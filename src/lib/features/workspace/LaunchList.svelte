<script lang="ts">
  import type { Launch } from '../../desktop/launch-client';
  import { t, tIncoming } from '../../i18n/index.svelte';
  import type { LaunchGroups } from './model';

  let {
    groups,
    query,
    selected,
    phase,
    refused,
    disabled = false,
    onquery,
    onpick,
    onnew,
  }: {
    groups: LaunchGroups;
    query: string;
    selected: string | null;
    phase: 'idle' | 'loading' | 'ready' | 'failed';
    refused: readonly { id: string; error: string }[];
    disabled?: boolean;
    onquery: (query: string) => void;
    onpick: (launch: Launch) => void;
    onnew: () => void;
  } = $props();

  const total = $derived(groups.system.length + groups.agents.length);
</script>

<aside class="workspace-list" aria-label={t('Saved launches')}>
  <label class="workspace-search">
    <span class="visually-hidden">{t('Search')}</span>
    <input
      type="search"
      placeholder={t('Search')}
      aria-label={t('Search')}
      value={query}
      {disabled}
      oninput={(event) => onquery(event.currentTarget.value)}
    />
  </label>
  <nav aria-label={t('Launch groups')}>
    <section class="launch-group" aria-labelledby="launch-group-system">
      <h2 id="launch-group-system">{t('System')}</h2>
      {#each groups.system as launch (launch.id)}
        <button
          class="launch-item"
          type="button"
          aria-current={selected === launch.id ? 'true' : undefined}
          {disabled}
          onclick={() => onpick(launch)}
        >
          <span>{launch.name}</span>
          {#if selected === launch.id}
            <span class="current-label"
              ><span aria-hidden="true">✓</span> {t('Selected')}</span
            >
          {/if}
        </button>
      {/each}
    </section>
    <section class="launch-group" aria-labelledby="launch-group-agents">
      <h2 id="launch-group-agents">{t('Agents')}</h2>
      {#each groups.agents as launch (launch.id)}
        <button
          class="launch-item"
          type="button"
          aria-current={selected === launch.id ? 'true' : undefined}
          {disabled}
          onclick={() => onpick(launch)}
        >
          <span>{launch.name}</span>
          {#if selected === launch.id}
            <span class="current-label"
              ><span aria-hidden="true">✓</span> {t('Selected')}</span
            >
          {/if}
        </button>
      {/each}
    </section>
  </nav>
  {#if phase === 'loading' && total === 0}<p class="list-state" role="status">
      {t('Reading launches…')}
    </p>{/if}
  {#if phase === 'ready' && total === 0}
    <p class="list-state">
      {query.trim()
        ? t('No launches match this search.')
        : t('No saved launches yet.')}
    </p>
  {/if}
  {#if refused.length > 0}
    <div class="list-notice" role="status">
      <strong
        ><span aria-hidden="true">⚠</span>
        {t('Files that could not be read')}</strong
      >
      {#each refused as file (file.id)}<p>
          {file.id}: {tIncoming(file.error)}
        </p>{/each}
    </div>
  {/if}
  <button class="workspace-new" type="button" onclick={onnew} {disabled}>
    <span aria-hidden="true">＋</span>
    {t('New')}
  </button>
</aside>

<style>
  .workspace-list {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    padding: 12px 10px;
    border-right: 1px solid var(--line);
    background: var(--surface);
  }
  .workspace-search {
    display: block;
    min-width: 0;
    margin-bottom: 10px;
  }
  .workspace-search input {
    width: 100%;
    min-width: 0;
    min-height: var(--control-h);
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text);
    font: var(--text-sm) var(--font-sans);
  }
  nav {
    min-height: 0;
    overflow: auto;
  }
  .launch-group {
    margin: 8px 0 16px;
  }
  .launch-group h2 {
    margin: 10px 10px 6px;
    color: var(--faint);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .launch-item {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
    min-height: var(--control-h);
    padding: 5px 10px;
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text);
    font-size: var(--text-sm);
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;
  }
  .launch-item:hover:not(:disabled) {
    background: var(--surface-hover);
  }
  .launch-item[aria-current='true'] {
    background: var(--accent-soft);
    font-weight: 600;
  }
  .current-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: none;
    color: var(--text);
    font-size: var(--text-xs);
    font-weight: 500;
  }
  .list-state {
    margin: 8px 10px;
    color: var(--muted);
    font-size: var(--text-xs);
    overflow-wrap: anywhere;
  }
  .list-notice {
    margin: 10px 0;
    padding: 10px;
    border: 1px solid var(--warn);
    border-radius: var(--radius-md);
    background: var(--warn-soft);
    color: var(--warn);
    font-size: var(--text-xs);
    overflow-wrap: anywhere;
  }
  .list-notice p {
    margin-top: 5px;
  }
  .workspace-new {
    width: 100%;
    min-height: var(--control-h);
    margin-top: auto;
    border: 1px dashed var(--line);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--muted);
    text-align: left;
  }
  .workspace-new > span {
    font-size: var(--text-lg);
  }
  @media (max-width: 760px) {
    .workspace-list {
      max-height: 210px;
      border-right: 0;
      border-bottom: 1px solid var(--line);
    }
    nav {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      max-height: 80px;
    }
    .launch-group {
      min-width: 0;
      margin: 0;
    }
    .launch-group h2 {
      margin: 0 6px 4px;
    }
    .workspace-new {
      margin-top: 8px;
    }
  }
</style>
