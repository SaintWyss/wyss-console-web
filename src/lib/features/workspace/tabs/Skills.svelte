<script lang="ts">
  import type { PlanItem } from '../../../contracts/arsenal';
  import { t, tIncoming } from '../../../i18n/index.svelte';
  import type { EstimateData } from '../data';
  import { kTokens } from '../estimate';
  import {
    draftSkills,
    skillBlocker,
    skillEnabled,
    type SkillEntry,
  } from '../model';
  import type { LaunchDraft } from '../plan';
  import CategoryGroup from '../CategoryGroup.svelte';
  import Section from '../Section.svelte';
  import ToggleRow from '../ToggleRow.svelte';

  let {
    draft,
    data,
    itemPlan,
    itemPlanState,
    estimate,
    disabled = false,
    onread,
    setItem,
    setAccountSkill,
  }: {
    draft: LaunchDraft;
    data: EstimateData;
    itemPlan: readonly PlanItem[];
    itemPlanState: 'loading' | 'ready' | 'failed';
    estimate: number | null;
    disabled?: boolean;
    onread: () => void;
    setItem: (id: string, enabled: boolean) => void;
    setAccountSkill: (name: string, enabled: boolean) => void;
  } = $props();

  let query = $state('');
  let opened = $state<Record<string, boolean>>({});
  const unavailable = (entry: SkillEntry) => skillBlocker(entry, itemPlan);
  const isEnabled = (entry: SkillEntry) => skillEnabled(entry, draft, itemPlan);
  const grouped = $derived(draftSkills(draft, data));
  const sections = $derived.by(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return grouped;
    return grouped
      .map((section) => ({
        ...section,
        categories: section.categories
          .map((category) => ({
            ...category,
            entries: category.entries.filter(
              (entry) =>
                entry.name.toLocaleLowerCase().includes(needle) ||
                entry.item?.description.toLocaleLowerCase().includes(needle),
            ),
          }))
          .filter((category) => category.entries.length > 0),
      }))
      .filter((section) => section.categories.length > 0);
  });
  const allEntries = $derived(
    grouped.flatMap((section) =>
      section.categories.flatMap((category) => category.entries),
    ),
  );
  const enabledCount = $derived(allEntries.filter(isEnabled).length);
  const countText = $derived(
    `${t('{on} of {all}', { on: enabledCount, all: allEntries.length })} · ${estimate === null ? t('Not estimated') : `~${kTokens(estimate)} ${t('tokens')}`}`,
  );

  function isDisabled(entry: SkillEntry): boolean {
    return (
      disabled ||
      (entry.account
        ? !draft.spec
        : itemPlanState !== 'ready' || Boolean(unavailable(entry)))
    );
  }

  function setEnabled(entry: SkillEntry, enabled: boolean) {
    if (entry.account) setAccountSkill(entry.name, enabled);
    else setItem(entry.id, enabled);
  }

  function toggleCategory(entries: readonly SkillEntry[], enabled: boolean) {
    for (const entry of entries)
      if (!isDisabled(entry)) setEnabled(entry, enabled);
  }

  function expanded(id: string) {
    return opened[id] ?? true;
  }
</script>

<div class="skill-toolbar">
  <label class="skill-filter">
    <span>{t('Filter skills')}</span>
    <input
      type="search"
      placeholder={t('Filter')}
      bind:value={query}
      {disabled}
    />
  </label>
  <span class="skill-count" aria-live="polite">{countText}</span>
  <button type="button" class="action" onclick={onread} {disabled}
    >{t('Read again')}</button
  >
</div>

{#if itemPlanState === 'loading'}
  <p class="workspace-state" role="status">
    {t('Checking skill availability…')}
  </p>
{:else if itemPlanState === 'failed'}
  <p class="workspace-state" role="alert">
    {t('Skill availability could not be checked.')}
  </p>
{:else if sections.length === 0}
  <p class="workspace-state">{t('No skills match this filter.')}</p>
{:else}
  {#each sections as section (section.id)}
    <Section title={t(section.label)}>
      {#each section.categories as category (`${section.id}-${category.id}`)}
        {@const id = `${section.id}-${category.id}`}
        {@const active = category.entries.filter(isEnabled).length}
        <CategoryGroup
          {id}
          label={t(category.label)}
          enabled={active}
          total={category.entries.length}
          expanded={expanded(id)}
          disabled={disabled || category.entries.every(isDisabled)}
          ontoggle={() => (opened[id] = !expanded(id))}
          ontoggleall={(enabled) => toggleCategory(category.entries, enabled)}
        >
          {#each category.entries as entry (entry.id)}
            {@const missing = unavailable(entry)}
            {#if missing}
              <div
                class="skill-unavailable"
                role="group"
                aria-label={t('Unavailable skill {name}', { name: entry.name })}
              >
                <span class="skill-name">{entry.name}</span>
                <span class="skill-reason"
                  ><span aria-hidden="true">×</span>
                  {t('Unavailable')}: {tIncoming(
                    missing.reason ||
                      missing.compatibility?.reason ||
                      'Not available',
                  )}</span
                >
              </div>
            {:else}
              <ToggleRow
                label={entry.name}
                checked={isEnabled(entry)}
                disabled={isDisabled(entry)}
                onchange={(enabled) => setEnabled(entry, enabled)}
              />
            {/if}
          {/each}
        </CategoryGroup>
      {/each}
    </Section>
  {/each}
{/if}

<style>
  .skill-toolbar {
    display: flex;
    align-items: end;
    flex-wrap: wrap;
    gap: 10px;
    padding: 8px 0 4px;
  }
  .skill-filter {
    display: grid;
    gap: 4px;
    min-width: min(220px, 100%);
    flex: 1 1 220px;
    color: var(--muted);
    font-size: var(--text-xs);
  }
  .skill-filter input {
    min-width: 0;
    width: 100%;
    min-height: var(--control-h);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text);
  }
  .skill-count {
    padding-bottom: 10px;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }
  .workspace-state {
    margin: 12px 0;
    color: var(--muted);
    font-size: var(--text-sm);
  }
  .skill-unavailable {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
    align-items: center;
    gap: 12px;
    min-height: 40px;
    padding: 4px 8px;
    border-bottom: 1px solid var(--line);
    color: var(--faint);
    font-size: var(--text-sm);
    overflow-wrap: anywhere;
  }
  .skill-reason {
    font-size: var(--text-xs);
  }
  @media (max-width: 1023px) {
    .skill-unavailable {
      grid-template-columns: minmax(0, 1fr);
    }
    .skill-reason {
      grid-column: 1;
    }
  }
</style>
