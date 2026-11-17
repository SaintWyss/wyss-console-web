import { vi } from 'vitest';
import type { NativeClient } from '../src/lib/features/native/controller';
import {
  parseLauncher,
  parseSession,
  parseStartReply,
  type Launcher,
  type NativeSession,
  type StartReply,
} from '../src/lib/contracts/native';

export const TERMINAL = '66666666-6666-4666-8666-666666666666';

export function launcher(over: Record<string, unknown> = {}): Launcher {
  return parseLauncher({
    agents: [
      {
        agent_id: 'claude_code',
        name: 'Claude Code',
        executable: 'claude',
        installed: true,
        path: '/home/u/.local/bin/claude',
        version: '2.1.303 (Claude Code)',
      },
      {
        agent_id: 'codex',
        name: 'Codex',
        executable: 'codex',
        installed: false,
        path: null,
        version: null,
      },
    ],
    shell: { path: '/usr/bin/fish', family: 'fish', through_shell: true },
    projects: [
      {
        path: '/home/u',
        home: true,
        default_agent: null,
        // A host from before profiles were removed still answers this; it is not read.
        default_profile: null,
        last_used: 0,
      },
      {
        path: '/home/u/work/app',
        home: false,
        default_agent: 'claude_code',
        default_profile: 'template-review',
        last_used: 5,
      },
    ],
    ...over,
  });
}

/** The launcher with OpenCode installed beside Claude Code: the M9 agent a degraded store guards. */
export function launcherWithM9(status: Launcher['m9_native_status']): Launcher {
  return launcher({
    m9_native_status: status,
    agents: [
      {
        agent_id: 'claude_code',
        name: 'Claude Code',
        executable: 'claude',
        installed: true,
        path: '/home/u/.local/bin/claude',
        version: '2.1.303 (Claude Code)',
      },
      {
        agent_id: 'opencode',
        name: 'OpenCode',
        executable: 'opencode',
        installed: true,
        path: '/home/u/.opencode/bin/opencode',
        version: '1.19.4',
      },
    ],
  });
}

export function session(over: Record<string, unknown> = {}): NativeSession {
  return parseSession({
    id: 'a'.repeat(32),
    agent_id: 'claude_code',
    agent_name: 'Claude Code',
    version: '2.1.303 (Claude Code)',
    project: '/home/u',
    profile: null,
    through_shell: true,
    state: 'running',
    started_at: 1_700_000_000,
    ended_at: null,
    exit_code: null,
    exit_signal: null,
    error: null,
    restart_of: null,
    restarts: 0,
    plane: 'native',
    terminal_id: TERMINAL,
    pid: 4242,
    usage: null,
    ...over,
  });
}

export function reply(over: Record<string, unknown> = {}): StartReply {
  const s = session(over);
  return parseStartReply({
    session: s,
    terminal: {
      terminal_id: s.terminal_id,
      shell: '/usr/bin/fish',
      cwd: s.project,
      observed_pid: 4242,
      size: { rows: 24, cols: 80 },
      state: 'running',
      exit: null,
      error: null,
    },
  });
}

/** A client over canned answers; every call is a spy the test can read. */
export function fakeClient(over: Partial<NativeClient> = {}) {
  const client: NativeClient = {
    launcher: vi.fn(async () => launcher()),
    readiness: vi.fn(async () => ({ m9_native_status: 'ready' as const })),
    sessions: vi.fn(async () => [] as NativeSession[]),
    start: vi.fn(async () => reply()),
    restart: vi.fn(async () =>
      reply({ id: 'c'.repeat(32), restart_of: 'a'.repeat(32), restarts: 1 }),
    ),
    stop: vi.fn(async () => undefined),
    forget: vi.fn(async () => undefined),
    chooseProject: vi.fn(async () => null),
    ...over,
  };
  return client;
}
