<script lang="ts">
  import { untrack } from 'svelte';
  import { msg, t, tIncoming } from '../../i18n/index.svelte';
  import type { Item, Selection, PlanItem } from '../../contracts/arsenal';
  import { permissionsFor, type Permission } from '../../contracts/native';
  import {
    arsenalClient,
    ArsenalCallError,
    type ArsenalClient,
    type Roles,
  } from '../../desktop/arsenal-client';
  import { failureMessage } from '../arsenal/messages';
  import {
    deleteLaunch,
    listLaunches,
    saveLaunch,
    LaunchError,
    type Launch,
    type SystemInfo,
  } from '../../desktop/launch-client';
  import DistroVariants from './DistroVariants.svelte';
  import {
    DEFAULT_CODEX_SPEC,
    DEFAULT_SPEC,
    hookLabel,
    toggle,
  } from '../arsenal/environment';
  import { distributorOf } from '../distributors/present';
  import {
    AS_CONFIGURED,
    BYPASS_WARNING,
    PERMISSION_LABEL,
  } from '../native/present';
  import { ENVIRONMENT_UNREADABLE } from '../terminal/launch';
  import { kTokens } from './estimate';
  import { BASIC_ROLES as BASIC } from './plan';
  import {
    loadOrder,
    renameInOrder,
    saveOrder,
  } from '../terminal/launch-order';
  import {
    allItemsOf,
    estimateLaunch,
    estimateOf,
    libraryItems,
    loadEstimateData,
    NO_DATA,
    selectionOf,
    type EstimateData,
  } from './data';
  import {
    editable,
    launchId,
    savePlan,
    type Agent,
    type LaunchDraft,
  } from './plan';

  let {
    visible,
    recent,
    choose,
    onopen,
    select = null,
    createPreset = null,
    onpresetused = () => undefined,
    client = arsenalClient,
    launches: loadLaunches = listLaunches,
  }: {
    visible: boolean;
    /** Folders the Console knows, newest first (the project registry). */
    recent: readonly { path: string; last_used: number }[];
    /** The native folder dialog; `null` when dismissed. */
    choose: () => Promise<string | null>;
    /** Opens a saved launch in the Console. */
    onopen: (id: string) => void;
    /** A launch to show when it appears: one just made elsewhere (a distributor's). */
    select?: string | null;
    /** A new launch prefilled from an existing Arsenal preset. */
    createPreset?: { request: number; selection: Selection } | null;
    onpresetused?: (request: number) => void;
    client?: ArsenalClient;
    launches?: typeof listLaunches;
  } = $props();

  /** What each part of a launch is, shown on hover. */
  const HINT = {
    role: msg(
      'Only for ordering this list: launches are grouped by role. It does not change what the agent does.',
    ),
    distributor: msg(
      'Which agent the launch starts: Claude Code (Anthropic) or Codex (OpenAI). Changing it starts the preset and the environment over, and a permission the other agent does not have.',
    ),
    permission: msg(
      'What the agent may do without asking you. “As configured” passes nothing: the agent starts with the permissions of its own settings. The model and the effort are chosen inside the agent.',
    ),
    mode: msg(
      'Native: the agent runs as its own program in a terminal of the Console, as when you type claude or codex. The other mode, Managed (the Console drives the session), starts from Sessions, not from a launch; that is why it is fixed here.',
    ),
    folder: msg(
      'Where the agent works: it reads and edits the files of this folder, and its project settings are this folder’s.',
    ),
    estimate: msg(
      'About how much context the agent loads before you write anything, from what is switched on below. The bar compares it with everything switched on. MCP servers are not counted.',
    ),
  } as const;
  const GROUP_HINT: Record<string, string> = {
    instructions: msg(
      'CLAUDE.md and the rules files Claude Code reads when it starts: what you told it to always follow. Switching one off saves context, and the agent no longer follows it.',
    ),
    skills: msg(
      'Know-how the agent loads when a task needs it. At start only each one’s short description takes context.',
    ),
    mcp: msg(
      'Outside tools the agent can call (browser, docs, Notion…). How much context they take is not measured.',
    ),
    agents: msg(
      'Helpers the agent can hand part of a task to, each with its own instructions.',
    ),
    account: msg(
      'The skills of your Claude account (claude.ai), on top of the ones installed on this computer.',
    ),
    hooks: msg(
      'Scripts that run on their own at fixed moments (before a command, when a turn ends…). The script takes no context, but what some of them print (at start, before each message) enters the conversation. Not measured.',
    ),
    codexInstructions: msg(
      'AGENTS.md of your Codex folder: what you told Codex to always follow. Switched off, this launch starts without it.',
    ),
  };
  /** Said under the hooks of a Codex launch: what leaving one out does, and what Codex asks. */
  const CODEX_HOME_NOTE = msg(
    'A launch that leaves a hook or AGENTS.md out runs in its own Codex folder, with your own Codex sign-in. Codex asks you to approve the hooks the first time in each new folder.',
  );
  const STALE_HOOKS = msg(
    'A hook this preset left out is no longer in hooks.json: it was edited or removed. A launch with this preset does not start until you check the hooks and save.',
  );
  const CONFIG_HOOKS_NOTE = msg(
    'Declared in config.toml: these run in every launch and cannot be switched off here.',
  );
  /** What each permission does, shown on hover over the chosen one. */
  const PERMISSION_HINT: Record<Permission, string> = {
    ask: msg('The agent asks before every change.'),
    read_only: msg('The agent reads and plans; it changes nothing.'),
    edits: msg(
      'The agent edits files without asking; it still asks before running commands. Claude Code only.',
    ),
    bypass: BYPASS_WARNING,
  };

  const AGENTS: readonly { id: Agent; distributor: string }[] = (
    ['claude_code', 'codex'] as const
  ).map((id) => ({ id, distributor: distributorOf(id) }));

  let phase = $state<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  let launches = $state<Launch[]>([]);
  let system = $state<SystemInfo>({ id: '', like: [], name: '' });
  let roles = $state<Roles>({ custom: [], assigned: {}, damaged: false });
  let data = $state<EstimateData>(NO_DATA);
  let q = $state('');
  let selected = $state<string | null>(null);
  let draft = $state<LaunchDraft | null>(null);
  let baseline = $state('');
  let open = $state<string | null>('skills');
  let busy = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let confirming = $state(false);
  let rolesOpen = $state(false);
  let newRole = $state('');
  let foldersOpen = $state(false);
  /** The draft dropped a hook its preset left out that hooks.json no longer has. */
  let staleHooks = $state(false);
  let usedPresetRequest: number | null = null;
  let itemPlan = $state<PlanItem[]>([]);
  let itemPlanState = $state<'loading' | 'ready' | 'failed'>('loading');
  const unavailable = (item: PlanItem) =>
    item.state === 'missing' || item.state === 'rejected';

  // Evaluate every library item, including unticked skills, with the launch's pinned revisions.
  // No preset is created by opening the editor. Ignore an answer for an older folder or agent.
  $effect(() => {
    if (!draft) return;
    const agent = draft.agent;
    const directory = draft.directory;
    const selection = draft.selection;
    const items = allItemsOf(data.library, agent);
    for (const item of selection?.items ?? []) {
      const index = items.findIndex((i) => i.capability === item.capability);
      if (index < 0) items.push({ ...item });
      else items[index] = { ...item };
    }
    let active = true;
    itemPlanState = 'loading';
    itemPlan = [];
    void client
      .terminalPlan('', agent, directory, items)
      .then((plan) => {
        if (!active || !draft) return;
        itemPlan = plan.items;
        const blocked = new Set(
          plan.items.filter(unavailable).map((i) => i.capability),
        );
        draft.items = draft.items.filter((i) => !blocked.has(i.capability));
        itemPlanState = 'ready';
      })
      .catch(() => {
        if (active) itemPlanState = 'failed';
      });
    return () => {
      active = false;
    };
  });

  const allRoles = $derived([
    ...BASIC.map((r) => ({ id: r.id, name: t(r.name), basic: true })),
    ...roles.custom.map((r) => ({ ...r, basic: false })),
  ]);
  const roleOf = (id: string) => roles.assigned[id] ?? 'worker';
  const knownRole = (id: string) =>
    allRoles.some((r) => r.id === id) ? id : 'worker';

  async function load() {
    phase = 'loading';
    error = null;
    try {
      const [list, r, read] = await Promise.all([
        loadLaunches(),
        // Roles that cannot be read leave the basic ones; the editor still opens.
        client
          .roles()
          .catch((): Roles => ({ custom: [], assigned: {}, damaged: true })),
        loadEstimateData(client),
      ]);
      // An answer without a list is a failure, never an empty Workspace.
      if (!Array.isArray(list?.launches))
        throw new Error(t('Workspace could not be read.'));
      launches = list.launches;
      system = list.system ?? system;
      roles = r;
      data = read;
      phase = 'ready';
      if (!selected && launches[0]) pick(launches[0]);
    } catch (e) {
      phase = 'failed';
      error =
        e instanceof Error
          ? tIncoming(e.message)
          : t('Workspace could not be read.');
    }
  }
  // Read on the first visit, and again on each later one: a launch made elsewhere appears.
  $effect(() => {
    if (visible) untrack(() => phase !== 'loading' && void load());
  });
  $effect(() => {
    const id = select;
    const found = launches.find((l) => l.id === id);
    if (found) untrack(() => selected !== found.id && pick(found));
  });
  $effect(() => {
    const request = createPreset;
    if (
      !visible ||
      phase !== 'ready' ||
      !request ||
      usedPresetRequest === request.request
    )
      return;
    usedPresetRequest = request.request;
    const selection = data.selections.find(
      (candidate) => candidate.id === request.selection.id,
    );
    if (selection) pickPreset(selection);
    else
      error = t('That preset is no longer available. Refresh and try again.');
    onpresetused(request.request);
  });

  function draftOf(launch: Launch | null): LaunchDraft {
    if (!launch || launch.kind !== 'session') {
      const agent: Agent = 'claude_code';
      return {
        id: launch?.id ?? null,
        name: launch?.name ?? t('New launch'),
        role: launch ? knownRole(roleOf(launch.id)) : 'worker',
        agent,
        permission: null,
        directory: launch?.directory ?? recent[0]?.path ?? '',
        selection: null,
        items: allItemsOf(data.library, agent),
        composites: [],
        spec: { ...DEFAULT_SPEC },
        codexSpec: null,
        instructions: { project: 'load' },
      };
    }
    const selection = selectionOf(launch, data.selections);
    return {
      id: launch.id,
      name: launch.name,
      role: knownRole(roleOf(launch.id)),
      agent: launch.agent,
      permission: launch.permission,
      directory: launch.directory,
      selection,
      items: selection
        ? selection.items.map((i) => ({ ...i }))
        : allItemsOf(data.library, launch.agent),
      composites: selection ? [...selection.composites] : [],
      // Claude, the same: a file that cannot be read draws nothing and saves nothing.
      spec:
        launch.agent === 'claude_code' &&
        !unreadableFor(selection, 'claude_code')
          ? {
              ...((selection && data.environments.get(selection.id)) ??
                DEFAULT_SPEC),
            }
          : null,
      // A preset whose environment could not be read gets none here: nothing is drawn as
      // "everything on", and Save does not write over what is not known.
      codexSpec:
        launch.agent === 'codex' && !unreadableFor(selection, 'codex')
          ? {
              ...((selection && data.codexEnvironments.get(selection.id)) ??
                DEFAULT_CODEX_SPEC),
            }
          : null,
      instructions:
        selection && data.instructionsFailed?.has(selection.id)
          ? null
          : ((selection && data.launchInstructions?.get(selection.id)) ?? {
              project: 'load',
            }),
    };
  }
  /** Whether the environment of this preset is in a file that cannot be read. */
  function unreadableFor(
    selection: Selection | null,
    agent: 'claude_code' | 'codex',
  ): boolean {
    if (selection === null) return false;
    return agent === 'codex'
      ? data.codexUnreadable === true &&
          !data.codexEnvironments.has(selection.id)
      : data.claudeFailed?.has(selection.id) === true;
  }
  function pick(launch: Launch | null) {
    selected = launch?.id ?? 'new';
    const fresh = draftOf(launch);
    // The baseline is what is saved. A hook the preset left out that `hooks.json` no longer has
    // (edited or removed) is dropped from the draft only, so the draft differs and can be saved.
    baseline = JSON.stringify(fresh);
    staleHooks = false;
    const listed = data.codexOptions?.hooks.map((h) => h.key);
    if (fresh.codexSpec && listed) {
      const kept = fresh.codexSpec.hooks_off.filter((k) => listed.includes(k));
      if (kept.length !== fresh.codexSpec.hooks_off.length) {
        fresh.codexSpec = { ...fresh.codexSpec, hooks_off: kept };
        staleHooks = true;
      }
    }
    draft = fresh;
    error = null;
    notice = null;
    confirming = false;
  }
  function freeLaunchName(name: string): string {
    const base = name.trim() || t('New launch');
    const usedIds = new Set(launches.map((launch) => launch.id));
    for (let suffix = 1; suffix < 10_000; suffix++) {
      const addition = suffix === 1 ? '' : ` ${suffix}`;
      const stem = base.slice(0, Math.max(1, 36 - addition.length)).trimEnd();
      const candidate = `${stem}${addition}`;
      const id = launchId(candidate);
      if (id && !usedIds.has(id)) return candidate;
    }
    return t('New launch');
  }
  function pickPreset(selection: Selection) {
    const fresh = draftOf(null);
    fresh.name = freeLaunchName(selection.name);
    fresh.agent = selection.provider;
    fresh.selection = selection;
    fresh.items = selection.items.map((item) => ({ ...item }));
    fresh.composites = [...selection.composites];
    fresh.spec =
      selection.provider === 'claude_code' &&
      !unreadableFor(selection, 'claude_code')
        ? { ...(data.environments.get(selection.id) ?? DEFAULT_SPEC) }
        : null;
    fresh.codexSpec =
      selection.provider === 'codex' && !unreadableFor(selection, 'codex')
        ? {
            ...(data.codexEnvironments.get(selection.id) ?? DEFAULT_CODEX_SPEC),
          }
        : null;
    fresh.instructions = data.instructionsFailed?.has(selection.id)
      ? null
      : (data.launchInstructions?.get(selection.id) ?? { project: 'load' });

    staleHooks = false;
    const listed = data.codexOptions?.hooks.map((hook) => hook.key);
    if (fresh.codexSpec && listed) {
      const kept = fresh.codexSpec.hooks_off.filter((key) =>
        listed.includes(key),
      );
      if (kept.length !== fresh.codexSpec.hooks_off.length) {
        fresh.codexSpec = { ...fresh.codexSpec, hooks_off: kept };
        staleHooks = true;
      }
    }
    selected = 'new';
    baseline = JSON.stringify(fresh);
    draft = fresh;
    error = null;
    notice = null;
    confirming = false;
  }
  const dirty = $derived(draft !== null && JSON.stringify(draft) !== baseline);
  const current = $derived(launches.find((l) => l.id === selected) ?? null);
  /** A launch that runs commands or `before` lines: opened from here, edited in its file. */
  const readOnly = $derived(current !== null && !editable(current));
  /** Saving writes the file its name gives; another file name is removed after it. */
  const renames = $derived(
    current !== null &&
      !readOnly &&
      draft !== null &&
      launchId(draft.name) !== '' &&
      launchId(draft.name) !== current.id,
  );
  const canSave = $derived(
    draft !== null &&
      itemPlanState === 'ready' &&
      (current === null || editable(current)) &&
      draft.name.trim() !== '' &&
      launchId(draft.name) !== '' &&
      draft.directory.startsWith('/') &&
      (draft.instructions?.project !== 'role' ||
        (draft.instructions.role.length > 0 &&
          !draft.instructions.role.includes('\0') &&
          new TextEncoder().encode(draft.instructions.role).length <=
            64 * 1024)),
  );

  // The list, by role, filtered by the search.
  const groups = $derived(
    allRoles
      .map((role) => ({
        role,
        items: launches.filter(
          (l) =>
            knownRole(roleOf(l.id)) === role.id &&
            l.name.toLowerCase().includes(q.trim().toLowerCase()),
        ),
      }))
      .filter((g) => g.items.length > 0),
  );

  const est = $derived(
    // No estimate from defaults when the Claude environment could not be read.
    draft &&
      !readOnly &&
      !(draft.agent === 'claude_code' && draft.spec === null)
      ? estimateOf(draft.agent, draft.items, draft.spec, data)
      : null,
  );
  const ceiling = $derived(
    draft
      ? estimateOf(
          draft.agent,
          allItemsOf(data.library, draft.agent),
          DEFAULT_SPEC,
          data,
        )
      : null,
  );
  const agentPermissions = $derived(draft ? permissionsFor(draft.agent) : []);
  // Only folders the Console knows as projects: the desktop reads no other.
  const known = $derived(new Set(recent.map((r) => r.path)));
  const saved = $derived([
    ...new Set(launches.map((l) => l.directory).filter((d) => known.has(d))),
  ]);
  const used = $derived(
    [...recent].sort((a, b) => b.last_used - a.last_used).slice(0, 8),
  );

  function setAgent(agent: Agent) {
    if (!draft || draft.agent === agent) return;
    // Preset and environment belong to an agent: they start over. A permission stays when the
    // other agent has it too (accepting edits is Claude Code's own).
    draft.agent = agent;
    if (draft.permission && !permissionsFor(agent).includes(draft.permission))
      draft.permission = null;
    draft.selection = null;
    draft.items = allItemsOf(data.library, agent);
    draft.composites = [];
    draft.spec = agent === 'claude_code' ? { ...DEFAULT_SPEC } : null;
    draft.codexSpec = agent === 'codex' ? { ...DEFAULT_CODEX_SPEC } : null;
    draft.instructions = { project: 'load' };
  }
  function setItem(id: string, on: boolean) {
    if (
      !draft ||
      (on &&
        (itemPlanState !== 'ready' ||
          itemPlan.some((i) => i.capability === id && unavailable(i))))
    )
      return;
    const has = draft.items.some((i) => i.capability === id);
    if (on && !has)
      draft.items = [...draft.items, { capability: id, revision: null }];
    if (!on && has)
      draft.items = draft.items.filter((i) => i.capability !== id);
  }

  // The groups of what a session loads, one row each, as the contract lists them.
  interface Row {
    key: string;
    label: string;
    on: boolean;
    set: (on: boolean) => void;
    disabled?: boolean;
    title?: string;
  }
  interface Group {
    id: string;
    label: string;
    rows: Row[];
    tokens: number | null;
    note?: string;
    /** Shown on hover instead of the group's usual hint. */
    hint?: string;
    /** Said inside the open group, above its rows. */
    notice?: string;
    /** Things of this kind that always load: shown ticked and fixed, never counted or switched. */
    fixed?: { label: string; title: string; note: string }[];
  }
  const groupsOf = $derived.by((): Group[] => {
    if (!draft) return [];
    const d = draft;
    const lib = libraryItems(data.library, d.agent);
    const on = new Set(d.items.map((i) => i.capability));
    const libRows = (kind: string): Row[] =>
      lib
        .filter((item) => item.kind === kind)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => {
          const reason = itemPlan.find(
            (i) => i.capability === item.id && unavailable(i),
          )?.reason;
          return {
            key: item.id,
            label: item.name,
            on:
              on.has(item.id) &&
              !itemPlan.some((i) => i.capability === item.id && unavailable(i)),
            disabled:
              kind === 'skill' &&
              (itemPlanState !== 'ready' ||
                itemPlan.some(
                  (i) => i.capability === item.id && unavailable(i),
                )),
            title: reason ? tIncoming(reason) : undefined,
            set: (v: boolean) => setItem(item.id, v),
          };
        });
    const out: Group[] = [];
    const options = data.options;
    if (d.agent === 'claude_code' && d.spec && options) {
      const spec = d.spec;
      out.push({
        id: 'instructions',
        label: msg('Instructions'),
        tokens: est?.instructions ?? null,
        rows: [
          ...(options.instructions
            ? [
                {
                  key: 'CLAUDE.md',
                  label: 'CLAUDE.md',
                  on: spec.instructions,
                  set: (v: boolean) => (spec.instructions = v),
                },
              ]
            : []),
          ...options.rules.map((rule) => ({
            key: `rule:${rule}`,
            label: `rules/${rule}`,
            on: spec.instructions && !spec.rules_off.includes(rule),
            disabled: !spec.instructions,
            set: (v: boolean) =>
              (spec.rules_off = toggle(spec.rules_off, rule, !v)),
          })),
        ],
      });
    }
    const codex = data.codexOptions;
    if (d.agent === 'codex' && d.codexSpec && codex?.instructions) {
      const spec = d.codexSpec;
      out.push({
        id: 'instructions',
        label: msg('Instructions'),
        tokens: null,
        hint: GROUP_HINT.codexInstructions,
        rows: [
          {
            key: 'AGENTS.md',
            label: 'AGENTS.md',
            on: spec.instructions,
            set: (v: boolean) => (spec.instructions = v),
          },
        ],
      });
    }
    out.push({
      id: 'skills',
      label: msg('Skills'),
      tokens: est?.skills ?? null,
      rows: libRows('skill'),
    });
    if (d.agent === 'claude_code' && d.spec && options) {
      const spec = d.spec;
      out.push({
        id: 'mcp',
        label: msg('MCP servers'),
        tokens: null,
        note: msg('not measured'),
        rows: options.mcp.map((name) => ({
          key: name,
          label: name,
          on: spec.mcp === null || spec.mcp.includes(name),
          set: (v: boolean) =>
            (spec.mcp = toggle(spec.mcp ?? [...options.mcp], name, v)),
        })),
      });
    }
    out.push({
      id: 'agents',
      label: msg('Agents'),
      tokens: est?.agents ?? null,
      rows: libRows('agent'),
    });
    if (d.agent === 'claude_code' && d.spec && options) {
      const spec = d.spec;
      out.push({
        id: 'account',
        label: msg('Account skills'),
        tokens: est?.account ?? null,
        rows: options.account_skills.map((name) => ({
          key: name,
          label: name,
          on: !spec.account_skills_off.includes(name),
          set: (v: boolean) =>
            (spec.account_skills_off = toggle(
              spec.account_skills_off,
              name,
              !v,
            )),
        })),
      });
      out.push({
        id: 'hooks',
        label: msg('Hooks'),
        tokens: null,
        note: msg('not measured'),
        rows: options.hooks.map((hook) => ({
          key: hook.key,
          label: hookLabel(hook),
          on: !spec.hooks_off.includes(hook.key),
          set: (v: boolean) =>
            (spec.hooks_off = toggle(spec.hooks_off, hook.key, !v)),
        })),
      });
    }
    if (d.agent === 'codex' && d.codexSpec && codex) {
      const spec = d.codexSpec;
      out.push({
        id: 'hooks',
        label: msg('Hooks'),
        tokens: null,
        note: msg('not measured'),
        notice: CODEX_HOME_NOTE,
        rows: codex.hooks.map((hook) => ({
          key: hook.key,
          label: hookLabel(hook),
          on: !spec.hooks_off.includes(hook.key),
          set: (v: boolean) =>
            (spec.hooks_off = toggle(spec.hooks_off, hook.key, !v)),
        })),
        // Hooks `config.toml` declares: no launch leaves one out, so they are not rows.
        fixed: codex.config_hooks.map((hook) => ({
          label: hookLabel(hook),
          title: hook.command,
          note: CONFIG_HOOKS_NOTE,
        })),
      });
    }
    return out;
  });
  function setAll(group: Group, v: boolean) {
    for (const row of group.rows) if (!row.disabled) row.set(v);
  }

  async function addRole() {
    const name = newRole.trim();
    if (!name) return;
    try {
      roles = await client.writeRole({ do: 'create', name });
      newRole = '';
    } catch {
      error = t('The role could not be saved.');
    }
  }
  async function removeRole(id: string) {
    try {
      roles = await client.writeRole({ do: 'delete', id });
      if (draft && draft.role === id) draft.role = 'worker';
    } catch {
      error = t('The role could not be deleted.');
    }
  }

  /** One Save: preset → environment → launch → role. Says what was saved if a step fails. */
  async function save(): Promise<string | null> {
    if (!draft || !canSave || busy) return null;
    // A frozen copy: the fields are disabled while saving, and nothing typed meanwhile mixes in.
    const d: LaunchDraft = $state.snapshot(draft) as LaunchDraft;
    const blocked = new Set(
      itemPlan.filter(unavailable).map((i) => i.capability),
    );
    d.items = d.items.filter((i) => !blocked.has(i.capability));
    busy = true;
    error = null;
    notice = null;
    const done: string[] = [];
    const folderSelection = await client
      .projectSelection(d.directory, d.agent)
      .catch(() => null);
    const plan = savePlan(d, {
      launches,
      selections: data.selections.filter((s) => s.provider === d.agent),
      folderSelection,
      savedSpec: d.selection
        ? (data.environments.get(d.selection.id) ?? null)
        : null,
      savedCodexSpec: d.selection
        ? (data.codexEnvironments.get(d.selection.id) ?? null)
        : null,
      savedInstructions: d.selection
        ? data.launchInstructions?.get(d.selection.id)
        : null,
      allItems: allItemsOf(data.library, d.agent),
    });
    try {
      let target: Selection | null = d.selection;
      const p = plan.preset;
      if (p.do === 'write' || p.do === 'copy' || p.do === 'create') {
        target = await client.saveSelection({
          id: p.do === 'write' ? p.id : null,
          name: p.name,
          provider: d.agent,
          items: d.items as Item[],
          composites: d.composites,
        });
        done.push(
          p.do === 'copy'
            ? t('preset “{name}” (a copy: the other launches keep theirs)', {
                name: p.name,
              })
            : t('preset “{name}”', { name: p.name }),
        );
      } else if (p.do === 'none') target = null;
      if (plan.environment && target && d.agent === 'codex' && d.codexSpec) {
        await client.writeCodexEnvironment(target.id, d.codexSpec);
        done.push(t('environment'));
      } else if (plan.environment && target && d.spec) {
        await client.writeEnvironment(target.id, d.spec);
        done.push(t('environment'));
      }
      if (
        target &&
        d.instructions &&
        (JSON.stringify(d.instructions) !==
          JSON.stringify(
            data.launchInstructions?.get(d.selection?.id ?? '') ?? {
              project: 'load',
            },
          ) ||
          ((p.do === 'copy' || p.do === 'create') &&
            d.instructions.project !== 'load'))
      ) {
        await client.writeLaunchInstructions(target.id, d.instructions);
      }
      const launch = await saveLaunch({
        name: d.name.trim(),
        directory: d.directory,
        agent: d.agent,
        permission: d.permission,
        preset: target?.name ?? null,
        replace: plan.launch.replace,
      });
      done.push(t('launch'));
      // The role follows the new name before the old file goes: a failure here leaves both
      // files, never a launch without its role.
      if (plan.role.renamedFrom)
        roles = await client.writeRole({
          do: 'rename',
          from: plan.role.renamedFrom,
          to: launch.id,
        });
      roles = await client.writeRole({
        do: 'assign',
        launch: launch.id,
        role: d.role,
      });
      done.push(t('role'));
      if (plan.removeOld) {
        try {
          await deleteLaunch(plan.removeOld);
          // It keeps its place in + Launch.
          saveOrder(renameInOrder(loadOrder(), plan.removeOld, launch.id));
        } catch {
          error = t(
            'Saved as “{name}”. The file under the old name could not be deleted: it is still listed.',
            { name: launch.name },
          );
        }
      }
      const failed = error;
      await load();
      const fresh = launches.find((l) => l.id === launch.id) ?? null;
      pick(fresh);
      error = failed;
      notice = failed ? null : t('Saved.');
      return launch.id;
    } catch (e) {
      const exists = e instanceof LaunchError && e.code === 'exists';
      const what = exists
        ? t('A launch with that name exists.')
        : e instanceof ArsenalCallError
          ? t(failureMessage(e))
          : e instanceof Error
            ? tIncoming(e.message)
            : t('It could not be saved.');
      error =
        done.length > 0
          ? t('{what} Saved so far: {done}. Nothing else changed.', {
              what,
              done: done.join(', '),
            })
          : what;
      return null;
    } finally {
      busy = false;
    }
  }
  async function tryIt() {
    if (!draft) return;
    if (!dirty && draft.id) {
      onopen(draft.id);
      return;
    }
    const id = await save();
    if (id) onopen(id);
  }
  async function remove() {
    const removing = current;
    if (!removing || removing.kind !== 'session' || !editable(removing)) return;
    busy = true;
    let deleted = false;
    try {
      const selection = selectionOf(removing, data.selections);
      await deleteLaunch(removing.id);
      deleted = true;
      if (
        selection &&
        !launches.some(
          (l) =>
            l.id !== removing.id &&
            l.kind === 'session' &&
            l.agent === removing.agent &&
            l.preset === selection.name,
        )
      ) {
        await client.writeLaunchInstructions(selection.id, { project: 'load' });
      }
      roles = await client.writeRole({ do: 'forget', launch: removing.id });
      selected = null;
      draft = null;
      await load();
    } catch {
      if (deleted) {
        selected = null;
        draft = null;
        await load();
      }
      error = t(
        deleted
          ? 'The launch was deleted, but its instructions or role could not be cleared.'
          : 'The launch could not be deleted.',
      );
    } finally {
      busy = false;
      confirming = false;
    }
  }
  async function browse() {
    const path = await choose().catch(() => null);
    if (path && draft) draft.directory = path;
  }
</script>

<section
  class="launch-editor"
  aria-label={t('Launches')}
  hidden={!visible}
  inert={!visible}
>
  <aside class="le-list">
    <div class="le-search">
      <input
        class="le-input"
        type="search"
        placeholder={t('Search…')}
        aria-label={t('Search launches')}
        bind:value={q}
      />
      <button
        type="button"
        class="top-action icon"
        aria-label={t('Roles')}
        title={t('Roles')}
        aria-expanded={rolesOpen}
        onclick={() => (rolesOpen = !rolesOpen)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"
          ><path
            d="M9 7a3 3 0 1 0 0 .01M3 20c0-3 2.7-5 6-5s6 2 6 5M17 8v6M14 11h6"
          /></svg
        >
      </button>
    </div>
    {#if rolesOpen}
      <div class="le-roles">
        {#each allRoles as role (role.id)}
          <div class="le-role-row">
            <span>{role.name}</span>
            {#if role.basic}
              <span class="le-meta">{t('basic')}</span>
            {:else}
              <button
                type="button"
                class="action quiet"
                aria-label={t('Delete role {name}', { name: role.name })}
                onclick={() => void removeRole(role.id)}>×</button
              >
            {/if}
          </div>
        {/each}
        <form
          class="le-role-row"
          onsubmit={(e) => {
            e.preventDefault();
            void addRole();
          }}
        >
          <input
            class="le-input"
            placeholder={t('New role…')}
            aria-label={t('New role name')}
            maxlength="40"
            bind:value={newRole}
          />
          <button type="submit" class="action">{t('Add')}</button>
        </form>
        <p class="le-meta">
          {t('Launches of a deleted role become Worker.')}
        </p>
      </div>
    {/if}
    <div class="le-groups">
      {#if phase === 'loading' && launches.length === 0}
        <p class="le-meta">{t('Reading launches…')}</p>
      {/if}
      {#each groups as group (group.role.id)}
        <p class="le-role">{group.role.name}</p>
        {#each group.items as launch (launch.id)}
          {@const e = estimateLaunch(launch, data)}
          <button
            type="button"
            class="le-item"
            aria-current={selected === launch.id ? 'true' : undefined}
            onclick={() => pick(launch)}
          >
            <span class="le-name">{launch.name}</span>
            {#if e}<span class="le-meta">~{kTokens(e.total)}</span>{/if}
          </button>
        {/each}
      {/each}
      {#if phase === 'ready' && launches.length === 0}
        <p class="le-meta">{t('No saved launches yet.')}</p>
      {/if}
    </div>
    <button type="button" class="le-new" onclick={() => pick(null)}
      >+ {t('New')}</button
    >
  </aside>

  {#if draft}
    {@const d = draft}
    <div class="le-editor">
      <header class="le-head">
        <input
          class="le-title"
          disabled={busy}
          readonly={current?.kind === 'commands'}
          aria-label={t('Launch name')}
          maxlength="60"
          bind:value={d.name}
        />
        <span class="le-total" aria-live="polite" title={t(HINT.estimate)}>
          {#if est && ceiling}
            ~{kTokens(est.total)}
            <span class="le-bar" aria-hidden="true"
              ><span
                style:width={`${Math.min(100, Math.round((est.total / ceiling.total) * 100))}%`}
              ></span></span
            >
            <span class="le-meta"
              >{t('of {total} · estimated, MCP not measured', {
                total: kTokens(ceiling.total),
              })}</span
            >
          {:else if d.agent === 'codex' && !readOnly}
            <span class="le-meta">{t('No estimate for Codex yet.')}</span>
          {/if}
        </span>
        {#if current && editable(current)}
          {#if confirming}
            <span class="le-meta"
              >{t('Delete {name}?', { name: current.name })}</span
            >
            <button
              type="button"
              class="action danger"
              onclick={() => void remove()}>{t('Delete')}</button
            >
            <button
              type="button"
              class="action"
              onclick={() => (confirming = false)}>{t('Cancel')}</button
            >
          {:else}
            <button
              type="button"
              class="top-action icon le-delete"
              aria-label={t('Delete launch')}
              title={t('Delete launch')}
              onclick={() => (confirming = true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"
                ><path
                  d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"
                /></svg
              >
            </button>
          {/if}
        {/if}
        {#if current?.kind !== 'commands'}<button
            type="button"
            class="action"
            disabled={busy || (!d.id && !canSave) || (dirty && !canSave)}
            onclick={() => void tryIt()}
            >{dirty || !d.id ? t('Save and try') : t('Try')}</button
          >
          <button
            type="button"
            class="action primary"
            disabled={busy || !dirty || !canSave}
            onclick={() => void save()}
            >{busy ? t('Saving…') : t('Save')}</button
          >{/if}
      </header>
      {#if current?.kind === 'commands'}
        <DistroVariants
          launch={current}
          {system}
          {onopen}
          onsaved={(fresh) => {
            launches = launches.map((l) => (l.id === fresh.id ? fresh : l));
          }}
        />
      {:else if current && !editable(current)}
        <p class="notice" data-tone="warn">
          {t(
            'This launch runs commands from its file. It opens from here; edit it in its file.',
          )}
        </p>
      {/if}
      {#if !readOnly && (d.agent === 'codex' || d.agent === 'claude_code') && unreadableFor(d.selection, d.agent)}
        <p class="notice" data-tone="error" role="alert">
          {t(
            d.agent === 'claude_code' && !data.claudeUnreadable
              ? 'The launch environment could not be read.'
              : ENVIRONMENT_UNREADABLE,
          )}
        </p>
      {/if}
      {#if !readOnly && staleHooks}
        <p class="notice" data-tone="warn" role="alert">
          {t(STALE_HOOKS)}
        </p>
      {/if}
      {#if !readOnly && d.selection && data.instructionsFailed?.has(d.selection.id)}
        <p class="notice" data-tone="error" role="alert">
          {t(
            'The launch instructions file cannot be read. It was not modified.',
          )}
        </p>
      {/if}
      {#if roles.damaged}
        <p class="notice" data-tone="warn">
          {t(
            'roles.json could not be read. Roles are shown as the basic ones and are not saved until the file is fixed or removed.',
          )}
        </p>
      {/if}
      {#if error}<p class="notice" data-tone="error" role="alert">
          {error}
        </p>{/if}
      {#if notice}<p class="notice" data-tone="ok" role="status">
          {notice}
        </p>{/if}

      {#if renames && current && draft}
        <p class="notice" data-tone="warn">
          {t(
            'This launch is saved as {file}.toml. Saving writes {next}.toml and removes {file}.toml.',
            { file: current.id, next: launchId(draft.name) },
          )}
        </p>
      {/if}
      {#if !readOnly && d.permission === 'bypass'}
        <p class="notice" data-tone="warn" role="status">
          {t(BYPASS_WARNING)}
        </p>
      {/if}
      {#if !readOnly}
        <fieldset
          class="le-fieldset le-group"
          disabled={busy || !d.instructions}
        >
          <div class="le-ghead">{t('Project instructions')}</div>
          <div class="le-fields">
            <label class="le-field">
              <select
                class="le-input"
                aria-label={t('Project instructions')}
                value={d.instructions?.project ?? 'load'}
                onchange={(e) => {
                  const mode = e.currentTarget.value as
                    'load' | 'exclude' | 'role';
                  d.instructions =
                    mode === 'load'
                      ? { project: 'load' }
                      : {
                          project: mode,
                          role:
                            d.instructions && 'role' in d.instructions
                              ? d.instructions.role
                              : '',
                        };
                }}
              >
                <option value="load">{t("Load the project's")}</option>
                <option value="exclude">{t("Without the project's")}</option>
                <option value="role">{t('Own role')}</option>
              </select>
            </label>
            {#if d.instructions?.project === 'role'}
              <label class="le-field">
                <textarea
                  class="le-input"
                  rows="6"
                  aria-label={t('Own role')}
                  bind:value={d.instructions.role}></textarea>
              </label>
            {/if}
            <div class="le-field">
              <span
                >{t(
                  d.instructions?.project === 'load'
                    ? 'Loads the project instructions.'
                    : 'Without project instructions, the agent does not read the project instructions or rules. Your global instructions follow their switch.',
                )}</span
              >
              {#if d.instructions?.project === 'role'}
                <span
                  >{t(
                    'The text applies at start. Another open terminal of this launch may see it change; resuming a conversation keeps what it already had.',
                  )}</span
                >
              {/if}
              {#if d.agent === 'claude_code' && d.instructions?.project === 'role' && data.options && !data.options.token_stored}
                <span class="notice" data-tone="warn" role="alert"
                  >{t(
                    'No long-lived token is stored, so this terminal will not start. Run claude setup-token in your own terminal and store it with: secret-tool store --label "Claude Code token (Wyss Console)" service wyss-console kind claude-oauth-token',
                  )}</span
                >
              {/if}
            </div>
          </div>
        </fieldset>
        {#if itemPlanState === 'failed'}
          <p class="notice" data-tone="error" role="alert">
            {t(
              'The launch plan could not be read. Check the folder and try again.',
            )}
          </p>
        {/if}
        <fieldset class="le-fieldset" disabled={busy}>
          <div class="le-fields">
            <label class="le-field" title={t(HINT.role)}
              ><span>{t('Role')}</span>
              <select class="le-input" bind:value={d.role}>
                {#each allRoles as role (role.id)}
                  <option value={role.id}>{role.name}</option>
                {/each}
              </select>
            </label>
            <label class="le-field" title={t(HINT.distributor)}
              ><span>{t('Distributor')}</span>
              <select
                class="le-input"
                value={d.agent}
                onchange={(e) => setAgent(e.currentTarget.value as Agent)}
              >
                {#each AGENTS as a (a.id)}
                  <option value={a.id}
                    >{a.distributor} · {a.id === 'claude_code'
                      ? 'Claude Code'
                      : 'Codex'}</option
                  >
                {/each}
              </select>
            </label>
            <label class="le-field" title={t(HINT.permission)}
              ><span>{t('Permissions')}</span>
              <select
                class="le-input"
                aria-label={t('Permissions')}
                title={t(
                  d.permission
                    ? PERMISSION_HINT[d.permission]
                    : HINT.permission,
                )}
                value={d.permission ?? ''}
                onchange={(e) => {
                  const word = e.currentTarget.value;
                  d.permission =
                    agentPermissions.find((p) => p === word) ?? null;
                }}
              >
                <option value="">{t(AS_CONFIGURED)}</option>
                {#each agentPermissions as p (p)}
                  <option value={p} title={t(PERMISSION_HINT[p])}
                    >{t(PERMISSION_LABEL[p])}</option
                  >
                {/each}
              </select>
            </label>
            <label class="le-field" title={t(HINT.mode)}
              ><span>{t('Mode')}</span>
              <select class="le-input" disabled>
                <option>Native</option>
              </select>
            </label>
            <div class="le-field le-wide" title={t(HINT.folder)}>
              <span>{t('Folder')}</span>
              <div class="le-folder">
                <!-- Read only: a folder is chosen in the dialog or among the known projects. The
                     desktop reads only those, so a typed path could never start. -->
                <input
                  class="le-input"
                  aria-label={t('Folder')}
                  readonly
                  title={t('Choose it with Browse… or from the known folders.')}
                  value={d.directory}
                />
                <button
                  type="button"
                  class="top-action icon"
                  aria-label={t('Saved and recent folders')}
                  title={t('Saved and recent folders')}
                  aria-expanded={foldersOpen}
                  onclick={() => (foldersOpen = !foldersOpen)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"
                    ><path
                      d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"
                    /></svg
                  >
                </button>
                <button
                  type="button"
                  class="action"
                  onclick={() => void browse()}>{t('Browse…')}</button
                >
                {#if foldersOpen}
                  <div class="le-folders">
                    {#if saved.length > 0}<p class="le-role">
                        {t('Saved')}
                      </p>{/if}
                    {#each saved as folder (folder)}
                      <button
                        type="button"
                        class="le-item"
                        onclick={() => {
                          d.directory = folder;
                          foldersOpen = false;
                        }}><span class="le-name">{folder}</span></button
                      >
                    {/each}
                    {#if used.length > 0}<p class="le-role">
                        {t('Recently used')}
                      </p>{/if}
                    {#each used as entry (entry.path)}
                      <button
                        type="button"
                        class="le-item"
                        onclick={() => {
                          d.directory = entry.path;
                          foldersOpen = false;
                        }}><span class="le-name">{entry.path}</span></button
                      >
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </fieldset>
        <div class="le-loads" inert={busy}>
          {#if d.agent === 'codex'}
            <p class="le-meta le-pad">
              {t(
                'For Codex a launch chooses skills, agents, AGENTS.md and the hooks of hooks.json. MCP servers and account skills are Claude Code only.',
              )}
            </p>
          {/if}
          {#each groupsOf as group (group.id)}
            {@const n = group.rows.filter((r) => r.on).length}
            <div class="le-group">
              <div class="le-ghead">
                <input
                  type="checkbox"
                  aria-label={t(group.label)}
                  checked={n === group.rows.length && n > 0}
                  indeterminate={n > 0 && n < group.rows.length}
                  disabled={group.rows.length === 0 ||
                    group.rows.every((r) => r.disabled)}
                  onchange={(e) => setAll(group, e.currentTarget.checked)}
                />
                <button
                  type="button"
                  class="le-gtoggle"
                  title={(group.hint ?? GROUP_HINT[group.id])
                    ? t(group.hint ?? GROUP_HINT[group.id])
                    : undefined}
                  aria-expanded={open === group.id}
                  onclick={() => (open = open === group.id ? null : group.id)}
                >
                  <span class="le-chev" class:open={open === group.id}>›</span>
                  {t(group.label)}
                  <span class="le-meta"
                    >{t('{on} of {all}', {
                      on: n,
                      all: group.rows.length,
                    })}</span
                  >
                </button>
                <span class="le-cost"
                  >{group.tokens === null
                    ? group.note
                      ? t(group.note)
                      : ''
                    : group.tokens === 0
                      ? '0'
                      : group.tokens < 1000
                        ? kTokens(group.tokens)
                        : `~${kTokens(group.tokens)}`}</span
                >
              </div>
              {#if open === group.id}
                <div class="le-rows">
                  {#if group.notice}
                    <p class="le-meta">{t(group.notice)}</p>
                  {/if}
                  {#each group.rows as row (row.key)}
                    <label class="le-row" class:off={!row.on} title={row.title}>
                      <input
                        type="checkbox"
                        checked={row.on}
                        disabled={row.disabled}
                        title={row.title}
                        onchange={(e) => row.set(e.currentTarget.checked)}
                      />
                      <span title={row.title ?? row.label}>{row.label}</span>
                    </label>
                  {/each}
                  {#if group.rows.length === 0 && !group.fixed?.length}
                    <p class="le-meta">{t('Nothing of this kind.')}</p>
                  {/if}
                  {#if group.fixed?.length}
                    <p class="le-meta">{t(group.fixed[0].note)}</p>
                    {#each group.fixed as fixed, i (i)}
                      <label class="le-row">
                        <input type="checkbox" checked disabled />
                        <span title={fixed.title}>{fixed.label}</span>
                      </label>
                    {/each}
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else if phase === 'failed'}
    <div class="le-editor">
      <p class="notice" data-tone="error" role="alert">{error}</p>
      <button type="button" class="action" onclick={() => void load()}
        >{t('Try again')}</button
      >
    </div>
  {/if}
</section>
