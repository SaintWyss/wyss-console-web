import type { ConfigItem } from '../../contracts/configuration';
import type {
  AgentId,
  Launcher,
  NativeSession,
  Profile,
} from '../../contracts/native';
import type { SessionSummary } from '../../contracts/sessions';
import { msg, type Phrase } from '../../i18n/msg';
import type { ModelsState } from '../models/controller';
import {
  catalogueFailure,
  completeness,
  configuredRows,
  observedRows,
  provenance,
} from '../models/present';
import { AGENT_LABEL } from '../native/present';

/**
 * Who makes each tool the Console knows and starts. Any other tool is added by the owner
 * (Personalization › Distributors › Add), with the commands that open and update it.
 */
export const DISTRIBUTORS = [
  { id: 'anthropic', name: 'Anthropic', agent: 'claude_code' },
  { id: 'openai', name: 'OpenAI', agent: 'codex' },
  { id: 'opencode', name: 'OpenCode', agent: 'opencode' },
] as const satisfies readonly {
  id: string;
  name: string;
  agent: AgentId;
}[];

/**
 * The command that updates each known tool, typed in a terminal where it is seen. Only the ones
 * checked against the tool's own help: OpenCode's is not, so it has no Update.
 */
export const UPDATE_COMMAND: Partial<Record<AgentId, string>> = {
  claude_code: 'claude update',
  codex: 'codex update',
};

/** Where each known tool is set up, by view: only the views that cover it. */
export const SET_UP_IN: Partial<
  Record<AgentId, readonly ('profiles' | 'configuration' | 'credentials')[]>
> = {
  claude_code: ['profiles', 'configuration', 'credentials'],
  codex: ['profiles', 'configuration', 'credentials'],
  opencode: ['configuration'],
};

/**
 * Tools suggested under Add: their name and the command that opens them, nothing else. The
 * update command is the owner's to write: it depends on how the tool was installed.
 */
export const SUGGESTED = [
  { name: 'Kimi CLI', maker: 'Moonshot AI', open: 'kimi' },
  { name: 'Gemini CLI', maker: 'Google', open: 'gemini' },
  { name: 'Aider', maker: 'Aider', open: 'aider' },
] as const;

/** The distributor of an agent, by name; the agent's own name when it has none here. */
export function distributorOf(agent: AgentId): string {
  return (
    DISTRIBUTORS.find((d) => d.agent === agent)?.name ?? AGENT_LABEL[agent]
  );
}

export interface ModelRow {
  key: string;
  /** A model id as the runtime listed it, or a sentence that says where a name comes from. */
  label: string | Phrase;
  /** Listed by Codex and not seen before the last refresh. */
  fresh: boolean;
}

export interface DistributorCard {
  id: (typeof DISTRIBUTORS)[number]['id'];
  name: string;
  status: Phrase;
  /** Only an installed tool is drawn in the ok tone. */
  installed: boolean;
  tool: string;
  agent: AgentId;
  /** Typed in a new terminal by Update; null when the Console has none checked for the tool. */
  update: string | null;
  models: ModelRow[];
  /** What cannot be known, or why there is no list. */
  notes: Phrase[];
}

const NOT_LISTED: Phrase = {
  text: msg('This tool does not list its models to the Console.'),
};

const EARLIER_READ: Phrase = {
  text: msg('Configured models are from an earlier read.'),
};

/** Installed or not as `native_launcher` answered; unknown when it did not, or did not name it. */
function statusOf(
  launcher: Launcher | null,
  agent: AgentId,
): { status: Phrase; installed: boolean } {
  const entry = launcher?.agents.find((a) => a.agent_id === agent);
  if (!entry) return { status: { text: msg('Unknown') }, installed: false };
  if (!entry.installed)
    return { status: { text: msg('Tool not installed') }, installed: false };
  return {
    status: entry.version
      ? {
          text: msg('Installed · {version}'),
          values: { version: entry.version },
        }
      : { text: msg('Installed · version not reported') },
    installed: true,
  };
}

/**
 * The names an agent would be asked for: the `model` its own files hold and the one each of
 * the owner's profiles passes. Neither is a list of what exists, and the card says so.
 */
function namedModels(
  agent: AgentId,
  items: readonly ConfigItem[] | null,
  profiles: readonly Profile[],
): ModelRow[] {
  const configured = [
    ...new Set(
      configuredRows(items)
        .filter((row) => row.provider === agent && row.key === 'model')
        .flatMap((row) => (row.value === null ? [] : [row.value])),
    ),
  ];
  return [
    ...configured.map((model): ModelRow => ({
      key: `configured:${model}`,
      label: { text: msg('Configured model: {model}'), values: { model } },
      fresh: false,
    })),
    ...profiles
      // A template ships with the Console: it is not the owner's.
      .filter((p) => !p.template && p.body.applies_to.includes(agent))
      .flatMap((p): ModelRow[] =>
        p.body.model === null
          ? []
          : [
              {
                key: `profile:${p.id}`,
                label: {
                  text: msg('Profile {name}: {model}'),
                  values: { name: p.body.name, model: p.body.model },
                },
                fresh: false,
              },
            ],
      ),
  ];
}

/** What the managed Codex runtime listed, or the sentence that says why there is no list. */
function codexModels(
  models: ModelsState,
  fresh: readonly string[],
): { models: ModelRow[]; notes: Phrase[] } {
  const catalogue = models.catalogue;
  if (catalogue === null)
    return {
      models: [],
      notes:
        models.phase === 'failed' ? [catalogueFailure(models.failure)] : [],
    };
  const notes: Phrase[] = [];
  if (catalogue.state === 'not_ready') notes.push(provenance(catalogue));
  if (models.stale) notes.push(catalogueFailure(models.failure));
  const partial = completeness(catalogue);
  if (partial) notes.push(partial);
  return {
    models: catalogue.entries.map((entry) => ({
      key: entry.model_id,
      label: entry.model_id,
      fresh: fresh.includes(entry.model_id),
    })),
    notes,
  };
}

/**
 * The four cards. Every fact is one the desktop answered: `launcher` is null when
 * `native_launcher` did not answer, and then nothing is said to be installed or missing.
 */
export function distributorCards(
  launcher: Launcher | null,
  models: ModelsState,
  items: readonly ConfigItem[] | null,
  profiles: readonly Profile[],
  fresh: readonly string[] = [],
  configStale = false,
): DistributorCard[] {
  return DISTRIBUTORS.map((d): DistributorCard => {
    const named =
      d.agent === 'codex' ? [] : namedModels(d.agent, items, profiles);
    const listing =
      d.agent === 'codex'
        ? codexModels(models, fresh)
        : {
            models: named,
            // A configured model that is shown and was not read again is said to be older.
            notes:
              configStale && named.some((m) => m.key.startsWith('configured:'))
                ? [NOT_LISTED, EARLIER_READ]
                : [NOT_LISTED],
          };
    return {
      id: d.id,
      name: d.name,
      ...statusOf(launcher, d.agent),
      tool: AGENT_LABEL[d.agent],
      agent: d.agent,
      update: UPDATE_COMMAND[d.agent] ?? null,
      ...listing,
    };
  });
}

// ---------------------------------------------------------------------------------------------
// A card's Models section: what the Models view showed, for this tool only.

/** A profile of this tool that names a model or an effort, itself or through one it extends. */
export interface ChosenRow {
  id: string;
  name: string;
  template: boolean;
  model: string | null;
  effort: string | null;
  modelFrom: string | null;
  effortFrom: string | null;
}

export function chosenBy(
  agent: AgentId,
  profiles: readonly Profile[],
): ChosenRow[] {
  const from = (p: Profile, field: 'model' | 'effort'): string | null => {
    const source = p.from[field];
    return p.body[field] === null &&
      source !== undefined &&
      source !== p.body.name
      ? source
      : null;
  };
  return profiles
    .filter((p) => p.body.applies_to.includes(agent))
    .map((p) => ({
      id: p.id,
      name: p.body.name,
      template: p.template,
      model: p.body.model,
      effort: p.body.effort,
      modelFrom: from(p, 'model'),
      effortFrom: from(p, 'effort'),
    }))
    .filter(
      (r) =>
        r.model !== null ||
        r.effort !== null ||
        r.modelFrom !== null ||
        r.effortFrom !== null,
    );
}

/**
 * What runs now with this tool. A session in a terminal reports no model: it is said by the
 * profile it started with, and the profile's model only while that profile is the version it
 * started with. A managed session (Codex) says what its runtime reported.
 */
export function inUse(
  agent: AgentId,
  native: readonly NativeSession[],
  profiles: readonly Profile[],
  managed: readonly SessionSummary[] | null,
): { key: string; line: Phrase }[] {
  const rows: { key: string; line: Phrase }[] = native
    .filter((s) => s.agent_id === agent && s.state === 'running')
    .map((s): { key: string; line: Phrase } => {
      const where = s.project.split('/').filter(Boolean).pop() ?? s.project;
      if (!s.profile)
        return {
          key: s.id,
          line: {
            text: msg(
              'In {folder}: started with no profile, as the agent is set up.',
            ),
            values: { folder: where },
          },
        };
      const p = profiles.find((x) => x.id === s.profile!.id);
      const model = p && p.current === s.profile.version ? p.body.model : null;
      return {
        key: s.id,
        line: model
          ? {
              text: msg(
                'In {folder}: started with the profile {name}, which asks for {model}.',
              ),
              values: { folder: where, name: s.profile.name, model },
            }
          : {
              text: msg('In {folder}: started with the profile {name}.'),
              values: { folder: where, name: s.profile.name },
            },
      };
    });
  if (agent === 'codex')
    rows.push(
      ...observedRows(managed).map((r) => ({
        key: `managed:${r.id}`,
        line: {
          text: msg('{session} (managed): {line}'),
          values: { session: r.label, line: r.line },
        },
      })),
    );
  return rows;
}
