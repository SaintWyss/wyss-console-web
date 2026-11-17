import { expect, it, vi } from 'vitest';
import type { Candidate } from '../src/lib/contracts/arsenal';
import {
  ArsenalCallError,
  type ArsenalClient,
} from '../src/lib/desktop/arsenal-client';
import { importEligible } from '../src/lib/features/arsenal/import';

const candidate = (
  id: string,
  overrides: Partial<Candidate> = {},
): Candidate => ({
  id,
  tree_hash: 'a'.repeat(64),
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
  name: id,
  description: '',
  origin: `~/.claude/skills/${id}`,
  executes_code: false,
  blocked: null,
  managed_by: null,
  file_count: 1,
  excluded_count: 0,
  review_count: 0,
  ...overrides,
});

it('imports eligible skills in one run, reports a failed entry, and continues', async () => {
  const first = candidate('first');
  const second = candidate('second', { status: 'source_changed' });
  const alreadyImported = candidate('existing', { status: 'imported' });
  const importSkill = vi.fn<ArsenalClient['importSkill']>(async ({ id }) => {
    if (id === first.id)
      throw new ArsenalCallError({ code: 'blocked', reason: 'needs_secret' });
    return { capability: `cap-${id}`, revision: 1, outcome: 'created' };
  });
  const progress: { done: number; finished: boolean; failures: number }[] = [];
  const run = await importEligible(
    [first, second, alreadyImported],
    importSkill,
    (snapshot) =>
      progress.push({
        done: snapshot.done,
        finished: snapshot.finished,
        failures: snapshot.failures.length,
      }),
  );

  expect(importSkill.mock.calls.map(([request]) => request.id)).toEqual([
    'first',
    'second',
  ]);
  expect(run).toMatchObject({
    total: 2,
    done: 2,
    created: 1,
    failures: [
      {
        name: 'first',
        text: 'A file holds something that looks like a secret. Remove it from the skill to import it.',
      },
    ],
    stopped: null,
    finished: true,
  });
  expect(progress.at(-1)).toEqual({ done: 2, finished: true, failures: 1 });
});
