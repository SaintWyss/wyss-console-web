<script lang="ts">
  import { t, tIncoming, tPhrase } from '../../i18n/index.svelte';
  import type { NativeState } from '../native/controller';
  import { distributorCards, SUGGESTED } from './present';
  import {
    distributorsClient,
    DistributorError,
    type AddedDistributor,
    type DistributorsClient,
    type SaveDistributorInput,
  } from '../../desktop/distributors-client';

  let {
    visible,
    native,
    launcherAnswered,
    onrun = () => undefined,
    onlaunch = () => undefined,

    client = distributorsClient,
  }: {
    visible: boolean;
    native: NativeState;
    /** False when the most recent `native_launcher` read did not answer. */
    launcherAnswered: boolean;
    /** Opens a terminal in the Console that types `input`, where it is seen. */
    onrun?: (title: string, cwd: string, input: string) => void;
    /** A launch was made: Workspace opens on it. */
    onlaunch?: (id: string) => void;
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
  let firstField = $state<HTMLInputElement | null>(null);
  // The dialog takes the focus on its first field, so Esc and Tab work at once.
  $effect(() => {
    if (form && firstField) firstField.focus();
  });
  /** What Open types for each tool the Console knows. */
  const OPEN_COMMAND: Record<string, string> = {
    claude_code: 'claude',
    codex: 'codex',
    opencode: 'opencode',
  };
  function close() {
    form = null;
    addedError = null;
    notice = null;
    confirmDelete = null;
  }
  let notice = $state<string | null>(null);

  function hostMessage(error: unknown): string | null {
    if (error instanceof DistributorError) {
      if (error.reasons[0]) return tIncoming(error.reasons[0]);
      return error.code === 'distributor_unavailable'
        ? t('The distributors could not be reached.')
        : t('The desktop could not complete the request.');
    }
    return error instanceof Error ? tIncoming(error.message) : null;
  }

  function failureMessage(error: unknown, fallback: string): string {
    return hostMessage(error) ?? t(fallback);
  }

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
  // Read each time the view is shown so files edited by hand or on the other computer appear.
  let shown = false;
  $effect(() => {
    if (visible && !shown) {
      shown = true;
      void readAdded();
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
    notice = null;
    // The dialog this save belongs to: if it was closed or replaced before the answer, the
    // answer does not touch the one shown now.
    const mine = form;
    try {
      const clean = (v: string | null) => (v && v.trim() ? v.trim() : null);
      const isNew = form.id === null;
      const saved = await client.save({
        ...form,
        name: form.name.trim(),
        open: form.open.trim(),
        maker: clean(form.maker),
        update: clean(form.update),
        note: clean(form.note),
      });
      // A new tool gets its launch in Workspace right away: adding it is what makes it usable.
      if (isNew)
        try {
          await client.makeLaunch(saved.id);
        } catch (e) {
          const original = e instanceof Error ? e.message : '';
          if (!original.includes('exists')) {
            const why = hostMessage(e) ?? '';
            notice = t(
              'It was added, but its launch could not be made: {why}',
              {
                why,
              },
            );
          }
        }
      if (form === mine) form = null;
      await readAdded();
    } catch (e) {
      if (form === mine)
        addedError = failureMessage(e, 'It could not be saved.');
    } finally {
      working = false;
    }
  }
  async function remove(id: string) {
    working = true;
    notice = null;
    try {
      await client.remove(id);
      confirmDelete = null;
      await readAdded();
    } catch (e) {
      addedError = failureMessage(e, 'It could not be deleted.');
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
      addedError = failureMessage(e, 'It could not be read.');
    }
  }
  async function makeLaunch(id: string) {
    working = true;
    notice = null;
    try {
      const launch = await client.makeLaunch(id);
      onlaunch(launch);
    } catch (e) {
      addedError = failureMessage(e, 'The launch could not be made.');
    } finally {
      working = false;
    }
  }

  const cards = $derived(
    distributorCards(launcherAnswered ? native.launcher : null),
  );
</script>

<section
  class="distributors-feature"
  aria-label={t('Distributors')}
  hidden={!visible}
  inert={!visible}
>
  {#if addedError && !form}<p class="notice" data-tone="error" role="alert">
      {addedError}
    </p>{/if}
  {#if notice}<p class="notice" data-tone="ok" role="status">{notice}</p>{/if}
  <div class="dist-grid">
    {#each cards as card (card.id)}
      {@const command = OPEN_COMMAND[card.agent]}
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
          <button
            type="button"
            class="action"
            disabled={!card.installed || !home || !command}
            title={command
              ? t('Types “{command}” in a new terminal of the Console.', {
                  command,
                })
              : ''}
            onclick={() => command && onrun(card.tool, home, `${command}\r`)}
            >{t('Open')}</button
          >
          <button
            type="button"
            class="action"
            disabled={!card.update || !card.installed || !home}
            title={card.update
              ? t(
                  'Types “{command}” in a new terminal of the Console, where you see it run.',
                  { command: card.update },
                )
              : ''}
            onclick={() =>
              card.update && onrun(card.tool, home, `${card.update}\r`)}
            >{t('Update tool')}</button
          >
          <!-- Locked: the Console is built around these tools (docs/DECISIONS.md). -->
          <button
            type="button"
            class="action"
            disabled
            title={t('Comes with the Console: it cannot be edited or deleted.')}
            >{t('Edit')}</button
          >
          <button type="button" class="action" disabled>{t('Delete')}</button>
        </div>
      </article>
    {/each}
    {#each added as d (d.id)}
      <article class="dist-card" aria-label={d.name} data-id={`added:${d.id}`}>
        <div class="dist-head">
          <h3
            title={d.found
              ? t('Found at {path}.', { path: d.found })
              : t('“{command}” was not found, or is not an executable file.', {
                  command: d.executable,
                })}
          >
            {d.maker ? `${d.maker} · ` : ''}{d.name} ·
            <span class="dist-status" class:ok={d.found !== null}
              >{d.found ? t('Installed') : t('Tool not installed')}</span
            >
          </h3>
        </div>
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
          <!-- Always there: without an update command it opens Edit to set one. -->
          <button
            type="button"
            class="action"
            disabled={!home}
            title={d.update
              ? t(
                  'Types “{command}” in a new terminal of the Console, where you see it run.',
                  { command: d.update },
                )
              : t('It has no update command yet: set one in Edit.')}
            onclick={() =>
              d.update
                ? void run(d.id, 'update')
                : (form = {
                    id: d.id,
                    name: d.name,
                    maker: d.maker,
                    open: d.open,
                    update: d.update,
                    note: d.note,
                  })}>{t('Update tool')}</button
          >
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
              onclick={() => void remove(d.id)}>{t('Confirm delete')}</button
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
              title={t(
                'Removes its card and the launch made from it, unless you changed that launch by hand. The tool itself stays installed.',
              )}
              onclick={() => (confirmDelete = d.id)}>{t('Delete')}</button
            >
          {/if}
        </div>
      </article>
    {/each}
  </div>
  {#each refusedFiles as r (r.id)}
    <p class="notice" data-tone="warn">{r.id}.toml: {tIncoming(r.error)}</p>
  {/each}
  <div class="dist-foot">
    <button
      type="button"
      class="action"
      title={t(
        'Add a tool the Console does not know: by its name and the commands that open and update it.',
      )}
      onclick={() => (form = blank())}>{t('Add a tool')}</button
    >
  </div>

  {#if form}
    {@const f = form}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class="ars-overlay"
      onclick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        class="ars-card"
        role="dialog"
        aria-modal="true"
        aria-label={f.id ? t('Edit distributor') : t('Add distributor')}
        tabindex="-1"
        onkeydown={(e) => {
          if (e.key === 'Escape') close();
        }}
      >
        <form
          class="dist-form"
          aria-label={f.id ? t('Edit distributor') : t('Add distributor')}
          onsubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {#if addedError}<p class="notice" data-tone="error" role="alert">
              {addedError}
            </p>{/if}
          {#if !f.id}
            <div class="dist-suggest">
              <span class="dist-note">{t('Suggestions:')}</span>
              {#each SUGGESTED as s (s.name)}
                <button
                  type="button"
                  class="action"
                  title={t(
                    'Fills in its name, maker and the command that opens it. Its update command depends on how you installed it.',
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
          <label class="le-field"
            ><span>{t('Name')}</span>
            <input
              class="le-input"
              maxlength="60"
              bind:this={firstField}
              bind:value={f.name}
            /></label
          >
          <label class="le-field" title={t('Who makes it.')}
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
              'Typed in a new terminal by Update. It depends on how you installed the tool.',
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
          <label class="le-field" title={t('Anything to remember about it.')}
            ><span>{t('Note')}</span>
            <input
              class="le-input"
              maxlength="280"
              value={f.note ?? ''}
              oninput={(e) => (f.note = e.currentTarget.value)}
            /></label
          >
          <div class="dist-actions">
            {#if f.id}
              {@const id = f.id}
              <button
                type="button"
                class="action"
                disabled={working}
                title={t(
                  'Makes a launch in Workspace that opens it, so it starts from + Launch like the others.',
                )}
                onclick={() => void makeLaunch(id)}>{t('Make launch')}</button
              >
            {/if}
            <span class="dist-spacer"></span>
            <button type="button" class="action" onclick={close}
              >{t('Cancel')}</button
            >
            <button
              type="submit"
              class="action primary"
              disabled={!formOk || working}>{t('Save')}</button
            >
          </div>
        </form>
      </div>
    </div>
  {/if}
</section>
