import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseApplied } from '../src/lib/contracts/configuration';
import {
  ChangesController,
  type ChangesState,
} from '../src/lib/features/configuration/changes-controller';
import { NOTICE_LABEL } from '../src/lib/features/configuration/present';
import changes from './fixtures/configuration-changes-v1.json';
import { FakeChanges } from './configuration-changes-harness';

const base = () => structuredClone(changes.applied) as Record<string, unknown>;

describe('parseApplied and launch_presets_not_followed', () => {
  it('accepts a reply without the key, and the key only as true', () => {
    expect(parseApplied(base())).not.toHaveProperty(
      'launch_presets_not_followed',
    );
    const flagged = parseApplied({
      ...base(),
      launch_presets_not_followed: true,
    });
    expect(flagged.launch_presets_not_followed).toBe(true);
    expect(flagged.change).toBe(changes.applied.change);
  });

  it('rejects the key set to false or to anything else, and still rejects other extras', () => {
    for (const bad of [false, 0, 1, 'true', null, undefined]) {
      expect(() =>
        parseApplied({ ...base(), launch_presets_not_followed: bad }),
      ).toThrow();
    }
    expect(() =>
      parseApplied({ ...base(), launch_presets_not_followed: true, extra: 1 }),
    ).toThrow();
    expect(() => parseApplied({ ...base(), extra: 1 })).toThrow();
  });
});

describe('the changes controller and a launch preset that did not follow', () => {
  let fake: FakeChanges;
  let states: ChangesState[];
  let controller: ChangesController;
  beforeEach(() => {
    vi.useFakeTimers();
    fake = new FakeChanges();
    states = [];
    controller = new ChangesController(
      (s) => states.push(s),
      () => undefined,
      fake.client(),
    );
  });
  afterEach(() => {
    controller.dispose();
    vi.useRealTimers();
  });
  const applyOnce = async () => {
    controller.author((c) => c.authorHook('Stop', null, null));
    await vi.advanceTimersByTimeAsync(0);
    controller.apply();
    await vi.advanceTimersByTimeAsync(0);
  };

  it('says it only when the reply carries the flag, and the next change clears it', async () => {
    fake.applied = parseApplied({
      ...base(),
      launch_presets_not_followed: true,
    });
    await applyOnce();
    expect(states.at(-1)?.notice).toBe('launches_not_followed');
    expect(NOTICE_LABEL.launches_not_followed).toContain(
      'could not be updated',
    );
    // Another change that follows its presets says nothing.
    fake.applied = parseApplied(base());
    await applyOnce();
    expect(states.at(-1)?.notice).toBeNull();
  });
});
