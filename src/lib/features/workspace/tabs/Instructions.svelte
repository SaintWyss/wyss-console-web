<script lang="ts">
  import { t } from '../../../i18n/index.svelte';
  import { toggle } from '../../arsenal/environment';
  import { kTokens } from '../estimate';
  import { workspace } from '../context';
  import Toggle from '../Toggle.svelte';

  const ws = workspace();
  const draft = $derived(ws.draft);

  const size = (bytes: number | undefined) =>
    bytes === undefined ? '' : `~${kTokens(Math.ceil(bytes / 4))}`;

  /** One row per global file this agent reads, with its switch. */
  const files = $derived.by(() => {
    if (draft.agent === 'claude_code') {
      const spec = draft.spec;
      const options = ws.data.options;
      if (!spec || !options) return [];
      return [
        ...(options.instructions
          ? [
              {
                name: 'CLAUDE.md',
                key: 'CLAUDE.md',
                size: options.sizes.instructions,
                on: spec.instructions,
                disabled: false,
                set: (on: boolean) => (spec.instructions = on),
              },
            ]
          : []),
        ...options.rules.map((rule) => ({
          name: `rules/${rule}`,
          key: `rules/${rule}`,
          size: options.sizes[`rule:${rule}`],
          on: spec.instructions && !spec.rules_off.includes(rule),
          disabled: !spec.instructions,
          set: (on: boolean) =>
            (spec.rules_off = toggle(spec.rules_off, rule, !on)),
        })),
      ];
    }
    const spec = draft.codexSpec;
    if (!spec || !ws.data.codexOptions?.instructions) return [];
    return [
      {
        name: 'AGENTS.md',
        key: 'codex/AGENTS.md',
        size: undefined,
        on: spec.instructions,
        disabled: false,
        set: (on: boolean) => (spec.instructions = on),
      },
    ];
  });

  let dialog = $state<HTMLDialogElement>();
  let shown = $state<{ name: string; text: string | null; failed: boolean }>({
    name: '',
    text: null,
    failed: false,
  });
  function view(name: string, key: string) {
    shown = { name, text: null, failed: false };
    dialog?.showModal();
    ws.instructionText(key).then(
      (text) => (shown = { name, text, failed: false }),
      () => (shown = { name, text: null, failed: true }),
    );
  }
</script>

{#each files as file (file.name)}
  <div class="ws-line">
    <button
      type="button"
      class="ws-link ws-mono"
      title={t('Show its text')}
      onclick={() => view(file.name, file.key)}>{file.name}</button
    >
    <span class="ws-meta">{size(file.size)}</span>
    <Toggle
      label={file.name}
      on={file.on}
      disabled={ws.busy || file.disabled}
      onchange={file.set}
    />
  </div>
{:else}
  <p class="ws-hint">{t('Nothing of this kind.')}</p>
{/each}

<dialog
  class="ws-dialog"
  bind:this={dialog}
  aria-label={shown.name}
  onclick={(e) => e.target === dialog && dialog?.close()}
>
  <header>
    <h2 class="ws-mono">{shown.name}</h2>
    <button type="button" class="action" onclick={() => dialog?.close()}
      >{t('Close')}</button
    >
  </header>
  {#if shown.failed}
    <p class="ws-hint" role="alert">{t('The file could not be read.')}</p>
  {:else if shown.text === null}
    <p class="ws-hint">{t('Reading')}</p>
  {:else}
    <pre>{shown.text}</pre>
  {/if}
</dialog>
