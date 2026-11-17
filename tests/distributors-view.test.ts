import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { mockIPC } from '@tauri-apps/api/mocks';
import App from '../src/App.svelte';
import type { TerminalRenderer } from '../src/lib/features/terminal/renderer';
import { parseTerminalId } from '../src/lib/contracts/identities';
import { setLanguage } from '../src/lib/i18n/index.svelte';
import { listing } from './agent-harness';
import { launcher } from './native-harness';
import approvals from './fixtures/approval-list-v1.json';
import inventory from './fixtures/configuration-inventory-v1.json';
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
  ).find((b) => b.getAttribute('aria-label') === label)!;
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
// Showing the view again lets its controllers read current state.
const showAgain = async () => {
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
  setLanguage('en');
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

it('opens from the rail and draws what the desktop answered', async () => {
  const ipc = desktop();
  component = mount(App, { target: document.body });
  await flush();
  expect(view().hidden).toBe(true);
  expect(view().inert).toBe(true);
  // The tools are discovered once when the window starts, whichever view is shown.
  const before = ipc.count('native_launcher');
  expect(before).toBe(1);
  expect(ipc.count('configuration_inventory')).toBe(0);

  tab('Distributors').click();
  await flush();
  expect(view().hidden).toBe(false);
  expect(rail('Personalization').getAttribute('aria-current')).toBe('page');
  expect(document.querySelector('.providers-feature')).toBeNull();
  // The cards say what the view is: no title is drawn over them.
  expect(document.querySelector('.context-title')).toBeNull();
  // Showing the view reads launcher status and the owner-added distributors.
  expect(ipc.count('native_launcher')).toBe(before + 1);
  expect(ipc.count('configuration_inventory')).toBe(0);

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
  // Every row the same buttons; the Console's own tools cannot be edited or deleted.
  expect(
    Array.from(card('anthropic').querySelectorAll('button')).map((b) => [
      text(b),
      b.disabled,
    ]),
  ).toEqual([
    ['Open', false],
    ['Update tool', false],
    ['Edit', true],
    ['Delete', true],
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
    'Update tool',
    'Edit',
    'Delete',
  ]);
  // Without an update command, Update opens Edit to set one.
  expect(
    Array.from(added.querySelectorAll('button'))
      .find((b) => text(b) === 'Update tool')!
      .getAttribute('title'),
  ).toContain('set one in Edit');

  // Its launch and its removal are in its dialog, opened by Edit.
  Array.from(added.querySelectorAll<HTMLButtonElement>('button'))
    .find((b) => text(b) === 'Edit')!
    .click();
  await flush();
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  button('Make launch').click();
  await flush();
  // Workspace opens on the launch made.
  expect(document.querySelector('.workspace-shell')!.hasAttribute('hidden')).toBe(
    false,
  );
});

it('refreshes installed status when the view is shown again', async () => {
  const ipc = desktop();
  component = mount(App, { target: document.body });
  await flush();
  tab('Distributors').click();
  await flush();
  expect(status('anthropic')).toBe('2.1.303');

  ipc.answers.launcherFails = true;
  await showAgain();
  expect(status('anthropic')).toBe('Unknown');
  expect(status('openai')).toBe('Unknown');
  expect(status('opencode')).toBe('Unknown');

  // It answers again: what it says is shown again.
  ipc.answers.launcherFails = false;
  await showAgain();
  expect(status('anthropic')).toBe('2.1.303');
  expect(status('openai')).toBe('Tool not installed');
});

it('keeps a save error inside the dialog and clears the error and notice on close', async () => {
  const ipc = desktop();
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
  let failSave = true;
  ipc.answers.extra = (command) => {
    if (command === 'distributor_list')
      return {
        folder: '~/d',
        distributors: list,
        refused: [],
        home: '/home/me',
      };
    if (command === 'distributor_save') {
      if (failSave)
        throw {
          code: 'distributor_invalid',
          reasons: ['a distributor with that name exists'],
        };
      list = [kimi];
      return kimi;
    }
    if (command === 'distributor_make_launch')
      throw { code: 'internal', reasons: [] };
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
  const fillForm = () => {
    const form = view().querySelector<HTMLFormElement>('.dist-form')!;
    const fields = form.querySelectorAll<HTMLInputElement>('input');
    fields[0].value = 'Kimi CLI';
    fields[0].dispatchEvent(new Event('input', { bubbles: true }));
    fields[2].value = 'kimi';
    fields[2].dispatchEvent(new Event('input', { bubbles: true }));
    return form;
  };

  button('Add a tool').click();
  await flush();
  let form = fillForm();
  form.requestSubmit();
  await flush();
  expect(text(form.querySelector('[role="alert"]'))).toContain(
    'a distributor with that name exists',
  );
  expect(view().querySelector(':scope > [role="alert"]')).toBeNull();
  button('Cancel').click();
  await flush();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(view().querySelector('[role="alert"]')).toBeNull();

  failSave = false;
  button('Add a tool').click();
  await flush();
  form = fillForm();
  form.requestSubmit();
  await flush();
  expect(view().querySelector('[role="status"]')).not.toBeNull();

  const added = view().querySelector('[data-id="added:kimi-cli"]')!;
  Array.from(added.querySelectorAll<HTMLButtonElement>('button'))
    .find((b) => text(b) === 'Edit')!
    .click();
  await flush();
  expect(view().querySelector('[role="status"]')).not.toBeNull();
  button('Cancel').click();
  await flush();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(view().querySelector('[role="status"]')).toBeNull();
});

it('shows distributor labels and status in Spanish', async () => {
  desktop();
  component = mount(App, { target: document.body });
  await flush();
  setLanguage('es');
  await flush();
  tab('Distribuidores').click();
  await flush();
  expect(view().getAttribute('aria-label')).toBe('Distribuidores');
  expect(
    Array.from(view().querySelectorAll<HTMLButtonElement>('button')).map(text),
  ).toContain('Agregar herramienta');
  expect(status('anthropic')).toBe('2.1.303');
  expect(status('openai')).toBe('No instalado');
  expect(status('opencode')).toBe('Desconocido');
});

it('drops the answer of a save whose dialog was closed before it came', async () => {
  const ipc = desktop();
  let reject: (e: unknown) => void = () => {};
  ipc.answers.extra = (command) => {
    if (command === 'distributor_save')
      return new Promise((_, no) => {
        reject = no;
      });
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
  const form = view().querySelector<HTMLFormElement>('.dist-form')!;
  const fields = form.querySelectorAll<HTMLInputElement>('input');
  fields[0].value = 'Kimi CLI';
  fields[0].dispatchEvent(new Event('input', { bubbles: true }));
  fields[2].value = 'kimi';
  fields[2].dispatchEvent(new Event('input', { bubbles: true }));
  form.requestSubmit();
  await flush();
  button('Cancel').click();
  await flush();
  button('Add a tool').click();
  await flush();
  reject({ code: 'distributor_invalid', reasons: ['too long'] });
  await flush();
  // The new dialog is still open and carries nothing of the save before it.
  expect(view().querySelector('.dist-form')).not.toBeNull();
  expect(view().querySelector('[role="alert"]')).toBeNull();
});

const areaButton = (label: string) =>
  Array.from(view().querySelectorAll<HTMLButtonElement>('button')).find(
    (button) => text(button) === label,
  )!;
const addedTool = {
  id: 'kimi-cli',
  name: 'Kimi CLI',
  maker: 'Moonshot AI',
  open: 'kimi',
  update: null,
  note: null,
  executable: 'kimi',
  found: null,
};

it('explains the actual reason a known tool cannot be updated, in both languages', async () => {
  const ipc = desktop();
  const installed = launcher();
  installed.agents.push({ ...installed.agents[0], agent_id: 'opencode' });
  ipc.answers.extra = (command) =>
    command === 'native_launcher' ? installed : undefined;
  component = mount(App, { target: document.body });
  await flush();
  tab('Distributors').click();
  await flush();
  const update = (id: string) =>
    Array.from(card(id).querySelectorAll<HTMLButtonElement>('button'))[1];
  expect(update('opencode').disabled).toBe(true);
  expect(update('opencode').title).toBe(
    'The Console has no verified update command for this tool.',
  );
  expect(update('openai').title).toBe('Tool not installed');
  setLanguage('es');
  await flush();
  expect(update('opencode').title).toBe(
    'La Consola no tiene un comando de actualización verificado para esta herramienta.',
  );
  expect(update('openai').title).toBe('No instalado');
});

it('shows why Save is disabled and clears the help when the form is valid', async () => {
  desktop();
  component = mount(App, { target: document.body });
  await flush();
  tab('Distributors').click();
  await flush();
  areaButton('Add a tool').click();
  await flush();
  const form = view().querySelector<HTMLFormElement>('.dist-form')!;
  const fields = form.querySelectorAll<HTMLInputElement>('input');
  const fill = async (index: number, value: string) => {
    fields[index].value = value;
    fields[index].dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
  };
  const help = () => text(form.querySelector('[role="status"]'));
  expect(areaButton('Save').disabled).toBe(true);
  expect(help()).toBe('Enter a name.');
  await fill(0, 'Kimi');
  await fill(2, '$HOME/bin/kimi');
  expect(areaButton('Save').disabled).toBe(true);
  expect(help()).toBe(
    'Command to open must start with a command name (like kimi) or an absolute path.',
  );
  setLanguage('es');
  await flush();
  expect(help()).toBe(
    'El comando para abrir debe empezar con el nombre de un comando (como kimi) o su ruta absoluta.',
  );
  await fill(2, '/home/me/bin/kimi');
  expect(areaButton('Guardar').disabled).toBe(false);
  expect(help()).toBe('');
});

it.each([
  ['folder: /tmp/exists-but-is-not-a-folder is not a folder', true],
  ['a launch with that name exists', false],
])('only ignores an exact launch conflict: %s', async (reason, visible) => {
  const ipc = desktop();
  ipc.answers.extra = (command) => {
    if (command === 'distributor_save') return addedTool;
    if (command === 'distributor_make_launch')
      throw { code: 'distributor_invalid', reasons: [reason] };
    return undefined;
  };
  component = mount(App, { target: document.body });
  await flush();
  tab('Distributors').click();
  await flush();
  areaButton('Add a tool').click();
  await flush();
  areaButton('Kimi CLI').click();
  await flush();
  view().querySelector<HTMLFormElement>('.dist-form')!.requestSubmit();
  await flush();
  const notice = view().querySelector(':scope > [role="status"]');
  expect(notice !== null).toBe(visible);
  if (visible) expect(text(notice)).toContain(reason);
});

it('does not bring back an automatic launch notice after its dialog was closed', async () => {
  const ipc = desktop();
  let reject!: (error: unknown) => void;
  ipc.answers.extra = (command) => {
    if (command === 'distributor_save') return addedTool;
    if (command === 'distributor_make_launch')
      return new Promise((_, no) => (reject = no));
    return undefined;
  };
  component = mount(App, { target: document.body });
  await flush();
  tab('Distributors').click();
  await flush();
  areaButton('Add a tool').click();
  await flush();
  areaButton('Kimi CLI').click();
  await flush();
  view().querySelector<HTMLFormElement>('.dist-form')!.requestSubmit();
  await flush();
  areaButton('Cancel').click();
  await flush();
  areaButton('Add a tool').click();
  await flush();
  reject({ code: 'internal', reasons: [] });
  await flush();
  expect(view().querySelector(':scope > [role="status"]')).toBeNull();
  expect(view().querySelector('.dist-form')).not.toBeNull();
});

it.each(['success', 'failure'])(
  'drops a manual launch %s after closing its dialog',
  async (outcome) => {
    const ipc = desktop();
    let settle!: () => void;
    ipc.answers.extra = (command) => {
      if (command === 'distributor_list')
        return {
          folder: '~/d',
          distributors: [addedTool],
          refused: [],
          home: '/home/me',
        };
      if (command === 'distributor_make_launch')
        return new Promise((resolve, reject) => {
          settle = () =>
            outcome === 'success'
              ? resolve(addedTool.id)
              : reject({ code: 'internal', reasons: [] });
        });
      return undefined;
    };
    component = mount(App, { target: document.body });
    await flush();
    tab('Distributors').click();
    await flush();
    const added = view().querySelector('[data-id="added:kimi-cli"]')!;
    Array.from(added.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => text(button) === 'Edit')!
      .click();
    await flush();
    areaButton('Make launch').click();
    await flush();
    areaButton('Cancel').click();
    await flush();
    areaButton('Add a tool').click();
    await flush();
    settle();
    await flush();
    expect(view().hidden).toBe(false);
    expect(view().querySelector('[role="alert"]')).toBeNull();
    expect(view().querySelector('.dist-form')).not.toBeNull();
  },
);
