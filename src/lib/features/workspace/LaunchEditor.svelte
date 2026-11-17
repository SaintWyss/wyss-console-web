<script lang="ts">
  import { untrack } from 'svelte';
  import { msg, t, tIncoming } from '../../i18n/index.svelte';
  import type { Item, Selection, PlanItem } from '../../contracts/arsenal';
  import { permissionsFor } from '../../contracts/native';
  import {
    arsenalClient,
    type ArsenalClient,
    type Roles,
  } from '../../desktop/arsenal-client';
  import {
    deleteLaunch,
    listLaunches,
    saveLaunch,
    LaunchError,
    type Launch,
    type SystemInfo,
  } from '../../desktop/launch-client';
  import DistroVariants from './DistroVariants.svelte';
  import './workspace.css';
  import { provideWorkspace } from './context';
  import { tabCounts } from './model';
  import General from './tabs/General.svelte';
  import Skills from './tabs/Skills.svelte';
  import Mcp from './tabs/Mcp.svelte';
  import Hooks from './tabs/Hooks.svelte';
  import Summary from './tabs/Summary.svelte';
  import {
    DEFAULT_CODEX_SPEC,
    DEFAULT_SPEC,
    isDefault,
  } from '../arsenal/environment';
  import { ENVIRONMENT_UNREADABLE } from '../terminal/launch';
  import { kTokens } from './estimate';
  import { previewItems } from './preview';
  import { errorMessage, sentence } from './messages';
  import { BASIC_ROLES as BASIC } from './plan';
  import {
    loadOrder,
    renameInOrder,
    saveOrder,
  } from '../terminal/launch-order';
  import {
    allItemsOf,
    estimateLaunch,
    estimateOf,
    loadEstimateData,
    NO_DATA,
    selectionOf,
    type EstimateData,
  } from './data';
  import {
    editable,
    launchId,
    savePlan,
    type Agent,
    type LaunchDraft,
  } from './plan';

  let {
    visible,
    recent,
    choose,
    onopen,
    select = null,
    createPreset = null,
    onpresetused = () => undefined,
    client = arsenalClient,
    launches: loadLaunches = listLaunches,
  }: {
    visible: boolean;
    /** Folders the Console knows, newest first (the project registry). */
    recent: readonly { path: string; last_used: number }[];
    /** The native folder dialog; `null` when dismissed. */
    choose: () => Promise<string | null>;
    /** Opens a saved launch in the Console. */
    onopen: (id: string) => void;
    /** A launch to show when it appears: one just made elsewhere (a distributor's). */
    select?: string | null;
    /** A new launch prefilled from an existing Arsenal preset. */
    createPreset?: { request: number; selection: Selection } | null;
    onpresetused?: (request: number) => void;
    client?: ArsenalClient;
    launches?: typeof listLaunches;
  } = $props();

  const STALE_HOOKS = msg(
    'A hook this preset left out is no longer in hooks.json: it was edited or removed. A launch with this preset does not start until you check the hooks and save.',
  );
  let phase = $state<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  let launches = $state<Launch[]>([]);
  let refused = $state<{ id: string; error: string }[]>([]);
  let system = $state<SystemInfo>({ id: '', like: [], name: '' });
  let roles = $state<Roles>({ custom: [], assigned: {}, damaged: false });
  let data = $state<EstimateData>(NO_DATA);
  let q = $state('');
  let selected = $state<string | null>(null);
  let draft = $state<LaunchDraft | null>(null);
  let baseline = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let confirming = $state(false);
  /** The draft dropped a hook its preset left out that hooks.json no longer has. */
  let staleHooks = $state(false);
  let usedPresetRequest: number | null = null;
  let itemPlan = $state<PlanItem[]>([]);
  /** Chosen skills dropped because they cannot load here. */
  let dropped = $state(0);
  let selectionPlanError = $state('');
  let itemPlanError = $state('');
  let selectionPlan = $state<
    import('../../contracts/arsenal').TerminalPlan | null
  >(null);
  let itemPlanState = $state<'loading' | 'ready' | 'failed'>('loading');
  const unavailable = (item: PlanItem) =>
    item.state === 'missing' || item.state === 'rejected';

  // Evaluate every library item, including unticked skills, with the launch's pinned revisions.
  // No preset is created by opening the editor. Ignore an answer for an older folder or agent.
  $effect(() => {
    if (!draft) return;
    const agent = draft.agent;
    const directory = draft.directory;
    const selection = draft.selection;
    const items = allItemsOf(data.library, agent);
    for (const item of selection?.items ?? []) {
      const index = items.findIndex((i) => i.capability === item.capability);
      if (index < 0) items.push({ ...item });
      else items[index] = { ...item };
    }
    let active = true;
    itemPlanState = 'loading';
    itemPlan = [];
    dropped = 0;
    itemPlanError = '';
    void previewItems(client, agent, directory, items)
      .then((items) => {
        if (!active || !draft) return;
        itemPlan = items;
        const blocked = new Set(
          items.filter(unavailable).map((i) => i.capability),
        );
        // What cannot load leaves the draft. Only a saved preset holds it: then Save says so and
        // removes it. A launch without a preset never saved it, so dropping it is no change.
        const untouched = JSON.stringify(draft) === baseline;
        dropped = draft.selection
          ? draft.items.filter((i) => blocked.has(i.capability)).length
          : 0;
        draft.items = draft.items.filter((i) => !blocked.has(i.capability));
        if (untouched && !draft.selection) baseline = JSON.stringify(draft);
        itemPlanState = 'ready';
      })
      .catch((e: unknown) => {
        if (active) {
          itemPlanState = 'failed';
          itemPlanError = errorMessage(e);
        }
      });
    return () => {
      active = false;
    };
  });

  // Availability batches are not a launch plan: their exclusions/conflicts differ from the draft.
  // Read the actual draft separately for the advisory enforcement verdict, never merge batch verdicts.
  $effect(() => {
    selectionPlan = null;
    selectionPlanError = '';
    if (!draft || itemPlanState !== 'ready') return;
    const agent = draft.agent;
    const directory = draft.directory;
    const items = $state.snapshot(draft.items) as Item[];
    if (items.length > 512) return;
    let active = true;
    const selection = draft.selection;
    // Saved presets also carry composites, which an item-only preview cannot represent.
    const unchanged =
      selection && JSON.stringify(items) === JSON.stringify(selection.items);
    void client
      .terminalPlan(
        unchanged ? selection.id : '',
        agent,
        directory,
        unchanged ? undefined : items,
      )
      .then(
        (plan) => {
          if (active) selectionPlan = plan;
        },
        (e: unknown) => {
          if (active) selectionPlanError = errorMessage(e);
        },
      );
    return () => {
      active = false;
    };
  });

  const allRoles = $derived([
    ...BASIC.map((r) => ({ id: r.id, name: t(r.name), basic: true })),
    ...roles.custom.map((r) => ({ ...r, basic: false })),
  ]);
  const roleOf = (id: string) => roles.assigned[id] ?? 'worker';
  const knownRole = (id: string) =>
    allRoles.some((r) => r.id === id) ? id : 'worker';

  async function load() {
    phase = 'loading';
    error = null;
    try {
      const [list, r, read] = await Promise.all([
        loadLaunches(),
        // Roles that cannot be read leave the basic ones; the editor still opens.
        client
          .roles()
          .catch((): Roles => ({ custom: [], assigned: {}, damaged: true })),
        loadEstimateData(client),
      ]);
      // An answer without a list is a failure, never an empty Workspace.
      if (!Array.isArray(list?.launches))
        throw new Error(t('Workspace could not be read.'));
      launches = list.launches;
      refused = list.refused ?? [];
      system = list.system ?? system;
      roles = r;
      data = read;
      phase = 'ready';
      if (!selected && launches[0]) pick(launches[0]);
    } catch (e) {
      phase = 'failed';
      error = errorMessage(e);
    }
  }
  // Read on the first visit, and again on each later one: a launch made elsewhere appears.
  $effect(() => {
    if (visible) untrack(() => phase !== 'loading' && void load());
  });
  $effect(() => {
    const id = select;
    const found = launches.find((l) => l.id === id);
    if (found) untrack(() => selected !== found.id && pick(found));
  });
  $effect(() => {
    const request = createPreset;
    if (
      !visible ||
      phase !== 'ready' ||
      !request ||
      usedPresetRequest === request.request
    )
      return;
    usedPresetRequest = request.request;
    const selection = data.selections.find(
      (candidate) => candidate.id === request.selection.id,
    );
    if (selection) pickPreset(selection);
    else
      error = t('That preset is no longer available. Refresh and try again.');
    onpresetused(request.request);
  });

  function draftOf(launch: Launch | null): LaunchDraft {
    if (!launch || launch.kind !== 'session') {
      const agent: Agent = 'claude_code';
      return {
        id: launch?.id ?? null,
        name: launch?.name ?? t('New launch'),
        role: launch ? knownRole(roleOf(launch.id)) : 'worker',
        agent,
        permission: null,
        directory: launch?.directory ?? recent[0]?.path ?? '',
        selection: null,
        items: allItemsOf(data.library, agent),
        composites: [],
        spec: { ...DEFAULT_SPEC },
        codexSpec: null,
        instructions: { project: 'load' },
      };
    }
    const selection = selectionOf(launch, data.selections);
    return {
      id: launch.id,
      name: launch.name,
      role: knownRole(roleOf(launch.id)),
      agent: launch.agent,
      permission: launch.permission,
      directory: launch.directory,
      selection,
      items: selection
        ? selection.items.map((i) => ({ ...i }))
        : allItemsOf(data.library, launch.agent),
      composites: selection ? [...selection.composites] : [],
      // Claude, the same: a file that cannot be read draws nothing and saves nothing.
      spec:
        launch.agent === 'claude_code' &&
        !unreadableFor(selection, 'claude_code')
          ? {
              ...((selection && data.environments.get(selection.id)) ??
                DEFAULT_SPEC),
            }
          : null,
      // A preset whose environment could not be read gets none here: nothing is drawn as
      // "everything on", and Save does not write over what is not known.
      codexSpec:
        launch.agent === 'codex' && !unreadableFor(selection, 'codex')
          ? {
              ...((selection && data.codexEnvironments.get(selection.id)) ??
                DEFAULT_CODEX_SPEC),
            }
          : null,
      instructions:
        selection && data.instructionsFailed?.has(selection.id)
          ? null
          : ((selection && data.launchInstructions?.get(selection.id)) ?? {
              project: 'load',
            }),
    };
  }
  /** Whether the environment of this preset is in a file that cannot be read. */
  function unreadableFor(
    selection: Selection | null,
    agent: 'claude_code' | 'codex',
  ): boolean {
    if (selection === null) return false;
    return agent === 'codex'
      ? data.codexUnreadable === true &&
          !data.codexEnvironments.has(selection.id)
      : data.claudeFailed?.has(selection.id) === true;
  }
  function pick(launch: Launch | null) {
    selected = launch?.id ?? 'new';
    const fresh = draftOf(launch);
    // The baseline is what is saved. A hook the preset left out that `hooks.json` no longer has
    // (edited or removed) is dropped from the draft only, so the draft differs and can be saved.
    baseline = JSON.stringify(fresh);
    staleHooks = false;
    const listed = data.codexOptions?.hooks.map((h) => h.key);
    if (fresh.codexSpec && listed) {
      const kept = fresh.codexSpec.hooks_off.filter((k) => listed.includes(k));
      if (kept.length !== fresh.codexSpec.hooks_off.length) {
        fresh.codexSpec = { ...fresh.codexSpec, hooks_off: kept };
        staleHooks = true;
      }
    }
    draft = fresh;
    error = null;
    notice = null;
    confirming = false;
  }
  function freeLaunchName(name: string): string {
    const base = name.trim() || t('New launch');
    const usedIds = new Set(launches.map((launch) => launch.id));
    for (let suffix = 1; suffix < 10_000; suffix++) {
      const addition = suffix === 1 ? '' : ` ${suffix}`;
      const stem = base.slice(0, Math.max(1, 36 - addition.length)).trimEnd();
      const candidate = `${stem}${addition}`;
      const id = launchId(candidate);
      if (id && !usedIds.has(id)) return candidate;
    }
    return t('New launch');
  }
  function pickPreset(selection: Selection) {
    const fresh = draftOf(null);
    fresh.name = freeLaunchName(selection.name);
    fresh.agent = selection.provider;
    fresh.selection = selection;
    fresh.items = selection.items.map((item) => ({ ...item }));
    fresh.composites = [...selection.composites];
    fresh.spec =
      selection.provider === 'claude_code' &&
      !unreadableFor(selection, 'claude_code')
        ? { ...(data.environments.get(selection.id) ?? DEFAULT_SPEC) }
        : null;
    fresh.codexSpec =
      selection.provider === 'codex' && !unreadableFor(selection, 'codex')
        ? {
            ...(data.codexEnvironments.get(selection.id) ?? DEFAULT_CODEX_SPEC),
          }
        : null;
    fresh.instructions = data.instructionsFailed?.has(selection.id)
      ? null
      : (data.launchInstructions?.get(selection.id) ?? { project: 'load' });

    staleHooks = false;
    const listed = data.codexOptions?.hooks.map((hook) => hook.key);
    if (fresh.codexSpec && listed) {
      const kept = fresh.codexSpec.hooks_off.filter((key) =>
        listed.includes(key),
      );
      if (kept.length !== fresh.codexSpec.hooks_off.length) {
        fresh.codexSpec = { ...fresh.codexSpec, hooks_off: kept };
        staleHooks = true;
      }
    }
    selected = 'new';
    baseline = JSON.stringify(fresh);
    draft = fresh;
    error = null;
    notice = null;
    confirming = false;
  }
  const dirty = $derived(draft !== null && JSON.stringify(draft) !== baseline);
  const current = $derived(launches.find((l) => l.id === selected) ?? null);
  /** A launch that runs commands or `before` lines: opened from here, edited in its file. */
  const readOnly = $derived(current !== null && !editable(current));
  /** Saving writes the file its name gives; another file name is removed after it. */
  const renames = $derived(
    current !== null &&
      !readOnly &&
      draft !== null &&
      launchId(draft.name) !== '' &&
      launchId(draft.name) !== current.id,
  );
  const canSave = $derived(
    draft !== null &&
      itemPlanState === 'ready' &&
      (current === null || editable(current)) &&
      draft.name.trim() !== '' &&
      launchId(draft.name) !== '' &&
      draft.directory.startsWith('/') &&
      (draft.instructions?.project !== 'role' ||
        (draft.instructions.role.length > 0 &&
          !draft.instructions.role.includes('\0') &&
          new TextEncoder().encode(draft.instructions.role).length <=
            64 * 1024)),
  );

  const TABS = ['general', 'skills', 'mcp', 'hooks', 'summary'] as const;
  type Tab = (typeof TABS)[number];
  const TAB_LABEL: Record<Tab, string> = {
    general: msg('General'),
    skills: msg('Skills'),
    mcp: msg('MCP'),
    hooks: msg('Hooks'),
    summary: msg('Summary'),
  };
  // The list: system commands first, agents after, filtered by the search.
  const shown = $derived(
    launches.filter((l) =>
      l.name.toLowerCase().includes(q.trim().toLowerCase()),
    ),
  );
  const listGroups = $derived(
    [
      {
        id: 'system',
        label: msg('System'),
        items: shown.filter((l) => l.kind === 'commands'),
      },
      {
        id: 'agents',
        label: msg('Agents'),
        items: shown.filter((l) => l.kind !== 'commands'),
      },
    ].filter((g) => g.items.length > 0),
  );
  let tab = $state<Tab>('general');
  const tabs = $derived(
    TABS.filter((id) => id !== 'mcp' || draft?.agent === 'claude_code'),
  );
  const counts = $derived(draft ? tabCounts(draft, data, itemPlan) : {});
  $effect(() => {
    if (!tabs.includes(tab)) tab = 'general';
  });

  const est = $derived(
    // No estimate from defaults when the Claude environment could not be read.
    draft &&
      !readOnly &&
      !(draft.agent === 'claude_code' && draft.spec === null)
      ? estimateOf(draft.agent, draft.items, draft.spec, data)
      : null,
  );
  const ceiling = $derived(
    draft
      ? estimateOf(
          draft.agent,
          allItemsOf(data.library, draft.agent),
          DEFAULT_SPEC,
          data,
        )
      : null,
  );
  // Only folders the Console knows as projects: the desktop reads no other.
  const known = $derived(new Set(recent.map((r) => r.path)));
  const saved = $derived([
    ...new Set(launches.map((l) => l.directory).filter((d) => known.has(d))),
  ]);
  const used = $derived(
    [...recent].sort((a, b) => b.last_used - a.last_used).slice(0, 8),
  );

  function setAgent(agent: Agent) {
    if (!draft || draft.agent === agent) return;
    // Preset and environment belong to an agent: they start over. A permission stays when the
    // other agent has it too (accepting edits is Claude Code's own).
    draft.agent = agent;
    if (draft.permission && !permissionsFor(agent).includes(draft.permission))
      draft.permission = null;
    draft.selection = null;
    draft.items = allItemsOf(data.library, agent);
    draft.composites = [];
    draft.spec = agent === 'claude_code' ? { ...DEFAULT_SPEC } : null;
    draft.codexSpec = agent === 'codex' ? { ...DEFAULT_CODEX_SPEC } : null;
    draft.instructions = { project: 'load' };
  }
  function setItem(id: string, on: boolean) {
    if (
      !draft ||
      (on &&
        (itemPlanState !== 'ready' ||
          itemPlan.some((i) => i.capability === id && unavailable(i))))
    )
      return;
    const has = draft.items.some((i) => i.capability === id);
    if (on && !has)
      draft.items = [
        ...draft.items,
        {
          capability: id,
          revision:
            draft.selection?.items.find((i) => i.capability === id)?.revision ??
            null,
        },
      ];
    if (!on && has)
      draft.items = draft.items.filter((i) => i.capability !== id);
  }

  /** One Save: preset → environment → launch → role. Says what was saved if a step fails. */
  async function save(): Promise<string | null> {
    if (!draft || !canSave || busy) return null;
    // A frozen copy: the fields are disabled while saving, and nothing typed meanwhile mixes in.
    const d: LaunchDraft = $state.snapshot(draft) as LaunchDraft;
    const blocked = new Set(
      itemPlan.filter(unavailable).map((i) => i.capability),
    );
    d.items = d.items.filter((i) => !blocked.has(i.capability));
    busy = true;
    error = null;
    notice = null;
    const done: string[] = [];
    const folderSelection = await client
      .projectSelection(d.directory, d.agent)
      .catch(() => null);
    const plan = savePlan(d, {
      launches,
      selections: data.selections.filter((s) => s.provider === d.agent),
      folderSelection,
      savedSpec: d.selection
        ? (data.environments.get(d.selection.id) ?? null)
        : null,
      savedCodexSpec: d.selection
        ? (data.codexEnvironments.get(d.selection.id) ?? null)
        : null,
      savedInstructions: d.selection
        ? data.launchInstructions?.get(d.selection.id)
        : null,
      allItems: allItemsOf(data.library, d.agent),
    });
    try {
      let target: Selection | null = d.selection;
      const p = plan.preset;
      if (p.do === 'write' || p.do === 'copy' || p.do === 'create') {
        target = await client.saveSelection({
          id: p.do === 'write' ? p.id : null,
          name: p.name,
          provider: d.agent,
          items: d.items as Item[],
          composites: d.composites,
        });
        done.push(
          p.do === 'copy'
            ? t('preset “{name}” (a copy: the other launches keep theirs)', {
                name: p.name,
              })
            : t('preset “{name}”', { name: p.name }),
        );
      } else if (p.do === 'none') target = null;
      if (plan.environment && target && d.agent === 'codex' && d.codexSpec) {
        await client.writeCodexEnvironment(target.id, d.codexSpec);
        done.push(t('environment'));
      } else if (plan.environment && target && d.spec) {
        await client.writeEnvironment(target.id, d.spec);
        done.push(t('environment'));
      }
      if (
        target &&
        d.instructions &&
        (JSON.stringify(d.instructions) !==
          JSON.stringify(
            data.launchInstructions?.get(d.selection?.id ?? '') ?? {
              project: 'load',
            },
          ) ||
          ((p.do === 'copy' || p.do === 'create') &&
            d.instructions.project !== 'load'))
      ) {
        await client.writeLaunchInstructions(target.id, d.instructions);
      }
      const launch = await saveLaunch({
        name: d.name.trim(),
        directory: d.directory,
        agent: d.agent,
        permission: d.permission,
        preset: target?.name ?? null,
        replace: plan.launch.replace,
      });
      done.push(t('launch'));
      // The role follows the new name before the old file goes: a failure here leaves both
      // files, never a launch without its role.
      if (plan.role.renamedFrom)
        roles = await client.writeRole({
          do: 'rename',
          from: plan.role.renamedFrom,
          to: launch.id,
        });
      roles = await client.writeRole({
        do: 'assign',
        launch: launch.id,
        role: d.role,
      });
      done.push(t('role'));
      if (plan.removeOld) {
        try {
          await deleteLaunch(plan.removeOld);
          // It keeps its place in + Launch.
          saveOrder(renameInOrder(loadOrder(), plan.removeOld, launch.id));
        } catch {
          error = t(
            'Saved as “{name}”. The file under the old name could not be deleted: it is still listed.',
            { name: launch.name },
          );
        }
      }
      const failed = error;
      await load();
      const fresh = launches.find((l) => l.id === launch.id) ?? null;
      pick(fresh);
      error = failed;
      notice = failed ? null : t('Saved.');
      return launch.id;
    } catch (e) {
      const exists = e instanceof LaunchError && e.code === 'exists';
      const what = exists
        ? t('A launch with that name exists.')
        : errorMessage(e);
      error =
        done.length > 0
          ? t('{what} Saved so far: {done}. Nothing else changed.', {
              what: sentence(what),
              done: done.join(', '),
            })
          : what;
      return null;
    } finally {
      busy = false;
    }
  }
  async function tryIt() {
    if (!draft) return;
    if (!dirty && draft.id) {
      onopen(draft.id);
      return;
    }
    const id = await save();
    if (id) onopen(id);
  }
  async function remove() {
    const removing = current;
    if (!removing || removing.kind !== 'session' || !editable(removing)) return;
    busy = true;
    let deleted = false;
    try {
      const selection = selectionOf(removing, data.selections);
      await deleteLaunch(removing.id);
      deleted = true;
      if (
        selection &&
        !launches.some(
          (l) =>
            l.id !== removing.id &&
            l.kind === 'session' &&
            l.agent === removing.agent &&
            l.preset === selection.name,
        )
      ) {
        await client.writeLaunchInstructions(selection.id, { project: 'load' });
      }
      roles = await client.writeRole({ do: 'forget', launch: removing.id });
      selected = null;
      draft = null;
      await load();
    } catch (e) {
      if (deleted) {
        selected = null;
        draft = null;
        await load();
      }
      error =
        t(
          deleted
            ? 'The launch was deleted, but its instructions or role could not be cleared.'
            : 'The launch could not be deleted.',
        ) + ` ${errorMessage(e)}`;
    } finally {
      busy = false;
      confirming = false;
    }
  }
  async function browse() {
    const path = await choose().catch(() => null);
    if (path && draft) draft.directory = path;
  }

  function tabKey(e: KeyboardEvent) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    tab = tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length];
    document.getElementById(`ws-tab-${tab}`)?.focus();
  }

  provideWorkspace({
    get draft() {
      return draft!;
    },
    get data() {
      return data;
    },
    get busy() {
      return busy || readOnly;
    },
    get itemPlan() {
      return itemPlan;
    },
    get itemPlanState() {
      return itemPlanState;
    },
    get estimate() {
      return est;
    },
    get saved() {
      return saved;
    },
    get used() {
      return used;
    },
    setAgent,
    setItem,
    browse,
    instructionText: (name: string) => client.instructionText(name),
    reload: load,
  });
</script>

<section
  class="ws"
  aria-label={t('Launches')}
  hidden={!visible}
  inert={!visible}
>
  <nav class="ws-list" aria-label={t('Launches')}>
    <input
      type="search"
      placeholder={t('Search')}
      aria-label={t('Search launches')}
      bind:value={q}
    />
    {#if phase === 'loading' && launches.length === 0}
      <p class="ws-hint">{t('Reading launches')}</p>
    {/if}
    {#each listGroups as group (group.id)}
      <h2 class="ws-group">{t(group.label)}</h2>
      {#each group.items as launch (launch.id)}
        {@const e = estimateLaunch(launch, data)}
        <button
          type="button"
          class="ws-item"
          aria-current={selected === launch.id ? 'true' : undefined}
          onclick={() => pick(launch)}
        >
          <span>{launch.name}</span>
          {#if e}<small>~{kTokens(e.total)}</small>{/if}
        </button>
      {/each}
    {/each}
    {#if phase === 'ready' && launches.length === 0}
      <p class="ws-hint">{t('No saved launches yet.')}</p>
    {/if}
    {#if refused.length > 0}
      <p class="ws-hint">{t('Files that could not be read')}</p>
    {/if}
    {#each refused as file (file.id)}
      <p class="notice" data-tone="warn">{file.id}: {tIncoming(file.error)}</p>
    {/each}
    <button type="button" class="action ws-new" onclick={() => pick(null)}
      >+ {t('New')}</button
    >
  </nav>

  {#if draft}
    <div class="ws-editor">
      <header class="ws-head">
        {#if current?.kind === 'commands'}
          <h1 class="ws-title">{draft.name}</h1>
        {:else}
          <input
            class="ws-title"
            aria-label={t('Launch name')}
            maxlength="60"
            disabled={busy}
            readonly={readOnly}
            bind:value={draft.name}
          />
          <span class="ws-estimate">
            {#if est && ceiling}
              {t('Initial context estimated')}
              <span class="ws-mono">{kTokens(est.total)}</span>
              <span class="ws-meter" aria-hidden="true"
                ><span
                  style:width={`${Math.min(100, Math.round((est.total / ceiling.total) * 100))}%`}
                ></span></span
              >
            {:else if draft.agent === 'codex'}
              {t('Initial context: no estimate for Codex')}
            {/if}
          </span>
        {/if}
      </header>

      {#if current?.kind === 'commands'}
        <DistroVariants
          launch={current}
          {system}
          {onopen}
          onsaved={(fresh) =>
            (launches = launches.map((l) => (l.id === fresh.id ? fresh : l)))}
        />
      {:else}
        <div class="ws-tabs" role="tablist" aria-label={t('Launch settings')}>
          {#each tabs as id (id)}
            {@const c = counts[id as keyof typeof counts]}
            <button
              type="button"
              role="tab"
              id={`ws-tab-${id}`}
              class="ws-tab"
              aria-selected={tab === id}
              aria-controls="ws-panel"
              tabindex={tab === id ? 0 : -1}
              onkeydown={tabKey}
              onclick={() => (tab = id)}
              >{t(TAB_LABEL[id])}{#if c}<span>{c.on}/{c.all}</span>{/if}</button
            >
          {/each}
        </div>
        <div class="ws-body">
          <div id="ws-panel" role="tabpanel" aria-labelledby={`ws-tab-${tab}`}>
            <div class="ws-notices">
              {#if readOnly}
                <p class="notice" data-tone="warn">
                  {t(
                    'This launch runs commands from its file. It opens from here; edit it in its file.',
                  )}
                </p>
              {/if}
              {#if !readOnly && (draft.agent === 'codex' || draft.agent === 'claude_code') && unreadableFor(draft.selection, draft.agent)}
                <p class="notice" data-tone="error" role="alert">
                  {t(
                    draft.agent === 'claude_code' && !data.claudeUnreadable
                      ? 'The launch environment could not be read.'
                      : ENVIRONMENT_UNREADABLE,
                  )}
                </p>
              {/if}
              {#if !readOnly && staleHooks}<p
                  class="notice"
                  data-tone="warn"
                  role="alert"
                >
                  {t(STALE_HOOKS)}
                </p>{/if}
              {#if !readOnly && draft.selection && data.instructionsFailed?.has(draft.selection.id)}
                <p class="notice" data-tone="error" role="alert">
                  {t(
                    'The launch instructions file cannot be read. It was not modified.',
                  )}
                </p>
              {/if}
              {#if renames && current}
                <p class="notice" data-tone="warn">
                  {t(
                    'This launch is saved as {file}.toml. Saving writes {next}.toml and removes {file}.toml.',
                    { file: current.id, next: launchId(draft.name) },
                  )}
                </p>
              {/if}
              {#if draft.agent === 'claude_code' && (draft.instructions?.project === 'role' || (draft.spec && !isDefault(draft.spec))) && data.options && !data.options.token_stored}
                <p class="notice" data-tone="warn" role="alert">
                  {t(
                    'No long-lived token is stored, so this terminal will not start. Run claude setup-token in your own terminal and store it with: secret-tool store --label "Claude Code token (Wyss Console)" service wyss-console kind claude-oauth-token',
                  )}
                </p>
              {/if}
              {#if itemPlanState === 'failed' || selectionPlanError}
                <p class="notice" data-tone="error" role="alert">
                  {t('The launch plan could not be read: {reason}', {
                    reason: itemPlanError || selectionPlanError,
                  })}
                </p>
              {/if}
              {#if selectionPlan && selectionPlan.can_apply === false}
                <p class="notice" data-tone="warn" role="status">
                  {t(
                    'This skills choice cannot be applied now: {reason} Check it before starting.',
                    {
                      reason:
                        selectionPlan.conflicts
                          ?.filter((c) => c.blocking)
                          .map((c) => c.names.join(', '))
                          .join('; ') ||
                        tIncoming(selectionPlan.enforcement.reason),
                    },
                  )}
                </p>
              {/if}
              {#if dropped > 0 && dirty}
                <p class="notice" data-tone="warn" role="status">
                  {t(
                    '{count} unavailable skills are removed from this launch on save.',
                    { count: dropped },
                  )}
                </p>
              {/if}
              {#if error}<p class="notice" data-tone="error" role="alert">
                  {error}
                </p>{/if}
              {#if notice}<p class="notice" data-tone="ok" role="status">
                  {notice}
                </p>{/if}
            </div>
            {#if tab === 'general'}<General />
            {:else if tab === 'skills'}<Skills />
            {:else if tab === 'mcp'}<Mcp />
            {:else if tab === 'hooks'}<Hooks />
            {:else}<Summary />{/if}
          </div>
        </div>
        <footer class="ws-foot">
          {#if current && editable(current)}
            {#if confirming}
              <span>{t('Delete {name}?', { name: current.name })}</span>
              <button
                type="button"
                class="action danger"
                onclick={() => void remove()}>{t('Delete')}</button
              >
              <button
                type="button"
                class="action"
                onclick={() => (confirming = false)}>{t('Cancel')}</button
              >
            {:else}
              <button
                type="button"
                class="action ws-delete"
                disabled={busy}
                onclick={() => (confirming = true)}>{t('Delete launch')}</button
              >
            {/if}
          {/if}
          <span class="ws-spacer"></span>
          <button
            type="button"
            class="action"
            disabled={busy || (!draft.id && !canSave) || (dirty && !canSave)}
            onclick={() => void tryIt()}>{t('Try')}</button
          >
          <button
            type="button"
            class="action primary"
            disabled={busy || !dirty || !canSave}
            onclick={() => void save()}>{busy ? t('Saving') : t('Save')}</button
          >
        </footer>
      {/if}
    </div>
  {:else if phase === 'failed'}
    <div class="ws-editor">
      <div class="ws-notices">
        <p class="notice" data-tone="error" role="alert">{error}</p>
        <button type="button" class="action" onclick={() => void load()}
          >{t('Try again')}</button
        >
      </div>
    </div>
  {/if}
</section>
