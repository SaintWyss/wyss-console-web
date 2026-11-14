import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { mockIPC } from '@tauri-apps/api/mocks';
import App from '../src/App.svelte';
import type { TerminalRenderer } from '../src/lib/features/terminal/renderer';
import { parseTerminalId } from '../src/lib/contracts/identities';
import { listing } from './agent-harness';
import approvals from './fixtures/approval-list-v1.json';
import fixture from './fixtures/configuration-inventory-v1.json';
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
  for (let i = 0; i < 30; i++) await Promise.resolve();
  flushSync();
};
const never = () => new Promise(() => undefined);
const text = (node: Element | null | undefined) =>
  node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const connected = {
  ...views.connected,
  agent: { ...views.connected.agent, actual: 'ready', model_count: 7 },
};

function desktop(inventory: () => unknown = () => fixture) {
  const calls: string[] = [];
  mockIPC((command, payload) => {
    calls.push(command);
    const request =
      (payload as { request?: Record<string, unknown> })?.request ?? {};
    switch (command) {
      case 'authority_state':
        return request.after === null ? connected : never();
      case 'configuration_inventory':
        return inventory();
      case 'configuration_changes':
        return { result: 'same', revision: 1 };
      case 'managed_sessions_page':
        return pages.loaded;
      case 'managed_turns':
        return listing([]);
      case 'managed_approvals':
        return approvals.empty;
      case 'arsenal_capabilities':
        return [];
      case 'arsenal_presets':
      case 'arsenal_selections':
        return [];
      case 'arsenal_discover':
        return {
          project: null,
          sources: [],
          candidates: [],
          composites: [],
          truncated: false,
        };
      case 'terminal_read_output':
        return never();
      case 'get_app_info':
        return { schema_version: 1, name: 'Wyss Console', version: '2.0-test' };
      default:
        return info;
    }
  });
  return { count: (c: string) => calls.filter((x) => x === c).length };
}
const nav = (label: string) =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>('.sidebar .nav-item'),
  ).find((b) => b.textContent?.includes(label))!;
const tab = (label: string) =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      '.personal-tabs .personal-tab',
    ),
  ).find((b) => b.textContent?.trim() === label)!;
const view = () =>
  document.querySelector<HTMLElement>(
    '.configuration-feature:not(.arsenal-feature)',
  )!;

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
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const kind = (label: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('.ars-kind')).find(
    (b) => b.textContent?.trim().startsWith(label),
  )!;

it('lives in Arsenal: its Global tab reads the configuration only while Arsenal is shown', async () => {
  const ipc = desktop();
  component = mount(App, { target: document.body });
  await flush();
  expect(ipc.count('configuration_inventory')).toBe(0);

  tab('Arsenal').click();
  await flush();
  kind('Global').click();
  await flush();
  expect(view().hidden).toBe(false);
  // Inside Arsenal it draws no title or filters of its own.
  expect(document.querySelector('.context-title')).toBeNull();
  expect(view().querySelector('h2')).toBeNull();
  expect(ipc.count('configuration_inventory')).toBe(1);
  // Global holds rule files, the configured model and plugins only.
  for (const row of view().querySelectorAll('.configuration-row'))
    expect(row.textContent).not.toMatch(/\bHook\b|MCP/);

  nav('Console').click();
  await flush();
  expect(view().hidden).toBe(true);
});

it('does not take the desktop’s answer on faith', async () => {
  desktop(() => ({
    ...fixture,
    inventory: { ...fixture.inventory, items: 'x' },
  }));
  component = mount(App, { target: document.body });
  await flush();
  tab('Arsenal').click();
  await flush();
  kind('Hooks').click();
  await flush();
  expect(text(view())).toContain('The configuration could not be read');
  expect(view().querySelector('.configuration-row')).toBeNull();
});

it('opens Arsenal on the tool, then the kind; the earlier screen is under More', async () => {
  const ipc = desktop();
  component = mount(App, { target: document.body });
  await flush();
  tab('Arsenal').click();
  await flush();
  const library = document.querySelector<HTMLElement>('.library-feature')!;
  expect(library.hidden).toBe(false);
  expect(
    Array.from(library.querySelectorAll('.ars-tool')).map((b) => b.textContent),
  ).toEqual(['Claude Code', 'Codex']);
  expect(
    Array.from(library.querySelectorAll('.ars-kind')).map((b) =>
      b.textContent?.replace(/\s*\d+$/, '').trim(),
    ),
  ).toEqual(['Global', 'Skills', 'Agents', 'Hooks', 'MCP']);
  // Skills first; nothing is imported here yet.
  expect(text(library)).toContain('Nothing here yet');
  expect(ipc.count('arsenal_capabilities')).toBe(1);
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      '.sidebar .rail-menu .nav-item',
    ),
  )
    .find((b) => b.textContent?.trim() === 'Arsenal presets')!
    .click();
  await flush();
  const arsenal = document.querySelector<HTMLElement>('.arsenal-feature')!;
  expect(arsenal.hidden).toBe(false);
  arsenal.querySelector<HTMLButtonElement>('#arsenal-tab-library')!.click();
  await flush();
  expect(text(arsenal)).toContain('Nothing is imported yet');
});
