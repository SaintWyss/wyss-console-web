<script lang="ts">
  import { t, tIncoming } from '../../../i18n/index.svelte';
  import { toggle } from '../../arsenal/environment';
  import { kTokens } from '../estimate';
  import { workspace } from '../context';
  import {
    draftSkills,
    skillBlocker,
    skillEnabled,
    type SkillEntry,
  } from '../model';
  import Category from '../Category.svelte';
  import Fold from '../Fold.svelte';
  import Toggle from '../Toggle.svelte';

  const ws = workspace();
  const draft = $derived(ws.draft);
  let query = $state('');

  const sections = $derived(draftSkills(draft, ws.data));
  const entries = $derived(
    sections.flatMap((s) => s.categories.flatMap((c) => c.entries)),
  );
  const isOn = (e: SkillEntry) => skillEnabled(e, draft, ws.itemPlan);
  const blocker = (e: SkillEntry) => skillBlocker(e, ws.itemPlan);
  const locked = (e: SkillEntry) =>
    ws.busy ||
    (e.account ? !draft.spec : ws.itemPlanState !== 'ready' || !!blocker(e));

  function set(e: SkillEntry, on: boolean) {
    if (!e.account) return ws.setItem(e.id, on);
    const spec = draft.spec;
    if (spec)
      spec.account_skills_off = toggle(spec.account_skills_off, e.name, !on);
  }
  const shown = (e: SkillEntry) =>
    !query.trim() || e.name.toLowerCase().includes(query.trim().toLowerCase());
</script>

<div class="ws-tools">
  <input
    type="search"
    placeholder={t('Filter skills')}
    aria-label={t('Filter skills')}
    bind:value={query}
  />
  <span class="ws-meta"
    >{t('{on} of {all}', {
      on: entries.filter(isOn).length,
      all: entries.length,
    })}{ws.estimate ? ` · ~${kTokens(ws.estimate.skills)}` : ''}</span
  >
  <button type="button" class="action" onclick={() => void ws.reload()}
    >{t('Read again')}</button
  >
</div>

{#each sections as section (section.id)}
  {@const cats = section.categories
    .map((c) => ({ ...c, entries: c.entries.filter(shown) }))
    .filter((c) => c.entries.length > 0)}
  {#if cats.length > 0}
    {@const all = cats.flatMap((c) => c.entries)}
    <Fold
      label={t(section.label)}
      count={`${all.filter(isOn).length}/${all.length}`}
    >
      {#each cats as cat (cat.id)}
        {@const free = cat.entries.filter((e) => !locked(e))}
        <Category
          label={t(cat.label)}
          count={`${cat.entries.filter(isOn).length}/${cat.entries.length}`}
          on={free.length > 0 && free.every(isOn)}
          disabled={free.length === 0}
          onchange={(on) => free.forEach((e) => set(e, on))}
        >
          {#each cat.entries as entry (entry.id)}
            {@const why = blocker(entry)}
            <div class="ws-line ws-indent" class:ws-off={!!why}>
              <span>{entry.name}</span>
              <span
                class="ws-meta"
                title={why?.reason ? tIncoming(why.reason) : undefined}
                >{why?.reason ? tIncoming(why.reason) : ''}</span
              >
              {#if why}<span></span>{:else}
                <Toggle
                  label={entry.name}
                  on={isOn(entry)}
                  disabled={locked(entry)}
                  onchange={(on) => set(entry, on)}
                />
              {/if}
            </div>
          {/each}
        </Category>
      {/each}
    </Fold>
  {/if}
{/each}
