import { afterEach, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import EnvironmentPanel from '../src/lib/features/arsenal/EnvironmentPanel.svelte';
import type {
  CodexEnvironmentOptions,
  CodexHomeSpec,
} from '../src/lib/features/arsenal/environment';

let component: ReturnType<typeof mount> | undefined;
afterEach(() => {
  if (component) void unmount(component);
  component = undefined;
  document.body.replaceChildren();
});

const options: CodexEnvironmentOptions = {
  hooks: [
    { key: 'k1', event: 'SessionStart', matcher: '', command: 'orient.sh' },
    { key: 'k2', event: 'PreToolUse', matcher: 'Bash', command: 'gate.py' },
  ],
  config_hooks: [{ event: 'Stop', matcher: '', command: 'notify.sh' }],
  instructions: true,
};

async function settle() {
  for (let i = 0; i < 6; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    flushSync();
  }
}

function render(
  saved: CodexHomeSpec,
  over: Partial<CodexEnvironmentOptions> = {},
) {
  // The Claude Code client must never be asked for a Codex preset.
  const client = {
    get: vi.fn(),
    options: vi.fn(),
    write: vi.fn(),
  };
  const codexClient = {
    get: vi.fn(async () => saved),
    options: vi.fn(async () => ({ ...options, ...over })),
    write: vi.fn(async () => undefined),
  };
  component = mount(EnvironmentPanel, {
    target: document.body,
    props: { selection: 'sel-cx', provider: 'codex', client, codexClient },
  });
  flushSync();
  return { client, codexClient };
}

const boxes = () => [
  ...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
];
const save = () =>
  [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
    b.textContent?.includes('Save environment'),
  )!;

it('reads and saves the environment of a Codex preset through the Codex client only', async () => {
  const { client, codexClient } = render({
    instructions: true,
    hooks_off: [],
  });
  await settle();
  expect(codexClient.options).toHaveBeenCalled();
  expect(codexClient.get).toHaveBeenCalledWith('sel-cx');
  expect(client.get).not.toHaveBeenCalled();
  expect(client.options).not.toHaveBeenCalled();
  // AGENTS.md, two hooks of hooks.json, and the fixed one of config.toml.
  expect(boxes().map((b) => [b.checked, b.disabled])).toEqual([
    [true, false],
    [true, false],
    [true, false],
    [true, true],
  ]);
  expect(document.body.textContent).toContain('notify.sh');
  expect(save().disabled).toBe(true);
  // Leave out AGENTS.md and the second hook.
  boxes()[0]!.click();
  boxes()[2]!.click();
  flushSync();
  expect(save().disabled).toBe(false);
  expect(document.body.textContent).toContain('its own Codex folder');
  save().click();
  await settle();
  expect(codexClient.write).toHaveBeenCalledWith('sel-cx', {
    instructions: false,
    hooks_off: ['k2'],
  });
  expect(client.write).not.toHaveBeenCalled();
  expect(save().disabled).toBe(true);
});

it('shows a saved Codex environment as it was left, and no fixed hooks when config.toml has none', async () => {
  render({ instructions: true, hooks_off: ['k1'] }, { config_hooks: [] });
  await settle();
  expect(boxes().map((b) => b.checked)).toEqual([true, false, true]);
  expect(document.body.textContent).not.toContain('Hooks of config.toml');
  expect(document.body.textContent).toContain('its own Codex folder');
});

it('says the launch environment could not be read when the Codex options fail', async () => {
  component = mount(EnvironmentPanel, {
    target: document.body,
    props: {
      selection: 'sel-cx',
      provider: 'codex',
      codexClient: {
        get: async () => ({ instructions: true, hooks_off: [] }),
        options: async () => {
          throw new Error('x');
        },
        write: async () => undefined,
      },
    },
  });
  await settle();
  expect(document.querySelector('[role="alert"]')?.textContent).toContain(
    'could not be read',
  );
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

it('does not draw a late answer for a preset the panel no longer shows', async () => {
  const slow = deferred<CodexHomeSpec>();
  const get = vi.fn((id: string) =>
    id === 'A'
      ? slow.promise
      : Promise.resolve({ instructions: true, hooks_off: ['k1'] }),
  );
  const props = $state({ selection: 'A', provider: 'codex' as const });
  component = mount(EnvironmentPanel, {
    target: document.body,
    props: {
      get selection() {
        return props.selection;
      },
      get provider() {
        return props.provider;
      },
      client: { get: vi.fn(), options: vi.fn(), write: vi.fn() },
      codexClient: {
        get,
        options: vi.fn(async () => options),
        write: vi.fn(async () => undefined),
      },
    },
  });
  flushSync();
  await settle();
  // B is chosen while A is still loading, and B answers first.
  props.selection = 'B';
  flushSync();
  await settle();
  expect(get).toHaveBeenCalledWith('B');
  expect(boxes().map((b) => b.checked)).toEqual([true, false, true, true]);
  // A answers last, with something else: B stays as it was.
  slow.resolve({ instructions: false, hooks_off: ['k2'] });
  await settle();
  expect(boxes().map((b) => b.checked)).toEqual([true, false, true, true]);
  expect(save().disabled).toBe(true);
});

it('keeps a choice made while the save is in flight as unsaved, and writes only what was frozen', async () => {
  const gate = deferred<undefined>();
  const { codexClient } = render({ instructions: true, hooks_off: [] });
  codexClient.write.mockImplementation(() => gate.promise);
  await settle();
  boxes()[1]!.click(); // k1 off
  flushSync();
  save().click();
  flushSync();
  expect(codexClient.write).toHaveBeenCalledWith('sel-cx', {
    instructions: true,
    hooks_off: ['k1'],
  });
  // While it is being written, k2 is switched off too.
  boxes()[2]!.click();
  flushSync();
  gate.resolve(undefined);
  await settle();
  expect(codexClient.write).toHaveBeenCalledTimes(1);
  expect(boxes().map((b) => b.checked)).toEqual([true, false, false, true]);
  // The second choice is not marked as saved: Save is still open for it.
  expect(save().disabled).toBe(false);
  save().click();
  await settle();
  expect(codexClient.write).toHaveBeenLastCalledWith('sel-cx', {
    instructions: true,
    hooks_off: ['k1', 'k2'],
  });
  expect(save().disabled).toBe(true);
});

it('drops a key that names no hook any more from the draft, says so and leaves the panel unsaved', async () => {
  const { codexClient } = render({
    instructions: true,
    hooks_off: ['k1', 'gone'],
  });
  await settle();
  expect(document.querySelector('[role="alert"]')?.textContent).toContain(
    'no longer in hooks.json',
  );
  // The draft shows what hooks.json has: k1 off, nothing for the removed one.
  expect(boxes().map((b) => b.checked)).toEqual([true, false, true, true]);
  expect(save().disabled).toBe(false);
  save().click();
  await settle();
  expect(codexClient.write).toHaveBeenCalledWith('sel-cx', {
    instructions: true,
    hooks_off: ['k1'],
  });
  // Saved: the warning goes, and so does the unsaved state.
  expect(document.querySelector('[role="alert"]')).toBeNull();
  expect(save().disabled).toBe(true);
});

it('control: a preset whose keys all name a hook shows no warning and nothing unsaved', async () => {
  render({ instructions: true, hooks_off: ['k1'] });
  await settle();
  expect(document.querySelector('[role="alert"]')).toBeNull();
  expect(save().disabled).toBe(true);
});

it('says the file cannot be read, in its own words, when the desktop answers environment_unreadable', async () => {
  component = mount(EnvironmentPanel, {
    target: document.body,
    props: {
      selection: 'sel-cx',
      provider: 'codex',
      codexClient: {
        get: async () => {
          throw Object.assign(new Error('x'), {
            code: 'environment_unreadable',
          });
        },
        options: async () => options,
        write: async () => undefined,
      },
    },
  });
  await settle();
  expect(document.querySelector('[role="alert"]')?.textContent).toContain(
    'environment-codex.json',
  );
});
