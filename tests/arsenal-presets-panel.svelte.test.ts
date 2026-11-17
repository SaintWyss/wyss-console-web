import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { mockIPC } from '@tauri-apps/api/mocks';
import type {
  ArsenalProvider,
  Candidate,
  Selection,
} from '../src/lib/contracts/arsenal';
import type { Launch, LaunchList } from '../src/lib/desktop/launch-client';
import type {
  ArsenalController,
  ArsenalState,
} from '../src/lib/features/arsenal/controller';
import { setLanguage } from '../src/lib/i18n/index.svelte';
import PresetsPanelHarness from './PresetsPanelHarness.svelte';
import PresetsPanel from '../src/lib/features/arsenal/PresetsPanel.svelte';

let component: ReturnType<typeof mount> | undefined;
afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  document.body.innerHTML = '';
  setLanguage('en');
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
    phase: 'ready',
    library: [],
    discover: null,
    discovering: false,
    busy: null,
    bulk: null,
    notice: null,
    selections,
    selectionsFailure: null,
    sync: null,
    ...overrides,
  };
}

const candidate = (id: string): Candidate => ({
  id,
  tree_hash: id === 'origin-a' ? 'a'.repeat(64) : 'b'.repeat(64),
  status: 'not_imported',
  importable: true,
  compatibility: 'supported',
  capability: null,
  duplicates: [],
  name_collisions: [],
  kind: 'skill',
  provider: 'claude_code',
  source: 'claude_user_skills',
  scope: 'user',
  name: 'shared-name',
  description: '',
  origin: `~/.claude/skills/${id}`,
  executes_code: false,
  blocked: null,
  managed_by: null,
  file_count: 1,
  excluded_count: 0,
  review_count: 0,
});

function render(
  selections: Selection[],
  launches: Launch[] = [],
  provider: ArsenalProvider = 'claude_code',
  overrides: Partial<ArsenalState> = {},
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
      arsenal: state(selections, overrides),
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

  it('shows both same-named import failures as separate alerts', async () => {
    mockIPC((command) => {
      if (command === 'arsenal_selections') return [];
      if (command === 'arsenal_discover')
        return {
          project: null,
          sources: [
            { source: 'claude_user_skills', state: 'read' },
            { source: 'codex_user_skills', state: 'absent' },
          ],
          candidates: [candidate('origin-a'), candidate('origin-b')],
          composites: [],
          truncated: false,
        };
      if (command === 'arsenal_import')
        return Promise.reject({ code: 'blocked', reason: 'needs_secret' });
      if (command === 'arsenal_capabilities') return [];
      return null;
    });
    let arsenalController: ArsenalController | undefined;
    component = mount(PresetsPanelHarness, {
      target: document.body,
      props: {
        oncontroller: (value: ArsenalController) => (arsenalController = value),
      },
    });
    await settle();
    button('Import the 2 new capabilities').click();
    await settle();

    const failures = [
      ...document.querySelectorAll('.presets-panel [role="alert"]'),
    ].filter((alert) => text(alert).startsWith('shared-name:'));
    expect(failures).toHaveLength(2);
    expect(failures.map(text)).toEqual([
      'shared-name: A file holds something that looks like a secret. Remove it from the skill to import it.',
      'shared-name: A file holds something that looks like a secret. Remove it from the skill to import it.',
    ]);
    expect(
      arsenalController?.snapshot().bulk?.failures.map((failure) => failure.id),
    ).toEqual(['origin-a', 'origin-b']);
  });

  it('shows a rejected preset deletion from the real Arsenal controller in Spanish', async () => {
    mockIPC((command) => {
      if (command === 'arsenal_selections') return [selection()];
      if (command === 'arsenal_selection_delete')
        return Promise.reject({ code: 'storage_unavailable', reason: null });
      return null;
    });
    setLanguage('es');
    component = mount(PresetsPanelHarness, { target: document.body });
    await settle();

    [...document.querySelectorAll<HTMLButtonElement>('.preset-actions button')]
      .find(
        (candidateButton) => candidateButton.textContent?.trim() === 'Borrar',
      )!
      .click();
    flushSync();
    [...document.querySelectorAll<HTMLButtonElement>('.preset-actions button')]
      .find(
        (candidateButton) =>
          candidateButton.textContent?.trim() === 'Confirmar borrado',
      )!
      .click();
    await settle();

    const alert = document.querySelector('[role="alert"]');
    expect(text(alert)).toContain('No se pudo abrir la biblioteca de Arsenal.');
    expect(document.querySelector('.preset-confirmation')).not.toBeNull();
  });
});
