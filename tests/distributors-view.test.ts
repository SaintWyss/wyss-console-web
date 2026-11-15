import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { mockIPC } from '@tauri-apps/api/mocks';
import App from '../src/App.svelte';
import type { TerminalRenderer } from '../src/lib/features/terminal/renderer';
import { parseTerminalId } from '../src/lib/contracts/identities';
import { listing } from './agent-harness';
import { launcher } from './native-harness';
import approvals from './fixtures/approval-list-v1.json';
import inventory from './fixtures/configuration-inventory-v1.json';
import catalogues from './fixtures/model-catalogue-v1.json';
import views from './fixtures/authority-view-v1.json';
import pages from './fixtures/session-page-v4.json';

const fakes = vi.hoisted(() => ({ factory: vi.fn() }));
vi.mock('../src/lib/features/terminal/renderer', () => ({
  createRenderer: fakes.factory,
}));

let component: ReturnType<typeof mount> | undefined;
const info = {
  terminal_id: parseTerminalId('55555555-5555-4555-8555-555555555555'),
  shell: '/bin/fish',
  cwd: '/example',
  observed_pid: 123,
  size: { rows: 24, cols: 80 },
  state: 'running',
  exit: null,
  error: null,
};
const flush = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  flushSync();
};
const never = () => new Promise(() => undefined);
const text = (node: Element | null | undefined) =>
  node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
/** A desktop whose answers the test changes between refreshes. */
function desktop() {
  const calls: string[] = [];
  const answers = {
    /** A value, or a function called on each read (a promise leaves the read in flight). */
    catalogue: catalogues.listed as unknown,
    inventory: (() => inventory) as () => unknown,
    launcherFails: false,
    /** Answers of its own for a command; `undefined` leaves it to the rest. */
    extra: (() => undefined) as (
      command: string,
      request: Record<string, unknown>,
    ) => unknown,
  };
  mockIPC((command, payload) => {
    calls.push(command);
    const request =
      (payload as { request?: Record<string, unknown> })?.request ?? {};
    const own = answers.extra(command, request);
    if (own !== undefined) return own;
    switch (command) {
      case 'authority_state':
        return request.after === null ? views.connected : never();
      case 'native_launcher':
        if (answers.launcherFails) throw { code: 'internal', reasons: [] };
        return launcher();
      case 'distributor_list':
        return {
          folder: '~/d',
          distributors: [],
          refused: [],
          home: '/home/me',
        };
      case 'native_readiness':
        return { m9_native_status: 'ready' };
      case 'native_sessions':
        return [];
      case 'managed_model_catalogue':
        return typeof answers.catalogue === 'function'
          ? (answers.catalogue as () => unknown)()
          : answers.catalogue;
      case 'configuration_inventory':
        return answers.inventory();
      case 'configuration_changes':
        return { result: 'same', revision: 1 };
      case 'managed_sessions_page':
        return pages.loaded;
      case 'managed_turns':
        return listing([]);
      case 'managed_approvals':
        return approvals.empty;
      case 'terminal_read_output':
        return never();
      case 'get_app_info':
        return { schema_version: 1, name: 'Wyss Console', version: '2.0-test' };
      default:
        return info;
    }
  });
  return { answers, count: (c: string) => calls.filter((x) => x === c).length };
}
const rail = (label: string) =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>('.rail-list .nav-item'),
  ).find((b) => b.getAttribute('title') === label)!;
const tab = (label: string) =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      '.personal-tabs .personal-tab',
    ),
  ).find((b) => b.textContent?.trim() === label)!;
const view = () =>
  document.querySelector<HTMLElement>('.distributors-feature')!;
const card = (id: string) =>
  view().querySelector<HTMLElement>(`.dist-card[data-id="${id}"]`)!;
const status = (id: string) => text(card(id).querySelector('.dist-status'));
// There is no refresh button: showing the view again reads everything again.
const refresh = async () => {
  tab('Credentials').click();
  await flush();
  tab('Distributors').click();
  await flush();
};

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  fakes.factory.mockImplementation((): TerminalRenderer => ({
    fit: () => info.size,
    write: async () => true,
    input: () => () => undefined,
    setInput: vi.fn(),
    setActive: vi.fn(),
    focus: vi.fn(),
    dispose: vi.fn(),
  }));
});
afterEach(async () => {
  if (component) await unmount(component);
  component = undefined;
  document.body.innerHTML = '';
  localStorage.clear();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

it('opens from the rail, reads only while shown, and draws what the desktop answered', async () => {
  const ipc = desktop();
  component = mount(App, { target: document.body });
  await flush();
  expect(view().hidden).toBe(true);
  expect(view().inert).toBe(true);
  // The tools are discovered once when the window starts, whichever view is shown.
  const before = ipc.count('native_launcher');
  expect(before).toBe(1);
  expect(ipc.count('configuration_inventory')).toBe(0);
  expect(ipc.count('managed_model_catalogue')).toBe(0);

  tab('Distributors').click();
  await flush();
  expect(view().hidden).toBe(false);
  expect(rail('Personalization').getAttribute('aria-current')).toBe('page');
  // Providers is a view of its own, under More: the rail no longer opens it.
  expect(
    document.querySelector<HTMLElement>('.providers-feature')!.hidden,
  ).toBe(true);
  // The cards say what the view is: no title is drawn over them.
  expect(document.querySelector('.context-title')).toBeNull();
  // Showing the view reads the tools again: there is no refresh button.
  expect(ipc.count('native_launcher')).toBe(before + 1);
  expect(ipc.count('configuration_inventory')).toBe(1);
  expect(ipc.count('managed_model_catalogue')).toBe(1);

  // One line each: maker · tool · version, nothing about models or the last read.
  expect(
    Array.from(view().querySelectorAll('.dist-card h3')).map(text),
  ).toEqual([
    'Anthropic · Claude Code · 2.1.303',
    'OpenAI · Codex · Tool not installed',
    'OpenCode · OpenCode · Unknown',
  ]);
  expect(text(view())).not.toMatch(
    /Last read|Configured model|Models in detail|claude update/,
  );
  expect(status('anthropic')).toBe('2.1.303');
  expect(card('anthropic').querySelector('.dist-status.ok')).not.toBeNull();
  expect(status('openai')).toBe('Tool not installed');
  expect(card('openai').querySelector('.dist-status.ok')).toBeNull();
  expect(status('opencode')).toBe('Unknown');
  expect(text(view())).not.toMatch(/connected/i);

  // Each card has Update only: configuration and credentials are in the column.
  expect(Array.from(view().querySelectorAll('button')).map(text)).toEqual([
    'Update tool',
    'Update tool',
    'Add a tool',
  ]);
});

it('adds a tool by name and command, opens it from its file, and makes a launch of it', async () => {
  const ipc = desktop();
  const saved: unknown[] = [];
  const launches: unknown[] = [];
  const kimi = {
    id: 'kimi-cli',
    name: 'Kimi CLI',
    maker: 'Moonshot AI',
    open: 'kimi',
    update: null,
    note: null,
    executable: 'kimi',
    found: null,
  };
  let list: unknown[] = [];
  ipc.answers.extra = (command, request) => {
    if (command === 'distributor_list')
      return {
        folder: '~/d',
        distributors: list,
        refused: [],
        home: '/home/me',
      };
    if (command === 'distributor_save') {
      saved.push(request);
      list = [kimi];
      return kimi;
    }
    if (command === 'distributor_get') return kimi;
    if (command === 'distributor_make_launch') {
      launches.push(request);
      return 'kimi-cli';
    }
    return undefined;
  };
  component = mount(App, { target: document.body });
  await flush();
  tab('Distributors').click();
  await flush();
  const button = (label: string) =>
    Array.from(view().querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => text(b) === label,
    )!;
  button('Add a tool').click();
  await flush();
  // The dialog takes the focus on its first field: Esc works at once.
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
  expect(document.activeElement).toBe(dialog.querySelector('input'));
  document.activeElement!.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
  await flush();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  button('Add a tool').click();
  await flush();
  button('Kimi CLI').click();
  await flush();
  view().querySelector<HTMLFormElement>('.dist-form')!.requestSubmit();
  await flush();
  expect(saved).toEqual([
    {
      id: null,
      name: 'Kimi CLI',
      maker: 'Moonshot AI',
      open: 'kimi',
      update: null,
      note: null,
    },
  ]);
  const added = view().querySelector('[data-id="added:kimi-cli"]')!;
  // The same one line as the tools the Console knows: maker · name · state.
  expect(text(added.querySelector('h3'))).toBe(
    'Moonshot AI · Kimi CLI · Tool not installed',
  );
  expect(added.querySelector('h3')!.getAttribute('title')).toContain(
    'was not found',
  );
  // The form was a dialog, and it is gone once saved.
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  // Adding it made its launch in Workspace, without leaving this page.
  expect(launches).toHaveLength(1);
  expect(Array.from(added.querySelectorAll('button')).map(text)).toEqual([
    'Open',
    'Edit',
    'Delete',
  ]);
  // No Update without a command for it.
  expect(Array.from(added.querySelectorAll('button')).map(text)).not.toContain(
    'Update tool',
  );
  // Its launch and its removal are in its dialog, opened by Edit.
  Array.from(added.querySelectorAll<HTMLButtonElement>('button'))
    .find((b) => text(b) === 'Edit')!
    .click();
  await flush();
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  button('Make launch').click();
  await flush();
  // Workspace opens on the launch made.
  expect(document.querySelector('.launch-editor')!.hasAttribute('hidden')).toBe(
    false,
  );
});

it('says unknown, not missing, when the tools did not answer a refresh', async () => {
  const ipc = desktop();
  component = mount(App, { target: document.body });
  await flush();
  tab('Distributors').click();
  await flush();
  expect(status('anthropic')).toBe('2.1.303');

  ipc.answers.launcherFails = true;
  await refresh();
  expect(status('anthropic')).toBe('Unknown');
  expect(status('openai')).toBe('Unknown');
  expect(status('opencode')).toBe('Unknown');

  // It answers again: what it says is shown again.
  ipc.answers.launcherFails = false;
  await refresh();
  expect(status('anthropic')).toBe('2.1.303');
  expect(status('openai')).toBe('Tool not installed');
});
