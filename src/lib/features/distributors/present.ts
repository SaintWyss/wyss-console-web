import type { ConfigItem } from '../../contracts/configuration';
import type { AgentId, Launcher, NativeSession } from '../../contracts/native';
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
import { AGENT_LABEL, startedWith } from '../native/present';

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
  Record<AgentId, readonly ('configuration' | 'credentials')[]>
> = {
  claude_code: ['configuration', 'credentials'],
  codex: ['configuration', 'credentials'],
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

/** The version number a tool reported (`2.1.325 (Claude Code)`, `codex-cli 0.169.0`); as it came when it has none. */
export function versionNumber(raw: string): string {
  return /\d+\.\d+(?:\.\d+)?(?:[-+][\w.]+)?/.exec(raw)?.[0] ?? raw.trim();
}

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
      ? { text: '{version}', values: { version: versionNumber(entry.version) } }
      : { text: msg('Installed') },
    installed: true,
  };
}

/**
 * The names an agent would be asked for: the `model` its own files hold. It is not a list of
 * what exists, and the card says so.
 */
function namedModels(
  agent: AgentId,
  items: readonly ConfigItem[] | null,
): ModelRow[] {
  const configured = [
    ...new Set(
      configuredRows(items)
        .filter((row) => row.provider === agent && row.key === 'model')
        .flatMap((row) => (row.value === null ? [] : [row.value])),
    ),
  ];
  return configured.map((model): ModelRow => ({
    key: `configured:${model}`,
    label: { text: msg('Configured model: {model}'), values: { model } },
    fresh: false,
  }));
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
  fresh: readonly string[] = [],
  configStale = false,
): DistributorCard[] {
  return DISTRIBUTORS.map((d): DistributorCard => {
    const named = d.agent === 'codex' ? [] : namedModels(d.agent, items);
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

/**
 * What runs now with this tool. A session in a terminal reports no model, and the Console
 * passes none: it is said by the permission it started with. A managed session (Codex) says
 * what its runtime reported.
 */
export function inUse(
  agent: AgentId,
  native: readonly NativeSession[],
  managed: readonly SessionSummary[] | null,
): { key: string; line: Phrase }[] {
  const rows: { key: string; line: Phrase }[] = native
    .filter((s) => s.agent_id === agent && s.state === 'running')
    .map((s): { key: string; line: Phrase } => {
      const where = s.project.split('/').filter(Boolean).pop() ?? s.project;
      return {
        key: s.id,
        line: s.profile
          ? {
              text: msg('In {folder}: started with {permission}.'),
              values: { folder: where, permission: startedWith(s.profile) },
            }
          : {
              text: msg('In {folder}: started as the agent is configured.'),
              values: { folder: where },
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
