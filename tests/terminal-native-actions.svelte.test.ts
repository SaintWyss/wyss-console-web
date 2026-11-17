import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { parseConsoleSessionId } from '../src/lib/contracts/identities';
import type { NativeController } from '../src/lib/features/native/controller';
import { session as nativeSession } from './native-harness';
import TerminalPanel from '../src/lib/features/terminal/TerminalPanel.svelte';
import type {
  TerminalSession,
  TerminalSessionManager,
} from '../src/lib/features/terminal/session-manager';

let component: ReturnType<typeof mount> | undefined;
afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  document.body.innerHTML = '';
});

const settle = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
  flushSync();
};

function render(
  options: {
    state?: 'running' | 'stopped' | 'requested';
    registered?: boolean;
    starting?: boolean;
    m9Blocked?: boolean;
  } = {},
) {
  const id = 'a'.repeat(32);
  const manager = {
    attach: vi.fn(),
    closeTab: vi.fn(async () => undefined),
    search: vi.fn(() => ({ total: 0, current: 0 })),
    clearSearch: vi.fn(),
    activate: vi.fn(),
  };
  const controller = {
    clearFailure: vi.fn(),
    stop: vi.fn(async () => true),
    restart: vi.fn(async () => true),
    forget: vi.fn(async () => true),
  };
  const session: TerminalSession = {
    id: parseConsoleSessionId('11111111-1111-4111-8111-111111111111'),
    title: 'Claude Code',
    view: { state: 'running' },
    native: {
      sessionId: id,
      agent: 'Claude Code',
      project: '/example',
      profile: null,
      throughShell: true,
    },
  };
  component = mount(TerminalPanel, {
    target: document.body,
    props: {
      session,
      tabId: 'tab-1',
      visible: true,
      focused: true,
      place: { x: 0, y: 0, w: 1, h: 1 },
      searching: false,
      manager: manager as unknown as TerminalSessionManager,
      onsearchclose: () => undefined,
      nativeRecord:
        options.registered === false
          ? null
          : nativeSession({ id, state: options.state ?? 'running' }),
      nativeController: controller as unknown as NativeController,
      nativeStarting: options.starting ?? false,
      m9Blocked: options.m9Blocked ?? false,
    },
  });
  flushSync();
  return { manager, controller };
}

function button(label: string): HTMLButtonElement | undefined {
  return [
    ...document.querySelectorAll<HTMLButtonElement>(
      '.native-panel-actions button',
    ),
  ].find((candidate) => candidate.textContent?.trim() === label);
}

describe('native terminal panel actions', () => {
  it('shows Stop and Restart only for a registered running session and calls stop without closing the tab', async () => {
    const { manager, controller } = render();
    expect(button('Stop')).toBeDefined();
    expect(button('Restart')).toBeDefined();
    expect(button('Forget')).toBeUndefined();
    button('Stop')!.click();
    await settle();
    expect(controller.clearFailure).toHaveBeenCalledOnce();
    expect(controller.stop).toHaveBeenCalledWith('a'.repeat(32));
    expect(manager.closeTab).not.toHaveBeenCalled();
  });

  it('shows restart and forget for a finished session and closes the old tab after either succeeds', async () => {
    const { manager, controller } = render({ state: 'stopped' });
    expect(button('Stop')).toBeUndefined();
    expect(button('Start it again')).toBeDefined();
    expect(button('Forget')).toBeDefined();
    button('Start it again')!.click();
    await settle();
    expect(controller.restart).toHaveBeenCalledWith('a'.repeat(32));
    expect(manager.closeTab).toHaveBeenCalledWith('tab-1');
    button('Forget')!.click();
    await settle();
    expect(controller.forget).toHaveBeenCalledWith('a'.repeat(32));
    expect(manager.closeTab).toHaveBeenCalledTimes(2);
  });

  it('hides actions without a registry record or while the record is only requested', () => {
    render({ registered: false });
    expect(document.querySelector('.native-panel-actions')).toBeNull();
    unmount(component!);
    component = undefined;
    render({ state: 'requested' });
    expect(document.querySelector('.native-panel-actions')).toBeNull();
  });

  it('keeps Stop available and disables Restart while starting or M9 is blocked', () => {
    render({ starting: true, m9Blocked: true });
    expect(button('Stop')?.disabled).toBe(false);
    expect(button('Restart')?.disabled).toBe(true);
  });
});
