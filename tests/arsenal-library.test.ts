import { describe, expect, it } from 'vitest';
import type { LibraryItem, Selection } from '../src/lib/contracts/arsenal';
import type { Launch } from '../src/lib/desktop/launch-client';
import {
  activatesWhen,
  changeable,
  isUnplaced,
  itemsAfter,
  matches,
  placeable,
  placedIn,
  placePlan,
  roleOn,
  runsCode,
  sessionLaunches,
  tokensOf,
} from '../src/lib/features/arsenal/library';

const item = (id: string, over: Partial<LibraryItem> = {}): LibraryItem =>
  ({
    id,
    provider: 'claude_code',
    source: 'claude-user',
    kind: 'skill',
    name: id,
    description: `${id} does things`,
    origin: '',
    revision: 1,
    revisions: 1,
    tree_hash: 'h',
    updated_at: 0,
    compatibility: { status: 'compatible', reason: '' },
    ...over,
  }) as LibraryItem;
const launch = (
  id: string,
  preset: string | null,
  over: Record<string, unknown> = {},
): Launch =>
  ({
    id,
    name: id,
    directory: '/home/u',
    kind: 'session',
    agent: 'claude_code',
    permission: null,
    before: [],
    preset,
    ...over,
  }) as Launch;
const sel = (id: string, name: string, items: string[]): Selection => ({
  id,
  name,
  provider: 'claude_code',
  items: items.map((capability) => ({ capability, revision: null })),
  composites: [],
  created_at: 0,
  updated_at: 0,
});

const a = item('a');
const b = item('b');
const hook = item('h', { kind: 'hook' });
const codexOnly = item('c', { provider: 'codex' });
const library = [a, b, hook, codexOnly];

describe('where a capability is placed', () => {
  it('a launch loads its preset, and one with no preset loads everything of its provider', () => {
    const selections = [sel('s1', 'Uno', ['a'])];
    const withPreset = sessionLaunches([launch('uno', 'Uno')]);
    expect(
      placedIn(a, withPreset, selections, library).map((l) => l.id),
    ).toEqual(['uno']);
    expect(placedIn(b, withPreset, selections, library)).toEqual([]);
    expect(isUnplaced(b, withPreset, selections, library)).toBe(true);
    const bare = sessionLaunches([launch('todo', null)]);
    expect(isUnplaced(b, bare, selections, library)).toBe(false);
    // Another provider's launch never places it.
    expect(placedIn(codexOnly, bare, selections, library)).toEqual([]);
  });

  it('only skills and agents are placed: the rest is chosen in an environment', () => {
    expect(placeable(a)).toBe(true);
    expect(placeable(hook)).toBe(false);
    expect(isUnplaced(hook, [], [], library)).toBe(false);
  });

  it('a role is on only when every launch of it loads the capability', () => {
    const selections = [sel('s1', 'Uno', ['a']), sel('s2', 'Dos', [])];
    const ls = sessionLaunches([launch('uno', 'Uno'), launch('dos', 'Dos')]);
    const roles = {
      custom: [],
      assigned: { uno: 'reviewer', dos: 'reviewer' },
      damaged: false,
    };
    expect(roleOn('reviewer', a, ls, roles, selections, library)).toBe(false);
    const one = { ...roles, assigned: { uno: 'reviewer' } };
    expect(roleOn('reviewer', a, ls, one, selections, library)).toBe(true);
    // A role with no launch of this provider is never on.
    expect(roleOn('orchestrator', a, ls, roles, selections, library)).toBe(
      false,
    );
  });

  it('a launch with before lines is not changed here', () => {
    expect(
      changeable(sessionLaunches([launch('x', null, { before: ['ls'] })])[0]),
    ).toBe(false);
  });
});

describe('placing goes through the Workspace save', () => {
  it('a preset only this launch uses is written in place', () => {
    const selections = [sel('s1', 'Uno', ['a'])];
    const [l] = sessionLaunches([launch('uno', 'Uno')]);
    const { plan, items } = placePlan(l, b, true, {
      launches: [l],
      selections,
      library,
      roles: null,
      folderSelection: null,
    });
    expect(plan.preset).toEqual({ do: 'write', id: 's1', name: 'Uno' });
    expect(items.map((i) => i.capability)).toEqual(['a', 'b']);
  });

  it('a preset another launch shares is copied: the other launch keeps its own', () => {
    const selections = [sel('s1', 'Uno', ['a'])];
    const ls = sessionLaunches([launch('uno', 'Uno'), launch('otro', 'Uno')]);
    const { plan } = placePlan(ls[0], b, true, {
      launches: ls,
      selections,
      library,
      roles: null,
      folderSelection: null,
    });
    expect(plan.preset).toMatchObject({
      do: 'copy',
      name: 'uno 2',
      sharedWith: ['otro'],
    });
  });

  it('taking one out of a launch with no preset makes it one with everything else', () => {
    const [l] = sessionLaunches([launch('todo', null)]);
    const { plan, items } = placePlan(l, a, false, {
      launches: [l],
      selections: [],
      library,
      roles: null,
      folderSelection: null,
    });
    expect(plan.preset).toEqual({ do: 'create', name: 'todo' });
    expect(items.map((i) => i.capability)).toEqual(['b']);
    // Putting in what it already loads changes nothing.
    expect(
      placePlan(l, a, true, {
        launches: [l],
        selections: [],
        library,
        roles: null,
        folderSelection: null,
      }).plan.preset,
    ).toEqual({ do: 'none' });
  });

  it('itemsAfter never lists a capability twice', () => {
    const now = [{ capability: 'a', revision: 3 }];
    expect(itemsAfter(now, a, true)).toEqual([
      { capability: 'a', revision: null },
    ]);
    expect(itemsAfter(now, a, false)).toEqual([]);
  });
});

describe('what a row says', () => {
  it('estimates the context as bytes ÷ 4 of name and description', () => {
    expect(tokensOf({ name: 'abcd', description: 'efg' })).toBe(2);
  });
  it('says when it activates only when the description says so', () => {
    expect(activatesWhen('Builds UI. Use when the user asks for a page.')).toBe(
      'the user asks for a page',
    );
    expect(activatesWhen('Úsalo cuando el usuario diga combo.')).toBe(
      'el usuario diga combo',
    );
    expect(activatesWhen('Just a description.')).toBeNull();
  });
  it('runs code: hooks and servers do; a skill does when it ships a script', () => {
    expect(runsCode('hook', null)).toBe('yes');
    expect(runsCode('skill', null)).toBe('unknown');
    expect(runsCode('skill', [{ path: 'SKILL.md' }])).toBe('no');
    expect(runsCode('skill', [{ path: 'scripts/run.py' }])).toBe('yes');
  });
  it('filters by search, origin, category and Unplaced', () => {
    const cat = () => 'build';
    const un = (i: LibraryItem) => i.id === 'b';
    const f = { query: '', origin: null, category: null };
    expect(matches(a, { ...f, query: 'DOES' }, cat, un)).toBe(true);
    expect(matches(a, { ...f, query: 'zzz' }, cat, un)).toBe(false);
    expect(matches(a, { ...f, origin: 'other' }, cat, un)).toBe(false);
    expect(matches(a, { ...f, category: 'unplaced' }, cat, un)).toBe(false);
    expect(matches(b, { ...f, category: 'unplaced' }, cat, un)).toBe(true);
    expect(matches(a, { ...f, category: 'design' }, cat, un)).toBe(false);
  });
});
