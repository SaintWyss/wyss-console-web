import type { LibraryItem } from '../../contracts/arsenal';
import type {
  HookOption,
  HomeSpec,
  CodexHomeSpec,
} from '../arsenal/environment';
import {
  GROUPS,
  GROUP_LABEL,
  SECTION_OF,
  groupFor,
  type Group,
} from '../arsenal/groups';
import { isCodexDefault, isDefault } from '../arsenal/environment';
import type { Launch } from '../../desktop/launch-client';
import type { PlanItem } from '../../contracts/arsenal';
import type { EstimateData } from './data';
import type { Estimate } from './estimate';
import type { LaunchDraft } from './plan';
import { AS_CONFIGURED, PERMISSION_LABEL } from '../native/present';

export const WORKSPACE_TABS = [
  'general',
  'instructions',
  'skills',
  'mcp',
  'hooks',
  'summary',
] as const;
export type WorkspaceTab = (typeof WORKSPACE_TABS)[number];

export interface LaunchGroups {
  system: Launch[];
  agents: Launch[];
}

/** The Workspace list is ordered by launch kind, independently of role metadata. */
export function groupLaunches(
  launches: readonly Launch[],
  query: string,
): LaunchGroups {
  const needle = query.trim().toLowerCase();
  const matches = (launch: Launch) =>
    needle === '' || launch.name.toLowerCase().includes(needle);
  return {
    system: launches.filter(
      (launch) => launch.kind === 'commands' && matches(launch),
    ),
    agents: launches.filter(
      (launch) => launch.kind === 'session' && matches(launch),
    ),
  };
}

export interface SkillEntry {
  id: string;
  name: string;
  item: LibraryItem | null;
  account: boolean;
}

export interface SkillCategory {
  id: string;
  label: string;
  entries: SkillEntry[];
}

export interface SkillSection {
  id: 'general' | 'work' | 'environment' | 'topics';
  label: string;
  categories: SkillCategory[];
}

const SECTION_ORDER: readonly SkillSection['id'][] = [
  'general',
  'work',
  'environment',
  'topics',
];
const SECTION_LABEL: Record<SkillSection['id'], string> = {
  general: 'General',
  work: 'By type of work',
  environment: 'Environment',
  topics: 'Own topics',
};

function sectionFor(group: Group): SkillSection['id'] {
  if (group === 'study' || group === 'other') return 'topics';
  const section = SECTION_OF[group];
  if (section === 'build') return 'work';
  if (section === 'env') return 'environment';
  return 'general';
}

/** Uses Arsenal's existing category mapping and section order for Workspace skills. */
export function groupSkills(
  library: readonly LibraryItem[],
  accountSkills: readonly string[] = [],
): SkillSection[] {
  const buckets = new Map<string, SkillCategory>();
  for (const item of library.filter((entry) => entry.kind === 'skill')) {
    const group = groupFor(item) as Group;
    const id = GROUPS.includes(group) ? group : 'other';
    const key = `${sectionFor(id)}:${id}`;
    const category = buckets.get(key) ?? {
      id,
      label: GROUP_LABEL[id],
      entries: [],
    };
    category.entries.push({
      id: item.id,
      name: item.name,
      item,
      account: false,
    });
    buckets.set(key, category);
  }
  if (accountSkills.length > 0) {
    buckets.set('environment:claude-account', {
      id: 'claude-account',
      label: 'Claude account',
      entries: accountSkills.map((name) => ({
        id: name,
        name,
        item: null,
        account: true,
      })),
    });
  }
  return SECTION_ORDER.map((id) => ({
    id,
    label: SECTION_LABEL[id],
    categories: [...buckets.entries()]
      .filter(([key]) => key.startsWith(`${id}:`))
      .map(([, category]) => category)
      .sort((a, b) => {
        const ai = GROUPS.indexOf(a.id as Group);
        const bi = GROUPS.indexOf(b.id as Group);
        return ai < 0 ? 1 : bi < 0 ? -1 : ai - bi;
      }),
  })).filter((section) => section.categories.length > 0);
}

export interface HookLike {
  key: string;
  event: string;
  matcher: string;
  command: string;
}

export interface HookRow {
  id: string;
  script: string;
  matchers: string[];
  hooks: HookOption[];
}

export interface HookSection {
  event: string;
  rows: HookRow[];
}

/** Names the last script file in a hook command; if none exists, keeps the redacted command. */
export function workspaceScriptName(command: string): string {
  const matches = command.match(
    /(?:^|\s|["'])((?:[^\s"']+\/)?[^\s"']+\.(?:py|sh|js|mjs))(?=$|\s|["'])/g,
  );
  if (!matches?.length) return command.trim();
  const last = matches[matches.length - 1]
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .split('/')
    .at(-1);
  return last ?? command.trim();
}

const EVENT_ORDER = ['SessionStart', 'PreToolUse', 'PostToolUse'];

export function sortHookEvents(events: readonly string[]): string[] {
  return [...events].sort((a, b) => {
    const ai = EVENT_ORDER.indexOf(a);
    const bi = EVENT_ORDER.indexOf(b);
    if (ai >= 0 || bi >= 0)
      return (
        (ai < 0 ? EVENT_ORDER.length : ai) - (bi < 0 ? EVENT_ORDER.length : bi)
      );
    return a.localeCompare(b);
  });
}

/** One row per script within a moment; one switch controls every registration in that row. */
export function groupHooksByMoment(hooks: readonly HookLike[]): HookSection[] {
  const events = new Map<string, Map<string, HookRow>>();
  for (const hook of hooks) {
    const event = hook.event || 'Unknown';
    const script = workspaceScriptName(hook.command);
    const rows = events.get(event) ?? new Map<string, HookRow>();
    const row = rows.get(script) ?? {
      id: `${event}:${script}`,
      script,
      matchers: [],
      hooks: [],
    };
    if (hook.matcher && !row.matchers.includes(hook.matcher))
      row.matchers.push(hook.matcher);
    row.hooks.push(hook as HookOption);
    rows.set(script, row);
    events.set(event, rows);
  }
  return sortHookEvents([...events.keys()])
    .map((event) => [event, events.get(event)!] as const)
    .map(([event, rows]) => ({ event, rows: [...rows.values()] }));
}

export function matcherText(matcher: string): string {
  if (!matcher) return 'Always';
  if (matcher === 'Bash') return 'Commands';
  if (/^(Write|Edit|MultiEdit)$/.test(matcher)) return 'Writing/editing';
  if (matcher === 'Read') return 'Reading files';
  if (/^(Agent|Task)$/.test(matcher)) return 'Agents';
  return matcher;
}

export function eventText(event: string): string {
  const labels: Record<string, string> = {
    SessionStart: 'When the session starts',
    PreToolUse: 'Before using a tool',
    PostToolUse: 'After using a tool',
    PostToolUseFailure: 'After a tool fails',
    UserPromptSubmit: 'Before a message is sent',
    PermissionRequest: 'When permission is requested',
    Notification: 'When a notification arrives',
    Stop: 'When the agent stops',
    SubagentStart: 'When an agent starts',
    SubagentStop: 'When an agent stops',
    PreCompact: 'Before the conversation is compacted',
    SessionEnd: 'When the session ends',
    TeammateIdle: 'When a teammate is idle',
    TaskCompleted: 'When a task completes',
    ConfigChange: 'When configuration changes',
    WorktreeCreate: 'When a worktree is created',
    WorktreeRemove: 'When a worktree is removed',
    InstructionsLoaded: 'When instructions are loaded',
  };
  return labels[event] ?? event;
}

export function launchChangesNothing(
  agent: 'claude_code' | 'codex',
  spec: HomeSpec | null,
  codexSpec: CodexHomeSpec | null | undefined,
): boolean {
  return agent === 'claude_code'
    ? spec !== null && isDefault(spec)
    : codexSpec != null && isCodexDefault(codexSpec);
}

export interface WorkspaceSummary {
  noChanges: boolean;
  application: string;
  directory: string;
  permission: string;
  context:
    { kind: 'codex' | 'unavailable' } | { kind: 'estimated'; total: number };
  globalInstructions: string[];
  projectInstructions: 'loaded' | 'skipped' | 'custom' | 'unavailable';
  skills: { label: string; categories: { label: string; names: string[] }[] }[];
  mcp: { servers: string[]; connectors: boolean } | null;
  hooks: { event: string; names: string[] }[];
  leftOut: { name: string; reason?: string }[];
}

/** Builds the Summary tab from its inputs without reading or writing application state. */
export function buildWorkspaceSummary(
  draft: LaunchDraft,
  data: EstimateData,
  estimate: Estimate | null,
  itemPlan: readonly PlanItem[],
): WorkspaceSummary {
  const claude = draft.agent === 'claude_code';
  const selected = new Set(draft.items.map((item) => item.capability));
  const planFor = (id: string) =>
    itemPlan.find((item) => item.capability === id);
  const skills = groupSkills(
    data.library.filter((item) => item.provider === draft.agent),
    claude ? (data.options?.account_skills ?? []) : [],
  ).map((section) => ({
    label: section.label,
    categories: section.categories.map((category) => ({
      label: category.label,
      names: category.entries
        .filter((entry) =>
          entry.account
            ? Boolean(
                draft.spec &&
                !draft.spec.account_skills_off.includes(entry.name),
              )
            : selected.has(entry.id) &&
              (!planFor(entry.id) || planFor(entry.id)?.state === 'prepared'),
        )
        .map((entry) => entry.name),
    })),
  }));
  const hooks = claude
    ? (data.options?.hooks ?? [])
    : (data.codexOptions?.hooks ?? []);
  const fixedHooks = claude
    ? []
    : (data.codexOptions?.config_hooks ?? []).map((hook, index) => ({
        ...hook,
        key: `config:${index}`,
      }));
  const hooksOff = claude
    ? (draft.spec?.hooks_off ?? [])
    : (draft.codexSpec?.hooks_off ?? []);
  const activeHooks = groupHooksByMoment([
    ...hooks.filter((hook) => !hooksOff.includes(hook.key)),
    ...fixedHooks,
  ]).map((section) => ({
    event: section.event,
    names: section.rows.map(
      (row) =>
        `${row.script} (${row.matchers.length ? row.matchers.map(matcherText).join(', ') : matcherText('')})`,
    ),
  }));
  const leftOut: WorkspaceSummary['leftOut'] = data.library
    .filter((item) => item.provider === draft.agent && item.kind === 'skill')
    .flatMap((item) => {
      const missing = planFor(item.id);
      if (missing && missing.state !== 'prepared')
        return [
          {
            name: item.name,
            reason:
              missing.reason ||
              missing.compatibility?.reason ||
              'Not available',
          },
        ];
      return selected.has(item.id) ? [] : [{ name: item.name }];
    });
  if (claude && draft.spec) {
    leftOut.push(
      ...(data.options?.account_skills ?? [])
        .filter((name) => draft.spec?.account_skills_off.includes(name))
        .map((name) => ({ name })),
    );
    if (!draft.spec.instructions)
      leftOut.push({ name: 'CLAUDE.md and global rules' });
    else
      leftOut.push(
        ...(data.options?.rules ?? [])
          .filter((rule) => draft.spec?.rules_off.includes(rule))
          .map((rule) => ({ name: `rules/${rule}` })),
      );
    leftOut.push(
      ...(data.options?.mcp ?? [])
        .filter(
          (name) =>
            draft.spec?.mcp !== null && !draft.spec?.mcp?.includes(name),
        )
        .map((name) => ({ name })),
    );
  }
  if (!claude && draft.codexSpec?.instructions === false)
    leftOut.push({ name: 'AGENTS.md' });
  leftOut.push(
    ...hooks
      .filter((hook) => hooksOff.includes(hook.key))
      .map((hook) => ({ name: workspaceScriptName(hook.command) })),
  );

  return {
    noChanges: launchChangesNothing(draft.agent, draft.spec, draft.codexSpec),
    application: claude ? 'Claude Code' : 'Codex',
    directory: draft.directory,
    permission: draft.permission
      ? PERMISSION_LABEL[draft.permission]
      : AS_CONFIGURED,
    context: !claude
      ? { kind: 'codex' }
      : estimate
        ? { kind: 'estimated', total: estimate.total }
        : { kind: 'unavailable' },
    globalInstructions: claude
      ? draft.spec?.instructions
        ? [
            ...(data.options?.instructions ? ['CLAUDE.md'] : []),
            ...(data.options?.rules ?? [])
              .filter((rule) => !draft.spec?.rules_off.includes(rule))
              .map((rule) => `rules/${rule}`),
          ]
        : []
      : draft.codexSpec?.instructions && data.codexOptions?.instructions
        ? ['AGENTS.md']
        : [],
    projectInstructions:
      draft.instructions?.project === 'load'
        ? 'loaded'
        : draft.instructions?.project === 'exclude'
          ? 'skipped'
          : draft.instructions?.project === 'role'
            ? 'custom'
            : 'unavailable',
    skills,
    mcp: claude
      ? {
          servers: (data.options?.mcp ?? []).filter(
            (name) =>
              draft.spec?.mcp === null || draft.spec?.mcp?.includes(name),
          ),
          connectors: draft.spec?.mcp === null,
        }
      : null,
    hooks: activeHooks,
    leftOut,
  };
}

/** The plan item that keeps a library skill from being applied, if any. */
export function skillBlocker(
  entry: SkillEntry,
  itemPlan: readonly PlanItem[],
): PlanItem | undefined {
  if (entry.account) return undefined;
  return itemPlan.find(
    (item) => item.capability === entry.id && item.state !== 'prepared',
  );
}

/** Whether the draft loads this skill: chosen and applicable, or an account skill left on. */
export function skillEnabled(
  entry: SkillEntry,
  draft: LaunchDraft,
  itemPlan: readonly PlanItem[],
): boolean {
  if (entry.account)
    return Boolean(
      draft.spec && !draft.spec.account_skills_off.includes(entry.name),
    );
  return (
    !skillBlocker(entry, itemPlan) &&
    draft.items.some((item) => item.capability === entry.id)
  );
}

/** The skills a draft can show, grouped as the Skills tab shows them. */
export function draftSkills(
  draft: LaunchDraft,
  data: EstimateData,
): SkillSection[] {
  return groupSkills(
    data.library.filter((item) => item.provider === draft.agent),
    draft.agent === 'claude_code' ? (data.options?.account_skills ?? []) : [],
  );
}

export interface TabCount {
  on: number;
  all: number;
}

/** What each tab's counter shows; null when its part of the environment could not be read. */
export function tabCounts(
  draft: LaunchDraft,
  data: EstimateData,
  itemPlan: readonly PlanItem[],
): Partial<Record<WorkspaceTab, TabCount | null>> {
  const claude = draft.agent === 'claude_code';
  const skills = draftSkills(draft, data).flatMap((section) =>
    section.categories.flatMap((category) => category.entries),
  );
  const rules = data.options?.rules ?? [];
  const claudeFiles = (data.options?.instructions ? 1 : 0) + rules.length;
  const instructions: TabCount | null = claude
    ? draft.spec === null
      ? null
      : {
          on: draft.spec.instructions
            ? (data.options?.instructions ? 1 : 0) +
              rules.filter((rule) => !draft.spec!.rules_off.includes(rule))
                .length
            : 0,
          all: claudeFiles,
        }
    : !draft.codexSpec
      ? null
      : {
          on:
            draft.codexSpec.instructions && data.codexOptions?.instructions
              ? 1
              : 0,
          all: data.codexOptions?.instructions ? 1 : 0,
        };
  const servers = data.options?.mcp ?? [];
  const mcp: TabCount | null =
    claude && draft.spec !== null
      ? {
          on:
            servers.filter(
              (name) =>
                draft.spec!.mcp === null || draft.spec!.mcp.includes(name),
            ).length + (draft.spec.mcp === null ? 1 : 0),
          all: servers.length + 1,
        }
      : null;
  const spec = claude ? draft.spec : draft.codexSpec;
  const live = groupHooksByMoment(
    claude ? (data.options?.hooks ?? []) : (data.codexOptions?.hooks ?? []),
  ).flatMap((section) => section.rows);
  const fixed = claude
    ? 0
    : groupHooksByMoment(
        (data.codexOptions?.config_hooks ?? []).map((hook, index) => ({
          ...hook,
          key: `config:${index}`,
        })),
      ).flatMap((section) => section.rows).length;
  const hooks: TabCount | null = !spec
    ? null
    : {
        on:
          live.filter((row) =>
            row.hooks.every((hook) => !spec.hooks_off.includes(hook.key)),
          ).length + fixed,
        all: live.length + fixed,
      };
  return {
    instructions,
    skills: {
      on: skills.filter((entry) => skillEnabled(entry, draft, itemPlan)).length,
      all: skills.length,
    },
    ...(claude ? { mcp } : {}),
    hooks,
  };
}
