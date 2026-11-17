import type {
  DiscoverReply,
  LibraryItem,
  Selection,
  SyncStatus,
} from '../../contracts/arsenal';
import {
  arsenalClient,
  ArsenalCallError,
  type ArsenalClient,
} from '../../desktop/arsenal-client';
import { msg, type Phrase } from '../../i18n/msg';
import { failureMessage, phrase } from './messages';
import { eligibleCandidates, importEligible, type BulkRun } from './import';

export type { BulkRun } from './import';

export interface Notice {
  tone: 'ok' | 'error';
  text: Phrase;
}

export interface ArsenalState {
  /** `unavailable`: the library could not be opened at all. `failed`: a read did not come back whole. */
  phase: 'idle' | 'loading' | 'ready' | 'unavailable' | 'failed';
  library: LibraryItem[];
  discover: DiscoverReply | null;
  discovering: boolean;
  busy: 'import' | null;
  /** The bulk run in progress or the last one finished, shown until the next run starts. */
  bulk: BulkRun | null;
  notice: Notice | null;
  selections: Selection[];
  /** Why the presets could not be read; the list shows it with Try again. `null` once they were read. */
  selectionsFailure: string | null;
  /** Synchronization with the owner's other computers; `null` until it was read once. */
  sync: SyncStatus | null;
}

/**
 * The one owner of Arsenal in the window. It reads the library while its view is shown and
 * imports new capabilities and deletes presets only when the owner asks. It
 * never sends a path, and nothing it holds starts a session.
 */
export class ArsenalController {
  private state: ArsenalState = {
    phase: 'idle',
    library: [],
    discover: null,
    discovering: false,
    busy: null,
    bulk: null,
    notice: null,
    selections: [],
    selectionsFailure: null,
    sync: null,
  };
  private visible = false;
  private disposed = false;

  constructor(
    private readonly publish: (state: ArsenalState) => void,
    private readonly client: ArsenalClient = arsenalClient,
  ) {}

  snapshot(): ArsenalState {
    return { ...this.state };
  }

  private set(change: Partial<ArsenalState>) {
    this.state = { ...this.state, ...change };
    if (!this.disposed) this.publish(this.snapshot());
  }

  /** The library is read when its view is shown, and again each time it is shown. */
  setVisible(visible: boolean) {
    if (this.disposed || visible === this.visible) return;
    this.visible = visible;
    if (visible) {
      void this.refresh();
      void this.loadSelections();
      // The scan says which providers are installed and which composites exist for presets.
      if (this.state.discover === null) void this.discover();
    }
    this.watchSync(visible);
  }

  dispose() {
    this.disposed = true;
    this.watchSync(false);
  }

  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private syncGeneration: number | null = null;

  /** Synchronization's status is read while the view is shown, and only then. */
  private watchSync(on: boolean) {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = null;
    if (!on || this.disposed) return;
    void this.readSync();
    this.syncTimer = setInterval(() => void this.readSync(), 4000);
  }

  /** Reads the status; when synchronization changed the library since the last read, reads that too. */
  async readSync() {
    try {
      const sync = await this.client.syncStatus();
      if (this.disposed) return;
      const changed =
        this.syncGeneration !== null && sync.generation !== this.syncGeneration;
      this.syncGeneration = sync.generation;
      this.set({ sync });
      if (changed) {
        void this.refresh();
        void this.loadSelections();
      }
    } catch {
      // A desktop that does not synchronize answers nothing; the status stays as it was.
    }
  }

  /** Reads the library. Shown content stays on screen while it reads. */
  async refresh() {
    this.set({
      phase: this.state.library.length ? this.state.phase : 'loading',
    });
    try {
      const library = await this.client.capabilities();
      this.set({ library, phase: 'ready' });
    } catch (error) {
      this.set({
        phase:
          failureOf(error) === 'storage_unavailable' ? 'unavailable' : 'failed',
      });
      this.set({
        notice: { tone: 'error', text: phrase(failureMessage(error)) },
      });
    }
  }

  async discover() {
    this.set({ discovering: true, notice: null });
    try {
      const discover = await this.client.discover();
      this.set({
        discover,
        discovering: false,
      });
    } catch (error) {
      this.set({
        discovering: false,
        notice: {
          tone: 'error',
          text: phrase(failureMessage(error)),
        },
      });
    }
  }

  /**
   * Imports every eligible entry of the last scan, one request each. The scan is not read again
   * until the run ends. A failed entry is recorded and the run goes on; a library that cannot take
   * writes stops it, since every later entry would fail the same way.
   */
  async importEligible() {
    if (this.state.busy !== null) return;
    const candidates = this.state.discover?.candidates ?? [];
    const eligible = eligibleCandidates(candidates);
    if (eligible.length === 0) {
      this.set({
        notice: {
          tone: 'ok',
          text: phrase(
            msg(
              'Nothing to import: every eligible skill is already in the library.',
            ),
          ),
        },
      });
      return;
    }
    this.set({ busy: 'import', notice: null });
    const run = await importEligible(
      candidates,
      this.client.importSkill,
      (next) => this.set({ bulk: next }),
    );
    if (!run) {
      this.set({ busy: null });
      return;
    }
    await this.discover();
    await this.refresh();
    const failed = run.failures.length + (run.stopped ? 1 : 0);
    this.set({
      busy: null,
      notice: {
        tone: failed > 0 ? 'error' : 'ok',
        text: bulkSummary(run),
      },
    });
  }

  /** Reads the presets. A failed read is kept for the list to show, with Try again, not as a notice. */
  async loadSelections() {
    try {
      this.set({
        selections: await this.client.selections(),
        selectionsFailure: null,
      });
    } catch (error) {
      this.set({ selectionsFailure: failureMessage(error) });
    }
  }

  /** Deletes a preset. Answers whether it was deleted; a refused delete leaves the list as it was. */
  async deleteSelection(id: string): Promise<boolean> {
    try {
      await this.client.deleteSelection(id);
    } catch (error) {
      this.set({
        notice: { tone: 'error', text: phrase(failureMessage(error)) },
      });
      return false;
    }
    this.set({
      notice: { tone: 'ok', text: phrase(msg('Selection deleted.')) },
    });
    await this.loadSelections();
    return true;
  }
}

function failureOf(error: unknown): string {
  return error instanceof ArsenalCallError ? error.code : 'internal';
}

/** The result a run leaves on screen: counts first, then what did not import and why. */
export function bulkSummary(run: BulkRun): Phrase {
  const parts: Phrase[] = [
    { text: msg('{count} imported'), values: { count: run.created } },
    {
      text: msg('{count} updated to a new revision'),
      values: { count: run.newRevision },
    },
    {
      text: msg('{count} already in the library, unchanged'),
      values: { count: run.unchanged },
    },
  ];
  if (run.failures.length > 0) {
    parts.push({
      text: msg('{count} failed'),
      values: { count: run.failures.length },
    });
  }
  const joined = parts.slice(1).reduce<Phrase>(
    (first, rest) => ({
      text: msg('{first}, {rest}'),
      values: { first, rest },
    }),
    parts[0],
  );
  const summary: Phrase = {
    text: msg('Bulk import: {parts}.'),
    values: { parts: joined },
  };
  return run.stopped
    ? {
        text: msg('{summary} Stopped: {reason}'),
        values: { summary, reason: phrase(run.stopped) },
      }
    : summary;
}
