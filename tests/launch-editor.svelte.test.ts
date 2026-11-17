import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import { mockIPC } from '@tauri-apps/api/mocks';
import LaunchEditor from '../src/lib/features/workspace/LaunchEditor.svelte';
import type { Launch, LaunchList } from '../src/lib/desktop/launch-client';
import type {
  LibraryItem,
  Selection,
  TerminalPlan,
} from '../src/lib/contracts/arsenal';
import {
  arsenalClient,
  type Roles,
  type ArsenalClient,
} from '../src/lib/desktop/arsenal-client';
import {
  DEFAULT_SPEC,
  type HomeSpec,
} from '../src/lib/features/arsenal/environment';

let component: ReturnType<typeof mount> | undefined;
let ipc: { command: string; args: unknown }[] = [];
afterEach(() => {
  if (component) void unmount(component);
  component = undefined;
  document.body.replaceChildren();
});
beforeEach(() => {
  ipc = [];
  mockIPC((command, args) => {
    ipc.push({ command, args });
    if (command === 'launch_save') {
      const r = (args as { request: Record<string, unknown> }).request;
      return {
        id: String(r.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-'),
        name: r.name,
        directory: r.directory,
        kind: 'session',
        agent: r.agent,
        permission: r.permission,
        before: [],
        preset: r.preset,
      };
    }
    return null;
  });
});

const lib = (id: string, kind: string, name = id): LibraryItem =>
  ({
    id,
    provider: 'claude_code',
    kind,
    name,
    description: `${name} does things`,
  }) as unknown as LibraryItem;
const session = (id: string, preset: string | null): Launch => ({
  id,
  name: id === 'estudiar' ? 'Estudiar' : id,
  directory: '/home/me/UTN',
  kind: 'session',
  agent: 'claude_code',
  permission: null,
  before: [],
  preset,
});
const sel: Selection = {
  id: 'sel-1',
  name: 'Estudio',
  provider: 'claude_code',
  // A pinned revision the editor does not show: it must come back as it was.
  items: [
    { capability: 's1', revision: 7 },
    { capability: 's2', revision: null },
  ],
  composites: ['gsd-core'],
  created_at: 0,
  updated_at: 0,
};
const codexSession = (): Launch => ({
  ...(session('cx', 'Codex Estudio') as Extract<Launch, { kind: 'session' }>),
  agent: 'codex',
});
const codexSel: Selection = {
  id: 'sel-cx',
  name: 'Codex Estudio',
  provider: 'codex',
  items: [{ capability: 'c1', revision: null }],
  composites: [],
  created_at: 0,
  updated_at: 0,
};
// Choices the editor does not draw (memory, plugins): they must be saved as they were.
const env: HomeSpec = {
  ...DEFAULT_SPEC,
  memory: false,
  plugins_off: ['caveman@caveman'],
};

function fake(
  over: Partial<{
    roles: Roles;
    library: LibraryItem[];
    tokenStored: boolean;
    launches: Launch[];
    failRole: boolean;
    failEnvironment: boolean;
    failInstructions: boolean;
    codex: boolean;
    terminalPlan: ArsenalClient['terminalPlan'];
    codexEnvironment: () => Promise<{
      instructions: boolean;
      hooks_off: string[];
    }>;
  }> = {},
): {
  client: ArsenalClient;
  calls: Record<string, unknown[]>;
} {
  const calls: Record<string, unknown[]> = {};
  const note = (name: string, value: unknown) =>
    (calls[name] ??= []).push(value);
  const roles: Roles = over.roles ?? {
    custom: [],
    assigned: { estudiar: 'researcher' },
    damaged: false,
  };
  const client = {
    roles: async () => roles,
    writeRole: async (change: unknown) => {
      note('writeRole', change);
      if (over.failRole) throw new Error('roles.json could not be written.');
      return roles;
    },
    capabilities: async () =>
      over.library ??
      (over.codex
        ? [{ ...lib('c1', 'skill', 'codex-skill'), provider: 'codex' }]
        : [
            lib('s1', 'skill', 'frontend-design'),
            lib('s2', 'skill', 'systematic-debugging'),
            lib('a1', 'agent', 'gsd-executor'),
          ]),
    selections: async () => (over.codex ? [codexSel] : [sel]),
    codexEnvironmentOptions: async () => ({
      hooks: [
        { key: 'k1', event: 'SessionStart', matcher: '', command: 'orient.sh' },
        { key: 'k2', event: 'PreToolUse', matcher: 'Bash', command: 'gate.py' },
      ],
      config_hooks: [{ event: 'Stop', matcher: '', command: 'notify.sh' }],
      instructions: true,
    }),
    codexEnvironment:
      over.codexEnvironment ??
      (async () => ({ instructions: true, hooks_off: [] })),
    writeCodexEnvironment: async (id: string, spec: unknown) => {
      note('writeCodexEnvironment', { id, spec });
    },
    environmentOptions: async () => ({
      hooks: [],
      mcp: ['context7'],
      plugins: ['caveman@caveman'],
      rules: ['ux.md'],
      account_skills: [],
      instructions: true,
      token_stored: over.tokenStored ?? true,
      sizes: { instructions: 8000, 'rule:ux.md': 400 },
    }),
    environment: async () => env,
    launchInstructions: async () => {
      if (over.failInstructions) throw new Error('unreadable');
      return { project: 'load' } as const;
    },
    writeLaunchInstructions: arsenalClient.writeLaunchInstructions,
    projectSelection: async () => null,
    terminalPlan:
      over.terminalPlan ??
      (async () => ({ items: [] }) as unknown as TerminalPlan),
    saveSelection: async (input: Record<string, unknown>) => {
      note('saveSelection', input);
      return { ...sel, ...input, id: input.id ?? 'sel-new' } as Selection;
    },
    writeEnvironment: async (id: string, spec: HomeSpec) => {
      note('writeEnvironment', { id, spec });
      if (over.failEnvironment)
        throw new Error('environment.json could not be written.');
    },
  } as unknown as ArsenalClient;
  void over.launches;
  return { client, calls };
}

async function show(
  launches: Launch[],
  over: Parameters<typeof fake>[0] = {},
  extra: Record<string, unknown> = {},
) {
  const f = fake(over);
  component = mount(LaunchEditor, {
    target: document.body,
    props: {
      visible: true,
      recent: [{ path: '/home/me/UTN', last_used: 2 }],
      choose: async () => null,
      onopen: vi.fn(),
      client: f.client,
      launches: async () =>
        ({
          folder: '/c',
          launches,
          refused: [],
          system: { id: 'cachyos', like: ['arch'], name: 'CachyOS' },
        }) as LaunchList,
      ...extra,
    },
  });
  for (let i = 0; i < 6; i++) await tick();
  flushSync();
  return f;
}
const text = (s: string) => document.querySelector(s)?.textContent ?? '';
const button = (label: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (b) => b.textContent?.trim() === label,
  )!;
async function settle() {
  for (let i = 0; i < 12; i++) await tick();
  flushSync();
}

it('shows role text only for own role and writes launch instructions on save', async () => {
  await show([session('estudiar', 'Estudio')]);
  expect(document.querySelector('textarea')).toBeNull();
  projectInstructions('role');
  const area = document.querySelector<HTMLTextAreaElement>('textarea')!;
  area.value = 'Mi rol';
  area.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
  button('Save').click();
  await settle();
  expect(
    ipc.find((call) => call.command === 'arsenal_launch_instructions_write')
      ?.args,
  ).toEqual({
    selection: 'sel-1',
    instructions: { project: 'role', role: 'Mi rol' },
  });
});

it('warns when launch instructions are unreadable and does not overwrite them', async () => {
  await show([session('estudiar', 'Estudio')], { failInstructions: true });
  expect(document.body.textContent).toContain(
    'The launch instructions file cannot be read',
  );
  expect(
    document
      .querySelector<HTMLSelectElement>(
        'select[aria-label="Project instructions"]',
      )
      ?.matches(':disabled'),
  ).toBe(true);
  rename('Otro nombre');
  button('Save').click();
  await settle();
  expect(savedRequest().name).toBe('Otro nombre');
  expect(
    ipc.some((call) => call.command === 'arsenal_launch_instructions_write'),
  ).toBe(false);
});

it('groups launches by role and shows the estimated context', async () => {
  await show([session('estudiar', 'Estudio'), session('otro', null)]);
  const roles = [...document.querySelectorAll('.le-role')].map(
    (r) => r.textContent,
  );
  expect(roles).toEqual(['Worker', 'Researcher']);
  expect(text('.le-total')).toMatch(/~\d+k/);
  expect(text('.le-total')).toContain('MCP and hooks not measured');
});

it('opens a new launch draft from the selected preset and keeps that preset on save', async () => {
  const onpresetused = vi.fn();
  const { calls } = await show(
    [],
    {},
    {
      createPreset: { request: 12, selection: sel },
      onpresetused,
    },
  );
  expect(onpresetused).toHaveBeenCalledWith(12);
  expect(
    document.querySelector<HTMLInputElement>('[aria-label="Launch name"]')
      ?.value,
  ).toBe('Estudio');
  rename('Estudio nuevo');
  button('Save').click();
  await settle();
  const saved = ipc.find((call) => call.command === 'launch_save')!.args as {
    request: Record<string, unknown>;
  };
  expect(saved.request).toMatchObject({
    name: 'Estudio nuevo',
    agent: 'claude_code',
    preset: 'Estudio',
  });
  expect(calls.saveSelection).toBeUndefined();
});

it('copies a shared preset to the launch’s own, and keeps what it does not show', async () => {
  const { calls } = await show([
    session('estudiar', 'Estudio'),
    session('otro', 'Estudio'),
  ]);
  // Untick one skill of the preset: Estudio is shared with "otro".
  document
    .querySelector<HTMLButtonElement>('.le-gtoggle[aria-expanded="true"]')
    ?.click();
  flushSync();
  const skills = [...document.querySelectorAll('.le-group')].find((g) =>
    g.textContent?.includes('Skills'),
  )!;
  skills.querySelector<HTMLButtonElement>('.le-gtoggle')!.click();
  flushSync();
  const row = [...skills.querySelectorAll<HTMLLabelElement>('.le-row')].find(
    (r) => r.textContent?.includes('systematic-debugging'),
  )!;
  row.querySelector('input')!.click();
  flushSync();
  button('Save').click();
  await settle();
  // A new preset named after the launch; the shared one is untouched.
  expect(calls.saveSelection).toEqual([
    {
      id: null,
      name: 'Estudiar',
      provider: 'claude_code',
      items: [{ capability: 's1', revision: 7 }],
      composites: ['gsd-core'],
    },
  ]);
  // The copy carries the environment, with what the editor does not draw kept.
  // The environment goes to the new preset, never to the shared one.
  expect(calls.writeEnvironment).toEqual([{ id: 'sel-new', spec: env }]);
  const written = (calls.writeEnvironment as { spec: HomeSpec }[])[0]!.spec;
  expect(written.memory).toBe(false);
  expect(written.plugins_off).toEqual(['caveman@caveman']);
  const save = ipc.find((c) => c.command === 'launch_save')!.args as {
    request: Record<string, unknown>;
  };
  expect(save.request).toMatchObject({
    name: 'Estudiar',
    preset: 'Estudiar',
    replace: true,
  });
  expect(calls.writeRole).toEqual([
    { do: 'assign', launch: 'estudiar', role: 'researcher' },
  ]);
});

it('opens a launch with commands but does not save over it', async () => {
  await show([
    {
      id: 'cmds',
      name: 'cmds',
      directory: '/home/me',
      kind: 'commands',
      commands: ['ls'],
      variants: [],
      active: null,
      template: null,
    },
  ]);
  expect(text('.notice[data-tone="warn"]')).toContain(
    'the file’s own commands run',
  );
  expect(button('Save').disabled).toBe(true);
  expect(document.querySelector('.le-delete')).toBeNull();
});

it('says what was saved when a later step fails, and keeps the draft', async () => {
  mockIPC((command) => {
    if (command === 'launch_save')
      return Promise.reject({ code: 'launch_invalid', reasons: ['no folder'] });
    return null;
  });
  await show([session('estudiar', 'Estudio')]);
  const skills = [...document.querySelectorAll('.le-group')].find((g) =>
    g.textContent?.includes('Skills'),
  )!;
  const first = skills.querySelector<HTMLInputElement>('.le-ghead input')!;
  first.click();
  flushSync();
  button('Save').click();
  await settle();
  expect(text('.notice[data-tone="error"]')).toContain(
    'Saved so far: preset “Estudio”',
  );
  // The draft is still there to save again.
  expect(button('Save').disabled).toBe(false);
});

const skillsGroup = () =>
  [...document.querySelectorAll('.le-group')].find((g) =>
    g.textContent?.includes('Skills'),
  )!;
function untickAllSkills() {
  skillsGroup().querySelector<HTMLInputElement>('.le-ghead input')!.click();
  flushSync();
}
function rename(name: string) {
  const title = document.querySelector<HTMLInputElement>('.le-title')!;
  title.value = name;
  title.dispatchEvent(new Event('input'));
  flushSync();
}

it('stops at a failed environment and says the preset was saved, launch untouched', async () => {
  const { calls } = await show([session('estudiar', 'Estudio')], {
    failEnvironment: true,
  });
  // Memory off is drawn nowhere: change a hook-less thing the editor shows instead.
  const mcp = [...document.querySelectorAll('.le-group')].find((g) =>
    g.textContent?.includes('MCP servers'),
  )!;
  mcp.querySelector<HTMLInputElement>('.le-ghead input')!.click();
  flushSync();
  button('Save').click();
  await settle();
  expect(calls.writeEnvironment).toHaveLength(1);
  expect(ipc.some((c) => c.command === 'launch_save')).toBe(false);
  expect(text('.notice[data-tone="error"]')).toContain(
    'environment.json could not be written.',
  );
});

it('on a rename, keeps the old file when the role cannot follow, and says so', async () => {
  const { calls } = await show([session('estudiar', 'Estudio')], {
    failRole: true,
  });
  rename('Estudiar SIG');
  button('Save').click();
  await settle();
  expect(ipc.some((c) => c.command === 'launch_save')).toBe(true);
  // The role did not follow: the old file is not deleted.
  expect(ipc.some((c) => c.command === 'launch_delete')).toBe(false);
  expect(calls.writeRole).toEqual([
    { do: 'rename', from: 'estudiar', to: 'estudiar-sig' },
  ]);
  expect(text('.notice[data-tone="error"]')).toContain('Saved so far:');
  expect(text('.notice[data-tone="error"]')).toContain('launch');
});

it('on a rename that saves, moves the role before deleting the old file', async () => {
  const { calls } = await show([session('estudiar', 'Estudio')]);
  rename('Estudiar SIG');
  button('Save').click();
  await settle();
  expect(calls.writeRole).toEqual([
    { do: 'rename', from: 'estudiar', to: 'estudiar-sig' },
    { do: 'assign', launch: 'estudiar-sig', role: 'researcher' },
  ]);
  const order = ipc
    .map((c) => c.command)
    .filter((c) => c === 'launch_save' || c === 'launch_delete');
  expect(order).toEqual(['launch_save', 'launch_delete']);
});

it('saves the draft as it was when Save was pressed, with the fields disabled meanwhile', async () => {
  let release: () => void = () => undefined;
  const { client, calls } = fake();
  const gate = new Promise<void>((r) => (release = r));
  const slow = {
    ...client,
    projectSelection: async () => {
      await gate;
      return null;
    },
  } as ArsenalClient;
  component = mount(LaunchEditor, {
    target: document.body,
    props: {
      visible: true,
      recent: [],
      choose: async () => null,
      onopen: vi.fn(),
      client: slow,
      launches: async () =>
        ({
          folder: '/c',
          launches: [session('estudiar', 'Estudio')],
          refused: [],
          system: { id: 'cachyos', like: ['arch'], name: 'CachyOS' },
        }) as LaunchList,
    },
  });
  await settle();
  untickAllSkills();
  button('Save').click();
  flushSync();
  expect(document.querySelector<HTMLInputElement>('.le-title')!.disabled).toBe(
    true,
  );
  expect(
    document.querySelector<HTMLFieldSetElement>('.le-fieldset')!.disabled,
  ).toBe(true);
  // Typed while saving: not saved.
  rename('Otro nombre');
  release();
  await settle();
  const save = ipc.find((c) => c.command === 'launch_save')!.args as {
    request: Record<string, unknown>;
  };
  expect(save.request.name).toBe('Estudiar');
  expect(calls.saveSelection).toHaveLength(1);
});

it('says roles.json is damaged and that roles are not saved', async () => {
  await show([session('estudiar', null)], {
    roles: { custom: [], assigned: {}, damaged: true },
  });
  expect(text('.notice[data-tone="warn"]')).toContain(
    'roles.json could not be read',
  );
});

it('shows a command launch as its name, a notice and Try: no distributor, model or estimate', async () => {
  await show([
    {
      id: 'upd',
      name: 'Actualizar',
      directory: '/home/me',
      kind: 'commands',
      commands: ['paru'],
      variants: [],
      active: null,
      template: null,
    },
  ]);
  expect(document.querySelector('.le-fields')).toBeNull();
  expect(document.querySelector('.le-loads')).toBeNull();
  expect(text('.le-total')).toBe('');
  expect(button('Try').disabled).toBe(false);
});

it('says before saving that a file under another name is written anew and the old one removed', async () => {
  await show([{ ...session('a-mano', null), name: 'Mi Lanzamiento' }]);
  expect(text('.notice[data-tone="warn"]')).toContain(
    'saved as a-mano.toml. Saving writes mi-lanzamiento.toml and removes a-mano.toml',
  );
});

const update: Launch = {
  id: 'actualizar-sistema',
  name: 'Actualizar sistema',
  directory: '/home/me',
  kind: 'commands',
  commands: ['sudo pacman -Syu', 'paru -Sua'],
  variants: [
    {
      distro: 'arch',
      commands: ['sudo pacman -Syu'],
      options: [],
      manual: false,
    },
    {
      distro: 'cachyos',
      commands: ['sudo pacman -Syu', 'paru -Sua'],
      options: ['aur'],
      manual: false,
    },
  ],
  active: 'cachyos',
  template: 'system-update',
};
const script = () =>
  document.querySelector<HTMLTextAreaElement>('.dv-script textarea')!.value;
const switchOf = (label: string) =>
  [...document.querySelectorAll<HTMLLabelElement>('.dv-switches label')]
    .find((l) => l.textContent?.includes(label))!
    .querySelector('input')!;

it('a distribution’s switches rewrite its script, and the active one cannot be deleted', async () => {
  await show([update]);
  expect(text('.dv-system')).toContain('CachyOS (cachyos)');
  expect(script()).toBe('sudo pacman -Syu\nparu -Sua');
  expect(switchOf('Include AUR').checked).toBe(true);
  expect(switchOf('--noconfirm').checked).toBe(false);
  switchOf('--noconfirm').click();
  flushSync();
  expect(script()).toBe('sudo pacman -Syu --noconfirm\nparu -Sua --noconfirm');
  switchOf('Include AUR').click();
  flushSync();
  expect(script()).toBe('sudo pacman -Syu --noconfirm');
  expect(button('Delete').disabled).toBe(true);
  button('Save').click();
  await settle();
  const saved = ipc.find((c) => c.command === 'launch_save_variants');
  expect(saved?.args).toEqual({
    request: {
      id: 'actualizar-sistema',
      variants: [
        update.variants[0],
        {
          distro: 'cachyos',
          commands: ['sudo pacman -Syu --noconfirm'],
          options: ['noconfirm'],
          manual: false,
        },
      ],
    },
  });
});

it('a script typed by hand turns the switches off until it goes back to them', async () => {
  await show([update]);
  const area = document.querySelector<HTMLTextAreaElement>(
    '.dv-script textarea',
  )!;
  area.value = 'sudo pacman -Syu\n\necho listo';
  area.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
  expect(
    document.querySelector<HTMLFieldSetElement>('.dv-switches')!.disabled,
  ).toBe(true);
  button('Back to options').click();
  flushSync();
  expect(script()).toBe('sudo pacman -Syu\nparu -Sua');
  // Another distribution can be picked and deleted; a new one is added with its defaults.
  [...document.querySelectorAll<HTMLButtonElement>('.dv-list .le-item')]
    .find((b) => b.textContent?.includes('Arch'))!
    .click();
  flushSync();
  expect(button('Delete').disabled).toBe(false);
  button('Delete').click();
  flushSync();
  expect(text('.dv-list')).not.toContain('Arch');
  button('+ Add distribution').click();
  flushSync();
  [...document.querySelectorAll<HTMLButtonElement>('.dv-add .le-item')]
    .find((b) => b.textContent?.includes('Fedora'))!
    .click();
  flushSync();
  expect(script()).toBe('sudo dnf upgrade --refresh');
});

it('a variant edited in its file by hand opens with the switches off', async () => {
  await show([
    {
      ...update,
      variants: [
        {
          distro: 'cachyos',
          commands: ['sysupdate'],
          options: ['aur'],
          manual: false,
        },
      ],
    } as Launch,
  ]);
  expect(script()).toBe('sysupdate');
  expect(
    document.querySelector<HTMLFieldSetElement>('.dv-switches')!.disabled,
  ).toBe(true);
});

it('hovering a switch or a distribution says what it does', async () => {
  await show([update]);
  expect(
    [...document.querySelectorAll<HTMLLabelElement>('.dv-switches label')].find(
      (l) => l.textContent?.includes('--noconfirm'),
    )!.title,
  ).toContain('answer yes on their own');
  expect(
    [...document.querySelectorAll<HTMLButtonElement>('.dv-list .le-item')].find(
      (b) => b.textContent?.includes('Arch'),
    )!.title,
  ).toContain('Manjaro');
  expect(text('.dv-hint')).toContain('CachyOS');
});

it('hovering each field and each group says what it is', async () => {
  await show([session('estudiar', 'Estudio')]);
  const field = (label: string) =>
    [...document.querySelectorAll<HTMLElement>('.le-field')].find(
      (f) => f.querySelector('span')?.textContent === label,
    )!;
  expect(field('Mode').title).toContain('Managed');
  expect(field('Permissions').title).toContain('without asking');
  expect(field('Role').title).toContain('does not change what the agent does');
  expect(field('Folder').title).toContain('Where the agent works');
  expect(
    field('Permissions').querySelector<HTMLSelectElement>('select')!.title,
  ).toContain('As configured');
  const toggles = [
    ...document.querySelectorAll<HTMLButtonElement>('.le-gtoggle'),
  ];
  expect(toggles.length).toBeGreaterThan(0);
  for (const toggle of toggles) expect(toggle.title).not.toBe('');
  expect(document.querySelector('.dv-info')).toBeNull();
});

const fieldSelect = (label: string) =>
  [...document.querySelectorAll<HTMLElement>('.le-field')]
    .find((f) => f.querySelector('span')?.textContent === label)!
    .querySelector<HTMLSelectElement>('select')!;
const optionsOf = (select: HTMLSelectElement) =>
  [...select.options].map((o) => [o.value, o.textContent?.trim()]);
function choose(select: HTMLSelectElement, value: string) {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}
const savedRequest = () =>
  (
    ipc.filter((c) => c.command === 'launch_save').at(-1)!.args as {
      request: Record<string, unknown>;
    }
  ).request;

it('the permissions of a launch are chosen directly, and accept edits is offered only for Claude Code', async () => {
  await show([session('estudiar', 'Estudio')]);
  const permissions = fieldSelect('Permissions');
  // No profile is listed, nor a way to edit one.
  expect(optionsOf(permissions)).toEqual([
    ['', 'As configured'],
    ['ask', 'Ask before acting'],
    ['read_only', 'Read only'],
    ['edits', 'Accept edits'],
    ['bypass', 'Full access'],
  ]);
  expect(document.body.textContent).not.toContain('Profile');
  expect(permissions.value).toBe('');
  choose(permissions, 'edits');
  expect(permissions.title).toContain('Claude Code only');
  // Codex has no such mode: the option goes, and so does the choice.
  choose(fieldSelect('Distributor'), 'codex');
  expect(optionsOf(fieldSelect('Permissions'))).toEqual([
    ['', 'As configured'],
    ['ask', 'Ask before acting'],
    ['read_only', 'Read only'],
    ['bypass', 'Full access'],
  ]);
  expect(fieldSelect('Permissions').value).toBe('');
  // A permission both agents have follows the change of agent.
  choose(fieldSelect('Permissions'), 'read_only');
  choose(fieldSelect('Distributor'), 'claude_code');
  expect(fieldSelect('Permissions').value).toBe('read_only');
});

it('saves the permission as its word, never a profile, and warns what full access costs', async () => {
  await show([session('estudiar', 'Estudio')]);
  expect(text('.notice[data-tone="warn"]')).not.toContain('Full access');
  choose(fieldSelect('Permissions'), 'bypass');
  expect(text('.notice[data-tone="warn"]')).toContain(
    'Full access: the agent asks nothing',
  );
  button('Save').click();
  await settle();
  expect(savedRequest()).toMatchObject({
    name: 'Estudiar',
    agent: 'claude_code',
    permission: 'bypass',
  });
  expect(savedRequest()).not.toHaveProperty('profile');
});

it('a launch set back to as configured is saved without a permission', async () => {
  await show([
    { ...session('estudiar', 'Estudio'), permission: 'bypass' } as Launch,
  ]);
  expect(text('.notice[data-tone="warn"]')).toContain('Full access');
  choose(fieldSelect('Permissions'), '');
  expect(text('.notice[data-tone="warn"]')).not.toContain('Full access');
  button('Save').click();
  await settle();
  expect(savedRequest().permission).toBeNull();
});

it('opens a saved launch on the permission its file names', async () => {
  await show([
    { ...session('estudiar', 'Estudio'), permission: 'edits' } as Launch,
  ]);
  expect(fieldSelect('Permissions').value).toBe('edits');
  expect(button('Save').disabled).toBe(true);
});

it('keeps the hooks of config.toml out of the count and out of "mark all", and saves only the hooks of hooks.json', async () => {
  const { calls } = await show([codexSession()], { codex: true });
  const hooks = [...document.querySelectorAll('.le-group')].find((g) =>
    g.querySelector('.le-gtoggle')?.textContent?.includes('Hooks'),
  )!;
  // Two hooks in hooks.json; the one config.toml declares is not counted.
  expect(hooks.querySelector('.le-gtoggle .le-meta')?.textContent).toContain(
    '2 of 2',
  );
  hooks.querySelector<HTMLButtonElement>('.le-gtoggle')!.click();
  flushSync();
  const rows = () => [
    ...hooks.querySelectorAll<HTMLInputElement>('.le-row input'),
  ];
  // Two rows to switch plus the config.toml one, shown ticked and fixed.
  expect(rows().map((r) => [r.checked, r.disabled])).toEqual([
    [true, false],
    [true, false],
    [true, true],
  ]);
  // "Mark all" off switches the two rows and never the fixed one.
  hooks.querySelector<HTMLInputElement>('.le-ghead input')!.click();
  flushSync();
  expect(hooks.querySelector('.le-gtoggle .le-meta')?.textContent).toContain(
    '0 of 2',
  );
  expect(rows().map((r) => [r.checked, r.disabled])).toEqual([
    [false, false],
    [false, false],
    [true, true],
  ]);
  button('Save').click();
  await settle();
  // The Codex environment is written to the preset, and never the Claude one.
  expect(calls.writeCodexEnvironment).toEqual([
    {
      id: 'sel-cx',
      spec: { instructions: true, hooks_off: ['k1', 'k2'] },
    },
  ]);
  expect(calls.writeEnvironment).toBeUndefined();
});

it('saves AGENTS.md left out of a Codex launch', async () => {
  const { calls } = await show([codexSession()], { codex: true });
  const instructions = [...document.querySelectorAll('.le-group')].find((g) =>
    g.querySelector('.le-gtoggle')?.textContent?.includes('Instructions'),
  )!;
  instructions.querySelector<HTMLInputElement>('.le-ghead input')!.click();
  flushSync();
  button('Save').click();
  await settle();
  expect(calls.writeCodexEnvironment).toEqual([
    { id: 'sel-cx', spec: { instructions: false, hooks_off: [] } },
  ]);
});

it('drops a hook the preset left out that hooks.json no longer has, says so, and can be saved', async () => {
  const { calls } = await show([codexSession()], {
    codex: true,
    codexEnvironment: async () => ({
      instructions: true,
      hooks_off: ['k1', 'gone'],
    }),
  });
  const warning = document.querySelector('[role="alert"]');
  expect(warning?.textContent).toContain('no longer in hooks.json');
  // The draft is not the saved one, so Save is open; control below shows it is closed otherwise.
  expect(button('Save').disabled).toBe(false);
  button('Save').click();
  await settle();
  expect(calls.writeCodexEnvironment).toEqual([
    { id: 'sel-cx', spec: { instructions: true, hooks_off: ['k1'] } },
  ]);
});

it('control: a preset whose keys all name a hook shows no warning', async () => {
  await show([codexSession()], {
    codex: true,
    codexEnvironment: async () => ({ instructions: true, hooks_off: ['k1'] }),
  });
  expect(document.querySelector('[role="alert"]')).toBeNull();
});

it('does not draw the environment of a preset whose file cannot be read, says so, and writes none', async () => {
  const { calls } = await show([codexSession()], {
    codex: true,
    codexEnvironment: async () => {
      throw Object.assign(new Error('x'), { code: 'environment_unreadable' });
    },
  });
  const warning = document.querySelector('[role="alert"]');
  expect(warning?.textContent).toContain('environment-codex.json');
  expect(
    [...document.querySelectorAll('.le-group')].some((g) =>
      g.querySelector('.le-gtoggle')?.textContent?.includes('Hooks'),
    ),
    'no hooks drawn as "everything on"',
  ).toBe(false);
  button('Save').click();
  await settle();
  expect(calls.writeCodexEnvironment).toBeUndefined();
});

function projectInstructions(mode: 'load' | 'exclude' | 'role') {
  const select = document.querySelector<HTMLSelectElement>(
    'select[aria-label="Project instructions"]',
  )!;
  select.value = mode;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

it.each(['exclude', 'role'] as const)(
  'saves %s without an existing preset to a new preset',
  async (mode) => {
    const { calls } = await show([session('estudiar', null)]);
    projectInstructions(mode);
    if (mode === 'role') {
      const area = document.querySelector<HTMLTextAreaElement>('textarea')!;
      area.value = 'My role';
      area.dispatchEvent(new Event('input', { bubbles: true }));
      flushSync();
    }
    expect(document.body.textContent).not.toContain('Choose a preset');
    button('Save').click();
    await settle();
    expect(calls.saveSelection).toHaveLength(1);
    expect(calls.saveSelection[0]).toMatchObject({
      id: null,
      items: [
        { capability: 's1', revision: null },
        { capability: 's2', revision: null },
        { capability: 'a1', revision: null },
      ],
    });
    expect(
      ipc.find((c) => c.command === 'arsenal_launch_instructions_write')?.args,
    ).toEqual({
      selection: 'sel-new',
      instructions: { project: mode, role: mode === 'role' ? 'My role' : '' },
    });
  },
);

it('uses the plan for the folder and provider, unticks unavailable skills and removes them only on save', async () => {
  const terminalPlan = vi.fn(
    async () =>
      ({
        items: [
          {
            capability: 's1',
            state: 'rejected',
            reason: 'Installed copy differs',
          },
          { capability: 's2', state: 'missing', reason: 'Not in this folder' },
        ],
      }) as TerminalPlan,
  );
  const { calls } = await show([session('estudiar', 'Estudio')], {
    terminalPlan,
  });
  expect(terminalPlan).toHaveBeenCalledWith('', 'claude_code', '/home/me/UTN', [
    { capability: 's1', revision: 7 },
    { capability: 's2', revision: null },
    { capability: 'a1', revision: null },
  ]);
  expect(calls.saveSelection).toBeUndefined();
  const skills = [...document.querySelectorAll('.le-group')].find((g) =>
    g.textContent?.includes('Skills'),
  )!;
  const inputs = [
    ...skills.querySelectorAll<HTMLInputElement>('.le-row input'),
  ];
  expect(inputs).toHaveLength(2);
  expect(inputs.every((i) => i.disabled && !i.checked)).toBe(true);
  expect(inputs.map((i) => i.title)).toEqual([
    'Installed copy differs',
    'Not in this folder',
  ]);
  expect(
    inputs.map((i) => i.parentElement!.querySelector('span')!.title),
  ).toEqual(['Installed copy differs', 'Not in this folder']);
  button('Save').click();
  await settle();
  expect(calls.saveSelection[0]).toMatchObject({ id: 'sel-1', items: [] });
});

it('ignores a late plan from a previously selected folder', async () => {
  let resolve!: (plan: TerminalPlan) => void;
  const terminalPlan = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<TerminalPlan>((r) => {
          resolve = r;
        }),
    )
    .mockResolvedValue({
      items: [{ capability: 's1', state: 'prepared', reason: '' }],
    });
  await show(
    [session('estudiar', 'Estudio')],
    { terminalPlan },
    { choose: async () => '/home/me/Other' },
  );
  button('Browse…').click();
  await settle();
  resolve({
    items: [{ capability: 's1', state: 'rejected', reason: 'Old folder' }],
  } as TerminalPlan);
  await settle();
  expect(terminalPlan).toHaveBeenLastCalledWith(
    'sel-1',
    'claude_code',
    '/home/me/Other',
    undefined,
  );
  const skill = [
    ...document.querySelectorAll<HTMLInputElement>('.le-row input'),
  ].find((i) => i.closest('label')?.textContent?.includes('frontend-design'))!;
  expect(skill.disabled).toBe(false);
  expect(skill.checked).toBe(true);
});

it.each([false, true])(
  'clears launch instructions on delete only when its preset is not shared (shared=%s)',
  async (shared) => {
    await show([
      session('estudiar', 'Estudio'),
      ...(shared ? [session('otro', 'Estudio')] : []),
    ]);
    document.querySelector<HTMLButtonElement>('.le-delete')!.click();
    await settle();
    button('Delete').click();
    await settle();
    expect(ipc.some((c) => c.command === 'launch_delete')).toBe(true);
    const writes = ipc.filter(
      (c) => c.command === 'arsenal_launch_instructions_write',
    );
    expect(writes).toHaveLength(shared ? 0 : 1);
    if (!shared)
      expect(writes[0].args).toEqual({
        selection: 'sel-1',
        instructions: { project: 'load' },
      });
  },
);

it('uses the group and select styles, six full-width role lines and only the chosen help', async () => {
  await show([session('estudiar', 'Estudio')]);
  const group = document
    .querySelector('select[aria-label="Project instructions"]')!
    .closest('.le-group')!;
  expect(group.querySelector('.le-ghead')?.textContent).toBe(
    'Project instructions',
  );
  expect(group.textContent).toContain('Loads the project instructions.');
  expect(group.textContent).not.toContain('Without project instructions,');
  expect(group.textContent).not.toContain('The text applies at start.');
  projectInstructions('exclude');
  expect(group.textContent).not.toContain('Loads the project instructions.');
  expect(group.textContent).toContain('Without project instructions,');
  expect(group.textContent).not.toContain('The text applies at start.');
  projectInstructions('role');
  expect(group.textContent).toContain('The text applies at start.');
  expect(group.querySelector('textarea')?.rows).toBe(6);
  expect(group.querySelector('textarea')?.closest('.le-field')).not.toBeNull();
});

it.each(['launch_delete', 'arsenal_launch_instructions_write'])(
  'reports a failure of %s without claiming the wrong deletion state',
  async (failure) => {
    await show([session('estudiar', 'Estudio')]);
    mockIPC((command, args) => {
      ipc.push({ command, args });
      if (command === failure) throw new Error('Fixture failure');
      return null;
    });
    document.querySelector<HTMLButtonElement>('.le-delete')!.click();
    await settle();
    button('Delete').click();
    await settle();
    if (failure === 'launch_delete') {
      expect(
        ipc.some((c) => c.command === 'arsenal_launch_instructions_write'),
      ).toBe(false);
      expect(document.body.textContent).toContain(
        'The launch could not be deleted.',
      );
    } else {
      expect(document.body.textContent).toContain(
        'The launch was deleted, but its instructions or role could not be cleared.',
      );
    }
  },
);

it('regression: previews a library larger than 512 without blocking a small saved preset', async () => {
  const terminalPlan = vi.fn(async (_selection, _agent, _directory, items) => {
    items ??= [];
    if (items.length > 512) throw new Error('invalid_request');
    return {
      items: items.map((i: { capability: string }) => ({
        ...i,
        state: 'prepared',
      })),
    } as TerminalPlan;
  }) as unknown as ReturnType<typeof vi.fn<ArsenalClient['terminalPlan']>>;
  await show([session('estudiar', 'Estudio')], {
    library: Array.from({ length: 600 }, (_, i) => lib(`s${i + 1}`, 'skill')),
    terminalPlan,
  });
  await settle();
  expect(terminalPlan.mock.calls.some((c) => c[3]?.length === 512)).toBe(true);
  expect(terminalPlan.mock.calls.some((c) => c[3]?.length === 88)).toBe(true);
  choose(fieldSelect('Permissions'), 'ask');
  expect(button('Save').disabled).toBe(false);
  expect(document.body.textContent).not.toContain('could not be read');
});

it('regression: rechecking a pinned skill keeps the revision that was evaluated', async () => {
  const { calls } = await show([session('estudiar', 'Estudio')]);
  const skill = [
    ...document.querySelectorAll<HTMLInputElement>('.le-row input'),
  ].find((i) => i.closest('label')?.textContent?.includes('frontend-design'))!;
  skill.click();
  flushSync();
  skill.click();
  flushSync();
  choose(fieldSelect('Permissions'), 'ask');
  button('Save').click();
  await settle();
  expect(calls.saveSelection).toBeUndefined(); // No unpinning, so the preset stays unchanged.
});

it('regression: unreadable instructions are not described as excluded', async () => {
  await show([session('estudiar', 'Estudio')], { failInstructions: true });
  expect(document.body.textContent).toContain(
    'Not available: the instructions file could not be read.',
  );
  expect(document.body.textContent).not.toContain(
    'Without project instructions,',
  );
});

it('regression: a nondefault Claude environment requires the token warning even with project instructions loaded', async () => {
  await show([session('estudiar', 'Estudio')], { tokenStored: false });
  expect(document.body.textContent).toContain('No long-lived token is stored');
});

it('regression: warns when the draft cannot apply its skills choice', async () => {
  await show([session('estudiar', 'Estudio')], {
    terminalPlan: async () =>
      ({
        items: [],
        can_apply: false,
        enforcement: { reason: 'Unqualified build' },
        conflicts: [],
      }) as unknown as TerminalPlan,
  });
  await settle();
  expect(document.body.textContent).toContain(
    'This skills choice cannot be applied now: Unqualified build',
  );
});

it('regression: exposes the real plan error instead of always blaming the folder', async () => {
  const { ArsenalCallError } =
    await import('../src/lib/desktop/arsenal-client');
  await show([session('estudiar', 'Estudio')], {
    terminalPlan: async () => {
      throw new ArsenalCallError({ code: 'agent_not_installed', reason: null });
    },
  });
  expect(document.body.textContent).toContain(
    'That agent is not installed on this computer.',
  );
  expect(document.body.textContent).not.toContain(
    'Check the folder and try again',
  );
});

it('regression: lists launch files refused by the reader', async () => {
  await show(
    [session('estudiar', null)],
    {},
    {
      launches: async () => ({
        launches: [session('estudiar', null)],
        refused: [{ id: 'broken.toml', error: 'not a launch file' }],
      }),
    },
  );
  expect(document.body.textContent).toContain('Files that could not be read');
  expect(document.body.textContent).toContain('broken.toml: not a launch file');
});

it('regression: says when unavailable items were removed from the draft', async () => {
  await show([session('estudiar', 'Estudio')], {
    terminalPlan: async () =>
      ({
        items: [{ capability: 's1', state: 'missing' }],
      }) as unknown as TerminalPlan,
  });
  expect(document.body.textContent).toContain(
    '1 unavailable items were left out',
  );
});

it('regression: the agent estimate does not shrink when an individual agent is unchecked', async () => {
  await show([session('estudiar', null)]);
  const agents = [...document.querySelectorAll('.le-group')].find((g) =>
    g.querySelector('.le-gtoggle')?.textContent?.includes('Agents'),
  )!;
  agents.querySelector<HTMLButtonElement>('.le-gtoggle')!.click();
  flushSync();
  const cost = agents.querySelector('.le-cost')!.textContent;
  agents.querySelector<HTMLInputElement>('.le-row input')!.click();
  flushSync();
  expect(agents.querySelector('.le-cost')!.textContent).toBe(cost);
  expect(
    agents.querySelector<HTMLButtonElement>('.le-gtoggle')!.title,
  ).toContain('does not switch it off');
});

it('regression: preserves the cause when deleting a launch fails', async () => {
  await show([session('estudiar', 'Estudio')]);
  mockIPC((command) => {
    if (command === 'launch_delete')
      throw { code: 'launch_invalid', reasons: ['unknown launch'] };
    return null;
  });
  document.querySelector<HTMLButtonElement>('.le-delete')!.click();
  flushSync();
  button('Delete').click();
  await settle();
  expect(document.body.textContent).toContain(
    'The launch could not be deleted. unknown launch',
  );
});

it('regression: punctuates host fragments before listing partially saved steps', async () => {
  await show([session('estudiar', 'Estudio')]);
  mockIPC((command) => {
    if (command === 'launch_save')
      throw { code: 'launch_invalid', reasons: ['directory not found'] };
    return null;
  });
  projectInstructions('exclude');
  button('Save').click();
  await settle();
  expect(document.body.textContent).toContain(
    'Directory not found. Saved so far:',
  );
});

it('regression: distribution warnings do not suggest adding an unknown ID or repeat an ID as the name', async () => {
  await show(
    [{ ...update, active: null, commands: [] }],
    {},
    {
      launches: async () => ({
        launches: [{ ...update, active: null, commands: [] }],
        refused: [],
        system: { id: '', name: '', like: [] },
      }),
    },
  );
  expect(document.body.textContent).toContain('add one to start it here');
  expect(document.body.textContent).not.toContain('add ?');
});

it.each(['', 'arch'])(
  'regression: a distribution with name %s displays its ID only once',
  async (name) => {
    await show(
      [update],
      {},
      {
        launches: async () => ({
          launches: [update],
          refused: [],
          system: { id: 'arch', name, like: [] },
        }),
      },
    );
    expect(text('.dv-system').trim()).toBe('Detected on this computer: arch');
  },
);

it.each(['launch_unavailable', 'internal'])(
  'regression: list failures with code %s show a sentence',
  async (code) => {
    const { LaunchError } = await import('../src/lib/desktop/launch-client');
    await show(
      [],
      {},
      {
        launches: async () => {
          throw new LaunchError(code);
        },
      },
    );
    expect(text('[role="alert"]')).toBe(
      code === 'internal'
        ? 'Something unexpected happened. Try again.'
        : 'The launch folder is not available.',
    );
  },
);

it('regression: variant save errors translate host codes into sentences', async () => {
  await show([update]);
  mockIPC(() => {
    throw { code: 'internal' };
  });
  switchOf('--noconfirm').click();
  flushSync();
  button('Save').click();
  await settle();
  expect(text('[role="alert"]')).toBe(
    'Something unexpected happened. Try again.',
  );
});

it('regression: Workspace copy describes the implemented switches in both languages', async () => {
  const { setLanguage } = await import('../src/lib/i18n/index.svelte');
  await show([session('estudiar', null)]);
  const select = document.querySelector<HTMLSelectElement>(
    'select[aria-label="Project instructions"]',
  )!;
  expect([...select.options].map((o) => o.textContent)).toEqual([
    'Load project instructions',
    'Skip project instructions',
    'Custom instructions',
  ]);
  expect(fieldSelect('Distributor').closest('label')!.title).toContain(
    'project instructions',
  );
  expect(document.querySelector('.le-total')!.textContent).toContain(
    'MCP and hooks not measured',
  );
  setLanguage('es');
  flushSync();
  try {
    expect(
      document.querySelector('select[aria-label="Instrucciones del proyecto"]')
        ?.textContent,
    ).toContain('Instrucciones propias');
    // Native is a named mode in this app, and still goes through t().
    expect(document.querySelector('select:disabled option')?.textContent).toBe(
      'Native',
    );
  } finally {
    setLanguage('en');
    flushSync();
  }
});

it('regression: the advisory verdict reads the saved preset and its composites when the items are unchanged', async () => {
  const terminalPlan = vi.fn(
    async () => ({ items: [] }) as unknown as TerminalPlan,
  );
  await show([session('estudiar', 'Estudio')], { terminalPlan });
  await settle();
  expect(terminalPlan).toHaveBeenLastCalledWith(
    'sel-1',
    'claude_code',
    '/home/me/UTN',
    undefined,
  );
});

it('regression: a failure reading the selection verdict is visible even when library availability succeeded', async () => {
  const terminalPlan = vi.fn(async (selection: string) => {
    if (selection) throw new Error('Selection verdict failed');
    return { items: [] } as unknown as TerminalPlan;
  });
  await show([session('estudiar', 'Estudio')], { terminalPlan });
  await settle();
  expect(document.body.textContent).toContain(
    'The launch plan could not be read: Selection verdict failed',
  );
});
