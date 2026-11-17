<script lang="ts">
  import type { InventoryReply } from '../../../contracts/configuration';
  import { t } from '../../../i18n/index.svelte';
  import { field } from '../../arsenal/hook';
  import type { EstimateData } from '../data';
  import type { LaunchDraft } from '../plan';
  import Section from '../Section.svelte';
  import ToggleRow from '../ToggleRow.svelte';

  let {
    draft,
    data,
    inventory,
    disabled = false,
    onread,
  }: {
    draft: LaunchDraft;
    data: EstimateData;
    inventory: InventoryReply | null;
    disabled?: boolean;
    onread: () => void;
  } = $props();

  const servers = $derived(data.options?.mcp ?? []);
  const localServers = $derived(
    servers.filter((name) => serverKind(name) === 'local'),
  );
  const packageServers = $derived(
    servers.filter((name) => serverKind(name) === 'package'),
  );
  const unknownServers = $derived(
    servers.filter((name) => serverKind(name) === 'unknown'),
  );
  const enabled = $derived(
    servers.filter(serverEnabled).length + (draft.spec?.mcp === null ? 1 : 0),
  );
  const total = $derived(servers.length + 1);

  function serverKind(name: string): 'local' | 'package' | 'unknown' {
    const item = inventory?.inventory.items.find(
      (entry) =>
        entry.provider === 'claude_code' &&
        entry.kind === 'mcp_server' &&
        entry.name === name,
    );
    const command = item ? field(item, 'command').trim() : '';
    if (!command) return 'unknown';
    return command.split(/\s+/)[0]?.split('/').at(-1) === 'npx'
      ? 'package'
      : 'local';
  }

  function serverEnabled(name: string): boolean {
    return draft.spec?.mcp === null || Boolean(draft.spec?.mcp?.includes(name));
  }

  function setServer(name: string, checked: boolean) {
    if (!draft.spec) return;
    const current = draft.spec.mcp ?? [...servers];
    draft.spec.mcp = checked
      ? [...new Set([...current, name])]
      : current.filter((server) => server !== name);
  }

  function setAccountConnectors(checked: boolean) {
    if (!draft.spec) return;
    // strict MCP config has no per-connector list; null restores the full configuration.
    draft.spec.mcp = checked ? null : [...servers];
  }
</script>

<div class="mcp-toolbar">
  <span>{t('To add one, ask Claude.')}</span>
  {#if draft.spec}<span class="mono-count" aria-live="polite"
      >{t('{on} of {all}', { on: enabled, all: total })}</span
    >{/if}
  <button type="button" class="action" {disabled} onclick={onread}
    >{t('Read again')}</button
  >
</div>

{#if !draft.spec}
  <p class="workspace-state" role="status">
    <span aria-hidden="true">⚠</span>
    {t(
      'MCP settings are unavailable because the launch environment could not be read.',
    )}
  </p>
{:else}
  <Section title={t('Your servers')}>
    {#if localServers.length === 0 && packageServers.length === 0 && unknownServers.length === 0}
      <p class="workspace-empty">{t('No MCP servers are configured.')}</p>
    {/if}
    {#if localServers.length > 0}
      <h3>{t('Local command')}</h3>
      {#each localServers as name (name)}
        <ToggleRow
          label={name}
          checked={serverEnabled(name)}
          disabled={disabled || !draft.spec}
          onchange={(checked) => setServer(name, checked)}
        />
      {/each}
    {/if}
    {#if packageServers.length > 0}
      <h3>{t('npx package')}</h3>
      {#each packageServers as name (name)}
        <ToggleRow
          label={name}
          checked={serverEnabled(name)}
          disabled={disabled || !draft.spec}
          onchange={(checked) => setServer(name, checked)}
        />
      {/each}
    {/if}
    {#each unknownServers as name (name)}
      <ToggleRow
        label={name}
        checked={serverEnabled(name)}
        disabled={disabled || !draft.spec}
        onchange={(checked) => setServer(name, checked)}
      />
    {/each}
  </Section>

  <Section title={t('Your claude.ai account')}>
    <ToggleRow
      label={t('Account connectors')}
      detail={t('Connector names are not available in this window.')}
      checked={draft.spec?.mcp === null}
      disabled={disabled || !draft.spec}
      onchange={setAccountConnectors}
    />
    <p class="mcp-note">
      <span aria-hidden="true">ⓘ</span>
      <span
        >{t(
          'Connectors and plugins follow the full MCP configuration and cannot be selected individually here.',
        )}</span
      >
    </p>
  </Section>
{/if}

<style>
  .mcp-toolbar {
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
  h3 {
    margin: 12px 8px 4px;
    color: var(--muted);
    font-size: var(--text-xs);
    font-weight: 600;
  }
  .workspace-empty {
    margin: 8px;
    color: var(--muted);
    font-size: var(--text-sm);
  }
  .mcp-note {
    display: flex;
    gap: 8px;
    margin: 8px;
    color: var(--muted);
    font-size: var(--text-xs);
  }
  .mcp-note span:first-child {
    flex: none;
    color: var(--accent);
    font-family: var(--font-mono);
  }
</style>
