import { afterEach, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import type { Guide } from '../src/lib/contracts/arsenal';
import type {
  ConfigItem,
  Provider,
  Verdict,
} from '../src/lib/contracts/configuration';
import { parseInventoryReply } from '../src/lib/contracts/configuration';
import ConfigurationView from '../src/lib/features/configuration/ConfigurationView.svelte';
import ChangePlan from '../src/lib/features/configuration/ChangePlan.svelte';
import { ConfigurationController } from '../src/lib/features/configuration/controller';
import { ChangesController } from '../src/lib/features/configuration/changes-controller';
import {
  NOT_WRITABLE_LABEL,
  PERSISTED_LABEL,
  NOTICE_LABEL,
} from '../src/lib/features/configuration/present';
import { setLanguage, t } from '../src/lib/i18n/index.svelte';
import ArsenalReviewHarness from './ArsenalReviewHarness.svelte';
import { FakeChanges, fixture } from './configuration-changes-harness';
import inventory from './fixtures/configuration-inventory-v1.json';

let component: ReturnType<typeof mount> | undefined;
const controllers: { dispose(): void }[] = [];
afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  controllers.splice(0).forEach((controller) => controller.dispose());
  document.body.replaceChildren();
  setLanguage('en');
});
const settle = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve();
  flushSync();
};
const text = (node: ParentNode = document.body) =>
  node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
function button(label: string): HTMLButtonElement {
  const found = [...document.querySelectorAll('button')].find(
    (node) => text(node.querySelector('.ab-label') ?? node) === label,
  );
  if (!found) throw new Error(`Missing button: ${label}`);
  return found;
}
const hook = (over: Partial<ConfigItem> = {}): ConfigItem => ({
  id: 'a'.repeat(32),
  provider: 'claude_code',
  source: 'claude_user_settings',
  scope: 'global',
  kind: 'hook',
  name: 'PreToolUse · Bash',
  persisted: 'present_enabled',
  effective: 'not_verifiable',
  session_use: 'unknown',
  not_writable: 'not_in_this_phase',
  detail: null,
  hash: null,
  ...over,
});
async function library(
  items: ConfigItem[] = [],
  fake = new FakeChanges(),
  guide: Guide = { entries: [], sets: [], truncated: false },
) {
  const reply = parseInventoryReply(inventory);
  reply.inventory.items = items;
  component = mount(ArsenalReviewHarness, {
    target: document.body,
    props: { guide, reply, client: fake.client() },
  });
  await settle();
  return fake;
}
function embedded(provider: Provider, kind: 'hook' | 'mcp_server') {
  const fake = new FakeChanges();
  const client = fake.client();
  const authorHook = vi.spyOn(client, 'authorHook');
  const authorMcp = vi.spyOn(client, 'authorMcp');
  const controller = new ConfigurationController(() => undefined);
  const changesController = new ChangesController(
    () => undefined,
    () => undefined,
    client,
  );
  controllers.push(controller, changesController);
  component = mount(ConfigurationView, {
    target: document.body,
    props: {
      visible: true,
      embedded: true,
      kinds: [kind],
      configuration: {
        ...controller.state(),
        phase: 'ready',
        provider,
        reply: parseInventoryReply(inventory),
      },
      controller,
      changes: changesController.state(),
      changesController,
    },
  });
  flushSync();
  return { authorHook, authorMcp };
}

it('does not offer to author a Claude hook from an OpenCode page', () => {
  embedded('opencode', 'hook');
  expect(
    [...document.querySelectorAll('button')].map((node) => text(node)),
  ).not.toContain('Add a hook…');
});

it('does not claim inline configuration is a dialog', async () => {
  await library([hook({ kind: 'mcp_server', name: 'docs' })]);
  const link = button('MCP');
  expect(link.hasAttribute('aria-haspopup')).toBe(false);
  link.click();
  flushSync();
  expect(
    document.querySelector('.ars-config-inline .configuration-feature'),
  ).not.toBeNull();
});

it.each(['codex', 'opencode'] as const)(
  'authors MCP only for its embedded %s page',
  async (provider) => {
    const { authorMcp } = embedded(provider, 'mcp_server');
    button('Add an MCP server…').click();
    flushSync();
    expect
      .soft(
        [...document.querySelectorAll('label')].some((node) =>
          text(node).startsWith('Agent'),
        ),
      )
      .toBe(false);
    const input = document.querySelector<HTMLInputElement>(
      'input[maxlength="64"]',
    )!;
    input.value = 'docs';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    document
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await settle();
    expect(authorMcp).toHaveBeenCalledWith('docs', 'local', provider, false);
  },
);

it('does not offer an unsupported Claude MCP creation', () => {
  embedded('claude_code', 'mcp_server');
  expect(
    [...document.querySelectorAll('button')].map((node) => text(node)),
  ).not.toContain('Add an MCP server…');
});

it('offers hook creation only over the event list, not embedded configuration', async () => {
  embedded('codex', 'hook');
  expect(
    [...document.querySelectorAll('button')].map((node) => text(node)),
  ).not.toContain('Add a hook…');
  await unmount(component!);
  component = undefined;
  document.body.replaceChildren();
  await library([hook({ provider: 'codex', source: 'codex_user_config' })]);
  const root = button('OpenAI · Codex');
  root.click();
  flushSync();
  [...root.closest('li')!.querySelectorAll<HTMLButtonElement>('button')]
    .find((node) => text(node.querySelector('.ab-label') ?? node) === 'Hooks')!
    .click();
  flushSync();
  button('Before a tool runs').click();
  flushSync();
  expect(
    [...document.querySelectorAll('button')].filter(
      (node) => text(node) === 'Add a hook',
    ),
  ).toHaveLength(1);
  button('Add a hook').click();
  flushSync();
  expect(document.querySelector('form.ars-add')).not.toBeNull();
});

it('shows the Codex hook trust notice once when its card is open', async () => {
  await library([hook({ provider: 'codex', source: 'codex_user_config' })]);
  const root = button('OpenAI · Codex');
  root.click();
  flushSync();
  [...root.closest('li')!.querySelectorAll<HTMLButtonElement>('button')]
    .find((node) => text(node.querySelector('.ab-label') ?? node) === 'Hooks')!
    .click();
  flushSync();
  button('Before a tool runs').click();
  flushSync();
  button('Bash').click();
  flushSync();
  expect(
    text().split('Codex asks you to trust a new or changed hook'),
  ).toHaveLength(2);
});

it('labels records of unknown type as kept entries and nests their plan inside the list item', async () => {
  const fake = await library([], new FakeChanges());
  fake.records = [{ ...fixture.records()[0]!, label: 'docs server' }];
  button('Kept aside').click();
  await settle();
  expect.soft(text(document.querySelector('.ab-title')!)).toBe('Kept aside');
  fake.plan = fixture.restorePlan();
  button('Put back').click();
  await settle();
  const plan = document.querySelector('.configuration-plan')!;
  expect(plan.parentElement?.tagName).toBe('LI');
  expect(text()).toContain('docs server');
});

it('describes an empty generic kept list without calling everything hooks', async () => {
  const fake = new FakeChanges();
  fake.records = [];
  await library([], fake);
  button('Kept aside').click();
  await settle();
  expect(text()).toContain('Nothing is kept aside.');
});

it('names the hook removal by what it does and uses the same vocabulary in the plan', async () => {
  await library([hook()]);
  button('Before a tool runs').click();
  flushSync();
  document.querySelector<HTMLButtonElement>('.ars-row')!.click();
  flushSync();
  button('Keep aside').click();
  await settle();
  expect(text(document.querySelector('.configuration-plan')!)).toContain(
    'Keep this hook aside',
  );
});

it('shows one factual read-only explanation with no promise of future editing', async () => {
  await library([
    hook({ source: 'claude_project_settings', persisted: 'present_disabled' }),
  ]);
  button('Before a tool runs').click();
  flushSync();
  document.querySelector<HTMLButtonElement>('.ars-row')!.click();
  flushSync();
  expect(text()).toContain('This hook cannot be changed from here.');
  expect(text()).not.toContain('not available yet');
});

it('translates hidden hook commands in both the row and card', async () => {
  setLanguage('es');
  await library([
    hook({
      detail: {
        kind: 'map',
        value: [['command', { kind: 'hidden', value: 'environment_value' }]],
      },
    }),
  ]);
  button('Antes de usar una herramienta').click();
  flushSync();
  expect(text()).toContain('[oculto]');
  document.querySelector<HTMLButtonElement>('.ars-row')!.click();
  flushSync();
  expect(text(document.querySelector('.lib-pre')!)).toBe('[oculto]');
});

it('gives every supported hook event a translated meaning without repeating its raw ID', async () => {
  await library([hook()]);
  button('Before a tool runs').click();
  flushSync();
  button('Add a hook').click();
  flushSync();
  const options = [...document.querySelectorAll('option')].map((node) =>
    text(node),
  );
  expect(options).toContain('When a tool fails · PostToolUseFailure');
  expect(options).toContain('When permission is requested · PermissionRequest');
  expect(options).toContain('When a subagent starts · SubagentStart');
});

it.each(['en', 'es'] as const)(
  'uses one kept-aside vocabulary in %s',
  (language) => {
    setLanguage(language);
    expect(t(PERSISTED_LABEL.parked.label)).toBe(
      language === 'en' ? 'Kept aside' : 'Guardados aparte',
    );
    expect(t(NOTICE_LABEL.imported)).toBe(
      language === 'en'
        ? 'Imported. It is listed under Kept aside.'
        : 'Importado. Figura en Guardados aparte.',
    );
  },
);

it.each(['en', 'es'] as const)(
  'renders complete prediction and trusted-writer sentences in %s',
  (language) => {
    setLanguage(language);
    const controller = new ChangesController(() => undefined);
    controllers.push(controller);
    component = mount(ChangePlan, {
      target: document.body,
      props: {
        changes: {
          ...controller.state(),
          plan: {
            ...fixture.codexMcpPlan(),
            shared_with_declared_writers: true,
            managed_effect: {
              predicted: true,
              before: 'external_hooks',
              after: 'available',
            },
          },
        },
        changesController: controller,
      },
    });
    flushSync();
    expect(text()).toContain(
      language === 'en'
        ? 'Prediction for managed launches: before this change, cannot start: a hook is enabled in Codex’s files; after this change, can start.'
        : 'Predicción para los lanzamientos administrados: antes de este cambio, no puede arrancar: hay un hook activado en los archivos de Codex; después de este cambio, puede arrancar.',
    );
    expect(text()).toContain(
      language === 'en'
        ? 'Another account you named in trusted-writers can also write this file’s folder. It is accepted because you named it.'
        : 'Otra cuenta que nombraste en trusted-writers también puede escribir la carpeta de este archivo. Se acepta porque la nombraste.',
    );
  },
);

it.each(['available', 'external_hooks', 'mcp_unprovable'] as const)(
  'renders an unchanged %s prediction as a complete sentence',
  (verdict: Verdict) => {
    const controller = new ChangesController(() => undefined);
    controllers.push(controller);
    component = mount(ChangePlan, {
      target: document.body,
      props: {
        changes: {
          ...controller.state(),
          plan: {
            ...fixture.codexMcpPlan(),
            managed_effect: {
              predicted: true,
              before: verdict,
              after: verdict,
            },
          },
        },
        changesController: controller,
      },
    });
    flushSync();
    expect(text()).toContain('Prediction for managed launches:');
    expect(text()).toContain('. This change does not alter that.');
  },
);

it.each(['claude_code', 'codex'] as const)(
  'names both copies when a %s skill differs and matches switch vocabulary',
  async (tool) => {
    await library(
      [
        hook({
          kind: 'skill',
          provider: tool,
          source:
            tool === 'codex' ? 'codex_user_config' : 'claude_user_settings',
          name: 'design',
        }),
      ],
      new FakeChanges(),
      {
        entries: [
          {
            id: 'design',
            tool,
            kind: 'skill',
            name: 'design',
            description: '',
            description_es: null,
            set: 'mine',
            origin: '~/.agents/skills/design',
            linked_to: null,
            scope: 'both',
            codex_differs: true,
            unreadable: null,
            description_cut: false,
          },
        ],
        sets: [],
        truncated: false,
      },
    );
    if (tool === 'codex') {
      button('OpenAI · Codex').click();
      flushSync();
      button('Skills').click();
      flushSync();
      button('Personal').click();
      flushSync();
      button('Design and interface').click();
      flushSync();
    }
    const entry = document.querySelector<HTMLButtonElement>(
      '[data-entry="design"]',
    );
    expect(entry).not.toBeNull();
    entry!.click();
    await settle();
    expect
      .soft(text())
      .toContain(
        'The copies in Claude Code’s and Codex’s folders are different.',
      );
    expect.soft(text()).toContain('State On');
    expect(button('Turn off')).toBeDefined();
  },
);

it.each(['list', 'configuration'] as const)(
  'closes the hook card and cancels its pending plan when choosing a %s',
  async (destination) => {
    let resolve!: (plan: ReturnType<typeof fixture.parkPlan>) => void;
    const pending = new Promise<ReturnType<typeof fixture.parkPlan>>(
      (yes) => (resolve = yes),
    );
    const fake = new FakeChanges();
    vi.spyOn(fake, 'client').mockReturnValue({
      ...fake.client(),
      plan: () => pending,
    });
    await library(
      [hook(), hook({ id: 'c'.repeat(32), kind: 'mcp_server', name: 'docs' })],
      fake,
    );
    button('Before a tool runs').click();
    flushSync();
    document.querySelector<HTMLButtonElement>('.ars-row')!.click();
    flushSync();
    document
      .querySelector<HTMLButtonElement>('.ars-state button[title]')!
      .click();
    flushSync();
    button(destination === 'list' ? 'Before a tool runs' : 'MCP').click();
    flushSync();
    expect(document.querySelector('.ars-card')).toBeNull();
    resolve(fixture.parkPlan());
    await settle();
    expect(document.querySelector('.configuration-plan')).toBeNull();
  },
);

it('does not promise future editing for read-only configuration entries', () => {
  expect(t(NOT_WRITABLE_LABEL.not_in_this_phase)).toBe(
    'This entry cannot be changed from here.',
  );
});

it('drops an open MCP form when the embedded provider changes', async () => {
  await library([
    hook({
      id: 'c'.repeat(32),
      provider: 'codex',
      kind: 'mcp_server',
      name: 'codex-docs',
    }),
    hook({
      id: 'd'.repeat(32),
      provider: 'opencode',
      kind: 'mcp_server',
      name: 'opencode-docs',
    }),
  ]);
  function chooseMcp(tool: string) {
    const root = button(tool);
    if (root.getAttribute('aria-expanded') === 'false') {
      root.click();
      flushSync();
    }
    const mcp = [...root.closest('li')!.querySelectorAll('button')].find(
      (node) => text(node.querySelector('.ab-label') ?? node) === 'MCP',
    );
    expect(mcp).toBeDefined();
    mcp!.click();
    flushSync();
  }
  chooseMcp('OpenAI · Codex');
  button('Add an MCP server…').click();
  flushSync();
  expect(document.querySelector('form')).not.toBeNull();
  chooseMcp('OpenCode');
  expect(document.querySelector('form')).toBeNull();
});

it('shows a failed kept-record read instead of an endless loading message and can retry', async () => {
  const fake = await library();
  fake.failNext = 'internal';
  button('Kept aside').click();
  await settle();
  const alert = document.querySelector('[role="alert"]');
  expect(alert).not.toBeNull();
  expect(text(alert!)).toContain('Something went wrong. Nothing was changed.');
  expect(text()).not.toContain('Reading…');
  button('Try again').click();
  await settle();
  expect(document.querySelector('[role="alert"]')).toBeNull();
  expect(document.querySelector('.ars-parked')).not.toBeNull();
});
