<script lang="ts">
  import { t } from '../../../i18n/index.svelte';
  import { toggle } from '../../arsenal/environment';
  import { kTokens } from '../estimate';
  import { workspace } from '../context';
  import Toggle from '../Toggle.svelte';

  const ws = workspace();
  const draft = $derived(ws.draft);

  const MODE_HELP = {
    load: 'The agent reads the project’s instructions as well as yours.',
    exclude:
      'The agent does not read the project’s instructions or rules; yours follow their switches.',
    role: 'The agent reads the text below instead of the project’s instructions.',
  } as const;

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
                size: options.sizes.instructions,
                on: spec.instructions,
                disabled: false,
                set: (on: boolean) => (spec.instructions = on),
              },
            ]
          : []),
        ...options.rules.map((rule) => ({
          name: `rules/${rule}`,
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
        size: undefined,
        on: spec.instructions,
        disabled: false,
        set: (on: boolean) => (spec.instructions = on),
      },
    ];
  });

  function setMode(mode: 'load' | 'exclude' | 'role') {
    const role =
      draft.instructions && 'role' in draft.instructions
        ? draft.instructions.role
        : '';
    draft.instructions =
      mode === 'load' ? { project: 'load' } : { project: mode, role };
  }
</script>

<h2 class="ws-section">{t('From the project')}</h2>
<div class="ws-row">
  <div>
    <label class="ws-label" for="project-instructions"
      >{t('Directory instructions')}</label
    >
    <p class="ws-hint">
      {t('The CLAUDE.md or AGENTS.md of the working directory.')}
    </p>
  </div>
  {#if draft.instructions}
    <div class="ws-split">
      <select
        id="project-instructions"
        disabled={ws.busy}
        value={draft.instructions.project}
        onchange={(e) =>
          setMode(e.currentTarget.value as 'load' | 'exclude' | 'role')}
      >
        <option value="load">{t('Load')}</option>
        <option value="exclude">{t('Skip')}</option>
        <option value="role">{t('Custom text')}</option>
      </select>
      <p class="ws-hint">{t(MODE_HELP[draft.instructions.project])}</p>
    </div>
  {:else}
    <p class="ws-hint" role="alert">
      {t('Not available: the instructions file could not be read.')}
    </p>
  {/if}
</div>
{#if draft.instructions?.project === 'role'}
  <div class="ws-row">
    <div>
      <label class="ws-label" for="custom-instructions"
        >{t('Custom text')}</label
      >
      <p class="ws-hint">{t('Read instead of the project’s instructions.')}</p>
    </div>
    <textarea
      id="custom-instructions"
      class="ws-commands"
      disabled={ws.busy}
      bind:value={draft.instructions.role}></textarea>
  </div>
{/if}

<h2 class="ws-section">{t('Global')}</h2>
{#each files as file (file.name)}
  <div class="ws-line">
    <span class="ws-mono">{file.name}</span>
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
