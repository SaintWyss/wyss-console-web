import type { Item, LibraryItem, Selection } from '../../contracts/arsenal';
import type { Launch } from '../../desktop/launch-client';
import type { Roles } from '../../desktop/arsenal-client';
import { allItemsOf, selectionOf } from '../workspace/data';
import { savePlan, type Agent, type SavePlan } from '../workspace/plan';

/**
 * The Arsenal library (redesign stage 4, arsenal-UI-SPEC "Etapa 4"). Nothing here is stored:
 * where a capability is placed is read from the launches and the presets they name.
 */

export type SessionLaunch = Extract<Launch, { kind: 'session' }>;

/** Only skills and agents go in a preset; the rest is chosen in a launch's environment. */
export function placeable(item: Pick<LibraryItem, 'kind'>): boolean {
  return item.kind === 'skill' || item.kind === 'agent';
}

export function sessionLaunches(launches: readonly Launch[]): SessionLaunch[] {
  return launches.filter((l): l is SessionLaunch => l.kind === 'session');
}

/**
 * The items a launch loads: its preset's, or everything of its provider when it names none
 * (what the desktop starts a launch without a preset with).
 */
export function itemsOfLaunch(
  launch: SessionLaunch,
  selections: readonly Selection[],
  library: readonly LibraryItem[],
): Item[] {
  const selection = selectionOf(launch, selections);
  return selection ? selection.items : allItemsOf(library, launch.agent);
}

/** The session launches that load `item`: same provider, and it is in what they load. */
export function placedIn(
  item: LibraryItem,
  launches: readonly SessionLaunch[],
  selections: readonly Selection[],
  library: readonly LibraryItem[],
): SessionLaunch[] {
  if (!placeable(item)) return [];
  return launches.filter(
    (l) =>
      l.agent === item.provider &&
      itemsOfLaunch(l, selections, library).some(
        (i) => i.capability === item.id,
      ),
  );
}

/** Unplaced: a skill or agent that no saved launch loads. */
export function isUnplaced(
  item: LibraryItem,
  launches: readonly SessionLaunch[],
  selections: readonly Selection[],
  library: readonly LibraryItem[],
): boolean {
  return (
    placeable(item) &&
    placedIn(item, launches, selections, library).length === 0
  );
}

/** A launch the library can change: no `before` lines (the same rule as Workspace). */
export function changeable(launch: SessionLaunch): boolean {
  return launch.before.length === 0;
}

export const DEFAULT_ROLE = 'worker';
export function roleOf(launch: string, roles: Roles | null): string {
  return roles?.assigned[launch] ?? DEFAULT_ROLE;
}

/** The launches of a role that can take `item`: same provider. */
export function launchesOfRole(
  role: string,
  item: LibraryItem,
  launches: readonly SessionLaunch[],
  roles: Roles | null,
): SessionLaunch[] {
  return launches.filter(
    (l) => l.agent === item.provider && roleOf(l.id, roles) === role,
  );
}

/** A role's chip is on when it has such launches and every one of them loads the item. */
export function roleOn(
  role: string,
  item: LibraryItem,
  launches: readonly SessionLaunch[],
  roles: Roles | null,
  selections: readonly Selection[],
  library: readonly LibraryItem[],
): boolean {
  const of = launchesOfRole(role, item, launches, roles);
  const placed = new Set(
    placedIn(item, launches, selections, library).map((l) => l.id),
  );
  return of.length > 0 && of.every((l) => placed.has(l.id));
}

/** Context a skill or agent adds at start: its name and description, bytes ÷ 4 (estimate.ts). */
export function tokensOf(
  item: Pick<LibraryItem, 'name' | 'description'>,
): number {
  return Math.ceil(
    new TextEncoder().encode(`${item.name}\n${item.description}`).length / 4,
  );
}

/** "Use when …" / "Úsalo cuando …" in a description, when it says one. */
export function activatesWhen(description: string): string | null {
  const found =
    /(?:^|[\s.(])(?:use (?:this(?: skill| agent)? )?(?:when|whenever|for)|[úu]salo cuando|use cuando)\s+([^.]*[^.\s])/iu.exec(
      description,
    );
  return found ? found[1].trim() : null;
}

export type RunsCode = 'yes' | 'no' | 'unknown';
const SCRIPT = /\.(sh|bash|zsh|py|js|mjs|cjs|ts|rb|pl)$/i;
/** Whether it runs code: hooks, servers and plugins do; a skill does when it ships scripts. */
export function runsCode(
  kind: string,
  files: readonly { path: string }[] | null,
): RunsCode {
  if (['hook', 'mcp_server', 'plugin', 'command'].includes(kind)) return 'yes';
  if (kind === 'rule') return 'no';
  if (files === null) return 'unknown';
  return files.some((f) => SCRIPT.test(f.path)) ? 'yes' : 'no';
}

export interface Filters {
  query: string;
  /** A source from `librarySources`, or null for all. */
  origin: string | null;
  /** `unplaced`, a category id, or null for the whole library. */
  category: string | null;
}

export function matches(
  item: LibraryItem,
  filters: Filters,
  categoryOf: (item: LibraryItem) => string,
  unplaced: (item: LibraryItem) => boolean,
): boolean {
  if (filters.origin !== null && item.source !== filters.origin) return false;
  if (filters.category === 'unplaced' && !unplaced(item)) return false;
  if (
    filters.category !== null &&
    filters.category !== 'unplaced' &&
    categoryOf(item) !== filters.category
  )
    return false;
  const q = filters.query.trim().toLowerCase();
  return (
    q === '' ||
    item.name.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q)
  );
}

/** What putting `item` in (or taking it out of) a launch's preset holds afterwards. */
export function itemsAfter(
  current: readonly Item[],
  item: LibraryItem,
  on: boolean,
): Item[] {
  const without = current.filter((i) => i.capability !== item.id);
  return on ? [...without, { capability: item.id, revision: null }] : without;
}

export interface PlaceContext {
  launches: readonly Launch[];
  selections: readonly Selection[];
  library: readonly LibraryItem[];
  roles: Roles | null;
  folderSelection: string | null;
}

/**
 * The Workspace save plan for one launch with `item` put in or taken out: the same plan, so a
 * shared preset is copied to the launch's own and no other launch changes. The environment and
 * the permission stay as they are.
 */
export function placePlan(
  launch: SessionLaunch,
  item: LibraryItem,
  on: boolean,
  ctx: PlaceContext,
): { plan: SavePlan; items: Item[]; selection: Selection | null } {
  const agent: Agent = launch.agent;
  const selection = selectionOf(launch, ctx.selections);
  const items = itemsAfter(
    itemsOfLaunch(launch, ctx.selections, ctx.library),
    item,
    on,
  );
  const plan = savePlan(
    {
      id: launch.id,
      name: launch.name,
      role: roleOf(launch.id, ctx.roles),
      agent,
      permission: launch.permission,
      directory: launch.directory,
      selection,
      items,
      composites: selection?.composites ?? [],
      spec: null,
    },
    {
      launches: ctx.launches,
      selections: ctx.selections.filter((s) => s.provider === agent),
      folderSelection: ctx.folderSelection,
      savedSpec: null,
      allItems: allItemsOf(ctx.library, agent),
    },
  );
  return { plan, items, selection };
}
