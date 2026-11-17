<script lang="ts">
  import { t } from '../../../i18n/index.svelte';
  import { toggle } from '../../arsenal/environment';
  import { workspace } from '../context';
  import Toggle from '../Toggle.svelte';

  const ws = workspace();
  const spec = $derived(ws.draft.spec);
  const options = $derived(ws.data.options);
  const servers = $derived(options?.mcp ?? []);

  // `mcp: null` starts with everything, account connectors included. A list starts with only
  // those servers (--strict-mcp-config), which leaves the account connectors out too.
  const connectors = $derived(spec?.mcp === null);
  const serverOn = (name: string) =>
    spec !== null && (spec.mcp === null || spec.mcp.includes(name));

  function setServer(name: string, on: boolean) {
    if (!spec) return;
    spec.mcp = toggle(spec.mcp ?? [...servers], name, on);
  }
  function setConnectors(on: boolean) {
    if (spec) spec.mcp = on ? null : [...servers];
  }
  function setPlugin(name: string, on: boolean) {
    if (spec) spec.plugins_off = toggle(spec.plugins_off, name, !on);
  }
</script>

<div class="ws-tools">
  <p class="ws-hint">{t('To add one, ask Claude.')}</p>
  <button type="button" class="action" onclick={() => void ws.reload()}
    >{t('Read again')}</button
  >
</div>

{#if !spec || !options}
  <p class="ws-hint" role="alert">
    {t('The launch environment could not be read.')}
  </p>
{:else}
  <h2 class="ws-section">{t('Your servers')}</h2>
  {#each servers as name (name)}
    <div class="ws-line">
      <span>{name}</span>
      <span></span>
      <Toggle
        label={name}
        on={serverOn(name)}
        disabled={ws.busy}
        onchange={(on) => setServer(name, on)}
      />
    </div>
  {:else}
    <p class="ws-hint">{t('Nothing of this kind.')}</p>
  {/each}

  <h2 class="ws-section">{t('Your claude.ai account')}</h2>
  <div class="ws-line">
    <span>{t('Account connectors')}</span>
    <span class="ws-meta"
      >{t(
        'Only with every server above on: Claude loads them all or none.',
      )}</span
    >
    <Toggle
      label={t('Account connectors')}
      on={connectors}
      disabled={ws.busy}
      onchange={setConnectors}
    />
  </div>

  {#if options.plugins.length > 0}
    <h2 class="ws-section">{t('Plugins')}</h2>
    {#each options.plugins as name (name)}
      <div class="ws-line">
        <span>{name}</span>
        <span></span>
        <Toggle
          label={name}
          on={!spec.plugins_off.includes(name)}
          disabled={ws.busy}
          onchange={(on) => setPlugin(name, on)}
        />
      </div>
    {/each}
  {/if}
{/if}
