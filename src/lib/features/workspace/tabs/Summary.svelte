<script lang="ts">
  import type { PlanItem } from '../../../contracts/arsenal';
  import { t, tIncoming } from '../../../i18n/index.svelte';
  import type { EstimateData } from '../data';
  import { kTokens, type Estimate } from '../estimate';
  import { buildWorkspaceSummary, eventText } from '../model';
  import type { LaunchDraft } from '../plan';
  import Section from '../Section.svelte';

  let {
    draft,
    data,
    estimate,
    itemPlan,
  }: {
    draft: LaunchDraft;
    data: EstimateData;
    estimate: Estimate | null;
    itemPlan: readonly PlanItem[];
  } = $props();

  const summary = $derived(
    buildWorkspaceSummary(draft, data, estimate, itemPlan),
  );
  const context = $derived(
    summary.context.kind === 'codex'
      ? t('Initial context: no estimate for Codex')
      : summary.context.kind === 'estimated'
        ? t('Initial context estimated {total}', {
            total: kTokens(summary.context.total),
          })
        : t('No estimate available'),
  );
  const projectInstructions = $derived(
    t(
      summary.projectInstructions === 'loaded'
        ? 'Project instructions are loaded.'
        : summary.projectInstructions === 'skipped'
          ? 'Project instructions are skipped.'
          : summary.projectInstructions === 'custom'
            ? 'Custom project text is used.'
            : 'Project instructions are unavailable.',
    ),
  );
</script>

{#if summary.noChanges}
  <p class="summary-notice">
    <span aria-hidden="true">ⓘ</span>
    <span
      >{t(
        'This launch changes nothing: it uses your full ~/.claude (~/.codex)',
      )}</span
    >
  </p>
{/if}

<Section title={t('Start')}>
  <dl>
    <div>
      <dt>{t('Application')}</dt>
      <dd>{summary.application}</dd>
    </div>
    <div>
      <dt>{t('Working directory')}</dt>
      <dd>{summary.directory || t('Not selected')}</dd>
    </div>
    <div>
      <dt>{t('Permissions')}</dt>
      <dd>{t(summary.permission)}</dd>
    </div>
    <div>
      <dt>{t('Initial context')}</dt>
      <dd>{context}</dd>
    </div>
  </dl>
</Section>

<Section title={t('Reads first')}>
  <dl>
    <div>
      <dt>{t('Global instructions')}</dt>
      <dd>
        {#if (draft.agent === 'claude_code' ? draft.spec : draft.codexSpec) === null}
          <p class="summary-state">
            <span aria-hidden="true">⚠</span>
            {t('The launch environment could not be read.')}
          </p>
        {:else}
          {summary.globalInstructions.length
            ? summary.globalInstructions.join(' → ')
            : t('None')}
        {/if}
      </dd>
    </div>
    <div>
      <dt>{t('Project')}</dt>
      <dd>{projectInstructions}</dd>
    </div>
  </dl>
</Section>

<Section title={t('Skills')}>
  {#each summary.skills as section (section.label)}
    {@const categories = section.categories.filter(
      (category) => category.names.length > 0,
    )}
    {#if categories.length > 0}
      <div class="summary-group">
        <h3>{t(section.label)}</h3>
        {#each categories as category (category.label)}
          <dl>
            <div>
              <dt>{t(category.label)}</dt>
              <dd>{category.names.join(', ')}</dd>
            </div>
          </dl>
        {/each}
      </div>
    {/if}
  {/each}
</Section>

{#if summary.mcp}
  <Section title={t('MCP')}>
    {#if draft.spec === null}
      <p class="summary-state">
        <span aria-hidden="true">⚠</span>
        {t('The launch environment could not be read.')}
      </p>
    {:else}
      <dl>
        <div>
          <dt>{t('Your servers')}</dt>
          <dd>
            {summary.mcp.servers.length
              ? summary.mcp.servers.join(', ')
              : t('None')}
          </dd>
        </div>
        <div>
          <dt>{t('Account connectors')}</dt>
          <dd>{summary.mcp.connectors ? t('On') : t('Off')}</dd>
        </div>
      </dl>
    {/if}
  </Section>
{/if}

<Section title={t('Hooks')}>
  {#if (draft.agent === 'claude_code' ? draft.spec : draft.codexSpec) === null}
    <p class="summary-state">
      <span aria-hidden="true">⚠</span>
      {t('The launch environment could not be read.')}
    </p>
  {:else}
    {#each summary.hooks as section (section.event)}
      {#if section.names.length > 0}
        <dl>
          <div>
            <dt>{t(eventText(section.event))}</dt>
            <dd>{section.names.join(', ')}</dd>
          </div>
        </dl>
      {/if}
    {/each}
  {/if}
</Section>

<Section title={t('Left out')}>
  {#if summary.leftOut.length > 0}
    <ul>
      {#each summary.leftOut as item, i (`${i}-${item.name}`)}
        <li>
          {item.name}{#if item.reason}: {tIncoming(item.reason)}{/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p>{t('Nothing is left out.')}</p>
  {/if}
</Section>

<style>
  .summary-notice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 10px 0;
    padding: 10px 12px;
    border-left: 3px solid var(--accent);
    background: var(--accent-soft);
    color: var(--text);
    font-size: var(--text-sm);
  }
  .summary-state {
    display: flex;
    gap: 8px;
    margin: 0;
    padding: 10px 8px;
    color: var(--muted);
    font-size: var(--text-sm);
    overflow-wrap: anywhere;
  }
  .summary-notice span:first-child {
    flex: none;
    color: var(--accent);
    font-family: var(--font-mono);
  }
  dl {
    margin: 0;
  }
  dl > div {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 24px;
    padding: 10px 8px;
    border-bottom: 1px solid var(--line);
  }
  dt {
    color: var(--muted);
    font-size: var(--text-sm);
  }
  dd {
    min-width: 0;
    margin: 0;
    color: var(--text);
    font-size: var(--text-sm);
    overflow-wrap: anywhere;
  }
  .summary-group h3 {
    margin: 10px 8px 2px;
    color: var(--muted);
    font-size: var(--text-xs);
    font-weight: 600;
  }
  ul {
    margin: 0;
    padding-left: 24px;
  }
  li {
    padding: 4px 0;
    color: var(--text);
    font-size: var(--text-sm);
    overflow-wrap: anywhere;
  }
  @media (max-width: 1023px) {
    dl > div {
      grid-template-columns: minmax(0, 1fr);
      gap: 4px;
    }
  }
</style>
