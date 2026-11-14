import { afterEach, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import LibraryView from '../src/lib/features/arsenal/LibraryView.svelte';
import type { ArsenalClient } from '../src/lib/desktop/arsenal-client';
import type { Launch, LaunchList } from '../src/lib/desktop/launch-client';
import type { LibraryItem, Selection } from '../src/lib/contracts/arsenal';
import type {
  ArsenalController,
  ArsenalState,
} from '../src/lib/features/arsenal/controller';

let component: ReturnType<typeof mount> | undefined;
afterEach(async () => {
  if (component) await unmount(component);
  component = undefined;
  document.body.innerHTML = '';
});
async function settle() {
  for (let i = 0; i < 20; i++) await tick();
  flushSync();
}
const button = (label: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (b) => b.textContent?.trim() === label,
  )!;

const skill = (id: string): LibraryItem =>
  ({
    id,
    provider: 'claude_code',
    source: 'claude-user',
    kind: 'skill',
    name: id,
    description: `${id}: use when testing`,
    origin: '',
    revision: 1,
    revisions: 1,
    tree_hash: 'h',
    updated_at: 0,
    compatibility: { status: 'compatible', reason: '' },
  }) as unknown as LibraryItem;
const session = (id: string, preset: string | null): Launch =>
  ({
    id,
    name: id,
    directory: '/home/u',
    kind: 'session',
    agent: 'claude_code',
    permission: 'edits',
    before: [],
    preset,
  }) as Launch;
const shared: Selection = {
  id: 's1',
  name: 'Comun',
  provider: 'claude_code',
  items: [{ capability: 'a', revision: null }],
  composites: [],
  created_at: 0,
  updated_at: 0,
};

function show(state: Partial<ArsenalState>, launches: Launch[]) {
  const saveSelection = vi.fn(async (input: { name: string }) => ({
    ...shared,
    id: 'new',
    name: input.name,
  }));
  const client = {
    selections: vi.fn(async () => [shared]),
    roles: vi.fn(async () => ({ custom: [], assigned: {}, damaged: false })),
    projectSelection: vi.fn(async () => null),
    saveSelection,
  } as unknown as ArsenalClient;
  const save = vi.fn(async () => launches[0]);
  const list = vi.fn(
    async () =>
      ({ launches, folder: '', refused: [] }) as unknown as LaunchList,
  );
  const controller = {
    open: vi.fn(async () => undefined),
    showFile: vi.fn(),
    discover: vi.fn(),
    importCandidate: vi.fn(),
    refresh: vi.fn(),
  } as unknown as ArsenalController;
  const arsenal = {
    phase: 'ready',
    library: [skill('a'), skill('b')],
    groups: {},
    categories: [],
    discover: null,
    discovering: false,
    busy: null,
    opened: null,
    file: null,
    ...state,
  } as unknown as ArsenalState;
  component = mount(LibraryView, {
    target: document.body,
    props: { visible: true, arsenal, controller, client, launches: list, save },
  });
  return { saveSelection, save };
}

it('counts what no launch loads as Unplaced, and opens a row on its three tabs', async () => {
  show({}, [session('uno', 'Comun')]);
  await settle();
  expect(
    document.querySelector('.lib-cat .lib-count')?.textContent?.trim(),
  ).toBe('1');
  const row = [...document.querySelectorAll<HTMLButtonElement>('.lib-line')];
  expect(row.map((r) => r.querySelector('.lib-place')?.textContent)).toEqual([
    '1 launch',
    'Unplaced',
  ]);
  row[1].click();
  await settle();
  expect(
    [...document.querySelectorAll('.lib-tab')].map((t) => t.textContent),
  ).toEqual(['What it does', 'Files', 'Where it goes']);
  expect(document.querySelector('.lib-kv')?.textContent).toContain('testing');
});

it('putting it in a launch whose preset is shared copies the preset and points the launch at it', async () => {
  const { saveSelection, save } = show({}, [
    session('uno', 'Comun'),
    session('otro', 'Comun'),
  ]);
  await settle();
  [...document.querySelectorAll<HTMLButtonElement>('.lib-line')][1].click();
  await settle();
  button('Where it goes').click();
  await settle();
  button('uno').click();
  await settle();
  // A new preset of the launch's own, never a write over the shared one.
  expect(saveSelection).toHaveBeenCalledWith(
    expect.objectContaining({
      id: null,
      name: 'uno',
      items: [
        { capability: 'a', revision: null },
        { capability: 'b', revision: null },
      ],
    }),
  );
  // The launch keeps its permission and now names its own preset; the other is not touched.
  expect(save).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'uno',
      permission: 'edits',
      preset: 'uno',
      replace: true,
    }),
  );
});

it('with an empty library offers to bring what was found, all ticked', async () => {
  show(
    {
      library: [],
      discover: {
        project: null,
        sources: [],
        composites: [],
        truncated: false,
        candidates: [
          {
            id: 'k1',
            importable: true,
            status: 'not_imported',
            name: 'one',
            description: 'd',
            source: 'claude-user',
            executes_code: false,
          },
        ],
      },
    } as unknown as Partial<ArsenalState>,
    [],
  );
  await settle();
  expect(document.body.textContent).toContain('Bring what you already use');
  expect(button('Import 1 items').disabled).toBe(false);
});
