<script lang="ts">
  import type { ArsenalProvider, Selection } from '../../contracts/arsenal';
  import {
    listLaunches,
    type Launch,
    type LaunchList,
  } from '../../desktop/launch-client';
  import { t, tPhrase } from '../../i18n/index.svelte';
  import {
    bulkSummary,
    type ArsenalController,
    type ArsenalState,
  } from './controller';
  import { eligibleCandidates } from './import';

  let {
    visible,
    provider,
    arsenal,
    controller,
    onedit,
    oncreate,
    launches: readLaunches = listLaunches,
  }: {
    visible: boolean;
    provider: ArsenalProvider;
    arsenal: ArsenalState;
    controller: Pick<
      ArsenalController,
      'deleteSelection' | 'importEligible' | 'loadSelections' | 'discover'
    >;
    onedit: (id: string) => void;
    oncreate: (selection: Selection) => void;
    launches?: typeof listLaunches;
  } = $props();

  let launchList = $state<LaunchList | null>(null);
  let launchPhase = $state<'loading' | 'ready' | 'failed'>('loading');
  let launchRead = 0;
  let confirming = $state<string | null>(null);
  let deleting = $state<string | null>(null);

  const label = $derived(provider === 'claude_code' ? 'Claude Code' : 'Codex');
  const selections = $derived(
    arsenal.selections.filter((selection) => selection.provider === provider),
  );
  const eligibleCount = $derived(
    eligibleCandidates(arsenal.discover?.candidates ?? []).length,
  );

  $effect(() => {
    if (!visible) return;
    const read = ++launchRead;
    launchPhase = 'loading';
    void readLaunches().then(
      (list) => {
        if (read !== launchRead) return;
        launchList = list;
        launchPhase = 'ready';
      },
      () => {
        if (read !== launchRead) return;
        launchList = null;
        launchPhase = 'failed';
      },
    );
  });

  function launchesFor(selection: Selection): Launch[] {
    return (launchList?.launches ?? []).filter(
      (launch) =>
        launch.kind === 'session' &&
        launch.agent === selection.provider &&
        launch.preset === selection.name,
    );
  }

  function duplicate(selection: Selection): boolean {
    return (
      selections.filter((candidate) => candidate.name === selection.name)
        .length > 1
    );
  }

  function confirmation(selection: Selection): string {
    const used = launchesFor(selection);
    if (used.length === 0)
      return t(
        'No launch on this computer uses this preset. Deleting it syncs to the other computer; its launches are not visible here.',
      );
    return t(
      'Deleting this preset stops {launches} from starting. The deletion syncs to the other computer; its launches are not visible here.',
      { launches: used.map((launch) => launch.name).join(', ') },
    );
  }

  async function confirmDelete(selection: Selection) {
    if (deleting) return;
    deleting = selection.id;
    if (await controller.deleteSelection(selection.id)) confirming = null;
    deleting = null;
  }
</script>

<section class="presets-panel" aria-label={t('Presets')}>
  <header class="ars-card-head">
    <h2>{t('Presets')} · {label}</h2>
  </header>

  {#if arsenal.notice}
    <p
      class="preset-notice"
      data-tone={arsenal.notice.tone}
      role={arsenal.notice.tone === 'error' ? 'alert' : 'status'}
      aria-live={arsenal.notice.tone === 'error' ? 'assertive' : 'polite'}
    >
      {tPhrase(arsenal.notice.text)}
    </p>
  {/if}

  <div class="preset-import">
    <p>
      {#if arsenal.discover}
        {t('Library: {imported} imported · {new} new on disk', {
          imported: arsenal.library.length,
          new: eligibleCount,
        })}
      {:else if arsenal.discovering}
        {t('Searching for new capabilities…')}
      {:else}
        {t('New capabilities could not be read.')}
      {/if}
    </p>
    <div class="preset-import-actions">
      <button
        type="button"
        class="action"
        disabled={arsenal.discovering || arsenal.busy !== null}
        onclick={() => void controller.discover()}
        >{arsenal.discovering
          ? t('Searching for new capabilities…')
          : t('Scan again')}</button
      >
      {#if eligibleCount > 0}
        <button
          type="button"
          class="action"
          disabled={arsenal.busy !== null || arsenal.discovering}
          aria-busy={arsenal.busy === 'import'}
          onclick={() => void controller.importEligible()}
          >{arsenal.busy === 'import' && arsenal.bulk && !arsenal.bulk.finished
            ? t('Importing {done} of {total}…', {
                done: arsenal.bulk.done,
                total: arsenal.bulk.total,
              })
            : t('Import the {count} new capabilities', {
                count: eligibleCount,
              })}</button
        >
      {/if}
    </div>
  </div>

  {#if arsenal.bulk && !arsenal.bulk.finished}
    <progress
      max={arsenal.bulk.total}
      value={arsenal.bulk.done}
      aria-label={t('Bulk import progress')}
    ></progress>
  {:else if arsenal.bulk?.finished}
    <p
      role={arsenal.bulk.failures.length || arsenal.bulk.stopped
        ? 'alert'
        : 'status'}
    >
      {tPhrase(bulkSummary(arsenal.bulk))}
    </p>
    {#each arsenal.bulk.failures as failure (failure.id)}
      <p role="alert">{failure.name}: {t(failure.text)}</p>
    {/each}
    {#if arsenal.bulk.stopped}
      <p role="alert">{t(arsenal.bulk.stopped)}</p>
    {/if}
  {/if}

  {#if arsenal.selectionsFailure}
    <p role="alert">{t(arsenal.selectionsFailure)}</p>
    <button
      type="button"
      class="action"
      onclick={() => void controller.loadSelections()}>{t('Try again')}</button
    >
  {:else if launchPhase === 'loading'}
    <p role="status">{t('Reading launches…')}</p>
  {:else if launchPhase === 'failed'}
    <p role="alert">{t('Workspace could not be read.')}</p>
    <button
      type="button"
      class="action"
      onclick={() => {
        launchPhase = 'loading';
        const read = ++launchRead;
        void readLaunches().then(
          (list) => {
            if (read === launchRead) {
              launchList = list;
              launchPhase = 'ready';
            }
          },
          () => {
            if (read === launchRead) launchPhase = 'failed';
          },
        );
      }}>{t('Try again')}</button
    >
  {:else if selections.length === 0}
    <p class="lib-muted">{t('No presets for this tool.')}</p>
  {:else}
    <ul class="preset-list">
      {#each selections as selection (selection.id)}
        {@const used = launchesFor(selection)}
        {@const duplicateName = duplicate(selection)}
        <li class="preset-row">
          <div class="preset-main">
            <h3>
              {selection.name}
              {#if duplicateName}
                <span
                  class="badge"
                  data-tone="warn"
                  title={t(
                    'Duplicate preset names block launches using that name.',
                  )}>{t('Duplicate name')}</span
                >
              {/if}
            </h3>
            <p>{t('{count} items', { count: selection.items.length })}</p>
            {#if used.length > 0}
              <ul class="preset-uses">
                {#each used as launch (launch.id)}
                  <li>
                    <span>{launch.name}</span>
                    <button
                      type="button"
                      class="action"
                      aria-label={t('Edit launch {name} in Workspace', {
                        name: launch.name,
                      })}
                      onclick={() => onedit(launch.id)}>{t('Edit')}</button
                    >
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="lib-muted">{t('No launch uses this preset.')}</p>
            {/if}
          </div>
          <div class="preset-actions">
            {#if used.length === 0}
              <button
                type="button"
                class="action"
                disabled={duplicateName}
                title={duplicateName
                  ? t('Remove duplicate preset names before creating a launch.')
                  : undefined}
                onclick={() => oncreate(selection)}
                >{t('Create launch with it')}</button
              >
            {/if}
            {#if confirming === selection.id}
              <p class="preset-confirmation">{confirmation(selection)}</p>
              <button
                type="button"
                class="action danger"
                disabled={deleting === selection.id}
                onclick={() => void confirmDelete(selection)}
                >{deleting === selection.id
                  ? t('Deleting…')
                  : t('Confirm delete')}</button
              >
              <button
                type="button"
                class="action"
                disabled={deleting === selection.id}
                onclick={() => (confirming = null)}>{t('Cancel')}</button
              >
            {:else}
              <button
                type="button"
                class="action"
                onclick={() => (confirming = selection.id)}
                >{t('Delete')}</button
              >
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .presets-panel {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .preset-notice[data-tone='error'] {
    color: var(--danger, #b42318);
  }
  .preset-import {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
  }
  .preset-import p,
  .preset-main p,
  .preset-confirmation {
    margin: 0;
    font-size: var(--text-sm);
  }
  .preset-import-actions,
  .preset-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .preset-list,
  .preset-uses {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .preset-row {
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    justify-content: space-between;
    gap: 8px 16px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  .preset-main {
    display: grid;
    gap: 5px;
    min-width: 0;
  }
  .preset-main h3 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--text-md);
  }
  .preset-main > p,
  .preset-uses {
    color: var(--muted);
    font-size: var(--text-sm);
  }
  .preset-uses li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
  }
  .preset-uses .action {
    min-height: 28px;
    padding-inline: 8px;
  }
  .preset-actions {
    justify-content: end;
  }
  .preset-confirmation {
    flex-basis: 100%;
    color: var(--muted);
  }
</style>
