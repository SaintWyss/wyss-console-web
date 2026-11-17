import { invoke } from '@tauri-apps/api/core';
import {
  parseCodexOptions,
  parseCodexSpec,
  parseOptions as parseEnvironmentOptions,
  parseSpec as parseEnvironment,
  type CodexHomeSpec,
  type HomeSpec,
} from '../features/arsenal/environment';
import {
  parseLaunchInstructions,
  type LaunchInstructions,
  parseBinding,
  parseSyncStatus,
  parseTerminalPlan,
  parseDiscover,
  parseGuide,
  parseGuideBody,
  type Guide,
  type GuideBody,
  parseImportFailure,
  parseImported,
  parseSelection,
  parseSelections,
  parseSummaries,
  type ArsenalFailure,
  type ArsenalProvider,
  type Binding,
  type SyncStatus,
  type LibraryItem,
  type TerminalPlan,
  type Imported,
  type Item,
  type Selection,
} from '../contracts/arsenal';
import type { AgentId } from '../contracts/native';

/** A command that failed, or answered with something that is not what it promises. */
export class ArsenalCallError extends Error {
  readonly code: string;
  readonly reason: string | null;

  constructor(failure: ArsenalFailure) {
    super(`arsenal: ${failure.code}`);
    this.code = failure.code;
    this.reason = failure.reason;
  }
}

async function call(
  command: string,
  args?: Record<string, unknown>,
): Promise<unknown> {
  try {
    return await invoke<unknown>(command, args);
  } catch (error) {
    let failure: ArsenalFailure;
    try {
      failure = parseImportFailure(error);
    } catch {
      failure = { code: 'internal', reason: null };
    }
    throw new ArsenalCallError(failure);
  }
}

/** Reads the answer of a command, and turns anything that is not its shape into `internal`. */
async function answer<T>(
  command: string,
  parse: (value: unknown) => T,
  args?: Record<string, unknown>,
): Promise<T> {
  const value = await call(command, args);
  try {
    return parse(value);
  } catch {
    throw new ArsenalCallError({ code: 'internal', reason: null });
  }
}

/** The entry an import names, as the last scan listed it. The backend reads that entry again. */
export interface ImportTarget {
  id: string;
  kind: string;
  source: string;
  name: string;
}

export { parseLaunchInstructions } from '../contracts/arsenal';
export type { LaunchInstructions } from '../contracts/arsenal';

/** Every request names something the library or a fresh scan already holds, never a path. */
export const arsenalClient = {
  discover: () => answer('arsenal_discover', parseDiscover),
  guide: () => answer<Guide>('arsenal_guide', parseGuide),
  guideBody: (id: string) =>
    answer<GuideBody>('arsenal_guide_body', parseGuideBody, {
      request: { id },
    }),
  capabilities: () =>
    answer<LibraryItem[]>('arsenal_capabilities', parseSummaries),
  importSkill: (target: ImportTarget) =>
    answer<Imported>('arsenal_import', parseImported, { request: target }),
  selections: () => answer<Selection[]>('arsenal_selections', parseSelections),
  saveSelection: (input: {
    id: string | null;
    name: string;
    provider: ArsenalProvider;
    items: Item[];
    composites: string[];
  }) =>
    answer<Selection>('arsenal_selection_write', parseSelection, {
      request: input,
    }),
  deleteSelection: (id: string) =>
    call('arsenal_selection_delete', { request: { id } }).then(() => undefined),
  /** The launch environment a Claude Code preset chose (H1/H2). */
  environment: (selection: string) =>
    answer<HomeSpec>('arsenal_environment', parseEnvironment, { selection }),
  /** What a launch environment can choose from, read from the owner's ~/.claude now. */
  environmentOptions: () =>
    answer('arsenal_environment_options', parseEnvironmentOptions),
  writeEnvironment: (selection: string, environment: HomeSpec) =>
    call('arsenal_environment_write', { selection, environment }).then(
      () => undefined,
    ),
  /** The launch environment a Codex preset chose (H4): instructions and hooks left out. */
  codexEnvironment: (selection: string) =>
    answer<CodexHomeSpec>('arsenal_codex_environment', parseCodexSpec, {
      selection,
    }),
  /** What a Codex launch environment can choose from, read from the owner's ~/.codex now. */
  codexEnvironmentOptions: () =>
    answer('arsenal_codex_environment_options', parseCodexOptions),
  writeCodexEnvironment: (selection: string, environment: CodexHomeSpec) =>
    call('arsenal_codex_environment_write', { selection, environment }).then(
      () => undefined,
    ),
  launchInstructions: (selection: string) =>
    answer('arsenal_launch_instructions', parseLaunchInstructions, {
      selection,
    }),
  writeLaunchInstructions: (
    selection: string,
    instructions: LaunchInstructions,
  ) =>
    call('arsenal_launch_instructions_write', { selection, instructions }).then(
      () => undefined,
    ),
  /** Workspace roles: the owner's own and each launch's role, kept on this computer. */
  roles: () => answer<Roles>('arsenal_roles', parseRoles),
  writeRole: (change: RoleChange) =>
    answer<Roles>('arsenal_role_write', parseRoles, { change }),
  /** The configuration one terminal would start with, computed now by the desktop. */
  terminalPlan: (
    selection: string,
    agent_id: AgentId,
    project: string | null,
    preview_items?: Item[],
  ) =>
    answer<TerminalPlan>('arsenal_terminal_plan', parseTerminalPlan, {
      request: {
        selection,
        agent_id,
        project,
        ...(preview_items ? { preview_items } : {}),
      },
    }),
  /** Records what a started terminal carries; the desktop reads that from the host itself. */
  bindTerminal: (session_id: string, selection: string, config_hash: string) =>
    answer<Binding>('arsenal_terminal_bind', parseBinding, {
      request: { session_id, selection, config_hash },
    }),
  /** Synchronization with the owner's other computers. Reading it changes nothing. */
  syncStatus: () => answer<SyncStatus>('arsenal_sync_status', parseSyncStatus),
  projectSelection: (project: string, agent_id: AgentId) =>
    answer<string | null>(
      'arsenal_project_selection',
      (value) => {
        if (value === null) return null;
        if (typeof value !== 'string') throw new Error('selection');
        return value;
      },
      { request: { project, agent_id } },
    ),
};

export type ArsenalClient = typeof arsenalClient;

/** Workspace roles as the desktop answers them. */
export interface Roles {
  custom: { id: string; name: string }[];
  /** Launch id → role id. A launch not listed is a Worker. */
  assigned: Record<string, string>;
  /** roles.json could not be read: it is not written over. */
  damaged: boolean;
}
export type RoleChange =
  | { do: 'create'; name: string }
  | { do: 'delete'; id: string }
  | { do: 'assign'; launch: string; role: string }
  | { do: 'rename'; from: string; to: string }
  | { do: 'forget'; launch: string };

export function parseRoles(value: unknown): Roles {
  const v = value as Record<string, unknown>;
  if (typeof v !== 'object' || v === null || !Array.isArray(v.custom))
    throw new Error('roles');
  const custom = v.custom.map((entry: unknown) => {
    const c = entry as Record<string, unknown>;
    if (typeof c?.id !== 'string' || typeof c?.name !== 'string')
      throw new Error('role');
    return { id: c.id, name: c.name };
  });
  const assigned = v.assigned as Record<string, unknown>;
  if (
    typeof assigned !== 'object' ||
    assigned === null ||
    Array.isArray(assigned)
  )
    throw new Error('assigned');
  if (Object.values(assigned).some((r) => typeof r !== 'string'))
    throw new Error('assigned');
  return {
    custom,
    assigned: assigned as Record<string, string>,
    damaged: v.damaged === true,
  };
}
