<script lang="ts">
  import { msg, t } from '../../i18n/index.svelte';
  import type { ConfigItem, ItemKind } from '../../contracts/configuration';
  import type { GuideSetKind } from '../../contracts/arsenal';
  import { CONFIG_KINDS, treeOf, type GuideSection } from './guide';
  import type { GuideStore } from './guide-store.svelte';

  /**
   * Arsenal's pages, under Arsenal in Personalization's column (arsenal-UI-SPEC "Etapa 4"): the
   * Guide, the owner's own skills, the sets they come from, agents and the configuration pages.
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

  /** A set's name on screen: those the desktop names in English go through `t()`. */
  const SET_NAME: Partial<Record<GuideSetKind, string>> = {
    account: msg('Claude account'),
    system: msg('Included with Codex'),
    repos: msg('Git repos'),
  };

  const tree = $derived(
    store.tool === 'opencode' ? null : treeOf(store.guide, store.tool),
  );
  const loading = $derived(store.guide === null);
  function configCount(kinds: readonly ItemKind[]): number | '…' {
    if (configItems === null) return '…';
    return configItems.filter(
      (item) => item.provider === store.tool && kinds.includes(item.kind),
    ).length;
  }
  const lit = (section: GuideSection) =>
    current && store.section === section ? 'page' : undefined;
</script>

<ul class="ars-tree" aria-label={t('Arsenal')}>
  {#if tree}
    <li>
      <button
        type="button"
        class="ars-tree-item"
        aria-current={lit('guide')}
        onclick={() => onpick('guide')}>{t('Guide')}</button
      >
    </li>
    <li>
      <button
        type="button"
        class="ars-tree-item"
        aria-current={lit('mine')}
        onclick={() => onpick('mine')}
        >{t('Mine')}
        <span class="ars-tree-count">{loading ? '…' : tree.mine}</span></button
      >
    </li>
    {#if tree.sets.length > 0}
      <li class="ars-tree-label" aria-hidden="true">{t('Sets')}</li>
      {#each tree.sets as row (row.set.key)}
        {@const named = SET_NAME[row.set.kind]}
        <li>
          <button
            type="button"
            class="ars-tree-item nested"
            aria-current={lit(`set:${row.set.key}`)}
            onclick={() => onpick(`set:${row.set.key}`)}
            >{named ? t(named) : row.set.name}
            <span class="ars-tree-count">{row.count}</span></button
          >
        </li>
      {/each}
    {/if}
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
  {#each [['hooks', msg('Hooks')], ['mcp', msg('MCP')], ['global', msg('Global')]] as const as [id, name] (id)}
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
