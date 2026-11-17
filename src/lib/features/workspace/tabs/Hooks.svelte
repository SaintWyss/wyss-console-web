<script lang="ts">
  import { t } from '../../../i18n/index.svelte';
  import { workspace } from '../context';
  import {
    eventText,
    groupHooksByMoment,
    matcherText,
    type HookRow,
  } from '../model';
  import Fold from '../Fold.svelte';
  import Toggle from '../Toggle.svelte';

  const ws = workspace();
  const draft = $derived(ws.draft);
  const claude = $derived(draft.agent === 'claude_code');
  const spec = $derived(claude ? draft.spec : draft.codexSpec);
  const sections = $derived(
    groupHooksByMoment(
      claude
        ? (ws.data.options?.hooks ?? [])
        : (ws.data.codexOptions?.hooks ?? []),
    ),
  );
  /** Hooks Codex's config.toml declares: they always run and are only shown. */
  const fixed = $derived(
    claude
      ? []
      : groupHooksByMoment(
          (ws.data.codexOptions?.config_hooks ?? []).map((hook, i) => ({
            ...hook,
            key: `config:${i}`,
          })),
        ),
  );
  const rows = $derived(sections.flatMap((s) => s.rows));
  const isOn = (row: HookRow) =>
    !!spec && row.hooks.every((h) => !spec.hooks_off.includes(h.key));
  function set(row: HookRow, on: boolean) {
    if (!spec) return;
    const keys = row.hooks.map((h) => h.key);
    spec.hooks_off = on
      ? spec.hooks_off.filter((k) => !keys.includes(k))
      : [...new Set([...spec.hooks_off, ...keys])];
  }
  /** What sets a hook off, in words: `Bash|Write` reads "Commands, Writing/editing". */
  const when = (row: HookRow) => {
    const words = row.matchers.flatMap((m) =>
      m.split('|').map((part) => t(matcherText(part.trim()))),
    );
    return words.length ? [...new Set(words)].join(', ') : t('Always');
  };
</script>

<div class="ws-tools">
  <p class="ws-hint">
    {t('No context at start. To add one, ask Claude.')}
  </p>
  <span class="ws-meta"
    >{t('{on} of {all}', {
      on: rows.filter(isOn).length,
      all: rows.length,
    })}</span
  >
  <button type="button" class="action" onclick={() => void ws.reload()}
    >{t('Read again')}</button
  >
</div>

{#if !spec}
  <p class="ws-hint" role="alert">
    {t('The launch environment could not be read.')}
  </p>
{:else}
  {#each sections as section (section.event)}
    <Fold
      label={t(eventText(section.event))}
      count={`${section.rows.filter(isOn).length}/${section.rows.length}`}
    >
      {#each section.rows as row (row.id)}
        <div class="ws-line">
          <span class="ws-mono">{row.script}</span>
          <span class="ws-meta">{when(row)}</span>
          <Toggle
            label={row.script}
            on={isOn(row)}
            disabled={ws.busy}
            onchange={(on) => set(row, on)}
          />
        </div>
      {/each}
    </Fold>
  {:else}
    <p class="ws-hint">{t('Nothing of this kind.')}</p>
  {/each}
  {#if fixed.length > 0}
    <Fold label={t('Always on (config.toml)')}>
      {#each fixed.flatMap((s) => s.rows) as row (row.id)}
        <div class="ws-line">
          <span class="ws-mono">{row.script}</span>
          <span class="ws-meta">{when(row)}</span>
          <span></span>
        </div>
      {/each}
    </Fold>
  {/if}
{/if}
