<script lang="ts">
  import { untrack } from 'svelte';
  import { t, tIncoming } from '../../i18n/index.svelte';
  import type { Item, PlanItem, Selection } from '../../contracts/arsenal';
  import type { InventoryReply } from '../../contracts/configuration';
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
  import { readConfigurationInventory } from '../../desktop/configuration-client';
  import DistroVariants from './DistroVariants.svelte';
  import {
    DEFAULT_CODEX_SPEC,
    DEFAULT_SPEC,
    toggle,
  } from '../arsenal/environment';
  import { ENVIRONMENT_UNREADABLE } from '../terminal/launch';
  import { kTokens } from './estimate';
  import { previewItems } from './preview';
  import { errorMessage, sentence } from './messages';
  import { BASIC_ROLES } from './plan';
  import {
    loadOrder,
    renameInOrder,
    saveOrder,
  } from '../terminal/launch-order';
  import {
    allItemsOf,
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
  import {
    tabCounts,
    groupLaunches,
    WORKSPACE_TABS,
    type WorkspaceTab,
  } from './model';
  import LaunchList from './LaunchList.svelte';
  import General from './tabs/General.svelte';
  import Instructions from './tabs/Instructions.svelte';
  import Skills from './tabs/Skills.svelte';
  import Mcp from './tabs/Mcp.svelte';
  import Hooks from './tabs/Hooks.svelte';
  import Summary from './tabs/Summary.svelte';

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

  let phase = $state<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  let launches = $state<Launch[]>([]);
  let refused = $state<{ id: string; error: string }[]>([]);
  let system = $state<SystemInfo>({ id: '', like: [], name: '' });
  let roles = $state<Roles>({ custom: [], assigned: {}, damaged: false });
  let data = $state<EstimateData>(NO_DATA);
  let inventory = $state<InventoryReply | null>(null);
  let q = $state('');
  let selected = $state<string | null>(null);
  let draft = $state<LaunchDraft | null>(null);
  let baseline = $state('');
  let tab = $state<WorkspaceTab>('general');
  let busy = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let confirming = $state(false);
  let rolesOpen = $state(false);
  let newRole = $state('');
  /** A preset dropped a Codex hook that no longer exists in hooks.json. */
  let staleHooks = $state(false);
  let usedPresetRequest: number | null = null;
  let itemPlan = $state<PlanItem[]>([]);
  let selectionPlanError = $state('');
  let itemPlanError = $state('');
  let selectionPlan = $state<
    import('../../contracts/arsenal').TerminalPlan | null
  >(null);
  let itemPlanState = $state<'loading' | 'ready' | 'failed'>('loading');

  const unavailable = (item: PlanItem) => item.state !== 'prepared';

  // Check all provider items, including unticked skills. Late answers for old drafts are ignored.
  $effect(() => {
    if (!draft) return;
    const agent = draft.agent;
    const directory = draft.directory;
    const selection = draft.selection;
    const items = allItemsOf(data.library, agent);
    for (const item of selection?.items ?? []) {
      const index = items.findIndex(
        (candidate) => candidate.capability === item.capability,
      );
      if (index < 0) items.push({ ...item });
      else items[index] = { ...item };
    }
    let active = true;
    itemPlanState = 'loading';
    itemPlan = [];
    itemPlanError = '';
    void previewItems(client, agent, directory, items)
      .then((available) => {
        if (!active || !draft) return;
        itemPlan = available;
        const blocked = new Set(
          available.filter(unavailable).map((item) => item.capability),
        );
        draft.items = draft.items.filter(
          (item) => !blocked.has(item.capability),
        );
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

  // The plan verdict reads the actual draft separately; availability batches are not a launch plan.
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
    ...BASIC_ROLES.map((role) => ({
      id: role.id,
      name: t(role.name),
      basic: true,
    })),
    ...roles.custom.map((role) => ({ ...role, basic: false })),
  ]);
  const roleOf = (id: string) => roles.assigned[id] ?? 'worker';
  const knownRole = (id: string) =>
    allRoles.some((role) => role.id === id) ? id : 'worker';

  async function load() {
    phase = 'loading';
    error = null;
    try {
      const [list, roleData, estimateData, configInventory] = await Promise.all(
        [
          loadLaunches(),
          client
            .roles()
            .catch((): Roles => ({ custom: [], assigned: {}, damaged: true })),
          loadEstimateData(client),
          readConfigurationInventory().catch(() => null),
        ],
      );
      if (!Array.isArray(list?.launches))
        throw new Error(t('Workspace could not be read.'));
      launches = list.launches;
      refused = list.refused ?? [];
      system = list.system ?? system;
      roles = roleData;
      data = estimateData;
      inventory = configInventory;
      phase = 'ready';
      if (!selected && launches[0]) pick(launches[0]);
    } catch (e) {
      phase = 'failed';
      error = errorMessage(e);
    }
  }

  // Load on first visit and again on later visits so launches created elsewhere appear.
  $effect(() => {
    if (visible) untrack(() => phase !== 'loading' && void load());
  });
  $effect(() => {
    const id = select;
    const found = launches.find((launch) => launch.id === id);
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

  function unreadableFor(selection: Selection | null, agent: Agent): boolean {
    if (selection === null) return false;
    return agent === 'codex'
      ? data.codexUnreadable === true &&
          !data.codexEnvironments.has(selection.id)
      : data.claudeFailed?.has(selection.id) === true;
  }

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
        ? selection.items.map((item) => ({ ...item }))
        : allItemsOf(data.library, launch.agent),
      composites: selection ? [...selection.composites] : [],
      spec:
        launch.agent === 'claude_code' &&
        !unreadableFor(selection, 'claude_code')
          ? {
              ...((selection && data.environments.get(selection.id)) ??
                DEFAULT_SPEC),
            }
          : null,
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

  function pick(launch: Launch | null) {
    selected = launch?.id ?? 'new';
    const fresh = draftOf(launch);
    baseline = JSON.stringify(fresh);
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
    draft = fresh;
    tab = 'general';
    error = null;
    notice = null;
    confirming = false;
    rolesOpen = false;
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
    tab = 'general';
    error = null;
    notice = null;
    confirming = false;
  }

  const dirty = $derived(draft !== null && JSON.stringify(draft) !== baseline);
  const current = $derived(
    launches.find((launch) => launch.id === selected) ?? null,
  );
  const readOnly = $derived(current !== null && !editable(current));
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
  const listGroups = $derived(groupLaunches(launches, q));
  const est = $derived(
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
  const known = $derived(new Set(recent.map((entry) => entry.path)));
  const saved = $derived([
    ...new Set(
      launches
        .map((launch) => launch.directory)
        .filter((path) => known.has(path)),
    ),
  ]);
  const used = $derived(
    [...recent].sort((a, b) => b.last_used - a.last_used).slice(0, 8),
  );

  const tabItems = $derived.by(() => {
    const currentDraft = draft;
    if (!currentDraft) return [];
    const counts = tabCounts(currentDraft, data, itemPlan);
    return WORKSPACE_TABS.filter(
      (id) => id !== 'mcp' || currentDraft.agent === 'claude_code',
    ).map((id) => {
      const c = counts[id];
      return {
        id,
        label: t(tabLabel(id)),
        count: c ? t('{on} of {all}', { on: c.on, all: c.all }) : '',
      };
    });
  });

  function tabLabel(id: WorkspaceTab): string {
    const labels: Record<WorkspaceTab, string> = {
      general: 'General',
      instructions: 'Instructions',
      skills: 'Skills',
      mcp: 'MCP',
      hooks: 'Hooks',
      summary: 'Summary',
    };
    return labels[id];
  }

  function tabKey(event: KeyboardEvent, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabItems.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabItems.length) %
            tabItems.length;
    const selectedTab = tabItems[next];
    if (!selectedTab) return;
    tab = selectedTab.id;
    document.getElementById(`workspace-tab-${selectedTab.id}`)?.focus();
  }

  function setAgent(agent: Agent) {
    if (!draft || draft.agent === agent) return;
    draft.agent = agent;
    if (draft.permission && !permissionsFor(agent).includes(draft.permission))
      draft.permission = null;
    draft.selection = null;
    draft.items = allItemsOf(data.library, agent);
    draft.composites = [];
    draft.spec = agent === 'claude_code' ? { ...DEFAULT_SPEC } : null;
    draft.codexSpec = agent === 'codex' ? { ...DEFAULT_CODEX_SPEC } : null;
    draft.instructions = { project: 'load' };
    if (agent === 'codex' && tab === 'mcp') tab = 'general';
  }

  function setItem(id: string, on: boolean) {
    if (
      !draft ||
      (on &&
        (itemPlanState !== 'ready' ||
          itemPlan.some((item) => item.capability === id && unavailable(item))))
    )
      return;
    const has = draft.items.some((item) => item.capability === id);
    if (on && !has) {
      draft.items = [
        ...draft.items,
        {
          capability: id,
          revision:
            draft.selection?.items.find((item) => item.capability === id)
              ?.revision ?? null,
        },
      ];
    }
    if (!on && has)
      draft.items = draft.items.filter((item) => item.capability !== id);
  }

  function setAccountSkill(name: string, on: boolean) {
    if (!draft?.spec) return;
    draft.spec.account_skills_off = toggle(
      draft.spec.account_skills_off,
      name,
      !on,
    );
  }

  async function addRole() {
    const name = newRole.trim();
    if (!name) return;
    try {
      roles = await client.writeRole({ do: 'create', name });
      newRole = '';
    } catch (e) {
      error = `${t('The role could not be saved.')} ${errorMessage(e)}`;
    }
  }

  async function removeRole(id: string) {
    try {
      roles = await client.writeRole({ do: 'delete', id });
      if (draft?.role === id) draft.role = 'worker';
    } catch (e) {
      error = `${t('The role could not be deleted.')} ${errorMessage(e)}`;
    }
  }

  /** One Save: preset → environment → launch → role. Says what was saved if a step fails. */
  async function save(): Promise<string | null> {
    if (!draft || !canSave || busy) return null;
    const d: LaunchDraft = $state.snapshot(draft) as LaunchDraft;
    const blocked = new Set(
      itemPlan.filter(unavailable).map((item) => item.capability),
    );
    d.items = d.items.filter((item) => !blocked.has(item.capability));
    busy = true;
    error = null;
    notice = null;
    const done: string[] = [];
    const folderSelection = await client
      .projectSelection(d.directory, d.agent)
      .catch(() => null);
    const plan = savePlan(d, {
      launches,
      selections: data.selections.filter(
        (selection) => selection.provider === d.agent,
      ),
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
      const preset = plan.preset;
      if (
        preset.do === 'write' ||
        preset.do === 'copy' ||
        preset.do === 'create'
      ) {
        target = await client.saveSelection({
          id: preset.do === 'write' ? preset.id : null,
          name: preset.name,
          provider: d.agent,
          items: d.items as Item[],
          composites: d.composites,
        });
        done.push(
          preset.do === 'copy'
            ? t('preset “{name}” (a copy: the other launches keep theirs)', {
                name: preset.name,
              })
            : t('preset “{name}”', { name: preset.name }),
        );
      } else if (preset.do === 'none') target = null;
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
          ((preset.do === 'copy' || preset.do === 'create') &&
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
      const fresh = launches.find((item) => item.id === launch.id) ?? null;
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
    if (!removing || (removing.kind === 'session' && !editable(removing)))
      return;
    const removingSession = removing.kind === 'session' ? removing : null;
    busy = true;
    let deleted = false;
    try {
      const selection = removingSession
        ? selectionOf(removingSession, data.selections)
        : null;
      await deleteLaunch(removing.id);
      deleted = true;
      if (
        selection &&
        !launches.some(
          (launch) =>
            launch.id !== removing.id &&
            launch.kind === 'session' &&
            launch.agent === removingSession?.agent &&
            launch.preset === selection.name,
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
      error = `${t(
        deleted
          ? 'The launch was deleted, but its instructions or role could not be cleared.'
          : 'The launch could not be deleted.',
      )} ${errorMessage(e)}`;
    } finally {
      busy = false;
      confirming = false;
    }
  }

  async function browse() {
    const path = await choose().catch(() => null);
    if (path && draft) draft.directory = path;
  }

  function noticeText(text: string, tone: 'warning' | 'error' | 'success') {
    return { text, tone };
  }

  const editorNotices = $derived.by(() => {
    if (!draft) return [];
    const notes: { text: string; tone: 'warning' | 'error' | 'success' }[] = [];
    if (
      !readOnly &&
      draft.selection &&
      unreadableFor(draft.selection, draft.agent)
    ) {
      notes.push(
        noticeText(
          t(
            draft.agent === 'claude_code' && !data.claudeUnreadable
              ? 'The launch environment could not be read.'
              : ENVIRONMENT_UNREADABLE,
          ),
          'error',
        ),
      );
    }
    if (!readOnly && staleHooks)
      notes.push(
        noticeText(
          t(
            'A hook this preset left out is no longer in hooks.json: it was edited or removed. A launch with this preset does not start until you check the hooks and save.',
          ),
          'warning',
        ),
      );
    if (
      !readOnly &&
      draft.selection &&
      data.instructionsFailed?.has(draft.selection.id)
    )
      notes.push(
        noticeText(
          t(
            'The launch instructions file cannot be read. It was not modified.',
          ),
          'error',
        ),
      );
    if (roles.damaged)
      notes.push(
        noticeText(
          t(
            'roles.json could not be read. Roles are shown as the basic ones and are not saved until the file is fixed or removed.',
          ),
          'warning',
        ),
      );
    if (renames && current && draft)
      notes.push(
        noticeText(
          t(
            'This launch is saved as {file}.toml. Saving writes {next}.toml and removes {file}.toml.',
            { file: current.id, next: launchId(draft.name) },
          ),
          'warning',
        ),
      );
    if (itemPlanState === 'failed' || selectionPlanError)
      notes.push(
        noticeText(
          t('The launch plan could not be read: {reason}', {
            reason: itemPlanError || selectionPlanError,
          }),
          'error',
        ),
      );
    if (selectionPlan && selectionPlan.can_apply === false)
      notes.push(
        noticeText(
          t(
            'This skills choice cannot be applied now: {reason} Check it before starting.',
            {
              reason:
                selectionPlan.conflicts
                  ?.filter((conflict) => conflict.blocking)
                  .map((conflict) => conflict.names.join(', '))
                  .join('; ') || tIncoming(selectionPlan.enforcement.reason),
            },
          ),
          'warning',
        ),
      );
    if (error) notes.push(noticeText(error, 'error'));
    if (notice) notes.push(noticeText(notice, 'success'));
    return notes;
  });
</script>

<section
  class="workspace-shell"
  aria-label={t('Launches')}
  hidden={!visible}
  inert={!visible}
>
  <LaunchList
    groups={listGroups}
    query={q}
    {selected}
    {phase}
    {refused}
    disabled={busy}
    onquery={(value) => (q = value)}
    onpick={pick}
    onnew={() => pick(null)}
  />

  <main
    class="workspace-main"
    class:commands={draft !== null && current?.kind === 'commands'}
  >
    {#if draft}
      {@const currentDraft = draft}
      <header class="workspace-header">
        <input
          class="workspace-title"
          disabled={busy || readOnly || current?.kind === 'commands'}
          readonly={current?.kind === 'commands'}
          aria-label={t('Launch name')}
          maxlength="60"
          bind:value={currentDraft.name}
        />
        {#if current?.kind !== 'commands'}
          <div class="context-estimate" aria-live="polite">
            {#if est && ceiling}
              <span
                >{t('Initial context estimated {total}', {
                  total: kTokens(est.total),
                })}</span
              >
              <span
                class="estimate-bar"
                role="img"
                aria-label={t('{value} percent of available context', {
                  value: Math.min(
                    100,
                    Math.round((est.total / ceiling.total) * 100),
                  ),
                })}
              >
                <span
                  style:width={`${Math.min(100, Math.round((est.total / ceiling.total) * 100))}%`}
                ></span>
              </span>
            {:else if currentDraft.agent === 'codex' && !readOnly}
              <span>{t('Initial context: no estimate for Codex')}</span>
            {/if}
          </div>
        {/if}
      </header>

      {#if current?.kind === 'commands'}
        <DistroVariants
          launch={current}
          {system}
          disabled={busy}
          {onopen}
          {confirming}
          onrequestremove={() => (confirming = true)}
          oncancelremove={() => (confirming = false)}
          onremove={() => void remove()}
          onbusy={(value) => (busy = value)}
          onsaved={(fresh) => {
            launches = launches.map((launch) =>
              launch.id === fresh.id ? fresh : launch,
            );
          }}
        />
      {:else}
        <div
          class="workspace-tabs"
          role="tablist"
          aria-label={t('Launch settings')}
        >
          {#each tabItems as item, index (item.id)}
            <button
              id={`workspace-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls={`workspace-panel-${item.id}`}
              tabindex={tab === item.id ? 0 : -1}
              disabled={busy}
              class:active={tab === item.id}
              onkeydown={(event) => tabKey(event, index)}
              onclick={() => (tab = item.id)}
            >
              <span>{item.label}</span>
              {#if item.count}<span class="tab-count">{item.count}</span>{/if}
            </button>
          {/each}
        </div>

        <div class="workspace-scroll" inert={busy}>
          {#if editorNotices.length > 0}
            <div class="workspace-notices" aria-label={t('Notices')}>
              {#each editorNotices as item, index (`${index}-${item.text}`)}
                <p
                  class={`workspace-notice ${item.tone}`}
                  role={item.tone === 'error' ? 'alert' : 'status'}
                >
                  <span aria-hidden="true"
                    >{item.tone === 'error'
                      ? '×'
                      : item.tone === 'warning'
                        ? '⚠'
                        : '✓'}</span
                  >
                  <strong
                    >{t(
                      item.tone === 'error'
                        ? 'Error'
                        : item.tone === 'warning'
                          ? 'Warning'
                          : 'Saved',
                    )}</strong
                  >
                  <span>{item.text}</span>
                </p>
              {/each}
            </div>
          {/if}
          {#if current && !editable(current)}
            <p class="workspace-notice warning" role="status">
              <span aria-hidden="true">⚠</span><strong>{t('Warning')}</strong>
              <span
                >{t(
                  'This launch runs commands from its file. It opens from here; edit it in its file.',
                )}</span
              >
            </p>
          {/if}

          <div
            id={`workspace-panel-${tab}`}
            class="workspace-panel"
            role="tabpanel"
            aria-labelledby={`workspace-tab-${tab}`}
            tabindex="0"
          >
            {#if tab === 'general'}
              <General
                draft={currentDraft}
                {busy}
                {readOnly}
                {roles}
                {allRoles}
                {saved}
                {used}
                {rolesOpen}
                {newRole}
                onBrowse={browse}
                onSetAgent={setAgent}
                onToggleRoles={() => (rolesOpen = !rolesOpen)}
                onNewRole={(value) => (newRole = value)}
                onAddRole={() => void addRole()}
                onRemoveRole={(id) => void removeRole(id)}
              />
            {:else if tab === 'instructions'}
              <Instructions
                draft={currentDraft}
                {data}
                {inventory}
                disabled={busy || readOnly}
              />
            {:else if tab === 'skills'}
              <Skills
                draft={currentDraft}
                {data}
                {itemPlan}
                {itemPlanState}
                estimate={est ? est.skills + est.account : null}
                disabled={busy || readOnly}
                onread={() => void load()}
                {setItem}
                {setAccountSkill}
              />
            {:else if tab === 'mcp' && currentDraft.agent === 'claude_code'}
              <Mcp
                draft={currentDraft}
                {data}
                {inventory}
                disabled={busy || readOnly}
                onread={() => void load()}
              />
            {:else if tab === 'hooks'}
              <Hooks
                draft={currentDraft}
                {data}
                disabled={busy || readOnly}
                onread={() => void load()}
              />
            {:else}
              <Summary draft={currentDraft} {data} estimate={est} {itemPlan} />
            {/if}
          </div>
        </div>

        <footer class="workspace-footer">
          {#if current && current.kind === 'session' && editable(current)}
            {#if confirming}
              <span class="remove-confirm"
                >{t('Delete {name}?', { name: current.name })}</span
              >
              <button
                type="button"
                class="remove-launch"
                disabled={busy}
                onclick={() => void remove()}>{t('Delete')}</button
              >
              <button
                type="button"
                class="action"
                disabled={busy}
                onclick={() => (confirming = false)}>{t('Cancel')}</button
              >
            {:else}
              <button
                type="button"
                class="remove-launch"
                disabled={busy}
                onclick={() => (confirming = true)}>{t('Delete launch')}</button
              >
            {/if}
          {/if}
          <span class="footer-spacer"></span>
          <button
            type="button"
            class="action"
            disabled={busy ||
              (!currentDraft.id && !canSave) ||
              (dirty && !canSave)}
            onclick={() => void tryIt()}
            >{dirty || !currentDraft.id ? t('Save and try') : t('Try')}</button
          >
          <button
            type="button"
            class="action primary"
            disabled={busy || !dirty || !canSave}
            onclick={() => void save()}
            >{busy ? t('Saving…') : t('Save')}</button
          >
        </footer>
      {/if}
    {:else if phase === 'failed'}
      <div class="workspace-failed">
        <p class="workspace-notice error" role="alert">
          <span aria-hidden="true">×</span><strong>{t('Error')}</strong><span
            >{error}</span
          >
        </p>
        <button
          type="button"
          class="action"
          disabled={busy}
          onclick={() => void load()}>{t('Try again')}</button
        >
      </div>
    {/if}
  </main>
</section>

<style>
  .workspace-shell {
    display: grid;
    grid-template-columns: minmax(210px, 250px) minmax(0, 1fr);
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--surface);
    color: var(--text);
  }
  .workspace-main {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .workspace-main.commands {
    grid-template-rows: auto minmax(0, 1fr);
  }
  .workspace-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px 20px;
    min-width: 0;
    padding: 18px 32px 8px;
  }
  .workspace-title {
    flex: 1 1 220px;
    min-width: 0;
    min-height: 42px;
    padding: 3px 0;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text);
    font: 600 var(--text-lg) var(--font-sans);
  }
  .workspace-title:hover:not(:disabled) {
    border-color: var(--line);
  }
  .workspace-title:focus-visible {
    border-color: var(--focus);
  }
  .context-estimate {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px 12px;
    min-width: 0;
    color: var(--muted);
    font-size: var(--text-xs);
  }
  .estimate-bar {
    display: block;
    width: 110px;
    height: 4px;
    overflow: hidden;
    border-radius: var(--radius-md);
    background: var(--surface-hover);
  }
  .estimate-bar > span {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .workspace-tabs {
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 4px 20px;
    padding: 0 32px;
    border-bottom: 1px solid var(--line);
  }
  .workspace-tabs button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    min-height: 44px;
    padding: 7px 0;
    border: 0;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    background: transparent;
    color: var(--muted);
    font-size: var(--text-sm);
    white-space: normal;
  }
  .workspace-tabs button:hover:not(:disabled) {
    background: transparent;
    color: var(--text);
  }
  .workspace-tabs button.active {
    border-bottom-color: var(--accent);
    color: var(--text);
    font-weight: 600;
  }
  .tab-count {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 400;
  }
  .workspace-scroll {
    min-width: 0;
    min-height: 0;
    overflow: auto;
    padding: 8px 32px 20px;
  }
  .workspace-panel {
    width: 100%;
    max-width: 980px;
    margin: 0 auto;
    outline-offset: 4px;
  }
  .workspace-notices {
    display: grid;
    gap: 6px;
    max-width: 980px;
    margin: 0 auto 10px;
  }
  .workspace-notice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    padding: 9px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    overflow-wrap: anywhere;
  }
  .workspace-notice > span:first-child {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 18px;
    height: 18px;
    border: 1px solid currentColor;
    border-radius: 50%;
    font-family: var(--font-mono);
    line-height: 1;
  }
  .workspace-notice strong {
    flex: none;
  }
  .workspace-notice.warning {
    border-color: var(--warn);
    background: var(--warn-soft);
    color: var(--warn);
  }
  .workspace-notice.error {
    border-color: var(--error);
    background: var(--surface);
    color: var(--error);
  }
  .workspace-notice.success {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--text);
  }
  .workspace-footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 68px;
    padding: 12px 32px;
    border-top: 1px solid var(--line);
    background: var(--surface);
  }
  .footer-spacer {
    flex: 1;
  }
  .remove-launch {
    min-height: var(--control-h);
    padding: 0 4px;
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--error);
    text-align: left;
  }
  .remove-launch:hover:not(:disabled) {
    background: var(--surface-hover);
  }
  .remove-confirm {
    color: var(--text);
    font-size: var(--text-xs);
    overflow-wrap: anywhere;
  }
  .workspace-failed {
    display: grid;
    align-content: start;
    justify-items: start;
    gap: 10px;
    min-width: 0;
    padding: 20px 32px;
  }
  .action {
    min-height: var(--control-h);
  }
  .action.primary {
    background: var(--accent);
    color: var(--surface);
  }
  @media (max-width: 1023px) {
    .workspace-header {
      padding: 14px 20px 8px;
    }
    .workspace-tabs {
      gap: 4px 14px;
      padding: 0 20px;
    }
    .workspace-scroll {
      padding: 8px 20px 16px;
    }
    .workspace-footer {
      padding: 10px 20px;
    }
  }
  @media (max-width: 760px) {
    .workspace-shell {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }
    .workspace-main {
      grid-template-rows: auto auto minmax(0, 1fr) auto;
    }
    .workspace-header,
    .workspace-tabs,
    .workspace-scroll,
    .workspace-footer {
      padding-right: 14px;
      padding-left: 14px;
    }
    .workspace-tabs {
      gap: 0 14px;
    }
    .context-estimate {
      justify-content: flex-start;
      flex: 1 1 100%;
    }
  }
  @media (max-width: 420px) {
    .workspace-header {
      padding-top: 10px;
    }
    .workspace-tabs {
      gap: 0 10px;
    }
    .workspace-tabs button {
      min-height: 40px;
      font-size: var(--text-xs);
    }
    .workspace-footer {
      gap: 6px;
    }
    .workspace-footer .action {
      flex: 1 1 100px;
    }
  }
</style>
