<script lang="ts">
  import { t } from '../../../i18n/index.svelte';
  import { toggle } from '../../arsenal/environment';
  import type { EstimateData } from '../data';
  import {
    eventText,
    groupHooksByMoment,
    matcherText,
    sortHookEvents,
    type HookRow,
  } from '../model';
  import type { LaunchDraft } from '../plan';
  import Section from '../Section.svelte';
  import ToggleRow from '../ToggleRow.svelte';

  interface DisplayRow extends HookRow {
    fixed: boolean;
  }

  let {
    draft,
    data,
    disabled = false,
    onread,
  }: {
    draft: LaunchDraft;
    data: EstimateData;
    disabled?: boolean;
    onread: () => void;
  } = $props();

  const readable = $derived(
    draft.agent === 'claude_code'
      ? draft.spec !== null
      : draft.codexSpec !== null,
  );
  const configurable = $derived(
    !readable
      ? []
      : draft.agent === 'claude_code'
        ? (data.options?.hooks ?? [])
        : (data.codexOptions?.hooks ?? []),
  );
  const fixed = $derived(
    draft.agent === 'codex'
      ? (data.codexOptions?.config_hooks ?? []).map((hook, index) => ({
          ...hook,
          key: `config:${index}`,
        }))
      : [],
  );
  const sections = $derived.by(() => {
    const activeSections = groupHooksByMoment(configurable);
    const fixedSections = groupHooksByMoment(fixed);
    const eventOrder = sortHookEvents([
      ...new Set(
        [...activeSections, ...fixedSections].map((section) => section.event),
      ),
    ]);
    return eventOrder.map((event) => ({
      event,
      rows: [
        ...(
          activeSections.find((section) => section.event === event)?.rows ?? []
        ).map((row) => ({ ...row, fixed: false })),
        ...(
          fixedSections.find((section) => section.event === event)?.rows ?? []
        ).map((row) => ({ ...row, fixed: true })),
      ] as DisplayRow[],
    }));
  });
  const rows = $derived(sections.flatMap((section) => section.rows));
  const countText = $derived(
    t('{on} of {all}', {
      on: rows.filter((row) => row.fixed || isEnabled(row)).length,
      all: rows.length,
    }),
  );

  function isOff(key: string): boolean {
    return draft.agent === 'claude_code'
      ? Boolean(draft.spec?.hooks_off.includes(key))
      : Boolean(draft.codexSpec?.hooks_off.includes(key));
  }

  function isEnabled(row: HookRow): boolean {
    return row.hooks.every((hook) => !isOff(hook.key));
  }

  function toggleRow(row: HookRow, enabled: boolean) {
    const target = draft.agent === 'claude_code' ? draft.spec : draft.codexSpec;
    if (!target) return;
    target.hooks_off = row.hooks.reduce(
      (current, hook) => toggle(current, hook.key, !enabled),
      target.hooks_off,
    );
  }

  function matcherLabel(row: HookRow): string {
    const matchers = row.matchers.length > 0 ? row.matchers : [''];
    return [
      ...new Set(matchers.map((matcher) => t(matcherText(matcher)))),
    ].join(' · ');
  }

  function rowLabel(row: HookRow): string {
    return row.script || t('Unnamed command');
  }
</script>

<div class="hooks-toolbar">
  <span>{t('No context at start. To add one, ask Claude.')}</span>
  {#if readable}<span class="mono-count" aria-live="polite">{countText}</span
    >{/if}
  <button type="button" class="action" {disabled} onclick={onread}
    >{t('Read again')}</button
  >
</div>

{#if !readable}
  <p class="workspace-state" role="status">
    <span aria-hidden="true">⚠</span>
    {t(
      'Hook settings are unavailable because the launch environment could not be read.',
    )}
  </p>
{:else if sections.length === 0}
  <p class="hooks-empty">{t('No hooks are configured.')}</p>
{/if}
{#each sections as section (section.event)}
  <Section title={t(eventText(section.event))}>
    {#each section.rows as row (row.id)}
      {#if row.fixed}
        <div class="fixed-hook">
          <code>{rowLabel(row)}</code>
          <span>{matcherLabel(row)}</span>
          <span class="fixed-state"
            ><span aria-hidden="true">✓</span> {t('Always on')}</span
          >
        </div>
      {:else}
        <ToggleRow
          label={rowLabel(row)}
          detail={matcherLabel(row)}
          checked={isEnabled(row)}
          disabled={disabled ||
            (draft.agent === 'claude_code' ? !draft.spec : !draft.codexSpec)}
          onchange={(enabled) => toggleRow(row, enabled)}
        />
      {/if}
    {/each}
  </Section>
{/each}

<style>
  .hooks-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 8px 0 4px;
    color: var(--muted);
    font-size: var(--text-sm);
  }
  .mono-count {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }
  .hooks-empty {
    margin: 12px 0;
    color: var(--muted);
  }
  .fixed-hook {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    min-height: 40px;
    padding: 4px 8px;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
    font-size: var(--text-xs);
    overflow-wrap: anywhere;
  }
  code {
    color: var(--text);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }
  .fixed-state {
    white-space: nowrap;
  }
  .fixed-state span {
    color: var(--accent);
  }
  @media (max-width: 1023px) {
    .fixed-hook {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .fixed-hook > span:nth-child(2) {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
</style>
