import type { Candidate } from '../../contracts/arsenal';
import {
  ArsenalCallError,
  type ArsenalClient,
} from '../../desktop/arsenal-client';
import { failureMessage } from './messages';

/** One bulk import run: what each entry did, and what stayed out and why. */
export interface BulkRun {
  total: number;
  done: number;
  created: number;
  newRevision: number;
  unchanged: number;
  failures: { name: string; text: string }[];
  /** Why the run stopped early, when the library itself refused writes. */
  stopped: string | null;
  finished: boolean;
}

const LIBRARY_STOPS = new Set([
  'storage_unavailable',
  'storage_corrupt',
  'storage_unsupported',
]);

function failureCode(error: unknown): string {
  return error instanceof ArsenalCallError ? error.code : 'internal';
}

export function eligibleCandidates(
  candidates: readonly Candidate[],
): Candidate[] {
  return candidates.filter(
    (candidate) =>
      candidate.importable &&
      (candidate.status === 'not_imported' ||
        candidate.status === 'source_changed'),
  );
}

/** Imports each eligible item once, reporting a snapshot after every settled request. */
export async function importEligible(
  candidates: readonly Candidate[],
  importSkill: ArsenalClient['importSkill'],
  onProgress: (run: BulkRun) => void = () => undefined,
): Promise<BulkRun | null> {
  const eligible = eligibleCandidates(candidates);
  if (eligible.length === 0) return null;

  const run: BulkRun = {
    total: eligible.length,
    done: 0,
    created: 0,
    newRevision: 0,
    unchanged: 0,
    failures: [],
    stopped: null,
    finished: false,
  };
  const publish = () => onProgress({ ...run, failures: [...run.failures] });
  publish();

  for (const candidate of eligible) {
    try {
      const imported = await importSkill({
        id: candidate.id,
        kind: candidate.kind,
        source: candidate.source,
        name: candidate.name,
      });
      if (imported.outcome === 'created') run.created += 1;
      else if (imported.outcome === 'new_revision') run.newRevision += 1;
      else run.unchanged += 1;
    } catch (error) {
      if (LIBRARY_STOPS.has(failureCode(error))) {
        run.stopped = failureMessage(error);
        break;
      }
      run.failures.push({
        name: candidate.name,
        text: failureMessage(error),
      });
    }
    run.done += 1;
    publish();
  }
  run.finished = true;
  publish();
  return run;
}
