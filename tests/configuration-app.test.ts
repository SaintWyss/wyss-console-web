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
    { ...entry('planner', 'agents', 'Plans work.'), kind: 'agent' },
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
      case 'configuration_records':
        return [
          {
            id: 'b'.repeat(32),
            created: 1,
            state: 'parked',
            label: 'PreToolUse · Bash',
            secret_bearing: false,
            protection: 'plain_no_secret',
            past_retention: false,
          },
        ];
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

/** A tree entry by the start of its label. */
const item = (label: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('.ab-item')).find(
    (b) => b.querySelector('.ab-label')?.textContent?.trim() === label,
  )!;
const library = () => document.querySelector<HTMLElement>('.library-feature')!;
/** Types in the search box over the tree. */
async function search(q: string) {
  const box = document.querySelector<HTMLInputElement>('.ab-search')!;
  box.value = q;
  box.dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
}
const row = (name: string) =>
  Array.from(library().querySelectorAll<HTMLButtonElement>('.ars-row')).find(
    (b) => b.querySelector('.lib-name')?.textContent === name,
  )!;
async function openArsenal() {
  component = mount(App, { target: document.body });
  await flush();
  tab('Arsenal').click();
  await flush();
}
/** Opens an entry's card through the search box. */
async function openCard(name: string) {
  await search(name);
  row(name).click();
  await flush();
  return library().querySelector<HTMLElement>('.ars-card')!;
}

it('lives in Arsenal: its configuration shows at the side of the tree and is read only while Arsenal is shown', async () => {
  const ipc = desktop();
  component = mount(App, { target: document.body });
  await flush();
  expect(ipc.count('configuration_inventory')).toBe(0);
  tab('Arsenal').click();
  await flush();
  item('Configuration').click();
  await flush();
  expect(view().hidden).toBe(false);
  // At the side of the tree, like a list: no dialog.
  expect(view().closest('[role="dialog"]')).toBeNull();
  expect(view().closest('.ab-list')).not.toBeNull();
  expect(ipc.count('configuration_inventory')).toBe(1);
  // It holds rule files, the configured model and plugins only.
  for (const r of view().querySelectorAll('.configuration-row'))
    expect(r.textContent).not.toMatch(/\bHook\b|MCP/);
  // Choosing a list of skills puts the list back.
  // The first category under Personal.
  item('Personal')
    .closest('li')!
    .querySelector<HTMLButtonElement>(':scope > .ab-sub .ab-item')!
    .click();
  await flush();
  expect(document.querySelector('.ars-config-inline')).toBeNull();
});

it('does not take the desktop’s answer on faith', async () => {
  desktop(() => ({
    ...fixture,
    inventory: { ...fixture.inventory, items: 'x' },
  }));
  await openArsenal();
  // Configuration pages are listed only when they hold something: none is shown.
  expect(
    Array.from(document.querySelectorAll('.ab-item')).some((b) =>
      /MCP|Configuration/.test(b.textContent ?? ''),
    ),
  ).toBe(false);
  // Claude Code's Hooks are always there, so the first can be added and the last put back.
  expect(item('Hooks')).toBeDefined();
});

it('opens Arsenal on a folding tree by layers, and the earlier presets screen is gone', async () => {
  const ipc = desktop();
  await openArsenal();
  expect(library().hidden).toBe(false);
  // No tool tabs: the tool is the tree's first layer.
  expect(library().querySelector('.ars-tools')).toBeNull();
  const labels = Array.from(
    document.querySelectorAll('.ab-item .ab-label'),
  ).map((l) => l.textContent?.trim());
  expect(labels.slice(0, 4)).toEqual([
    'Anthropic · Claude Code',
    'Skills',
    'Personal',
    labels[3],
  ]);
  expect(labels).toContain('Sets');
  expect(labels).toContain('Agents');
  // A category is chosen and its entries listed, with no colour or tag.
  expect(
    library().querySelector('.ab-item[aria-current="page"]'),
  ).not.toBeNull();
  expect(library().querySelectorAll('.ars-row').length).toBeGreaterThan(0);
  expect(library().querySelector('.ars-tag, .ars-dot')).toBeNull();
  // Folding a branch hides what hangs from it.
  item('Skills').click();
  await flush();
  expect(item('Personal')).toBeUndefined();
  expect(ipc.count('arsenal_guide')).toBe(1);
  // The Personalization column folds to icons while Arsenal is shown.
  expect(document.querySelector('.personal-tabs.folded')).not.toBeNull();
  // The earlier presets screen is gone: More no longer offers it.
  expect(
    Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        '.sidebar .rail-menu .nav-item',
      ),
    ).map((b) => b.textContent?.trim()),
  ).not.toContain('Arsenal presets');
  expect(document.querySelector('.arsenal-feature')).toBeNull();
});

it('opens a card in place of the list, ordered short to long, read by id', async () => {
  const ipc = desktop();
  await openArsenal();
  const card = await openCard('loops');
  // The list gives way to the card: no row is left over it.
  expect(library().querySelector('.ars-row')).toBeNull();
  expect(text(card.querySelector('h2'))).toBe('loops');
  expect(text(card.querySelector('.ars-meta'))).toBe(
    'Personal · Both · global',
  );
  expect(text(card)).toContain('Designs loops.');
  expect(text(card)).toContain('Use it when Use when a task repeats.');
  expect(text(card)).toContain(
    'Do not use it when Do not use for one-off work.',
  );
  // "How it is used" is gone; Instructions, then Location, then Files.
  expect(text(card)).not.toContain('How it is used');
  const order = Array.from(card.querySelectorAll('h3')).map((h) => text(h));
  expect(order.indexOf('Instructions')).toBeLessThan(order.indexOf('Location'));
  expect(order.indexOf('Location')).toBeLessThan(
    order.findIndex((h) => h.startsWith('Files')),
  );
  // The file's titles are the index: its "Usage" is a folding part.
  expect(
    Array.from(card.querySelectorAll('.ars-part > summary')).map((s) =>
      text(s),
    ),
  ).toEqual(['Usage']);
  expect(text(card)).toContain(
    'The copies in Claude Code’s and Codex’s folders are different.',
  );
  expect(ipc.count('arsenal_guide_body')).toBe(1);
  // A third party's text is shown as text, never as markup.
  expect(card.querySelector('img')).toBeNull();
  expect(text(card)).toContain('<img src=x onerror=alert(1)>');
  // Back brings the list back and the focus to the row that opened the card.
  Array.from(card.querySelectorAll<HTMLButtonElement>('button'))
    .find((b) => text(b) === 'Back')!
    .click();
  await flush();
  await flush();
  expect(library().querySelector('.ars-card')).toBeNull();
  expect(document.activeElement).toBe(row('loops'));
});

it('closes the card with Esc, and the search finds skills and agents', async () => {
  desktop();
  await openArsenal();
  await openCard('loops');
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  await flush();
  expect(library().querySelector('.ars-card')).toBeNull();
  await search('phase');
  expect(
    Array.from(library().querySelectorAll('.ars-row .lib-name')).map(
      (n) => n.textContent,
    ),
  ).toEqual(['gsd-plan']);
  expect(text(library())).toContain('1 found for “phase”');
  await search('planner');
  expect(
    Array.from(library().querySelectorAll('.ars-row .lib-name')).map(
      (n) => n.textContent,
    ),
  ).toEqual(['planner']);
  // The tree folds away to give the list the width.
  document.querySelector<HTMLButtonElement>('.ab-fold')!.click();
  await flush();
  expect(document.querySelector('.ab-tree')).toBeNull();
});

it('shows each set as a branch under Sets', async () => {
  desktop();
  await openArsenal();
  item('Sets').click();
  await flush();
  expect(item('GSD Core')).toBeDefined();
});

it('switches one of Personal off through Configuration’s own plan', async () => {
  desktop();
  planned.length = 0;
  await openArsenal();
  const card = await openCard('useful');
  expect(text(card)).toContain('State On');
  Array.from(card.querySelectorAll<HTMLButtonElement>('button'))
    .find((b) => b.textContent?.trim() === 'Turn off')!
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
  await openArsenal();
  const press = (label: string) =>
    Array.from(
      library().querySelectorAll<HTMLButtonElement>('.ars-card button'),
    )
      .find((b) => b.textContent?.trim() === label)!
      .click();
  // `useful` is switched off (change 1), then `noisy` is switched on (change 2).
  await openCard('useful');
  press('Turn off');
  await flush();
  press('Apply');
  await flush();
  press('Back');
  await flush();
  await openCard('noisy');
  expect(text(library().querySelector('.ars-card'))).not.toContain('Undo');
  press('Turn on');
  await flush();
  press('Apply');
  await flush();
  press('Back');
  await flush();
  // Back on `useful`: its Undo names its own change, not the last one made.
  await openCard('useful');
  press('Undo');
  await flush();
  answering = false;
  expect(undone).toEqual(['a0000000000000000000000000000001']);
});

it('comes back to Arsenal on its tree, with no configuration left open', async () => {
  desktop();
  await openArsenal();
  item('Configuration').click();
  await flush();
  nav('Console').click();
  await flush();
  tab('Arsenal').click();
  await flush();
  expect(document.querySelector('.ars-config-inline')).toBeNull();
  expect(library().querySelector('.ab-tree')).not.toBeNull();
});

it('lists Claude Code’s hooks by event, opens one as a card with Edit and Keep aside, and adds one from its event', async () => {
  desktop();
  planned.length = 0;
  await openArsenal();
  item('Hooks').click();
  await flush();
  item('Before a tool runs').click();
  await flush();
  const hook = row('guard.sh');
  expect(text(hook)).toContain('guard.sh --token [redacted]');
  hook.click();
  await flush();
  const card = library().querySelector<HTMLElement>('.ars-card')!;
  expect(text(card.querySelector('h2'))).toBe('guard.sh');
  expect(text(card.querySelector('.ars-meta'))).toBe(
    'Before a tool runs · PreToolUse · Bash · On',
  );
  const buttons = Array.from(card.querySelectorAll('button')).map((b) =>
    text(b),
  );
  expect(buttons).toContain('Edit');
  expect(buttons).toContain('Keep aside');
  // Keep aside uses through Configuration's own plan.
  Array.from(card.querySelectorAll<HTMLButtonElement>('button'))
    .find((b) => text(b) === 'Keep aside')!
    .click();
  await flush();
  expect(planned).toEqual([
    { operation: 'park_hook', target: '3509f91842ae6d3540a6c182b5491893' },
  ]);
  // Back to the event's list: it offers to add a hook there.
  Array.from(card.querySelectorAll<HTMLButtonElement>('button'))
    .find((b) => text(b) === 'Back')!
    .click();
  await flush();
  expect(
    Array.from(library().querySelectorAll('button')).some(
      (b) => text(b) === 'Add a hook',
    ),
  ).toBe(true);
});

it('keeps deleted hooks aside and puts one back through a plan', async () => {
  desktop();
  planned.length = 0;
  await openArsenal();
  item('Hooks').click();
  await flush();
  item('Kept aside').click();
  await flush();
  const panel = library().querySelector<HTMLElement>('.ars-config-inline')!;
  expect(text(panel)).toContain('PreToolUse · Bash');
  // Adding a hook is offered here too, for any event.
  expect(
    Array.from(panel.querySelectorAll('button')).some(
      (b) => text(b) === 'Add a hook',
    ),
  ).toBe(true);
  Array.from(panel.querySelectorAll<HTMLButtonElement>('button'))
    .find((b) => text(b) === 'Put back')!
    .click();
  await flush();
  expect(planned).toEqual([
    { operation: 'restore_hook', target: 'b'.repeat(32) },
  ]);
});

it('lists Codex’s own hooks like Claude’s, says Codex will ask for trust, and keeps one aside', async () => {
  const codexHook = {
    ...fixture.inventory.items.find((i) => i.kind === 'hook')!,
    id: 'c'.repeat(32),
    provider: 'codex',
    source: 'codex_user_hooks',
    name: 'SessionStart · startup',
  };
  desktop(() => ({
    ...fixture,
    inventory: {
      ...fixture.inventory,
      items: [...fixture.inventory.items, codexHook],
    },
  }));
  planned.length = 0;
  await openArsenal();
  item('OpenAI · Codex').click();
  await flush();
  // The first Hooks branch is Claude Code's: the last is Codex's.
  const hooks = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.ab-item'),
  ).filter((b) => b.querySelector('.ab-label')?.textContent === 'Hooks');
  hooks[hooks.length - 1].click();
  await flush();
  item('When a session opens').click();
  await flush();
  row('guard.sh').click();
  await flush();
  const card = library().querySelector<HTMLElement>('.ars-card')!;
  expect(text(card)).toContain('Codex asks you to trust');
  Array.from(card.querySelectorAll<HTMLButtonElement>('button'))
    .find((b) => text(b) === 'Keep aside')!
    .click();
  await flush();
  expect(planned).toEqual([{ operation: 'park_hook', target: 'c'.repeat(32) }]);
});
