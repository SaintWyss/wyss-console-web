import { describe, expect, it, vi } from 'vitest';
import {
  ArsenalShapeError,
  parseBinding,
  parseDiscover,
  parseImportFailure,
  parseSummaries,
  parseTerminalPlan,
  type Candidate,
  type DiscoverReply,
  type Selection,
  type LibraryItem,
} from '../src/lib/contracts/arsenal';
import {
  ArsenalCallError,
  type ArsenalClient,
} from '../src/lib/desktop/arsenal-client';
import {
  ArsenalController,
  type ArsenalState,
} from '../src/lib/features/arsenal/controller';
import { tPhrase } from '../src/lib/i18n/index.svelte';

const design: LibraryItem = {
  id: 'cap-design',
  provider: 'claude_code',
  source: 'claude_user_skills',
  kind: 'skill',
  name: 'design',
  description: 'Plans screens',
  origin: '~/.claude/skills/design',
  revision: 2,
  revisions: 2,
  tree_hash: 'c'.repeat(64),
  updated_at: 1,
  compatibility: { status: 'supported', reason: 'own format' },
};

const candidate: Candidate = {
  id: 'id-design',
  tree_hash: 'c'.repeat(64),
  status: 'not_imported',
  importable: true,
  compatibility: 'unverified',
  capability: null,
  duplicates: [],
  name_collisions: [],
  kind: 'skill',
  provider: 'claude_code',
  source: 'claude_user_skills',
  scope: 'user',
  name: 'design',
  description: 'Plans screens',
  origin: '~/.claude/skills/design',
  executes_code: false,
  blocked: null,
  managed_by: null,
  file_count: 1,
  excluded_count: 0,
  review_count: 0,
};

const discovered: DiscoverReply = {
  project: null,
  sources: [
    { source: 'claude_user_skills', state: 'read' },
    { source: 'codex_user_skills', state: 'absent' },
  ],
  candidates: [candidate],
  composites: [],
  truncated: false,
};

const selection: Selection = {
  id: 'sel-1',
  name: 'Frontend',
  provider: 'codex',
  items: [{ capability: 'cap-design', revision: null }],
  composites: [],
  created_at: 1,
  updated_at: 1,
};

function fakeClient(overrides: Partial<ArsenalClient> = {}): ArsenalClient {
  return {
    discover: vi.fn(async () => discovered),
    capabilities: vi.fn(async () => [design]),
    importSkill: vi.fn(async () => ({
      revision: 1,
      outcome: 'created' as const,
    })),
    selections: vi.fn(async () => [selection]),
    saveSelection: vi.fn(async () => selection),
    deleteSelection: vi.fn(async () => undefined),
    terminalPlan: vi.fn(async () => {
      throw new Error('not in this test');
    }),
    bindTerminal: vi.fn(async () => {
      throw new Error('not in this test');
    }),
    projectSelection: vi.fn(async () => null),
    ...overrides,
  } as ArsenalClient;
}

function controllerWith(client: ArsenalClient) {
  const states: ArsenalState[] = [];
  const controller = new ArsenalController(
    (state) => states.push(state),
    client,
  );
  // The controller hands phrases to the view; the tests read them as the English the window
  // draws, so every expected sentence stays the English one.
  const english = (state: ArsenalState) =>
    state.notice
      ? {
          ...state,
          notice: { ...state.notice, text: tPhrase(state.notice.text) },
        }
      : state;
  return { controller, last: () => english(states[states.length - 1]) };
}

describe('Arsenal controller', () => {
  it('reads the library and reports an unavailable store as unavailable, not as empty', async () => {
    const ok = controllerWith(fakeClient());
    await ok.controller.refresh();
    expect(ok.last().phase).toBe('ready');
    expect(ok.last().library).toEqual([design]);

    const broken = controllerWith(
      fakeClient({
        capabilities: vi.fn(async () => {
          throw new ArsenalCallError({
            code: 'storage_unavailable',
            reason: null,
          });
        }),
      }),
    );
    await broken.controller.refresh();
    expect(broken.last().phase).toBe('unavailable');
    expect(broken.last().library).toEqual([]);
    expect(broken.last().notice?.tone).toBe('error');
    expect(broken.last().notice?.text).toContain('could not be opened');
  });

  describe('bulk import', () => {
    const entry = (
      id: string,
      name: string,
      patch: Partial<Candidate> = {},
    ): Candidate => ({ ...candidate, id, name, ...patch });

    const batch: DiscoverReply = {
      ...discovered,
      candidates: [
        entry('id-new', 'alpha'),
        entry('id-changed', 'beta', { status: 'source_changed' }),
        entry('id-done', 'gamma', { status: 'imported', capability: 'cap-g' }),
        entry('id-hook', 'pre-commit', {
          kind: 'hook',
          status: 'read_only',
          importable: false,
          blocked: 'read_only_kind',
        }),
        entry('id-secret', 'delta', {
          importable: false,
          blocked: 'needs_secret',
        }),
        entry('id-fails', 'epsilon'),
      ],
    };

    it('imports only eligible entries, counts each outcome and rescans once at the end', async () => {
      const outcomes = ['created', 'new_revision', 'created'] as const;
      let call = 0;
      const client = fakeClient({
        discover: vi.fn(async () => batch),
        importSkill: vi.fn(async () => ({
          capability: 'cap',
          revision: 1,
          outcome: outcomes[call++ % outcomes.length],
        })),
      });
      const { controller, last } = controllerWith(client);
      await controller.discover();
      await controller.importEligible();
      expect(client.importSkill).toHaveBeenCalledTimes(3);
      expect(client.importSkill).toHaveBeenCalledWith({
        id: 'id-new',
        kind: 'skill',
        source: 'claude_user_skills',
        name: 'alpha',
      });
      expect(client.importSkill).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: 'id-hook' }),
      );
      expect(client.importSkill).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: 'id-done' }),
      );
      expect(last().bulk).toMatchObject({
        total: 3,
        done: 3,
        created: 2,
        newRevision: 1,
        unchanged: 0,
        failures: [],
        stopped: null,
        finished: true,
      });
      expect(last().notice).toEqual({
        tone: 'ok',
        text: 'Bulk import: 2 imported, 1 updated to a new revision, 0 already in the library, unchanged.',
      });
      expect(last().busy).toBeNull();
      // One scan at the start, one after the run: the run itself never rescans.
      expect(client.discover).toHaveBeenCalledTimes(2);
    });

    it('records a failed entry and keeps importing the rest', async () => {
      const client = fakeClient({
        discover: vi.fn(async () => batch),
        importSkill: vi.fn(async (target: { id: string }) => {
          if (target.id === 'id-new') {
            throw new ArsenalCallError({
              code: 'blocked',
              reason: 'tree_too_large',
            });
          }
          return {
            capability: 'cap',
            revision: 1,
            outcome: 'created' as const,
          };
        }),
      });
      const { controller, last } = controllerWith(client);
      await controller.discover();
      await controller.importEligible();
      expect(client.importSkill).toHaveBeenCalledTimes(3);
      expect(last().bulk?.failures).toEqual([
        {
          id: 'id-new',
          name: 'alpha',
          text: expect.stringContaining('larger than the import limit'),
        },
      ]);
      expect(last().bulk?.created).toBe(2);
      expect(last().notice?.tone).toBe('error');
      expect(last().notice?.text).toBe(
        'Bulk import: 2 imported, 0 updated to a new revision, 0 already in the library, unchanged, 1 failed.',
      );
    });

    it('keeps going past a busy library, because the next entry can still succeed', async () => {
      const client = fakeClient({
        discover: vi.fn(async () => batch),
        importSkill: vi.fn(async () => {
          throw new ArsenalCallError({ code: 'storage_busy', reason: null });
        }),
      });
      const { controller, last } = controllerWith(client);
      await controller.discover();
      await controller.importEligible();
      expect(client.importSkill).toHaveBeenCalledTimes(3);
      expect(last().bulk?.failures).toHaveLength(3);
      expect(last().bulk?.stopped).toBeNull();
      expect(last().busy).toBeNull();
    });

    it('stops at once and says so when the library cannot be opened', async () => {
      const client = fakeClient({
        discover: vi.fn(async () => batch),
        importSkill: vi.fn(async () => {
          throw new ArsenalCallError({
            code: 'storage_unavailable',
            reason: null,
          });
        }),
      });
      const { controller, last } = controllerWith(client);
      await controller.discover();
      await controller.importEligible();
      expect(client.importSkill).toHaveBeenCalledTimes(1);
      expect(last().bulk?.stopped).toContain('could not be opened');
      expect(last().notice?.text).toContain(
        'Stopped: The Arsenal library could not be opened',
      );
    });

    it('says nothing is left to import without calling the desktop', async () => {
      const client = fakeClient({
        discover: vi.fn(async () => ({
          ...discovered,
          candidates: [entry('id-done', 'gamma', { status: 'imported' })],
        })),
      });
      const { controller, last } = controllerWith(client);
      await controller.discover();
      await controller.importEligible();
      expect(client.importSkill).not.toHaveBeenCalled();
      expect(last().notice).toEqual({
        tone: 'ok',
        text: 'Nothing to import: every eligible skill is already in the library.',
      });
    });
  });

  it('keeps a failed read of the presets for the list to show with Try again, and clears it on the next good read', async () => {
    const client = fakeClient();
    client.selections = vi.fn(async () => {
      throw new ArsenalCallError({ code: 'storage_unavailable', reason: null });
    });
    const { controller, last } = controllerWith(client);
    await controller.loadSelections();
    expect(last().selectionsFailure).toBe(
      'The Arsenal library could not be opened. Check that the Wyss data folder is writable, then Refresh.',
    );
    expect(last().notice).toBeNull();
    client.selections = vi.fn(async () => [selection]);
    await controller.loadSelections();
    expect(last().selectionsFailure).toBeNull();
    expect(last().selections).toEqual([selection]);
  });
});

describe('Arsenal contracts', () => {
  it('rejects a reply that is not the shape the desktop promises', () => {
    expect(() => parseSummaries([{ id: 'x' }])).toThrow(ArsenalShapeError);
    expect(() =>
      parseDiscover({
        project: null,
        sources: [{ source: 's', state: 'maybe' }],
        candidates: [],
        composites: [],
        truncated: false,
      }),
    ).toThrow(ArsenalShapeError);
    expect(() => parseDiscover('not an object')).toThrow(ArsenalShapeError);
  });

  it('keeps read-only entries, composites and the project name the window shows', () => {
    const reply = parseDiscover({
      project: 'app',
      sources: [],
      candidates: [
        {
          ...candidate,
          id: 'id-hook',
          kind: 'hook',
          name: 'pre-commit',
          status: 'read_only',
          importable: false,
          compatibility: 'unsupported',
          blocked: 'read_only_kind',
        },
        {
          ...candidate,
          id: 'id-gsd',
          name: 'gsd-help',
          importable: false,
          blocked: 'symbolic_link',
          managed_by: {
            composite: 'GSD Core',
            version: '1.15.0',
            artifacts: 1950,
          },
        },
      ],
      composites: [
        {
          key: 'gsd_core@1.15.0',
          kind: 'gsd_core',
          provider: 'claude_code',
          name: 'GSD Core 1.15.0',
          version: '1.15.0',
          description: '',
          artifacts: 1950,
          members: 1,
          origin: '~/.local/share/wyss/gsd-core/1.15.0',
          enabled: null,
          methodology: true,
          skills: ['gsd-help'],
          agents: [],
          commands: 0,
          hooks: false,
          mcp: false,
          categories: [['skill', 216]],
          limitations: ['Installed by GSD Core as links.'],
        },
      ],
      truncated: false,
    });
    expect(reply.project).toBe('app');
    expect(reply.composites[0].categories).toEqual([['skill', 216]]);
    expect(reply.candidates[0].status).toBe('read_only');
    expect(reply.candidates[1].managed_by?.composite).toBe('GSD Core');
    expect(reply.composites[0].members).toBe(1);
  });

  it('reads the Codex environment of a terminal plan and fails the whole plan on a malformed one', () => {
    const base = {
      selection: 'sel-1',
      selection_name: 'Codex',
      provider: 'codex',
      provider_version: 'codex-cli 0.169.0',
      project: 'app',
      status: 'ready',
      can_apply: true,
      enforcement: { state: 'unqualified', reason: 'x', evidence: null },
      items: [],
      kept: [],
      excluded: [],
      inherited_off: [],
      excluded_files: [],
      untouched: [],
      composites: [],
      conflicts: [],
      warnings: [],
      overlay: null,
      config_hash: 'e'.repeat(64),
    };
    // Absent or null: the owner's own configuration.
    expect(parseTerminalPlan(base).codex_environment).toBeNull();
    expect(
      parseTerminalPlan({ ...base, codex_environment: null }).codex_environment,
    ).toBeNull();
    expect(
      parseTerminalPlan({
        ...base,
        codex_environment: { instructions: false, hooks_off: ['k'] },
      }).codex_environment,
    ).toEqual({ instructions: false, hooks_off: ['k'] });
    for (const bad of [
      'yes',
      [],
      { instructions: 'no', hooks_off: [] },
      { instructions: true },
      { instructions: true, hooks_off: [1] },
      { instructions: true, hooks_off: 'k' },
    ]) {
      expect(
        () => parseTerminalPlan({ ...base, codex_environment: bad }),
        JSON.stringify(bad),
      ).toThrow(ArsenalShapeError);
    }
  });

  it('reads a terminal plan and a binding, and refuses a plan that claims more than it can', () => {
    const plan = {
      selection: 'sel-1',
      selection_name: 'Frontend',
      provider: 'claude_code',
      provider_version: '2.1.314 (Claude Code)',
      project: 'app',
      status: 'ready',
      can_apply: false,
      enforcement: {
        state: 'unqualified',
        reason: 'Skill exclusion is not qualified.',
        evidence: null,
      },
      items: [
        {
          capability: 'cap-design',
          name: 'design',
          kind: 'skill',
          provider: 'claude_code',
          revision: 2,
          pinned: true,
          tree_hash: 'c'.repeat(64),
          state: 'prepared',
          reason: 'The installed copy is exactly revision 2.',
          compatibility: { status: 'supported', reason: 'own format' },
          dependencies: [{ kind: 'tool', name: 'Read', state: 'declared' }],
        },
      ],
      kept: ['design'],
      excluded: ['tokens'],
      inherited_off: [],
      excluded_files: [],
      untouched: ['Hooks, permissions and MCP servers: as your settings say.'],
      composites: [],
      conflicts: [],
      warnings: [],
      overlay: '{"skillOverrides":{"tokens":"off"}}',
      config_hash: 'e'.repeat(64),
    };
    const parsed = parseTerminalPlan(plan);
    expect(parsed.enforcement.state).toBe('unqualified');
    expect(parsed.items[0].dependencies[0].state).toBe('declared');
    expect(() =>
      parseTerminalPlan({ ...plan, enforcement: { state: 'verified' } }),
    ).toThrow(ArsenalShapeError);
    const binding = parseBinding({
      session_id: 'a'.repeat(32),
      selection_id: 'sel-1',
      selection_name: 'Frontend',
      provider: 'claude_code',
      provider_version: null,
      project: '/home/u/app',
      config_hash: 'e'.repeat(64),
      state: 'not_applied',
      reason: 'Skill exclusion is not qualified.',
      plan,
      created_at: 1,
      verification: 'not_observed',
    });
    expect(binding.plan?.excluded).toEqual(['tokens']);
    // A binding never says a configuration was verified.
    expect(() =>
      parseBinding({
        ...binding,
        plan,
        state: 'applied',
        verification: 'verified',
      }),
    ).toThrow(ArsenalShapeError);
  });

  it('keeps the failure code and the blocking reason of a refused call', () => {
    expect(
      parseImportFailure({ code: 'blocked', reason: 'needs_secret' }),
    ).toEqual({
      code: 'blocked',
      reason: 'needs_secret',
    });
    expect(parseImportFailure({ code: 'not_found' })).toEqual({
      code: 'not_found',
      reason: null,
    });
  });
});
