<script lang="ts">
  import { t } from '../../../i18n/index.svelte';
  import { kTokens } from '../estimate';
  import { workspace } from '../context';
  import { buildWorkspaceSummary, eventText } from '../model';
  import Fold from '../Fold.svelte';

  const ws = workspace();
  const s = $derived(
    buildWorkspaceSummary(ws.draft, ws.data, ws.estimate, ws.itemPlan),
  );
  const PROJECT = {
    loaded: 'Project instructions: loaded',
    skipped: 'Project instructions: skipped',
    custom: 'Project instructions: replaced by custom text',
    unavailable: 'Project instructions: could not be read',
  } as const;
  const list = (names: readonly string[]) =>
    names.length ? names.join(', ') : '—';
</script>

{#if s.noChanges}
  <p class="notice ws-summary-note">
    {t(
      ws.draft.agent === 'claude_code'
        ? 'This launch changes nothing: it uses your full ~/.claude.'
        : 'This launch changes nothing: it uses your full ~/.codex.',
    )}
  </p>
{/if}

<Fold label={t('At start')}>
  <dl class="ws-facts">
    <dt>{t('Application')}</dt>
    <dd>{s.application}</dd>
    <dt>{t('Working directory')}</dt>
    <dd class="ws-mono">{s.directory}</dd>
    <dt>{t('Permissions')}</dt>
    <dd>{t(s.permission)}</dd>
    <dt>{t('Initial context')}</dt>
    <dd>
      {s.context.kind === 'estimated'
        ? `~${kTokens(s.context.total)} ${t('tokens')}`
        : t('Not estimated')}
    </dd>
  </dl>
</Fold>

<Fold label={t('Reads first')}>
  <dl class="ws-facts">
    {#each s.globalInstructions as file, i (file)}
      <dt>{i + 1}</dt>
      <dd class="ws-mono">{file}</dd>
    {/each}
    <dt>{s.globalInstructions.length + 1}</dt>
    <dd>{t(PROJECT[s.projectInstructions])}</dd>
  </dl>
</Fold>

<Fold label={t('Skills')}>
  <dl class="ws-facts">
    {#each s.skills as section (section.label)}
      <dt>{t(section.label)}</dt>
      <dd>{list(section.categories.flatMap((c) => c.names))}</dd>
    {/each}
  </dl>
</Fold>

{#if s.mcp}
  <Fold label={t('MCP')}>
    <dl class="ws-facts">
      <dt>{t('Your servers')}</dt>
      <dd>{list(s.mcp.servers)}</dd>
      <dt>{t('Account connectors')}</dt>
      <dd>{s.mcp.connectors ? t('On') : t('Off')}</dd>
    </dl>
  </Fold>
{/if}

<Fold label={t('Hooks')}>
  <dl class="ws-facts">
    {#each s.hooks as moment (moment.event)}
      <dt>{t(eventText(moment.event))}</dt>
      <dd class="ws-mono">{list(moment.names)}</dd>
    {:else}
      <dt>—</dt>
      <dd>{t('None')}</dd>
    {/each}
  </dl>
</Fold>
