<script lang="ts">
  import { msg, t } from '../../i18n/index.svelte';
  import type { ArsenalProvider, LibraryItem } from '../../contracts/arsenal';
  import type { ItemKind } from '../../contracts/configuration';
  import type { ArsenalController, ArsenalState } from './controller';
  import {
    GROUP_LABEL,
    GROUPS,
    groupFor,
    knownGroup,
    type Group,
  } from './groups';
  import ConfigurationView from '../configuration/ConfigurationView.svelte';
  import type {
    ConfigurationController,
    ConfigurationState,
  } from '../configuration/controller';
  import type {
    ChangesController,
    ChangesState,
  } from '../configuration/changes-controller';

  /**
   * Arsenal (redesign stage 4, arsenal-UI-SPEC "Etapa 4"): first the tool, then the kind.
   * Global, Hooks and MCP are the agent's own configuration files (what Configuration was);
   * Skills and Agents are the library, by category.
   */
  let {
    visible,
    arsenal,
    controller,
    configuration,
    configurationController,
    changes,
    changesController,
    focus = null,
  }: {
    visible: boolean;
    arsenal: ArsenalState;
    controller: ArsenalController;
    configuration: ConfigurationState;
    configurationController: ConfigurationController;
    changes: ChangesState;
    changesController: ChangesController;
    /** Opened from a "Configuration" link: lands on this tab. */
    focus?: { tab: 'global'; at: number } | null;
  } = $props();

  type Tab = 'global' | 'skills' | 'agents' | 'hooks' | 'mcp';
  const TABS: { id: Tab; name: string }[] = [
    { id: 'global', name: msg('Global') },
    { id: 'skills', name: msg('Skills') },
    { id: 'agents', name: msg('Agents') },
    { id: 'hooks', name: msg('Hooks') },
    { id: 'mcp', name: msg('MCP') },
  ];
  /** What each configuration tab shows of the agent's own files. */
  const CONFIG_KINDS: Partial<Record<Tab, readonly ItemKind[]>> = {
    global: ['rule_file', 'model_preference', 'plugin'],
    hooks: ['hook'],
    mcp: ['mcp_server'],
  };
  const TOOLS: { id: ArsenalProvider; name: string }[] = [
    { id: 'claude_code', name: 'Claude Code' },
    { id: 'codex', name: 'Codex' },
  ];

  let tool = $state<ArsenalProvider>('claude_code');
  let tab = $state<Tab>('skills');
  let openId = $state<string | null>(null);
  let shut = $state<Set<string>>(new Set());
  let adding = $state(false);
  let picked = $state<Set<string>>(new Set());

  const isConfig = $derived(tab in CONFIG_KINDS);
  // The configuration tabs read the agent's own files for the tool chosen here.
  $effect(() => {
    if (visible) configurationController.setProvider(tool);
  });
  $effect(() => {
    if (focus) tab = focus.tab;
  });

  const library = $derived(arsenal.library);
  const configItems = $derived(configuration.reply?.inventory.items ?? []);
  const customIds = $derived(
    arsenal.categories.filter((c) => c.name !== null).map((c) => c.id),
  );
  const categoryOf = (item: LibraryItem) =>
    knownGroup(groupFor(item, arsenal.groups[item.id]), customIds);
  function categoryName(id: string): string {
    const custom = arsenal.categories.find((c) => c.id === id);
    if (custom?.name) return custom.name;
    return t(GROUP_LABEL[id as Group] ?? GROUP_LABEL.other);
  }
  const ofKind = (kind: 'skill' | 'agent') =>
    library.filter((i) => i.provider === tool && i.kind === kind);
  function count(id: Tab): number {
    if (id === 'skills') return ofKind('skill').length;
    if (id === 'agents') return ofKind('agent').length;
    const kinds = CONFIG_KINDS[id] ?? [];
    return configItems.filter(
      (i) => i.provider === tool && kinds.includes(i.kind),
    ).length;
  }
  /** The tab's items by category, in screen order; only categories that hold something. */
  const groups = $derived.by(() => {
    if (tab !== 'skills' && tab !== 'agents') return [];
    const items = ofKind(tab === 'skills' ? 'skill' : 'agent');
    return [...GROUPS, ...customIds]
      .map((id) => ({
        id,
        items: items
          .filter((i) => categoryOf(i) === id)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((g) => g.items.length > 0);
  });

  function toggleGroup(id: string) {
    shut = shut.has(id)
      ? new Set([...shut].filter((x) => x !== id))
      : new Set([...shut, id]);
  }
  function toggleOpen(item: LibraryItem) {
    if (openId === item.id) {
      openId = null;
      return;
    }
    openId = item.id;
    void controller.open(item.id);
  }

  const candidates = $derived(
    (arsenal.discover?.candidates ?? []).filter(
      (c) =>
        c.provider === tool &&
        c.kind === (tab === 'agents' ? 'agent' : 'skill') &&
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
  }
  function flip(id: string) {
    picked = picked.has(id)
      ? new Set([...picked].filter((x) => x !== id))
      : new Set([...picked, id]);
  }
  function choose(next: { tool?: ArsenalProvider; tab?: Tab }) {
    if (next.tool) tool = next.tool;
    if (next.tab) tab = next.tab;
    openId = null;
    adding = false;
  }
</script>

<section
  class="library-feature"
  aria-label={t('Arsenal')}
  hidden={!visible}
  inert={!visible}
>
  <div class="ars-tools" role="tablist" aria-label={t('Tool')}>
    {#each TOOLS as x (x.id)}
      <button
        type="button"
        role="tab"
        class="ars-tool"
        aria-selected={tool === x.id}
        onclick={() => choose({ tool: x.id })}>{x.name}</button
      >
    {/each}
  </div>
  <div class="ars-kinds" role="tablist" aria-label={t('Kind')}>
    {#each TABS as x (x.id)}
      <button
        type="button"
        role="tab"
        class="ars-kind"
        aria-selected={tab === x.id}
        onclick={() => choose({ tab: x.id })}
        >{t(x.name)} <span class="ars-count">{count(x.id)}</span></button
      >
    {/each}
  </div>

  <div class="ars-config" hidden={!isConfig}>
    <ConfigurationView
      visible={visible && isConfig}
      embedded
      kinds={CONFIG_KINDS[tab] ?? []}
      {configuration}
      controller={configurationController}
      {changes}
      {changesController}
    />
  </div>

  {#if !isConfig}
    <div class="ars-body">
      <div class="ars-bar">
        <button
          type="button"
          class="action"
          aria-expanded={adding}
          onclick={startAdding}>{t('Add')}</button
        >
      </div>

      {#if adding}
        <div class="lib-add">
          <p class="lib-muted">
            {t(
              'What Wyss Console found in your folders and is not in the library yet. It is copied to your library; your original files are not touched.',
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

      {#if groups.length === 0 && !adding}
        <p class="lib-muted">
          {t('Nothing here yet. Add brings what is already on your computer.')}
        </p>
      {/if}
      {#each groups as g (g.id)}
        {@const open = !shut.has(g.id)}
        <section class="ars-group">
          <h3>
            <button
              type="button"
              class="ars-group-head"
              aria-expanded={open}
              onclick={() => toggleGroup(g.id)}
              ><span class="ars-chevron" aria-hidden="true"
                >{open ? '▾' : '▸'}</span
              >
              {categoryName(g.id)}
              <span class="ars-count">{g.items.length}</span></button
            >
          </h3>
          {#if open}
            <ul class="ars-rows">
              {#each g.items as item (item.id)}
                {@const isOpen = openId === item.id}
                {@const detail =
                  arsenal.opened?.summary.id === item.id
                    ? arsenal.opened
                    : null}
                <li>
                  <button
                    type="button"
                    class="ars-row"
                    aria-expanded={isOpen}
                    onclick={() => toggleOpen(item)}
                  >
                    <span class="lib-name" title={item.name}>{item.name}</span>
                    <span class="lib-desc" title={item.description}
                      >{item.description}</span
                    >
                  </button>
                  {#if isOpen}
                    <div class="ars-detail">
                      <p>{item.description}</p>
                      {#if detail}
                        <ul class="lib-files">
                          {#each detail.files as f (f.path)}
                            <li>
                              <button
                                type="button"
                                class="lib-file"
                                onclick={() => void controller.showFile(f.path)}
                                >{f.path}</button
                              >
                            </li>
                          {/each}
                        </ul>
                        {#if arsenal.file}<pre class="lib-pre">{arsenal.file
                              .text}</pre>{/if}
                      {:else}
                        <p class="lib-muted" role="status">{t('Reading…')}</p>
                      {/if}
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {/each}
    </div>
  {/if}
</section>
