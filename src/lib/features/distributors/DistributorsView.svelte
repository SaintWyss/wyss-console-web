<script lang="ts">
  import type { ConfigItem } from '../../contracts/configuration';
  import { t, tPhrase } from '../../i18n/index.svelte';
  import type { ModelsState } from '../models/controller';
  import type { NativeState } from '../native/controller';
  import { distributorCards, SUGGESTED } from './present';
  import type { SessionSummary } from '../../contracts/sessions';
  import {
    distributorsClient,
    type AddedDistributor,
    type DistributorsClient,
    type SaveDistributorInput,
  } from '../../desktop/distributors-client';
  import { listedIds, loadSeen, reconcile, saveSeen } from './seen';

  let {
    visible,
    native,
    models,
    configItems,
    configStale,
    onrefresh,
    onrun = () => undefined,
    onlaunch = () => undefined,

    client = distributorsClient,
  }: {
    visible: boolean;
    native: NativeState;
    models: ModelsState;
    configItems: readonly ConfigItem[] | null;
    /** The last read of the agents' files failed: what is held is from an earlier one. */
    configStale: boolean;
    /** Reads the tools, the configuration and the Codex list again; false when the tools did not answer. */
    onrefresh: () => Promise<boolean>;
    /** Opens a terminal in the Console that types `input`, where it is seen. */
    onrun?: (title: string, cwd: string, input: string) => void;
    /** Opens another Personalization tab. */
    /** Opens a page; Configuration opens on the tool of the card it was chosen from. */
    ongo?: (
      view: 'configuration' | 'credentials',
      tool?: 'claude_code' | 'codex' | 'opencode',
    ) => void;
    /** A launch was made: Workspace opens on it. */
    onlaunch?: (id: string) => void;
    /** The managed sessions the Sessions view read (Codex only); null before a read. */
    managed?: readonly SessionSummary[] | null;
    client?: DistributorsClient;
  } = $props();

  // Distributors the owner added, read from their files.
  let added = $state<AddedDistributor[]>([]);
  let refusedFiles = $state<{ id: string; error: string }[]>([]);
  let home = $state('');
  let addedError = $state<string | null>(null);
  let form = $state<SaveDistributorInput | null>(null);
  let confirmDelete = $state<string | null>(null);
  let working = $state(false);
  let notice = $state<string | null>(null);

  async function readAdded() {
    try {
      const list = await client.list();
      added = list.distributors;
      refusedFiles = list.refused;
      home = list.home;
      addedError = null;
    } catch {
      addedError = t('The added distributors did not load.');
    }
  }
  // Read each time the view is shown: a failed read is tried again, and files edited by
  // hand or on the other computer appear.
  // Each time the view is shown it reads everything again: the tools, their files and the
  // Codex list. There is no button for it.
  let shown = false;
  $effect(() => {
    if (visible && !shown) {
      shown = true;
      void refresh();
    } else if (!visible) shown = false;
  });

  const blank = (): SaveDistributorInput => ({
    id: null,
    name: '',
    maker: null,
    open: '',
    update: null,
    note: null,
  });
  const formOk = $derived(
    form !== null &&
      form.name.trim() !== '' &&
      /^(\/|[A-Za-z0-9._-])/.test(form.open.trim()) &&
      !/[\n\r]/.test(form.open + (form.update ?? '')),
  );
  async function submit() {
    if (!form || !formOk || working) return;
    working = true;
    addedError = null;
    try {
      const clean = (v: string | null) => (v && v.trim() ? v.trim() : null);
      await client.save({
        ...form,
        name: form.name.trim(),
        open: form.open.trim(),
        maker: clean(form.maker),
        update: clean(form.update),
        note: clean(form.note),
      });
      form = null;
      await readAdded();
    } catch (e) {
      addedError = e instanceof Error ? e.message : t('It could not be saved.');
    } finally {
      working = false;
    }
  }
  async function remove(id: string) {
    working = true;
    try {
      await client.remove(id);
      confirmDelete = null;
      await readAdded();
    } catch (e) {
      addedError =
        e instanceof Error ? e.message : t('It could not be deleted.');
    } finally {
      working = false;
    }
  }
  /** Opens or updates from the file as it is now: the window's copy is never what is typed. */
  async function run(id: string, what: 'open' | 'update') {
    try {
      const d = await client.get(id);
      const command = what === 'open' ? d.open : d.update;
      if (command) onrun(d.name, home, `${command}\r`);
    } catch (e) {
      addedError = e instanceof Error ? e.message : t('It could not be read.');
    }
  }
  async function makeLaunch(id: string) {
    working = true;
    notice = null;
    try {
      const launch = await client.makeLaunch(id);
      onlaunch(launch);
    } catch (e) {
      addedError =
        e instanceof Error ? e.message : t('The launch could not be made.');
    } finally {
      working = false;
    }
  }

  let busy = $state(false);
  /** Codex models not seen before the last refresh. Gone at the next one. */
  let fresh = $state<string[]>([]);
  /** False after a refresh in which `native_launcher` did not answer: nothing is said of the tools. */
  let answered = $state(true);
  let compared = false;

  /** One comparison per read: what is new is marked, and what was listed is kept. */
  function compare() {
    const result = reconcile(loadSeen(), listedIds(models));
    if (result.save) saveSeen(result.save);
    fresh = result.fresh;
  }
  // The first read of the Codex list, once it has an answer of either kind.
  $effect(() => {
    if (
      !visible ||
      compared ||
      (models.phase !== 'ready' && models.phase !== 'failed')
    )
      return;
    compared = true;
    compare();
  });

  async function refresh() {
    if (busy) return;
    busy = true;
    void readAdded();
    try {
      answered = await onrefresh();
    } catch {
      answered = false;
    }
    busy = false;
    compared = true;
    compare();
  }

  const cards = $derived(
    distributorCards(
      answered ? native.launcher : null,
      models,
      configItems,
      fresh,
      configStale,
    ),
  );
</script>

<section
  class="distributors-feature"
  aria-label={t('Distributors')}
  hidden={!visible}
  inert={!visible}
>
  {#if addedError}<p class="notice" data-tone="error" role="alert">
      {addedError}
    </p>{/if}
  {#if notice}<p class="notice" data-tone="ok" role="status">{notice}</p>{/if}
  <div class="dist-grid">
    {#each cards as card (card.id)}
      <article class="dist-card" aria-label={card.name} data-id={card.id}>
        <div class="dist-head">
          <h3>
            {card.name} · {card.tool} ·
            <span class="dist-status" class:ok={card.installed}
              >{tPhrase(card.status)}</span
            >
          </h3>
        </div>
        <div class="dist-actions">
          {#if card.update}
            <button
              type="button"
              class="action"
              disabled={!card.installed || !home}
              title={t(
                'Types “{command}” in a new terminal of the Console, where you see it run.',
                { command: card.update },
              )}
              onclick={() => onrun(card.tool, home, `${card.update}\r`)}
              >{t('Update')}</button
            >
          {/if}
        </div>
      </article>
    {/each}
  </div>

  <div class="dist-bar">
    <h3 class="dist-section">{t('Added by you')}</h3>
    <button
      type="button"
      class="action"
      title={t(
        'Add a tool the Console does not know: by its name and the commands that open and update it.',
      )}
      disabled={form !== null}
      onclick={() => (form = blank())}>{t('Add')}</button
    >
  </div>
  <p class="dist-note">
    {t(
      'A tool you add opens and updates in a terminal of the Console. Arsenal and the context estimate are only for the tools the Console knows.',
    )}
  </p>
  {#each refusedFiles as r (r.id)}
    <p class="notice" data-tone="warn">{r.id}.toml: {r.error}</p>
  {/each}

  {#if form}
    {@const f = form}
    <form
      class="dist-card dist-form"
      aria-label={f.id ? t('Edit distributor') : t('Add distributor')}
      onsubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {#if !f.id}
        <div class="dist-suggest">
          <span class="dist-note">{t('Suggestions:')}</span>
          {#each SUGGESTED as s (s.name)}
            <button
              type="button"
              class="action"
              title={t(
                'Fills in its name and the command that opens it. Its update command depends on how you installed it.',
              )}
              onclick={() => {
                f.name = s.name;
                f.maker = s.maker;
                f.open = s.open;
              }}>{s.name}</button
            >
          {/each}
        </div>
      {/if}
      <label class="le-field" title={t('How the card is called.')}
        ><span>{t('Name')}</span>
        <input class="le-input" maxlength="60" bind:value={f.name} /></label
      >
      <label class="le-field" title={t('Who makes it. Optional.')}
        ><span>{t('Made by')}</span>
        <input
          class="le-input"
          maxlength="60"
          value={f.maker ?? ''}
          oninput={(e) => (f.maker = e.currentTarget.value)}
        /></label
      >
      <label
        class="le-field"
        title={t(
          'Typed in a new terminal to open it. Its first word is the command looked for to say whether it is installed.',
        )}
        ><span>{t('Command to open')}</span>
        <input
          class="le-input mono"
          placeholder="kimi"
          spellcheck="false"
          bind:value={f.open}
        /></label
      >
      <label
        class="le-field"
        title={t(
          'Typed in a new terminal by Update. Optional: it depends on how you installed the tool.',
        )}
        ><span>{t('Command to update')}</span>
        <input
          class="le-input mono"
          placeholder={t('optional')}
          spellcheck="false"
          value={f.update ?? ''}
          oninput={(e) => (f.update = e.currentTarget.value)}
        /></label
      >
      <label
        class="le-field"
        title={t('Anything to remember about it. Optional.')}
        ><span>{t('Note')}</span>
        <input
          class="le-input"
          maxlength="280"
          value={f.note ?? ''}
          oninput={(e) => (f.note = e.currentTarget.value)}
        /></label
      >
      <div class="dist-actions">
        <span class="dist-spacer"></span>
        <button type="button" class="action" onclick={() => (form = null)}
          >{t('Cancel')}</button
        >
        <button
          type="submit"
          class="action primary"
          disabled={!formOk || working}>{t('Save')}</button
        >
      </div>
    </form>
  {/if}

  <div class="dist-grid">
    {#each added as d (d.id)}
      <article class="dist-card" aria-label={d.name} data-id={`added:${d.id}`}>
        <div class="dist-head">
          <h3>{d.maker ?? d.name}</h3>
          <span
            class="dist-status"
            class:ok={d.found !== null}
            title={d.found
              ? t('Found at {path}.', { path: d.found })
              : t(
                  '“{command}” was not found where the agents are looked for.',
                  {
                    command: d.executable,
                  },
                )}>{d.found ? t('Installed') : t('Tool not installed')}</span
          >
        </div>
        <p class="dist-tool">{d.name}</p>
        <p class="dist-note"><code class="dist-cmd">{d.open}</code></p>
        {#if d.note}<p class="dist-note">{d.note}</p>{/if}
        <div class="dist-actions">
          <button
            type="button"
            class="action"
            disabled={!home}
            title={t('Types “{command}” in a new terminal of the Console.', {
              command: d.open,
            })}
            onclick={() => void run(d.id, 'open')}>{t('Open')}</button
          >
          {#if d.update}
            <button
              type="button"
              class="action"
              disabled={!home}
              title={t(
                'Types “{command}” in a new terminal of the Console, where you see it run.',
                { command: d.update },
              )}
              onclick={() => void run(d.id, 'update')}>{t('Update')}</button
            >
          {/if}
          <button
            type="button"
            class="action"
            disabled={working}
            title={t(
              'Makes a launch in Workspace that opens it, so it starts from + Launch like the others.',
            )}
            onclick={() => void makeLaunch(d.id)}>{t('Make launch')}</button
          >
          <span class="dist-spacer"></span>
          <button
            type="button"
            class="action"
            title={t('Change its name or its commands.')}
            onclick={() =>
              (form = {
                id: d.id,
                name: d.name,
                maker: d.maker,
                open: d.open,
                update: d.update,
                note: d.note,
              })}>{t('Edit')}</button
          >
          {#if confirmDelete === d.id}
            <button
              type="button"
              class="action danger"
              disabled={working}
              onclick={() => void remove(d.id)}>{t('Delete')}</button
            >
            <button
              type="button"
              class="action"
              onclick={() => (confirmDelete = null)}>{t('Cancel')}</button
            >
          {:else}
            <button
              type="button"
              class="action"
              title={t('Removes its card. The tool itself stays installed.')}
              onclick={() => (confirmDelete = d.id)}>{t('Delete')}</button
            >
          {/if}
        </div>
      </article>
    {/each}
  </div>
  {#if added.length === 0 && !form}
    <p class="dist-note">{t('Nothing added yet.')}</p>
  {/if}
</section>
