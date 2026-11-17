import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { mockIPC } from '@tauri-apps/api/mocks';
import type { NativeController } from '../src/lib/features/native/controller';
import { currentWorkspace } from '../src/lib/features/native/bridge';
import type { TerminalRenderer } from '../src/lib/features/terminal/renderer';
import { launcher, reply, session } from './native-harness';
import NativeTerminalHarness from './NativeTerminalHarness.svelte';

const fakes = vi.hoisted(() => ({ factory: vi.fn() }));
vi.mock('../src/lib/features/terminal/renderer', () => ({
  createRenderer: fakes.factory,
}));

let component: ReturnType<typeof mount> | undefined;
let controller: NativeController | undefined;
let commands: string[];
let records: ReturnType<typeof session>[];
let terminalNumber: number;
const launch = {
  id: 'daily',
  name: 'Daily work',
  directory: '/home/u/work/app',
  kind: 'session',
  agent: 'claude_code',
  permission: null,
  before: [],
  preset: null,
};
const terminal = (number: number) => ({
  terminal_id: `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
  shell: '/bin/fish',
  cwd: '/home/u/work/app',
  observed_pid: 200 + number,
  size: { rows: 24, cols: 80 },
  state: 'running',
  exit: null,
  error: null,
});

class Observer {
  observe() {}
  disconnect() {}
}

async function settle() {
  for (let i = 0; i < 60; i++) await Promise.resolve();
  flushSync();
}

async function until(condition: () => boolean, message: string) {
  for (let i = 0; i < 80; i++) {
    await settle();
    if (condition()) return;
  }
  throw new Error(message);
}

async function mountAndLaunch() {
  component = mount(NativeTerminalHarness, {
    target: document.body,
    props: { oncontroller: (value: NativeController) => (controller = value) },
  });
  await until(
    () => !!currentWorkspace() && !!document.querySelector('.launch-trigger'),
    'terminal workspace did not mount',
  );
  document.querySelector<HTMLButtonElement>('.launch-trigger')!.click();
  await until(
    () => !!document.querySelector('.launch-item'),
    'saved launch did not appear',
  );
  document.querySelector<HTMLButtonElement>('.launch-item')!.click();
  await until(
    () => commands.includes('native_start'),
    'launch did not start the native session',
  );
  await settle();
  return currentWorkspace()!;
}

function panelButton(panelId: string, label: string) {
  return [
    ...document.querySelectorAll<HTMLButtonElement>(
      `#panel-${panelId} .native-panel-actions button`,
    ),
  ].find((button) => button.textContent?.trim() === label);
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', Observer);
  commands = [];
  records = [];
  terminalNumber = 0;
  controller = undefined;
  fakes.factory.mockImplementation((): TerminalRenderer => ({
    fit: () => ({ rows: 24, cols: 80 }),
    write: async () => true,
    input: () => () => undefined,
    setInput: vi.fn(),
    setActive: vi.fn(),
    focus: vi.fn(),
    dispose: vi.fn(),
  }));

  mockIPC((command, payload) => {
    commands.push(command);
    const request =
      (payload as { request?: Record<string, unknown> } | undefined)?.request ??
      {};
    switch (command) {
      case 'native_launcher':
        return launcher();
      case 'native_readiness':
        return { m9_native_status: 'ready' };
      case 'native_sessions':
        return records;
      case 'native_preview':
        return {
          applied: [],
          with_cost: [],
          not_applicable: [],
          can_start: true,
          through_shell: true,
          warnings: [],
          plan_token: 'preview-token',
          provider_version: '2.1.303 (Claude Code)',
        };
      case 'native_start': {
        const started = reply();
        records = [started.session];
        return started;
      }
      case 'native_restart': {
        const restarted = reply({
          id: 'b'.repeat(32),
          restart_of: 'a'.repeat(32),
          restarts: 1,
          terminal_id: '77777777-7777-4777-8777-777777777777',
        });
        records = [...records, restarted.session];
        return restarted;
      }
      case 'native_stop': {
        const id = String(request.id);
        records = records.map((entry) =>
          entry.id === id
            ? session({
                ...entry,
                state: 'stopped',
                ended_at: 1_700_000_001,
                terminal_id: null,
                pid: null,
              })
            : entry,
        );
        return null;
      }
      case 'native_forget':
        return Promise.reject({ code: 'store_unavailable', reasons: [] });
      case 'launch_list':
        return {
          folder: '/home/u/.config/wyss-console/launch',
          launches: [launch],
          refused: [],
          system: { id: 'linux', like: [], name: 'Linux' },
        };
      case 'launch_get':
        return launch;
      case 'launch_before':
        return [];
      case 'arsenal_project_selection':
        return null;
      case 'host_terminals':
        return [];
      case 'layout_read':
        return null;
      case 'layout_write':
        return null;
      case 'create_terminal':
        return terminal(++terminalNumber);
      case 'terminal_read_output':
        return new Promise(() => undefined);
      case 'close_terminal':
      case 'terminal_resize':
      case 'terminal_write':
        return terminal(terminalNumber || 1);
      default:
        return null;
    }
  });
});

afterEach(async () => {
  if (component) await unmount(component);
  component = undefined;
  controller = undefined;
  await settle();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('native terminal actions in the Console', () => {
  it('refreshes the registry after the first launch from an empty registry', async () => {
    const workspace = await mountAndLaunch();
    const pane = workspace.tabOf('a'.repeat(32));

    expect(pane).toBeDefined();
    expect(
      commands.filter((command) => command === 'native_sessions').length,
    ).toBeGreaterThan(1);
    expect(panelButton(pane!, 'Stop')).toBeDefined();
    expect(panelButton(pane!, 'Restart')).toBeDefined();
  });

  it('restarts only its native pane and leaves the other split running', async () => {
    const workspace = await mountAndLaunch();
    controller!.refreshSessions();
    await until(
      () => !!workspace.tabOf('a'.repeat(32)),
      'native record did not refresh',
    );
    const nativePane = workspace.tabOf('a'.repeat(32))!;
    const neighbor = workspace.split(nativePane, 'row')!;
    await until(
      () => !!document.getElementById(`panel-${neighbor}`),
      'split terminal did not render',
    );

    panelButton(nativePane, 'Restart')!.click();
    await until(
      () =>
        workspace.tabOf('b'.repeat(32)) !== undefined &&
        workspace.tabOf('a'.repeat(32)) === undefined,
      'restart did not replace the old native pane',
    );

    expect(document.getElementById(`panel-${neighbor}`)).not.toBeNull();
  });

  it('keeps the terminal visible when forgetting its finished registry entry fails', async () => {
    const workspace = await mountAndLaunch();
    controller!.refreshSessions();
    await until(
      () => !!workspace.tabOf('a'.repeat(32)),
      'native record did not refresh',
    );
    const nativePane = workspace.tabOf('a'.repeat(32))!;

    panelButton(nativePane, 'Stop')!.click();
    await until(
      () => !!panelButton(nativePane, 'Forget'),
      'stopped registry entry did not appear',
    );
    panelButton(nativePane, 'Forget')!.click();
    await until(
      () => !!document.querySelector('[role="alert"]'),
      'failed forget did not report an error',
    );

    expect(workspace.tabOf('a'.repeat(32))).toBeDefined();
    expect(document.getElementById(`panel-${nativePane}`)).not.toBeNull();
  });
});
