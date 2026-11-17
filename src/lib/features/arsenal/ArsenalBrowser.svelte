<script lang="ts">
  import { tick } from 'svelte';
  import { currentLanguage, t } from '../../i18n/index.svelte';
  import type { GuideEntry } from '../../contracts/arsenal';
  import { firstSentence, matches } from './guide';
  import { hookCommand, scriptName } from './hook';
  import type { ArsenalProvider } from '../../contracts/arsenal';
  import type { MapNode, MapTool } from './map';

  /**
   * Arsenal as a folding tree and a list (owner, 2026-11-15, sketch B): the tree holds the layers
   * (tool → kind → Personal or each set → category); choosing a category lists its entries at the
   * side, and an entry opens its card. Configuration pages open over the page.
   */
  let {
    roots,
    query = $bindable(''),
    onentry,
    onconfig,
    openId = null,
    onclose = () => undefined,
    card,
    configView,
    configShown = false,
    onlist = () => undefined,
    onitem = () => undefined,
    onparked = () => undefined,
    onpresets = () => undefined,
    listTop,
    presetsView,
  }: {
    /** Hooks kept aside were chosen: they show at the side like a configuration page. */
    onparked?: (key: string) => void;
    onpresets?: (tool: ArsenalProvider) => void;
    presetsView?: import('svelte').Snippet;
    /** A configuration item (a hook) was chosen: its card opens like an entry's. */
    onitem?: (item: import('../../contracts/configuration').ConfigItem) => void;
    /** Drawn over the list of a branch, with its key: e.g. "Add a hook" over a hook event. */
    listTop?: import('svelte').Snippet<[string]>;
    /** Hooks, MCP or Configuration, shown at the side like a list when one is chosen. */
    configView?: import('svelte').Snippet;
    configShown?: boolean;
    /** A list of entries was chosen: a configuration page shown at the side gives way. */
    onlist?: () => void;
    /** The entry whose card is open: its row goes to the top and the card fills the rest. */
    openId?: string | null;
    onclose?: () => void;
    card?: import('svelte').Snippet;
    roots: MapNode[];
    /** What is typed in the search box over the tree: it lists every entry that matches. */
    query?: string;
    onentry: (entry: GuideEntry) => void;
    onconfig: (tool: MapTool, section: 'hooks' | 'mcp' | 'global') => void;
  } = $props();

  type Branch = Extract<MapNode, { kind: 'branch' }>;
  /** A branch whose children are all entries: it is chosen, not folded. */
  const isList = (n: Branch) =>
    n.children.length > 0 &&
    n.children.every((c) => c.kind === 'entry' || c.kind === 'item');

  let opened = $state<Set<string>>(new Set());
  let selected = $state<string | null>(null);

  // Opens the first tool's own skills on the first category, once there is something.
  $effect(() => {
    if (selected !== null || roots.length === 0) return;
    const path: string[] = [];
    let level: MapNode[] = roots;
    for (;;) {
      const first = level.find((n): n is Branch => n.kind === 'branch');
      if (!first) break;
      if (isList(first)) {
        selected = first.key;
        break;
      }
      path.push(first.key);
      level = first.children;
    }
    opened = new Set(path);
  });

  function findNode(nodes: MapNode[], key: string): MapNode | null {
    for (const n of nodes) {
      if (n.key === key) return n;
      if (n.kind === 'branch') {
        const inner = findNode(n.children, key);
        if (inner) return inner;
      }
    }
    return null;
  }
  const selectedNode = $derived(selected ? findNode(roots, selected) : null);
  const shown = $derived(selectedNode?.kind === 'branch' ? selectedNode : null);
  const presetsShown = $derived(
    selectedNode?.kind === 'presets' ? selectedNode : null,
  );
  const entries = $derived(
    shown
      ? shown.children.filter(
          (c): c is Extract<MapNode, { kind: 'entry' }> => c.kind === 'entry',
        )
      : [],
  );

  let listEl = $state<HTMLDivElement | null>(null);
  /** Where the list was and which row opened the card: both come back when it closes. */
  let kept: { top: number; id: string } | null = null;
  $effect(() => {
    const id = openId;
    if (!listEl) return;
    if (id !== null) {
      if (kept === null) kept = { top: listEl.scrollTop, id };
      listEl.scrollTop = 0;
      return;
    }
    if (kept === null) return;
    const back = kept;
    kept = null;
    void tick().then(() => {
      if (!listEl) return;
      listEl.scrollTop = back.top;
      listEl
        .querySelector<HTMLElement>(`[data-entry="${CSS.escape(back.id)}"]`)
        ?.focus({ preventScroll: true });
    });
  });
  /** The tree folded away, to give the list the width. */
  let folded = $state(false);
  type Leaf = Extract<MapNode, { kind: 'entry' }>;
  const found = $derived.by((): Leaf[] => {
    if (query.trim() === '') return [];
    const out: Leaf[] = [];
    const seen: Record<string, true> = {};
    const walk = (nodes: MapNode[]) => {
      for (const n of nodes) {
        if (n.kind === 'entry') {
          if (!seen[n.key] && matches(n.entry, query)) {
            seen[n.key] = true;
            out.push(n);
          }
        } else if (n.kind === 'branch') walk(n.children);
      }
    };
    walk(roots);
    return out;
  });
  type ItemLeaf = Extract<MapNode, { kind: 'item' }>;
  const items = $derived(
    shown && query.trim() === '' && openId === null
      ? shown.children.filter((c): c is ItemLeaf => c.kind === 'item')
      : [],
  );
  const all = $derived(query.trim() !== '' ? found : entries);
  // With a card open, only the card is shown.
  const listed = $derived(openId === null ? all : []);

  function pick(node: MapNode) {
    if (node.kind === 'parked') {
      selected = node.key;
      return onparked(node.key);
    }
    if (node.kind === 'config') {
      selected = node.key;
      return onconfig(node.tool, node.section);
    }
    if (node.kind === 'presets') {
      selected = node.key;
      query = '';
      return onpresets(node.tool);
    }
    if (node.kind !== 'branch') return;
    if (isList(node)) {
      selected = node.key;
      onlist();
      return;
    }
    opened = opened.has(node.key)
      ? new Set([...opened].filter((k) => k !== node.key))
      : new Set([...opened, node.key]);
  }
  function describe(entry: GuideEntry): string {
    if (entry.unreadable) return t('Its text could not be read.');
    if (entry.description === '') return t('Its file has no description.');
    return firstSentence(
      (currentLanguage() === 'es' && entry.description_es) || entry.description,
    );
  }
</script>

<div class="ab-split" class:folded>
  <div class="ab-side">
    <div class="ab-head">
      {#if !folded}
        <input
          type="search"
          class="ab-search"
          placeholder={t('Search')}
          aria-label={t('Search skills and agents')}
          bind:value={query}
        />
      {/if}
      <button
        type="button"
        class="ab-fold"
        aria-label={folded ? t('Show the tree') : t('Hide the tree')}
        title={folded ? t('Show the tree') : t('Hide the tree')}
        aria-expanded={!folded}
        onclick={() => (folded = !folded)}>{folded ? '»' : '«'}</button
      >
    </div>
    {#if !folded}
      {#snippet branch(nodes: MapNode[], cls: string)}
        <ul
          class={cls}
          aria-label={cls === 'ab-tree' ? t('Arsenal') : undefined}
        >
          {#each nodes.filter((n) => n.kind !== 'entry') as node (node.key)}
            {@const folds = node.kind === 'branch' && !isList(node)}
            <li>
              <button
                type="button"
                class="ab-item"
                aria-expanded={folds ? opened.has(node.key) : undefined}
                aria-current={selected === node.key ? 'page' : undefined}
                aria-haspopup={node.kind === 'config' ? 'dialog' : undefined}
                onclick={() => pick(node)}
              >
                {#if folds}<span class="ab-chev" aria-hidden="true"
                    >{opened.has(node.key) ? '▾' : '▸'}</span
                  >{/if}
                <span class="ab-label">{node.label}</span>
                {#if node.kind === 'branch' && node.count !== null}
                  <span class="ab-count">{node.count}</span>
                {:else if node.kind === 'config'}
                  <span class="ab-count">{node.count}</span>
                {:else if node.kind === 'presets'}
                  <span class="ab-count">{node.count}</span>
                {/if}
              </button>
              {#if folds && node.kind === 'branch' && opened.has(node.key)}
                {@render branch(node.children, 'ab-sub')}
              {/if}
            </li>
          {/each}
        </ul>
      {/snippet}
      {@render branch(roots, 'ab-tree')}
    {/if}
  </div>

  <div class="ab-list" bind:this={listEl}>
    {#if configShown && configView}
      {@render configView()}
    {:else if openId !== null}
      <!-- The card says where it is: no list title over it. -->
    {:else if presetsShown}
      <!-- The preset panel supplies its own heading. -->
    {:else if query.trim() !== ''}
      <h2 class="ab-title">
        {t('{n} found for “{q}”', { n: found.length, q: query.trim() })}
      </h2>
    {:else if shown}
      <h2 class="ab-title">
        {shown.label}
        <span class="ars-count">{entries.length + items.length}</span>
      </h2>
    {:else if !presetsShown && listed.length === 0}
      <p class="lib-muted">{t('Choose a category in the tree.')}</p>
    {/if}
    {#if presetsShown && presetsView && !configShown && openId === null}
      {@render presetsView()}
    {/if}
    {#if shown && listTop && openId === null && query.trim() === '' && !configShown}
      {@render listTop(shown.key)}
    {/if}
    {#if items.length > 0 && !configShown}
      <ul class="ars-rows">
        {#each items as it (it.key)}
          <li>
            <button
              type="button"
              class="ars-row"
              data-entry={it.item.id}
              onclick={() => onitem(it.item)}
            >
              <span class="lib-name" title={it.item.name}
                >{scriptName(hookCommand(it.item)) || it.label}</span
              >
              <span class="lib-desc">{hookCommand(it.item)}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    <ul class="ars-rows" hidden={configShown}>
      {#each listed as e (e.key)}
        <li>
          <button
            type="button"
            class="ars-row"
            data-entry={e.entry.id}
            aria-expanded={openId === e.entry.id}
            onclick={() =>
              openId === e.entry.id ? onclose() : onentry(e.entry)}
          >
            <span class="lib-name" title={e.entry.name}>{e.entry.name}</span>
            <span class="lib-desc">{describe(e.entry)}</span>
          </button>
        </li>
      {/each}
    </ul>
    {#if openId !== null && card}
      {@render card()}
    {/if}
  </div>
</div>
