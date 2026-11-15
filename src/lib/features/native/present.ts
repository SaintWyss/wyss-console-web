import {
  profilePermission,
  type AgentId,
  type NativeSession,
  type Permission,
  type ProfileRef,
  type SessionState,
} from '../../contracts/native';
import type { ConfigItem } from '../../contracts/configuration';
import { msg, type Phrase } from '../../i18n/msg';

export type Tone = 'ok' | 'pending' | 'warn' | 'error' | 'idle';

export const AGENT_LABEL: Record<AgentId, string> = {
  claude_code: 'Claude Code',
  codex: 'Codex',
  opencode: 'OpenCode',
  hermes: 'Hermes Agent (Native)',
};

/** The agents whose sessions the Console records in its M9 store; the others are legacy. */
export const isM9Agent = (agent: AgentId): boolean =>
  agent === 'opencode' || agent === 'hermes';

/** Shown when the process ended and only its record failed: the stop happened, the write did not. */
/** Shown when a start or restart failed while its record was written: a process may exist. */
export const START_UNRECORDED = msg(
  'The Console could not record this start, so a process may exist. Check the sessions below. Nothing is started again automatically, and OpenCode and Hermes wait until the store is confirmed.',
);

/** Shown when a stop ended the process and only its record failed. */
export const STOP_UNRECORDED = msg(
  'The process was stopped, but the Console could not record that. Nothing was started again, and OpenCode and Hermes stay blocked until the store is confirmed.',
);

/** A restart's new session is "restarting" until its process runs. The label is a phrase: the view draws it with tPhrase(). */
export function stateLabel(s: NativeSession): { label: Phrase; tone: Tone } {
  switch (s.state) {
    case 'requested':
      return s.restart_of
        ? { label: { text: msg('Restarting') }, tone: 'pending' }
        : { label: { text: msg('Starting') }, tone: 'pending' };
    case 'running':
      return { label: { text: msg('Active') }, tone: 'ok' };
    case 'exited':
      if (s.exit_signal)
        return { label: { text: msg('Ended by a signal') }, tone: 'error' };
      return s.exit_code === 0
        ? { label: { text: msg('Exited (0)') }, tone: 'idle' }
        : {
            label: {
              text: msg('Failed ({code})'),
              values: { code: String(s.exit_code ?? '?') },
            },
            tone: 'error',
          };
    case 'stopped':
      return { label: { text: msg('Stopped') }, tone: 'warn' };
    case 'failed_start':
      return { label: { text: msg('Did not start') }, tone: 'error' };
    case 'lost':
      return { label: { text: msg('Lost') }, tone: 'warn' };
  }
}

export const STATE_NOTE: Record<SessionState, string> = {
  requested: msg('The start was accepted and is being prepared.'),
  running: msg('The agent’s process is alive in its terminal.'),
  exited: msg('The process ended by itself.'),
  stopped: msg('You stopped it.'),
  failed_start: msg('The process never ran.'),
  lost: msg(
    'The Console was restarted and did not see how it ended. Its terminal went with the window, so it is not running.',
  ),
};

/**
 * Said wherever a launch with a folder of its own would run in the owner's home: the agent reads
 * `.claude` and `.codex` of its working folder as the project's, so what the preset leaves out
 * would load again. The window says it before starting; the host refuses it with
 * `arsenal_home_cwd_is_home`.
 */
export const HOME_FOLDER_REFUSED = msg(
  'A launch with a folder of its own cannot use your home folder as its project: your configuration (hooks, instructions, skills) would load anyway. Choose a project folder.',
);

export const FAILURE_TEXT: Record<string, string> = {
  agent_not_installed: msg('That agent is not installed on this computer.'),
  project_invalid: msg(
    'That folder cannot be used. Choose a folder with the folder button.',
  ),
  // The host's codes still say "profile": a permission is sent as its fixed template.
  profile_not_applicable: msg(
    'This permission cannot be applied to that agent.',
  ),
  profile_unknown: msg(
    'What this session was started with no longer exists, so it cannot start that way. Start a new one from Workspace.',
  ),
  profile_preview_required: msg(
    'The start was not checked first. Choose the permission again and start.',
  ),
  profile_preview_stale: msg(
    'What the start would do changed after it was checked. Check it again and start.',
  ),
  provider_version_unverified: msg(
    'This exact provider build is not verified for permission flags, so nothing was launched with them. Choose “As configured” or use a qualified build.',
  ),
  arsenal_unqualified: msg(
    'Skill exclusion is not qualified for this exact provider build, so nothing was started with it. Start without applying the selection, or use a qualified build.',
  ),
  arsenal_plan_stale: msg(
    'The Arsenal plan changed since it was shown: the library, the installed skills or the provider build moved. Review the new plan and start again.',
  ),
  arsenal_blocked: msg(
    'The Arsenal plan has items that cannot be carried or names a skill that is not installed, so nothing was started with it.',
  ),
  arsenal_unavailable: msg(
    'The Arsenal library or the installed skills could not be read, so nothing was started with the selection.',
  ),
  arsenal_selection_unknown: msg('That Arsenal selection no longer exists.'),
  arsenal_environment_unreadable: msg(
    'The file of Codex launch environments (environment-codex.json) cannot be read, so what a preset leaves out is not known. Launches with a Codex preset do not start until the file is fixed or removed. It was not changed.',
  ),
  arsenal_environment_stale: msg(
    'A hook this preset leaves out is no longer in hooks.json: it was edited or removed. Nothing was started. Check the preset’s hooks and save it.',
  ),
  arsenal_home_cwd_is_home: HOME_FOLDER_REFUSED,
  arsenal_project_refused: msg(
    'Arsenal does not read this project folder, so its selection cannot be applied here.',
  ),
  handoff_target_unverified: msg(
    'Hermes Native does not have a verified interactive handoff argument. It was not started with this brief.',
  ),
  brief_invalid: msg(
    'The brief must start with a “# ” heading, hold no NUL and be at most 16 KiB.',
  ),
  limit_reached: msg(
    'The terminal limit (16) is reached. Close one to start another.',
  ),
  spawn_failed: msg('The agent could not be started.'),
  busy: msg('A start is already in progress.'),
  session_unknown: msg('That session is not known any more.'),
  not_running: msg('That session is not running.'),
  still_running: msg('A running session cannot be removed. Stop it first.'),
  stop_failed: msg('The session could not be stopped.'),
  store_unavailable: msg('The Console could not write its own state.'),
  readiness_busy: msg(
    'Session storage is busy. Readiness could not be checked; it will be retried.',
  ),
  unavailable: msg(
    'The Console has no private folder to keep native sessions in, so it cannot start agents.',
  ),
  request_invalid: msg('The request was not valid.'),
  host_unavailable: msg(
    'The terminal host is not answering. Nothing was sent; nothing changed.',
  ),
  host_outcome_unknown: msg(
    'The terminal host did not confirm this request: it may or may not have taken effect, and it was not sent again. Check the sessions listed here before repeating it, so nothing runs twice.',
  ),
  host_outdated: msg(
    'The terminal host is older than this window and cannot start with this option. Update it before using it; existing sessions are unchanged.',
  ),
  export_failed: msg('The file could not be written.'),
  internal: msg('Something went wrong in the desktop.'),
};
export const failureText = (code: string) =>
  FAILURE_TEXT[code] ?? msg('Something went wrong in the desktop.');

export const PERMISSION_LABEL: Record<Permission, string> = {
  ask: msg('Ask before acting'),
  read_only: msg('Read only'),
  edits: msg('Accept edits'),
  bypass: msg('Full access'),
};
/** No permission named: the agent starts with what its own files say. */
export const AS_CONFIGURED = msg('As configured');
/** What choosing a permission does, said under the choice. */
export const PERMISSION_HELP = msg(
  'What the agent may do without asking you. “As configured” passes nothing: the agent starts with the permissions of its own settings. The model and the effort are chosen inside the agent.',
);
/**
 * What a session was started with, in a phrase: its permission, as configured, or the name of
 * the profile it was started with before profiles were removed (what that one set is not known).
 */
export function startedWith(profile: ProfileRef | null): Phrase {
  if (!profile) return { text: AS_CONFIGURED };
  const permission = profilePermission(profile);
  return permission
    ? { text: PERMISSION_LABEL[permission] }
    : { text: msg('Profile {name}'), values: { name: profile.name } };
}
/** The names of the fixed templates, which is all a terminal's tab carries from the host. */
const TEMPLATE_NAME: Record<string, Permission | null> = {
  'As configured': null,
  Strict: 'ask',
  'Review, read only': 'read_only',
  'Accept edits': 'edits',
  'Full access (bypass)': 'bypass',
};
/**
 * What a tab says its agent was started with, from the name the host recorded: the permission
 * when it is a template's, the name itself when it is a profile saved before profiles were
 * removed, and nothing when the agent started as configured.
 */
export function tabStartedWith(name: string | null): Phrase | null {
  if (name === null) return null;
  if (!Object.hasOwn(TEMPLATE_NAME, name))
    return { text: msg('Profile {name}'), values: { name } };
  const permission = TEMPLATE_NAME[name];
  return permission ? { text: PERMISSION_LABEL[permission] } : null;
}
/** Said wherever full access is chosen or shown: what it costs. */
export const BYPASS_WARNING = msg(
  'Full access: the agent asks nothing and runs every command and edit without a sandbox, with your account’s rights.',
);
export function folderName(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? '/';
}
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
export function since(from: number, now: number): string {
  const seconds = Math.max(0, Math.round(now / 1000 - from));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d`;
}

/**
 * The two things said about the model of a native session, kept apart because they are
 * different facts: what the agent's own files are set to, and what is in use. The Console
 * passes neither a model nor an effort: they are chosen inside the agent. What is in use is
 * never filled from the files: neither agent reports the model it runs without a hook or a
 * read of the terminal, and this app adds neither.
 */
export interface ModelFacts {
  configured: string;
  /** The effort the agent's own files hold, or why there is none to say. */
  configuredEffort: string;
  inUse: string;
}
export function modelFacts(
  session: NativeSession,
  config: readonly ConfigItem[] | null,
): ModelFacts {
  let configured: string = msg('not read yet (open Configuration)');
  let configuredEffort: string = configured;
  if (config !== null) {
    const provider =
      session.agent_id === 'claude_code'
        ? 'claude_code'
        : session.agent_id === 'codex'
          ? 'codex'
          : null;
    const keyed = (key: string): string | null => {
      const item = config.find(
        (i) =>
          i.provider === provider &&
          i.kind === 'model_preference' &&
          i.name === key &&
          i.scope === 'global' &&
          i.detail?.kind === 'text',
      );
      return item?.detail?.kind === 'text' ? item.detail.value.text : null;
    };
    // Each agent names its effort key its own way.
    if (provider) {
      const effortKey =
        session.agent_id === 'claude_code'
          ? 'effortLevel'
          : 'model_reasoning_effort';
      configured = keyed('model') ?? msg('not set in its files');
      configuredEffort = keyed(effortKey) ?? msg('not set in its files');
    } else {
      configured = configuredEffort = msg(
        'not observed by this provider configuration view',
      );
    }
  }
  return {
    configured,
    configuredEffort,
    inUse: msg('not reported by the agent'),
  };
}

/**
 * What can be said about changing the model of a session that is already running. Claude
 * Code's own command is documented (and says it saves your default too); Codex's is not
 * verified, so none is offered. The text sends nothing to the terminal and copies nothing.
 */
export function switchHint(agent: AgentId): string {
  switch (agent) {
    case 'claude_code':
      return msg(
        'To change the model in this session, type /model in it. Claude Code also saves your choice as its default.',
      );
    case 'codex':
      return msg(
        'How to change the model of a running Codex session is not verified, so none is suggested.',
      );
    case 'opencode':
    case 'hermes':
      return msg(
        'How to change the model in a running session is not verified, so none is suggested.',
      );
  }
}

/** Sessions of one project, then by start: grouping for the overview (FR-NAT-08). */
export function groupByProject(
  sessions: NativeSession[],
): { project: string; sessions: NativeSession[] }[] {
  const groups = new Map<string, NativeSession[]>();
  for (const s of sessions)
    groups.set(s.project, [...(groups.get(s.project) ?? []), s]);
  return [...groups.entries()]
    .map(([project, list]) => ({
      project,
      sessions: list.sort((a, b) => b.started_at - a.started_at),
    }))
    .sort(
      (a, b) =>
        Math.max(...b.sessions.map((s) => s.started_at)) -
        Math.max(...a.sessions.map((s) => s.started_at)),
    );
}

/** Two running sessions on one folder can write the same tree (09 §6). */
export function sharedFolders(sessions: NativeSession[]): Set<string> {
  const running = new Map<string, number>();
  for (const s of sessions)
    if (s.state === 'running')
      running.set(s.project, (running.get(s.project) ?? 0) + 1);
  return new Set([...running].filter(([, n]) => n > 1).map(([p]) => p));
}

/**
 * Sessions the Console lost sight of and has not started again since: what a restored
 * workspace would start. A record that already has a successor is not offered twice.
 */
export function restorable(sessions: NativeSession[]): NativeSession[] {
  const restarted = new Set(
    sessions.map((s) => s.restart_of).filter((id): id is string => id !== null),
  );
  return sessions.filter((s) => s.state === 'lost' && !restarted.has(s.id));
}
