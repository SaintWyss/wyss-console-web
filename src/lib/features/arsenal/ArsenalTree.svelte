<script lang="ts">
  import { t } from '../../i18n/index.svelte';
  import type { ConfigItem, ItemKind } from '../../contracts/configuration';
  import { CONFIG_KINDS, originsOf, treeOf, type GuideSection } from './guide';
  import { originName } from './origin';
  import type { GuideStore } from './guide-store.svelte';

  /**
   * Arsenal's pages, under Arsenal in Personalization's column (arsenal-UI-SPEC "Etapa 4"): a
   * search box, the skills by where they come from, each with its colour, then agents and the
   * configuration pages.
   */
  let {
    store,
    current,
    configItems,
    onpick,
  }: {
    store: GuideStore;
    /** Arsenal is the page shown: one of its entries is lit. */
    current: boolean;
    /** The agents' configuration as last read; `null` until it is read. */
    configItems: readonly ConfigItem[] | null;
    onpick: (section: GuideSection) => void;
  } = $props();

  const tree = $derived(
    store.tool === 'opencode' ? null : treeOf(store.guide, store.tool),
  );
  const origins = $derived(tree ? originsOf(tree) : []);
  const loading = $derived(store.guide === null);
  function configCount(kinds: readonly ItemKind[]): number | '…' {
    if (configItems === null) return '…';
    return configItems.filter(
      (item) => item.provider === store.tool && kinds.includes(item.kind),
    ).length;
  }
  const lit = (section: GuideSection) =>
    current && store.section === section ? 'page' : undefined;

  function search(value: string) {
    store.query = value;
    // The search looks through skills: from a configuration page it goes back to them.
    if (
      value.trim() !== '' &&
      !store.section.startsWith('origin:') &&
      store.section !== 'agents'
    )
      onpick('origin:mine');
  }
</script>

<div class="ars-tree-wrap">
  {#if tree}
    <input
      type="search"
      class="ars-search"
      placeholder={t('Search skills and agents…')}
      aria-label={t('Search skills and agents')}
      value={store.query}
      oninput={(e) => search(e.currentTarget.value)}
    />
  {/if}
  <ul class="ars-tree" aria-label={t('Arsenal')}>
    {#if tree}
      <li class="ars-tree-label" aria-hidden="true">{t('Skills')}</li>
      {#if loading}
        <li class="ars-tree-label" role="status">{t('Reading…')}</li>
      {/if}
      {#each origins as row (row.origin)}
        <li>
          <button
            type="button"
            class="ars-tree-item"
            data-origin={row.origin}
            aria-current={lit(`origin:${row.origin}`)}
            onclick={() => onpick(`origin:${row.origin}`)}
          >
            <span class="ars-tree-name"
              ><span class="ars-dot" aria-hidden="true"></span>{originName(
                row.origin,
                store.tool,
              )}</span
            >
            <span class="ars-tree-count">{row.count}</span></button
          >
        </li>
      {/each}
      <li class="ars-tree-sep" aria-hidden="true"></li>
      <li>
        <button
          type="button"
          class="ars-tree-item"
          aria-current={lit('agents')}
          onclick={() => onpick('agents')}
          >{t('Agents')}
          <span class="ars-tree-count">{loading ? '…' : tree.agents}</span
          ></button
        >
      </li>
    {/if}
    {#each [['hooks', 'Hooks'], ['mcp', 'MCP'], ['global', 'Global']] as const as [id, name] (id)}
      <li>
        <button
          type="button"
          class="ars-tree-item"
          aria-current={lit(id)}
          onclick={() => onpick(id)}
          >{t(name)}
          <span class="ars-tree-count">{configCount(CONFIG_KINDS[id])}</span
          ></button
        >
      </li>
    {/each}
  </ul>
</div>
