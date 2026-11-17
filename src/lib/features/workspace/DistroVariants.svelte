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
    disabled = false,
    onsaved,
    onopen,
    confirming,
    onrequestremove,
    oncancelremove,
    onremove,
    onbusy,
    save = saveVariants,
  }: {
    launch: Extract<Launch, { kind: 'commands' }>;
    system: SystemInfo;
    disabled?: boolean;
    /** The launch as the desktop read it back after saving. */
    onsaved: (launch: Launch) => void;
    onopen: (id: string) => void;
    confirming: boolean;
    onrequestremove: () => void;
    oncancelremove: () => void;
    onremove: () => void;
    onbusy: (busy: boolean) => void;
    save?: typeof saveVariants;
  } = $props();

  interface Row extends Variant {
    script: string;
  }
  const rowOf = (variant: Variant): Row => ({
    ...variant,
    manual:
      variant.manual ||
      (launch.template === 'system-update' &&
        !!distroOf(variant.distro) &&
        compose(distroOf(variant.distro)!, variant.options).join('\n') !==
          variant.commands.join('\n')),
    options: [...variant.options],
    commands: [...variant.commands],
    script: variant.commands.join('\n'),
  });

  let rows = $state<Row[]>([]);
  let baseline = $state('');
  let picked = $state<string | null>(null);
  let adding = $state(false);
  let selectedAdd = $state('');
  let customId = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);

  function reset(from: typeof launch) {
    rows = from.variants.map(rowOf);
    baseline = JSON.stringify(rows);
    const detected = rows.find((row) => row.distro === system.id)?.distro;
    picked = detected ?? from.active ?? rows[0]?.distro ?? null;
    adding = false;
    selectedAdd = '';
    customId = '';
    error = null;
    notice = null;
  }

  let seen: typeof launch | null = null;
  $effect.pre(() => {
    if (launch !== seen) {
      seen = launch;
      reset(launch);
    }
  });

  const isUpdate = $derived(launch.template === 'system-update');
  const dirty = $derived(JSON.stringify(rows) !== baseline);
  const row = $derived(rows.find((item) => item.distro === picked) ?? null);
  const distro = $derived(row && isUpdate ? distroOf(row.distro) : undefined);
  const labelOf = (id: string) =>
    (isUpdate ? distroOf(id)?.label : undefined) ?? id;
  const missing = $derived(
    isUpdate
      ? DISTROS.filter(
          (item) => !rows.some((entry) => entry.distro === item.id),
        )
      : [],
  );
  const valid = $derived(
    rows.every((item) => linesOf(item.script).length > 0) &&
      (rows.length > 0 || launch.commands.length > 0),
  );
  const custom = $derived(selectedAdd === '__custom__');

  function editScript(text: string) {
    if (!row) return;
    row.script = text;
    row.commands = linesOf(text);
    if (isUpdate && distroOf(row.distro)) row.manual = true;
  }

  function backToSwitches() {
    if (!row) return;
    const definition = distroOf(row.distro);
    if (!definition) return;
    row.manual = false;
    row.commands = compose(definition, row.options);
    row.script = row.commands.join('\n');
  }

  function add(id: string) {
    const clean = id.trim().toLowerCase();
    if (!distroIdOk(clean) || rows.some((item) => item.distro === clean))
      return;
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
    selectedAdd = '';
    customId = '';
  }

  function removeVariant(id: string) {
    if (id === launch.active) return;
    rows = rows.filter((item) => item.distro !== id);
    if (picked === id) picked = launch.active ?? rows[0]?.distro ?? null;
  }

  async function store(): Promise<boolean> {
    if (busy || !valid) return false;
    busy = true;
    onbusy(true);
    error = null;
    notice = null;
    try {
      const saved = await save(
        launch.id,
        rows.map((item) => ({
          distro: item.distro,
          commands: linesOf(item.script),
          options: [...item.options],
          manual: item.manual,
        })),
      );
      onsaved(saved);
      notice = t('Saved.');
      return true;
    } catch (e) {
      error = errorMessage(e);
      return false;
    } finally {
      busy = false;
      onbusy(false);
    }
  }

  async function tryIt() {
    if (dirty && !(await store())) return;
    onopen(launch.id);
  }

  function addSelected() {
    if (custom) add(customId);
    else add(selectedAdd);
  }
</script>

<section
  class="distribution-editor"
  aria-label={t('Update system')}
  inert={disabled || busy}
>
  <h2>{t('Update system')}</h2>
  {#if error}
    <p class="distribution-notice error" role="alert">
      <span aria-hidden="true">×</span><strong>{t('Error')}</strong>{error}
    </p>
  {/if}
  {#if notice && !dirty}
    <p class="distribution-notice success" role="status">
      <span aria-hidden="true">✓</span><strong>{t('Saved')}</strong>{notice}
    </p>
  {/if}
  {#if !launch.active}
    <p class="distribution-notice warning" role="status">
      <span aria-hidden="true">⚠</span>
      <strong>{t('Warning')}</strong>
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

  <div class="distribution-row">
    <label for="launch-distribution">{t('Distribution')}</label>
    <div class="distribution-select">
      <select
        id="launch-distribution"
        value={picked ?? ''}
        disabled={busy || rows.length === 0}
        onchange={(event) => (picked = event.currentTarget.value || null)}
      >
        {#each rows as item (item.distro)}
          <option value={item.distro}>{labelOf(item.distro)}</option>
        {/each}
      </select>
      <button
        type="button"
        class="action add-distribution"
        aria-expanded={adding}
        disabled={busy}
        onclick={() => (adding = !adding)}>{t('Add distribution')}</button
      >
    </div>
  </div>

  {#if adding}
    <div class="add-panel">
      <label for="new-distribution">{t('Add distribution')}</label>
      <div class="distribution-select">
        <select id="new-distribution" bind:value={selectedAdd} disabled={busy}>
          <option value="">{t('Choose a distribution')}</option>
          {#each missing as item (item.id)}<option value={item.id}
              >{item.label}</option
            >{/each}
          <option value="__custom__">{t('Custom distribution ID')}</option>
        </select>
        {#if custom}
          <input
            class="custom-id"
            placeholder={t('os-release ID, e.g. void')}
            aria-label={t('Distribution ID')}
            maxlength="64"
            bind:value={customId}
            disabled={busy}
          />
        {/if}
        <button
          type="button"
          class="action add-confirm"
          disabled={busy ||
            (custom
              ? !distroIdOk(customId.trim().toLowerCase())
              : !selectedAdd)}
          onclick={addSelected}>{t('Add')}</button
        >
      </div>
    </div>
  {/if}

  {#if row}
    {@const current = row}
    <div class="distribution-detail">
      {#if isUpdate && distro}
        <fieldset class="distribution-options" disabled={true}>
          <legend>{t('Options')}</legend>
          {#each distro.switches as option (option.id)}
            <label class="option-row" title={t(option.hint)}>
              <input
                type="checkbox"
                checked={current.options.includes(option.id)}
                disabled
              />
              <span>{t(option.label)}</span>
              {#if option.flag}<code>{option.flag}</code>{/if}
            </label>
          {/each}
        </fieldset>
        {#if current.manual}
          <p class="distribution-notice warning manual-notice" role="status">
            <span aria-hidden="true">⚠</span>
            <strong>{t('Warning')}</strong>
            <span
              >{t(
                'Commands edited by hand: the options no longer change them.',
              )}</span
            >
            <button
              type="button"
              class="rebuild-link"
              disabled={busy}
              onclick={backToSwitches}>{t('Rebuild from the options')}</button
            >
          </p>
        {/if}
      {/if}

      <label class="commands-label" for="launch-commands">{t('Commands')}</label
      >
      <textarea
        id="launch-commands"
        spellcheck="false"
        rows={Math.max(3, current.script.split('\n').length + 1)}
        disabled={busy}
        value={current.script}
        oninput={(event) => editScript(event.currentTarget.value)}></textarea>

      {#if rows.length > 1}
        <div class="variant-list" aria-label={t('Other distributions')}>
          {#each rows as item (item.distro)}
            {#if item.distro !== current.distro}
              <span>{labelOf(item.distro)}</span>
              <button
                type="button"
                class="remove-variant"
                disabled={busy || item.distro === launch.active}
                onclick={() => removeVariant(item.distro)}
                >{t('Remove distribution')}</button
              >
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <p class="distribution-empty">{t('No distributions yet.')}</p>
  {/if}

  <div class="distribution-footer">
    {#if confirming}
      <span class="remove-confirm"
        >{t('Delete {name}?', { name: launch.name })}</span
      >
      <button
        type="button"
        class="remove-launch"
        disabled={busy}
        onclick={onremove}>{t('Delete')}</button
      >
      <button
        type="button"
        class="action"
        disabled={busy}
        onclick={oncancelremove}>{t('Cancel')}</button
      >
    {:else}
      <button
        type="button"
        class="remove-launch"
        disabled={busy}
        onclick={onrequestremove}>{t('Delete launch')}</button
      >
    {/if}
    <span class="footer-spacer"></span>
    <button
      type="button"
      class="action"
      disabled={busy ||
        !row ||
        !valid ||
        (launch.commands.length === 0 && !dirty)}
      onclick={() => void tryIt()}>{t('Try')}</button
    >
    <button
      type="button"
      class="action primary"
      disabled={busy || !row || !dirty || !valid}
      onclick={() => void store()}>{busy ? t('Saving…') : t('Save')}</button
    >
  </div>
</section>

<style>
  .distribution-editor {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: auto;
    padding: 12px 32px 20px;
  }
  h2 {
    margin: 0 0 8px;
    color: var(--text);
    font-size: var(--text-lg);
    font-weight: 600;
  }
  .distribution-notice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 8px 0;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    overflow-wrap: anywhere;
  }
  .distribution-notice strong {
    flex: none;
  }
  .distribution-notice.warning {
    border-color: var(--warn);
    background: var(--warn-soft);
    color: var(--warn);
  }
  .distribution-notice.error {
    border-color: var(--error);
    background: var(--surface);
    color: var(--error);
  }
  .distribution-notice.success {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--text);
  }
  .distribution-row,
  .add-panel {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    align-items: center;
    gap: 24px;
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
    font-size: var(--text-sm);
  }
  .distribution-select {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 140px;
    gap: 8px;
    min-width: 0;
  }
  select,
  input,
  textarea {
    width: 100%;
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text);
    font: var(--text-sm) var(--font-sans);
  }
  select,
  input {
    min-height: var(--control-h);
  }
  select {
    padding: 0 36px 0 10px;
  }
  input {
    padding: 0 10px;
  }
  textarea {
    min-height: 140px;
    padding: 10px 12px;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 1.6;
    resize: vertical;
  }
  .add-distribution,
  .add-confirm {
    width: 140px;
    white-space: normal;
  }
  .add-panel {
    align-items: start;
  }
  .distribution-detail {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    padding: 18px 0 0;
  }
  .distribution-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 24px;
    max-height: 320px;
    overflow: auto;
    margin: 0 0 12px;
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
  }
  .distribution-options legend {
    padding: 0 6px;
    color: var(--text);
    font-size: var(--text-sm);
    font-weight: 600;
  }
  .option-row {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) auto;
    align-items: start;
    gap: 8px;
    min-height: 36px;
    padding: 7px 0;
    color: var(--text);
    font-size: var(--text-sm);
  }
  .option-row input {
    width: 16px;
    height: 16px;
    margin: 3px 0 0;
    accent-color: var(--accent);
    opacity: 1;
  }
  .option-row code {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    white-space: nowrap;
  }
  .manual-notice {
    align-items: center;
    flex-wrap: wrap;
  }
  .rebuild-link {
    min-height: var(--control-h);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--warn);
    font-size: var(--text-xs);
    text-decoration: underline;
  }
  .commands-label {
    margin: 8px 0;
    font-size: var(--text-sm);
    font-weight: 500;
  }
  .distribution-footer {
    position: sticky;
    bottom: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--line);
  }
  .footer-spacer {
    flex: 1;
  }
  .remove-launch,
  .remove-variant {
    min-height: var(--control-h);
    padding: 0 8px;
    border: 0;
    background: transparent;
    color: var(--error);
    text-align: left;
  }
  .remove-launch:hover:not(:disabled),
  .remove-variant:hover:not(:disabled) {
    background: var(--surface-hover);
  }
  .remove-confirm {
    color: var(--text);
    font-size: var(--text-xs);
  }
  .variant-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-size: var(--text-xs);
  }
  .remove-variant {
    min-height: var(--control-h);
    font-size: var(--text-xs);
  }
  .distribution-empty {
    margin: 12px 0;
    color: var(--muted);
  }
  @media (max-width: 1023px) {
    .distribution-row,
    .add-panel {
      grid-template-columns: minmax(0, 1fr);
      gap: 8px;
    }
    .distribution-editor {
      padding: 12px 16px 20px;
    }
  }
  @media (max-width: 640px) {
    .distribution-select {
      grid-template-columns: minmax(0, 1fr);
    }
    .add-distribution,
    .add-confirm {
      width: 140px;
    }
    .distribution-options {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
