<script lang="ts">
  import { t } from '../../i18n/index.svelte';
  import {
    saveVariants,
    type Launch,
    type SystemInfo,
    type Variant,
  } from '../../desktop/launch-client';
  import { errorMessage } from './messages';
  import {
    compose,
    DISTROS,
    distroIdOk,
    distroOf,
    fresh,
    linesOf,
  } from './distros';

  let {
    launch,
    system,
    onsaved,
    onopen,
    save = saveVariants,
  }: {
    launch: Extract<Launch, { kind: 'commands' }>;
    system: SystemInfo;
    /** The launch as the desktop read it back after saving. */
    onsaved: (launch: Launch) => void;
    onopen: (id: string) => void;
    save?: typeof saveVariants;
  } = $props();

  /** Each variant with the script as the editor holds it. */
  interface Row extends Variant {
    script: string;
  }
  const rowOf = (v: Variant): Row => ({
    ...v,
    // Commands the switches would not make were edited in the file: kept as typed.
    manual:
      v.manual ||
      (launch.template === 'system-update' &&
        !!distroOf(v.distro) &&
        compose(distroOf(v.distro)!, v.options).join('\n') !==
          v.commands.join('\n')),
    options: [...v.options],
    commands: [...v.commands],
    script: v.commands.join('\n'),
  });

  let rows = $state<Row[]>([]);
  let baseline = $state('');
  let picked = $state<string | null>(null);
  let adding = $state(false);
  let newId = $state('');
  let confirmingRemove = $state(false);
  let busy = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);

  function reset(from: typeof launch) {
    rows = from.variants.map(rowOf);
    baseline = JSON.stringify(rows);
    // The distribution picked stays picked after a save, while it is still there.
    picked = rows.some((r) => r.distro === picked)
      ? picked
      : (from.active ?? rows[0]?.distro ?? null);
    adding = false;
    error = null;
  }
  // A fresh read of the launch (another launch picked, or the saved copy back) starts over.
  let seen: typeof launch | null = null;
  $effect.pre(() => {
    if (launch !== seen) {
      seen = launch;
      reset(launch);
    }
  });

  const isUpdate = $derived(launch.template === 'system-update');
  const dirty = $derived(JSON.stringify(rows) !== baseline);
  const row = $derived(rows.find((r) => r.distro === picked) ?? null);
  const distro = $derived(
    row && isUpdate && !row.manual ? distroOf(row.distro) : undefined,
  );
  const labelOf = (id: string) =>
    (isUpdate ? distroOf(id)?.label : undefined) ?? id;
  /** The distributions that can still be added from the shipped ones. */
  const missing = $derived(
    isUpdate ? DISTROS.filter((d) => !rows.some((r) => r.distro === d.id)) : [],
  );
  const valid = $derived(
    rows.every((r) => linesOf(r.script).length > 0) &&
      (rows.length > 0 || launch.commands.length > 0),
  );

  function setSwitch(id: string, on: boolean) {
    if (!row || !distro) return;
    row.options = on
      ? [...row.options.filter((o) => o !== id), id]
      : row.options.filter((o) => o !== id);
    // Kept in the switches' order, so the file does not change with the order they were pressed.
    row.options = distro.switches
      .map((s) => s.id)
      .filter((s) => row.options.includes(s));
    row.commands = compose(distro, row.options);
    row.script = row.commands.join('\n');
  }
  function editScript(text: string) {
    if (!row) return;
    row.script = text;
    row.commands = linesOf(text);
    // A script typed by hand is kept as typed: the switches would write over it.
    if (isUpdate && distroOf(row.distro)) row.manual = true;
  }
  function backToSwitches() {
    if (!row) return;
    const d = distroOf(row.distro);
    if (!d) return;
    row.manual = false;
    row.commands = compose(d, row.options);
    row.script = row.commands.join('\n');
  }
  function add(id: string) {
    const clean = id.trim().toLowerCase();
    if (!distroIdOk(clean) || rows.some((r) => r.distro === clean)) return;
    const shipped = isUpdate ? distroOf(clean) : undefined;
    rows = [
      ...rows,
      rowOf(
        shipped
          ? fresh(shipped)
          : { distro: clean, commands: [], options: [], manual: true },
      ),
    ];
    picked = clean;
    adding = false;
    newId = '';
  }
  function remove(id: string) {
    if (id === launch.active) return;
    rows = rows.filter((r) => r.distro !== id);
    if (picked === id) picked = launch.active ?? rows[0]?.distro ?? null;
  }

  async function store(): Promise<boolean> {
    if (busy || !valid) return false;
    busy = true;
    error = null;
    notice = null;
    try {
      const fresh = await save(
        launch.id,
        rows.map((r) => ({
          distro: r.distro,
          commands: linesOf(r.script),
          options: [...r.options],
          manual: r.manual,
        })),
      );
      onsaved(fresh);
      notice = t('Saved.');
      return true;
    } catch (e) {
      error = errorMessage(e);
      return false;
    } finally {
      busy = false;
    }
  }
  async function tryIt() {
    if (dirty && !(await store())) return;
    onopen(launch.id);
  }
</script>

<div class="ws-body">
  <div>
    {#if error || (notice && !dirty) || !launch.active}
      <div class="ws-notices">
        {#if error}<p class="notice" data-tone="error" role="alert">
            {error}
          </p>{/if}
        {#if notice && !dirty}<p class="notice" data-tone="ok" role="status">
            {notice}
          </p>{/if}
        {#if !launch.active}
          <p class="notice" data-tone="warn">
            {launch.commands.length > 0
              ? t(
                  'No distribution here matches this computer: the file’s own commands run.',
                )
              : system.id
                ? t(
                    'No distribution here matches this computer: add {id} to start it here.',
                    { id: system.id },
                  )
                : t(
                    'No distribution here matches this computer: add one to start it here.',
                  )}
          </p>
        {/if}
      </div>
    {/if}

    <div class="ws-row">
      <div>
        <label class="ws-label" for="launch-distribution"
          >{t('Distribution')}</label
        >
        <p class="ws-hint">{t('Commands for this computer.')}</p>
      </div>
      <div class="ws-control">
        <div class="ws-pair">
          <select
            id="launch-distribution"
            disabled={busy}
            value={picked ?? ''}
            onchange={(e) => {
              picked = e.currentTarget.value;
              confirmingRemove = false;
            }}
          >
            {#each rows as r (r.distro)}
              <option value={r.distro}>{labelOf(r.distro)}</option>
            {/each}
          </select>
          <button
            type="button"
            class="action"
            disabled={busy}
            aria-expanded={adding}
            onclick={() => (adding = !adding)}>{t('Add')}</button
          >
        </div>
        {#if adding}
          <form
            class="ws-pair"
            onsubmit={(e) => {
              e.preventDefault();
              add(newId);
            }}
          >
            <input
              list="known-distributions"
              placeholder={t('os-release ID, e.g. void')}
              aria-label={t('Distribution ID')}
              maxlength="64"
              bind:value={newId}
            />
            <datalist id="known-distributions">
              {#each missing as d (d.id)}<option value={d.id}>{d.label}</option
                >{/each}
            </datalist>
            <button
              type="submit"
              class="action"
              disabled={!distroIdOk(newId.trim().toLowerCase())}
              >{t('Add distribution')}</button
            >
          </form>
        {/if}
      </div>
    </div>

    {#if row}
      {@const r = row}
      {#if isUpdate && distroOf(r.distro)}
        {@const d = distroOf(r.distro)!}
        <div class="ws-row">
          <div>
            <span class="ws-label">{t('Options')}</span>
            <p class="ws-hint">
              {t('Each option changes the commands below.')}
            </p>
          </div>
          <fieldset class="ws-options" disabled={busy || r.manual}>
            <legend class="visually-hidden">{t('Options')}</legend>
            {#each d.switches as s (s.id)}
              <label title={t(s.hint)}>
                <input
                  type="checkbox"
                  checked={r.options.includes(s.id)}
                  onchange={(e) => setSwitch(s.id, e.currentTarget.checked)}
                />
                <span>
                  {t(s.label)}
                  {#if s.flag}<code>{s.flag}</code>{/if}
                </span>
              </label>
            {/each}
          </fieldset>
        </div>
      {/if}

      <div class="ws-row">
        <div>
          <label class="ws-label" for="launch-commands">{t('Commands')}</label>
          <p class="ws-hint">
            {t('Editable. One per line, in a new terminal in {folder}.', {
              folder: launch.directory,
            })}
          </p>
        </div>
        <div class="ws-control">
          <textarea
            id="launch-commands"
            class="ws-commands"
            spellcheck="false"
            rows={Math.max(5, r.script.split('\n').length + 1)}
            disabled={busy}
            value={r.script}
            oninput={(e) => editScript(e.currentTarget.value)}></textarea>
          {#if r.manual && isUpdate && distroOf(r.distro)}
            <p class="ws-manual" role="status">
              {t('Edited by hand: the options no longer change them.')}
              <button type="button" class="ws-link" onclick={backToSwitches}
                >{t('Rebuild from the options')}</button
              >
            </p>
          {/if}
        </div>
      </div>
    {:else if launch.commands.length > 0}
      <div class="ws-row">
        <div>
          <span class="ws-label">{t('Commands')}</span>
          <p class="ws-hint">
            {t(
              'The file’s own commands, for every distribution. Add one to give it its own.',
            )}
          </p>
        </div>
        <pre class="ws-commands">{launch.commands.join('\n')}</pre>
      </div>
    {/if}
  </div>
</div>

<div class="ws-foot">
  {#if row && row.distro !== launch.active}
    {#if confirmingRemove}
      <span>{t('Remove {name}?', { name: labelOf(row.distro) })}</span>
      <button
        type="button"
        class="action danger"
        onclick={() => {
          remove(row!.distro);
          confirmingRemove = false;
        }}>{t('Remove')}</button
      >
      <button
        type="button"
        class="action"
        onclick={() => (confirmingRemove = false)}>{t('Cancel')}</button
      >
    {:else}
      <button
        type="button"
        class="action ws-delete"
        disabled={busy}
        onclick={() => (confirmingRemove = true)}
        >{t('Remove distribution')}</button
      >
    {/if}
  {/if}
  <span class="ws-spacer"></span>
  {#if dirty}
    <button
      type="button"
      class="action"
      disabled={busy}
      onclick={() => reset(launch)}>{t('Discard')}</button
    >
  {/if}
  <button
    type="button"
    class="action"
    disabled={busy || !valid || (launch.commands.length === 0 && !dirty)}
    onclick={() => void tryIt()}>{t('Try')}</button
  >
  <button
    type="button"
    class="action primary"
    disabled={busy || !dirty || !valid}
    onclick={() => void store()}>{busy ? t('Saving') : t('Save')}</button
  >
</div>
