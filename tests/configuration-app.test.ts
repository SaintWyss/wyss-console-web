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

const entry = (name: string, set: string, description: string) => ({
  id: `claude_code/skill/${set}/${name}`,
  tool: 'claude_code',
  kind: 'skill',
  name,
  description,
  set,
  origin: `~/.claude/skills/${name}`,
  linked_to: null,
  scope: 'both',
  codex_differs: true,
  unreadable: null,
});
const guideReply = {
  entries: [
    entry(
      'loops',
      'mine',
      'Designs loops. Use when a task repeats. Do not use for one-off work.',
    ),
    entry('useful', 'mine', 'Helps.'),
    entry('gsd-help', 'gsd:claude_code', 'Shows the GSD commands.'),
    entry('gsd-plan', 'gsd:claude_code', 'Plans a phase.'),
  ],
  sets: [
    {
      key: 'gsd:claude_code',
      tool: 'claude_code',
      kind: 'gsd',
      name: 'GSD Core',
      version: '1.15.0',
      description: '',
    },
  ],
  truncated: false,
};

const planned: unknown[] = [];
function desktop(inventory: () => unknown = () => fixture) {
  const calls: string[] = [];
  mockIPC((command, payload) => {
    calls.push(command);
    if (command === 'configuration_plan') {
      planned.push((payload as { request: unknown }).request);
      return never();
    }
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
      case 'arsenal_guide':
        return guideReply;
      case 'arsenal_guide_body':
        return {
          id: request.id,
          text: '# Loops\n\n## Usage\n\nType /loops.\n\n<img src=x onerror=alert(1)>',
          cut: false,
          files: ['SKILL.md'],
          more_files: 0,
        };
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
  Array.from(
    document.querySelectorAll<HTMLButtonElement>('.ars-tree-item'),
  ).find((b) => b.textContent?.trim().startsWith(label))!;

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

it('opens Arsenal on its Guide, with the tree at the side; the earlier screen is under More', async () => {
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
    Array.from(document.querySelectorAll('.ars-tree-item')).map((b) =>
      b.textContent?.replace(/\s*[\d…]+$/, '').trim(),
    ),
  ).toEqual(['Guide', 'Mine', 'GSD Core', 'Agents', 'Hooks', 'MCP', 'Global']);
  // The Guide: what a skill is, and no description of any skill.
  expect(text(library)).toContain('A skill is an instruction');
  expect(text(library)).not.toContain('Designs loops');
  expect(ipc.count('arsenal_guide')).toBe(1);
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

it('shows Mine folded, and a card split from the description, read by id', async () => {
  const ipc = desktop();
  component = mount(App, { target: document.body });
  await flush();
  tab('Arsenal').click();
  await flush();
  kind('Mine').click();
  await flush();
  const library = document.querySelector<HTMLElement>('.library-feature')!;
  // Folded: the category and its phrase, no row.
  expect(library.querySelector('.ars-row')).toBeNull();
  expect(text(library)).toContain('Planning and method');
  library.querySelector<HTMLButtonElement>('.ars-group-head')!.click();
  await flush();
  const row = library.querySelector<HTMLButtonElement>('.ars-row')!;
  expect(text(row)).toBe('loops Designs loops.');
  row.click();
  await flush();
  const card = library.querySelector<HTMLElement>('.ars-card')!;
  expect(text(card)).toContain('What it does Designs loops.');
  expect(text(card)).toContain('Use it when Use when a task repeats.');
  expect(text(card)).toContain(
    'Do not use it when Do not use for one-off work.',
  );
  expect(text(card)).toContain('How it is used Type /loops.');
  expect(text(card)).toContain('Both · global');
  expect(text(card)).toContain('Codex’s copy is different.');
  expect(ipc.count('arsenal_guide_body')).toBe(1);
  // A third party's text is shown as text, never as markup.
  expect(card.querySelector('img')).toBeNull();
  expect(text(card)).toContain('<img src=x onerror=alert(1)>');
});

it('opens a set with where to start and the note that it is not edited here', async () => {
  desktop();
  component = mount(App, { target: document.body });
  await flush();
  tab('Arsenal').click();
  await flush();
  kind('GSD Core').click();
  await flush();
  const library = document.querySelector<HTMLElement>('.library-feature')!;
  expect(text(library)).toContain('GSD Core 1.15.0');
  expect(text(library)).toContain('Start with /gsd-help');
  expect(text(library)).toContain(
    'They come from outside and update themselves',
  );
  expect(library.querySelectorAll('.ars-row')).toHaveLength(2);
});

it('switches one of Mine off through Configuration’s own plan', async () => {
  desktop();
  planned.length = 0;
  component = mount(App, { target: document.body });
  await flush();
  tab('Arsenal').click();
  await flush();
  kind('Mine').click();
  await flush();
  const library = document.querySelector<HTMLElement>('.library-feature')!;
  for (const head of library.querySelectorAll<HTMLButtonElement>(
    '.ars-group-head',
  ))
    head.click();
  await flush();
  Array.from(library.querySelectorAll<HTMLButtonElement>('.ars-row'))
    .find((b) => b.textContent?.includes('useful'))!
    .click();
  await flush();
  const card = library.querySelector<HTMLElement>('.ars-card')!;
  expect(text(card)).toContain('State Switched on');
  Array.from(card.querySelectorAll<HTMLButtonElement>('button'))
    .find((b) => b.textContent?.trim() === 'Switch off')!
    .click();
  await flush();
  // The account's entry, never the open project's skill of the same name.
  expect(planned).toEqual([
    { operation: 'skill_off', target: '4dadecba81158fed2b5d162fa7214374' },
  ]);
});
