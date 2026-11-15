import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { mockIPC } from '@tauri-apps/api/mocks';
import App from '../src/App.svelte';
import type { TerminalRenderer } from '../src/lib/features/terminal/renderer';
import { parseTerminalId } from '../src/lib/contracts/identities';
import { listing } from './agent-harness';
import approvals from './fixtures/approval-list-v1.json';
import fixture from './fixtures/configuration-inventory-v1.json';
import changesFixture from './fixtures/configuration-changes-v1.json';
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
  description_cut: false,
});
const guideReply = {
  entries: [
    entry(
      'loops',
      'mine',
      'Designs loops. Use when a task repeats. Do not use for one-off work.',
    ),
    entry('useful', 'mine', 'Helps.'),
    entry('noisy', 'mine', 'Talks a lot.'),
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
const undone: unknown[] = [];
/** When set, plans and applies answer, so a change can be made and undone. */
let answering = false;
let changeNumber = 0;
function desktop(inventory: () => unknown = () => fixture) {
  const calls: string[] = [];
  mockIPC((command, payload) => {
    calls.push(command);
    const asked = (payload as { request?: Record<string, unknown> })?.request;
    if (command === 'configuration_plan') {
      planned.push(asked);
      if (!answering) return never();
      changeNumber += 1;
      return {
        ...changesFixture.plan_skill,
        id: String(changeNumber).padStart(32, '0'),
      };
    }
    if (command === 'configuration_apply')
      return {
        change: `a${String(changeNumber).padStart(31, '0')}`,
        outcome: 'applied',
        revision: 0,
      };
    if (command === 'configuration_undo') {
      undone.push(asked?.change);
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
          files_cut: false,
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

it('opens Arsenal on the owner’s skills, the tree by origin at the side; the earlier screen is under More', async () => {
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
  ).toEqual(['My skills', 'GSD Core', 'Agents', 'Hooks', 'MCP', 'Global']);
  // Each origin has its colour, named next to it.
  expect(
    document.querySelector('.ars-tree-item[data-origin="gsd"] .ars-dot'),
  ).not.toBeNull();
  // It lands on the owner's own skills, shown as rows with their origin.
  expect(text(library)).toContain('Designs loops');
  expect(text(library)).not.toContain('A skill is an instruction');
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

it('shows the owner’s skills as rows, and a card over them split from the description, read by id', async () => {
  const ipc = desktop();
  component = mount(App, { target: document.body });
  await flush();
  tab('Arsenal').click();
  await flush();
  kind('My skills').click();
  await flush();
  const library = document.querySelector<HTMLElement>('.library-feature')!;
  // Rows under their category, each with its origin in words.
  expect(text(library)).toContain('Planning and method');
  const row = Array.from(
    library.querySelectorAll<HTMLButtonElement>('.ars-row'),
  ).find((b) => b.textContent?.includes('loops'))!;
  expect(text(row)).toBe('loops Designs loops. My skills');
  expect(row.getAttribute('aria-haspopup')).toBe('dialog');
  row.focus();
  row.click();
  await flush();
  const card = library.querySelector<HTMLElement>('.ars-card')!;
  expect(card.getAttribute('role')).toBe('dialog');
  expect(card.getAttribute('aria-modal')).toBe('true');
  expect(card.dataset.origin).toBe('mine');
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
  // Esc closes it and the focus goes back to the row that opened it.
  card.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
  await flush();
  expect(library.querySelector('.ars-card')).toBeNull();
  expect(document.activeElement).toBe(row);
});

it('closes the card with a click outside it, and finds skills from the search box', async () => {
  desktop();
  component = mount(App, { target: document.body });
  await flush();
  tab('Arsenal').click();
  await flush();
  const library = document.querySelector<HTMLElement>('.library-feature')!;
  library.querySelector<HTMLButtonElement>('.ars-row')!.click();
  await flush();
  library.querySelector<HTMLElement>('.ars-overlay')!.click();
  await flush();
  expect(library.querySelector('.ars-card')).toBeNull();
  // The search looks through every origin of the tool, from a configuration page too.
  kind('Hooks').click();
  await flush();
  const box = document.querySelector<HTMLInputElement>('.ars-search')!;
  box.value = 'phase';
  box.dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
  const rows = Array.from(library.querySelectorAll('.ars-row')).map((r) =>
    text(r),
  );
  expect(rows).toEqual(['gsd-plan Plans a phase. GSD Core']);
  expect(text(library)).toContain('1 found for “phase”');
});

it('opens an origin with each set, where to start and what the set is', async () => {
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
  expect(text(library)).toContain('A method for planning');
  expect(library.querySelectorAll('.ars-row[data-origin="gsd"]')).toHaveLength(
    2,
  );
});

it('switches one of Mine off through Configuration’s own plan', async () => {
  desktop();
  planned.length = 0;
  component = mount(App, { target: document.body });
  await flush();
  tab('Arsenal').click();
  await flush();
  kind('My skills').click();
  await flush();
  const library = document.querySelector<HTMLElement>('.library-feature')!;
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

it('offers Undo on the card whose change it was, naming that change', async () => {
  desktop();
  answering = true;
  changeNumber = 0;
  undone.length = 0;
  component = mount(App, { target: document.body });
  await flush();
  tab('Arsenal').click();
  await flush();
  kind('My skills').click();
  await flush();
  const library = document.querySelector<HTMLElement>('.library-feature')!;
  const row = (name: string) =>
    Array.from(library.querySelectorAll<HTMLButtonElement>('.ars-row')).find(
      (b) => b.textContent?.includes(name),
    )!;
  const press = (label: string) =>
    Array.from(library.querySelectorAll<HTMLButtonElement>('.ars-card button'))
      .find((b) => b.textContent?.trim() === label)!
      .click();
  // `useful` is switched off (change 1), then `noisy` is switched on (change 2).
  row('useful').click();
  await flush();
  press('Switch off');
  await flush();
  press('Apply');
  await flush();
  row('noisy').click();
  await flush();
  expect(text(library.querySelector('.ars-card'))).not.toContain('Undo');
  press('Switch on');
  await flush();
  press('Apply');
  await flush();
  // Back on `useful`: its Undo names its own change, not the last one made.
  row('useful').click();
  await flush();
  press('Undo');
  await flush();
  answering = false;
  expect(undone).toEqual(['a0000000000000000000000000000001']);
});

it('comes back to Arsenal on the owner’s skills', async () => {
  desktop();
  component = mount(App, { target: document.body });
  await flush();
  tab('Arsenal').click();
  await flush();
  kind('Global').click();
  await flush();
  nav('Console').click();
  await flush();
  tab('Arsenal').click();
  await flush();
  expect(
    text(document.querySelector('.ars-tree-item[aria-current="page"]')),
  ).toBe('My skills 3');
});
