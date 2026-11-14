<script lang="ts">
  import { msg, t } from '../../i18n/index.svelte';
  import type { Item, LibraryItem, Selection } from '../../contracts/arsenal';
  import { arsenalClient, type Roles } from '../../desktop/arsenal-client';
  import {
    listLaunches,
    saveLaunch,
    type Launch,
  } from '../../desktop/launch-client';
  import type { ArsenalController, ArsenalState } from './controller';
  import {
    GROUP_LABEL,
    GROUPS,
    groupFor,
    knownGroup,
    type Group,
  } from './groups';
  import { librarySources } from './catalogue';
  import { BASIC_ROLES } from '../workspace/plan';
  import {
    activatesWhen,
    changeable,
    isUnplaced,
    launchesOfRole,
    matches,
    placeable,
    placedIn,
    placePlan,
    roleOn,
    runsCode,
    sessionLaunches,
    tokensOf,
    type SessionLaunch,
  } from './library';

  let {
    visible,
    arsenal,
    controller,
    client = arsenalClient,
    launches: readLaunches = listLaunches,
    save = saveLaunch,
  }: {
    visible: boolean;
    arsenal: ArsenalState;
    controller: ArsenalController;
    client?: typeof arsenalClient;
    launches?: typeof listLaunches;
    save?: typeof saveLaunch;
  } = $props();

  const PROVIDER = { claude_code: 'Claude Code', codex: 'Codex' } as const;
  const RUNS = {
    yes: msg('Yes'),
    no: msg('No'),
    unknown: msg('Not known'),
  } as const;
  type Tab = 'what' | 'files' | 'where';
  const TABS: { id: Tab; name: string }[] = [
    { id: 'what', name: msg('What it does') },
    { id: 'files', name: msg('Files') },
    { id: 'where', name: msg('Where it goes') },
  ];

  let launchList = $state<Launch[]>([]);
  let selections = $state<Selection[]>([]);
  let roles = $state<Roles | null>(null);
  let reading = $state(false);
  let query = $state('');
  let origin = $state<string | null>(null);
  let category = $state<string | null>(null);
  let openId = $state<string | null>(null);
  let tab = $state<Tab>('what');
  let working = $state<string | null>(null);
  let error = $state<string | null>(null);
  let adding = $state(false);
  let picked = $state<Set<string>>(new Set());

  async function read() {
    reading = true;
    const [l, s, r] = await Promise.all([
      readLaunches().catch(() => null),
      client.selections().catch(() => null),
      client.roles().catch(() => null),
    ]);
    if (l && Array.isArray(l.launches)) launchList = [...l.launches];
    if (Array.isArray(s)) selections = s;
    if (r) roles = r;
    reading = false;
  }
  let shown = false;
  $effect(() => {
    if (visible && !shown) {
      shown = true;
      void read();
    } else if (!visible) shown = false;
  });

  const library = $derived(arsenal.library);
  const sessions = $derived(sessionLaunches(launchList));
  const customIds = $derived(
    arsenal.categories.filter((c) => c.name !== null).map((c) => c.id),
  );
  const categoryOf = (item: LibraryItem) =>
    knownGroup(groupFor(item, arsenal.groups[item.id]), customIds);
  const unplaced = (item: LibraryItem) =>
    isUnplaced(item, sessions, selections, library);
  function categoryName(id: string): string {
    const custom = arsenal.categories.find((c) => c.id === id);
    if (custom?.name) return custom.name;
    return t(GROUP_LABEL[id as Group] ?? GROUP_LABEL.other);
  }
  const categories = $derived(
    [...GROUPS, ...customIds]
      .map((id) => ({
        id,
        n: library.filter((i) => categoryOf(i) === id).length,
      }))
      .filter((c) => c.n > 0),
  );
  const unplacedN = $derived(library.filter(unplaced).length);
  const origins = $derived(librarySources(library));
  const rows = $derived(
    library.filter((item) =>
      matches(item, { query, origin, category }, categoryOf, unplaced),
    ),
  );
  const allRoles = $derived([
    ...BASIC_ROLES.map((r) => ({ id: r.id, name: t(r.name) })),
    ...(roles?.custom ?? []),
  ]);

  function placedLine(item: LibraryItem): string {
    if (!placeable(item)) return t('In a launch’s environment');
    const n = placedIn(item, sessions, selections, library).length;
    return n === 0
      ? t('Unplaced')
      : n === 1
        ? t('1 launch')
        : t('{n} launches', { n });
  }

  function toggleOpen(item: LibraryItem) {
    error = null;
    if (openId === item.id) {
      openId = null;
      return;
    }
    openId = item.id;
    tab = 'what';
    void controller.open(item.id);
  }

  /** Puts `item` in, or takes it out of, one launch: the Workspace save, never another launch. */
  async function place(launch: SessionLaunch, item: LibraryItem, on: boolean) {
    const folderSelection = await client
      .projectSelection(launch.directory, launch.agent)
      .catch(() => null);
    const { plan, items } = placePlan(launch, item, on, {
      launches: launchList,
      selections,
      library,
      roles,
      folderSelection,
    });
    const p = plan.preset;
    if (p.do !== 'write' && p.do !== 'copy' && p.do !== 'create') return;
    const target = await client.saveSelection({
      id: p.do === 'write' ? p.id : null,
      name: p.name,
      provider: launch.agent,
      items: items as Item[],
      composites:
        selections.find(
          (s) => s.provider === launch.agent && s.name === launch.preset,
        )?.composites ?? [],
    });
    if (target.name !== launch.preset)
      await save({
        name: launch.name,
        directory: launch.directory,
        agent: launch.agent,
        permission: launch.permission,
        preset: target.name,
        replace: true,
      });
  }

  async function run(key: string, steps: () => Promise<void>) {
    if (working) return;
    working = key;
    error = null;
    try {
      await steps();
    } catch {
      error = t('Could not be saved. What was saved before this stays.');
    }
    await read();
    working = null;
  }
  const toggleLaunch = (
    launch: SessionLaunch,
    item: LibraryItem,
    on: boolean,
  ) => run(`l:${launch.id}`, () => place(launch, item, on));
  const toggleRole = (role: string, item: LibraryItem, on: boolean) =>
    run(`r:${role}`, async () => {
      // One launch after the other: each one reads the presets the last one left.
      for (const launch of launchesOfRole(role, item, sessions, roles).filter(
        changeable,
      )) {
        await place(launch, item, on);
        const s = await client.selections().catch(() => null);
        if (Array.isArray(s)) selections = s;
        const l = await readLaunches().catch(() => null);
        if (l && Array.isArray(l.launches)) launchList = [...l.launches];
      }
    });

  const candidates = $derived(
    (arsenal.discover?.candidates ?? []).filter(
      (c) =>
        c.importable &&
        (c.status === 'not_imported' || c.status === 'source_changed'),
    ),
  );
  function startAdding() {
    adding = !adding;
    if (adding) {
      picked = new Set(candidates.map((c) => c.id));
      if (arsenal.discover === null) void controller.discover();
    }
  }
  async function importPicked() {
    for (const id of picked) await controller.importCandidate(id);
    picked = new Set();
    adding = false;
    await controller.refresh();
    await read();
  }
  function flip(id: string) {
    picked = picked.has(id)
      ? new Set([...picked].filter((x) => x !== id))
      : new Set([...picked, id]);
  }
  const firstOpen = $derived(arsenal.phase === 'ready' && library.length === 0);
  $effect(() => {
    if (firstOpen && candidates.length > 0 && picked.size === 0)
      picked = new Set(candidates.map((c) => c.id));
  });
</script>

<section
  class="library-feature"
  aria-label={t('Arsenal')}
  hidden={!visible}
  inert={!visible}
>
  {#if firstOpen}
    <div class="lib-first">
      <h2>{t('Bring what you already use')}</h2>
      <p class="lib-muted">
        {t(
          'Wyss Console found this on your computer. It is copied to your library; your original files are not touched.',
        )}
      </p>
      {#if arsenal.discovering}
        <p class="lib-muted" role="status">{t('Reading…')}</p>
      {:else if candidates.length === 0}
        <p class="lib-muted">{t('Nothing found to bring.')}</p>
      {/if}
      <ul class="lib-picks">
        {#each candidates as c (c.id)}
          <li>
            <label>
              <input
                type="checkbox"
                checked={picked.has(c.id)}
                onchange={() => flip(c.id)}
              />
              <span class="lib-name">{c.name}</span>
              <span class="lib-desc">{c.description}</span>
              <span class="lib-meta">{c.source}</span>
            </label>
          </li>
        {/each}
      </ul>
      <div class="lib-actions">
        <button
          type="button"
          class="action primary"
          disabled={picked.size === 0 || arsenal.busy !== null}
          onclick={() => void importPicked()}
          >{t('Import {n} items', { n: picked.size })}</button
        >
      </div>
    </div>
  {:else}
    <div class="lib-split">
      <nav class="lib-side" aria-label={t('Library')}>
        <button
          type="button"
          class="lib-cat"
          aria-current={category === 'unplaced'}
          onclick={() =>
            (category = category === 'unplaced' ? null : 'unplaced')}
          ><span>{t('Unplaced')}</span><span class="lib-count">{unplacedN}</span
          ></button
        >
        <h3 class="lib-head">
          <button
            type="button"
            class="lib-cat"
            aria-current={category === null}
            onclick={() => (category = null)}
            ><span>{t('Library')}</span><span class="lib-count"
              >{library.length}</span
            ></button
          >
        </h3>
        {#each categories as c (c.id)}
          <button
            type="button"
            class="lib-cat"
            aria-current={category === c.id}
            onclick={() => (category = c.id)}
            ><span>{categoryName(c.id)}</span><span class="lib-count"
              >{c.n}</span
            ></button
          >
        {/each}
        <span class="lib-grow"></span>
        <button
          type="button"
          class="action"
          aria-expanded={adding}
          onclick={startAdding}>{t('Add')}</button
        >
      </nav>

      <div class="lib-main">
        {#if adding}
          <div class="lib-add">
            <p class="lib-muted">
              {t(
                'What Wyss Console found in your folders and is not in the library yet. Before it is added you see what it does, its files and whether it runs code.',
              )}
            </p>
            {#if arsenal.discovering}
              <p class="lib-muted" role="status">{t('Reading…')}</p>
            {:else if candidates.length === 0}
              <p class="lib-muted">{t('Nothing found to bring.')}</p>
            {/if}
            <ul class="lib-picks">
              {#each candidates as c (c.id)}
                <li>
                  <label>
                    <input
                      type="checkbox"
                      checked={picked.has(c.id)}
                      onchange={() => flip(c.id)}
                    />
                    <span class="lib-name">{c.name}</span>
                    <span class="lib-desc">{c.description}</span>
                    <span class="lib-meta"
                      >{c.source} · {t('Runs code')}: {t(
                        c.executes_code ? RUNS.yes : RUNS.no,
                      )}</span
                    >
                  </label>
                </li>
              {/each}
            </ul>
            <div class="lib-actions">
              <button type="button" class="action quiet" onclick={startAdding}
                >{t('Cancel')}</button
              >
              <button
                type="button"
                class="action primary"
                disabled={picked.size === 0 || arsenal.busy !== null}
                onclick={() => void importPicked()}
                >{t('Import {n} items', { n: picked.size })}</button
              >
            </div>
          </div>
        {/if}

        <div class="lib-bar">
          <input
            type="search"
            class="lib-search"
            placeholder={t('Search…')}
            aria-label={t('Search')}
            bind:value={query}
          />
          <div class="lib-origins" role="group" aria-label={t('Origin')}>
            <button
              type="button"
              class="lib-chip"
              aria-pressed={origin === null}
              onclick={() => (origin = null)}>{t('All')}</button
            >
            {#each origins as o (o)}
              <button
                type="button"
                class="lib-chip"
                aria-pressed={origin === o}
                onclick={() => (origin = origin === o ? null : o)}>{o}</button
              >
            {/each}
          </div>
          {#if reading}<span class="lib-muted" role="status"
              >{t('Reading…')}</span
            >{/if}
        </div>

        {#if error}<p class="notice" data-tone="error" role="alert">
            {error}
          </p>{/if}

        <ul class="lib-rows" aria-label={t('Library')}>
          {#each rows as item (item.id)}
            {@const isOpen = openId === item.id}
            <li class="lib-row" class:open={isOpen}>
              <button
                type="button"
                class="lib-line"
                aria-expanded={isOpen}
                onclick={() => toggleOpen(item)}
              >
                <span class="lib-text">
                  <span class="lib-name" title={item.name}>{item.name}</span>
                  <span class="lib-desc" title={item.description}
                    >{item.description}</span
                  >
                </span>
                <span class="lib-meta">{item.source}</span>
                <span class="lib-meta">~{tokensOf(item)}</span>
                <span class="lib-place" class:none={unplaced(item)}
                  >{placedLine(item)}</span
                >
              </button>
              {#if isOpen}
                {@const detail =
                  arsenal.opened?.summary.id === item.id
                    ? arsenal.opened
                    : null}
                <div class="lib-detail">
                  <div class="lib-tabs" role="tablist">
                    {#each TABS as x (x.id)}
                      <button
                        type="button"
                        role="tab"
                        class="lib-tab"
                        aria-selected={tab === x.id}
                        onclick={() => (tab = x.id)}>{t(x.name)}</button
                      >
                    {/each}
                  </div>
                  {#if tab === 'what'}
                    <p>{item.description}</p>
                    <dl class="lib-kv">
                      {#if activatesWhen(item.description)}
                        <dt>{t('Activates when')}</dt>
                        <dd>{activatesWhen(item.description)}</dd>
                      {/if}
                      <dt>{t('Runs code')}</dt>
                      <dd>
                        {t(RUNS[runsCode(item.kind, detail?.files ?? null)])}
                      </dd>
                      <dt>{t('Context')}</dt>
                      <dd>~{tokensOf(item)} {t('tokens, estimated')}</dd>
                      <dt>{t('Works in')}</dt>
                      <dd>{PROVIDER[item.provider]}</dd>
                    </dl>
                  {:else if tab === 'files'}
                    {#if detail}
                      <ul class="lib-files">
                        {#each detail.files as f (f.path)}
                          <li>
                            <button
                              type="button"
                              class="lib-file"
                              onclick={() => void controller.showFile(f.path)}
                              >{f.path}</button
                            ><span class="lib-meta">{f.size} B</span>
                          </li>
                        {/each}
                      </ul>
                      {#if arsenal.file}<pre class="lib-pre">{arsenal.file
                            .text}</pre>{/if}
                    {:else}
                      <p class="lib-muted" role="status">{t('Reading…')}</p>
                    {/if}
                  {:else if !placeable(item)}
                    <p class="lib-muted">
                      {t(
                        'This is chosen in each launch’s environment, in Workspace.',
                      )}
                    </p>
                  {:else}
                    <p class="lib-sug">
                      {t('Suggestion: {group}', {
                        group: categoryName(categoryOf(item)),
                      })}
                    </p>
                    <h4 class="lib-head">{t('Roles')}</h4>
                    <div class="lib-chips">
                      {#each allRoles as r (r.id)}
                        {@const on = roleOn(
                          r.id,
                          item,
                          sessions,
                          roles,
                          selections,
                          library,
                        )}
                        {@const none =
                          launchesOfRole(r.id, item, sessions, roles).length ===
                          0}
                        <button
                          type="button"
                          class="lib-chip"
                          aria-pressed={on}
                          aria-busy={working === `r:${r.id}`}
                          disabled={none || working !== null}
                          title={none
                            ? t('No launch of this agent has this role.')
                            : ''}
                          onclick={() => void toggleRole(r.id, item, !on)}
                          >{on ? '✓ ' : ''}{r.name}</button
                        >
                      {/each}
                    </div>
                    <h4 class="lib-head">{t('Launches')}</h4>
                    <div class="lib-chips">
                      {#each sessions.filter((l) => l.agent === item.provider) as l (l.id)}
                        {@const on =
                          placedIn(item, [l], selections, library).length > 0}
                        <button
                          type="button"
                          class="lib-chip"
                          aria-pressed={on}
                          aria-busy={working === `l:${l.id}`}
                          disabled={!changeable(l) || working !== null}
                          title={changeable(l)
                            ? ''
                            : t(
                                'This launch runs commands before it starts: it is changed in its file.',
                              )}
                          onclick={() => void toggleLaunch(l, item, !on)}
                          >{on ? '✓ ' : ''}{l.name}</button
                        >
                      {:else}
                        <span class="lib-muted"
                          >{t('No launch of this agent yet.')}</span
                        >
                      {/each}
                    </div>
                    <p class="lib-muted">
                      {t(
                        'Putting it in a role adds it to every launch of that role.',
                      )}
                    </p>
                  {/if}
                </div>
              {/if}
            </li>
          {:else}
            <li class="lib-muted">
              {query.trim()
                ? t('Nothing matches “{q}”.', { q: query.trim() })
                : t('Nothing here.')}
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}
</section>
