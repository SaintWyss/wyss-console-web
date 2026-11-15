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
