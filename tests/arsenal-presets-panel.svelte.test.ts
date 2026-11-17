import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import type { ArsenalProvider, Selection } from '../src/lib/contracts/arsenal';
import type { Launch, LaunchList } from '../src/lib/desktop/launch-client';
import type {
  ArsenalController,
  ArsenalState,
} from '../src/lib/features/arsenal/controller';
import PresetsPanel from '../src/lib/features/arsenal/PresetsPanel.svelte';

let component: ReturnType<typeof mount> | undefined;
afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  document.body.innerHTML = '';
});

const settle = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
  flushSync();
};
const text = (node: Element | null | undefined) =>
  node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

const selection = (overrides: Partial<Selection> = {}): Selection => ({
  id: 'selection-1',
  name: 'Estudio',
  provider: 'claude_code',
  items: [{ capability: 'cap-design', revision: null }],
  composites: [],
  created_at: 1,
  updated_at: 1,
  ...overrides,
});

const launch = (
  overrides: Partial<Extract<Launch, { kind: 'session' }>> = {},
): Launch => ({
  id: 'estudio',
  name: 'Estudio principal',
  directory: '/home/u/work',
  kind: 'session',
  agent: 'claude_code',
  permission: null,
  before: [],
  preset: 'Estudio',
  ...overrides,
});

const launchList = (launches: Launch[] = []): LaunchList => ({
  folder: '/home/u/.config/wyss-console/launch',
  launches,
  refused: [],
  system: { id: 'linux', like: [], name: 'Linux' },
});

function state(
  selections: Selection[],
  overrides: Partial<ArsenalState> = {},
): ArsenalState {
  return {
    tab: 'presets',
    phase: 'ready',
    library: [],
    opened: null,
    file: null,
    discover: null,
    discovering: false,
    chosen: null,
    chosenDetail: null,
    busy: null,
    bulk: null,
    notice: null,
    presets: [],
    selections,
    selectionsFailure: null,
    preview: null,
    bindings: [],
    sync: null,
    groups: {},
    categories: [],
    categoryFailure: null,
    movingGroup: null,
    groupFailure: null,
    plan: null,
    ...overrides,
  };
}

function render(
  selections: Selection[],
  launches: Launch[] = [],
  provider: ArsenalProvider = 'claude_code',
) {
  const controller = {
    deleteSelection: vi.fn(async () => true),
    importEligible: vi.fn(async () => undefined),
    loadSelections: vi.fn(async () => undefined),
    discover: vi.fn(async () => undefined),
  };
  const onedit = vi.fn();
  const oncreate = vi.fn();
  component = mount(PresetsPanel, {
    target: document.body,
    props: {
      visible: true,
      provider,
      arsenal: state(selections),
      controller: controller as unknown as ArsenalController,
      onedit,
      oncreate,
      launches: async () => launchList(launches),
    },
  });
  flushSync();
  return { controller, onedit, oncreate };
}

function button(label: string): HTMLButtonElement {
  const found = [
    ...document.querySelectorAll<HTMLButtonElement>('button'),
  ].find((candidate) => candidate.textContent?.trim() === label);
  if (!found) throw new Error(`button not found: ${label}`);
  return found;
}

describe('Arsenal preset list', () => {
  it('lists presets, marks duplicate names, and opens a launch in Workspace for editing', async () => {
    const first = selection();
    const second = selection({ id: 'selection-2' });
    const { onedit } = render([first, second], [launch()]);
    await settle();
    expect(document.querySelectorAll('.preset-row')).toHaveLength(2);
    expect(document.querySelectorAll('.badge')).toHaveLength(2);
    expect(text(document.querySelector('.preset-uses'))).toContain(
      'Estudio principal',
    );
    expect(
      document.querySelector(
        '[aria-label="Edit launch Estudio principal in Workspace"]',
      ),
    ).not.toBeNull();
    document
      .querySelector<HTMLButtonElement>(
        '[aria-label="Edit launch Estudio principal in Workspace"]',
      )!
      .click();
    expect(onedit).toHaveBeenCalledWith('estudio');
  });

  it('creates a launch from an unused preset', async () => {
    const preset = selection();
    const { oncreate } = render([preset]);
    await settle();
    button('Create launch with it').click();
    expect(oncreate).toHaveBeenCalledWith(preset);
  });

  it('confirms deletion in the row and explains the launch and sync effect', async () => {
    const preset = selection();
    const { controller } = render([preset], [launch()]);
    await settle();
    button('Delete').click();
    flushSync();
    const row = document.querySelector('.preset-row')!;
    expect(text(row)).toContain('Estudio principal');
    expect(text(row)).toContain('syncs to the other computer');
    expect(controller.deleteSelection).not.toHaveBeenCalled();
    [...row.querySelectorAll<HTMLButtonElement>('button')]
      .find((candidate) => candidate.textContent?.trim() === 'Confirm delete')!
      .click();
    await settle();
    expect(controller.deleteSelection).toHaveBeenCalledWith('selection-1');
  });

  it('disables creating a launch when preset names are duplicated', async () => {
    render([selection(), selection({ id: 'selection-2' })]);
    await settle();
    expect(button('Create launch with it').disabled).toBe(true);
  });
});
