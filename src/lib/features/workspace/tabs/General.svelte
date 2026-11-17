<script lang="ts">
  import { t } from '../../../i18n/index.svelte';
  import { permissionsFor, type Permission } from '../../../contracts/native';
  import { AS_CONFIGURED, PERMISSION_LABEL } from '../../native/present';
  import { workspace } from '../context';
  import type { Agent } from '../plan';

  const ws = workspace();
  const draft = $derived(ws.draft);

  const HELP: Record<Permission | 'configured', string> = {
    configured: 'Uses what the application has configured.',
    ask: 'Asks for approval before every action.',
    read_only: 'Does not change files or run commands.',
    edits: 'Edits without asking; asks before running commands.',
    bypass: 'No approvals and no sandbox, with your account’s permissions.',
  };

  const folders = $derived([
    ...new Set([draft.directory, ...ws.saved, ...ws.used.map((u) => u.path)]),
  ]);
  const MODE_HELP = {
    load: 'The agent reads the project’s instructions as well as yours.',
    exclude:
      'The agent does not read the project’s instructions or rules; yours follow their switches.',
    role: 'The agent reads the text below instead of the project’s instructions.',
  } as const;

  function setMode(mode: 'load' | 'exclude' | 'role') {
    const role =
      draft.instructions && 'role' in draft.instructions
        ? draft.instructions.role
        : '';
    draft.instructions =
      mode === 'load' ? { project: 'load' } : { project: mode, role };
  }
</script>

<div class="ws-row">
  <div>
    <label class="ws-label" for="launch-application">{t('Application')}</label>
    <p class="ws-hint">{t('The program that starts in the terminal.')}</p>
  </div>
  <div class="ws-control">
    <select
      id="launch-application"
      disabled={ws.busy}
      value={draft.agent}
      onchange={(e) => ws.setAgent(e.currentTarget.value as Agent)}
    >
      <option value="claude_code">Claude Code</option>
      <option value="codex">Codex</option>
    </select>
  </div>
</div>

<div class="ws-row">
  <div>
    <label class="ws-label" for="launch-directory"
      >{t('Working directory')}</label
    >
    <p class="ws-hint">{t('The folder the session opens in.')}</p>
  </div>
  <div class="ws-pair">
    <select
      id="launch-directory"
      class="ws-mono"
      disabled={ws.busy}
      bind:value={draft.directory}
    >
      {#each folders as path (path)}<option value={path}>{path}</option>{/each}
    </select>
    <button
      type="button"
      class="action"
      disabled={ws.busy}
      onclick={() => void ws.browse()}>{t('Select')}</button
    >
  </div>
</div>

<div class="ws-row">
  <div>
    <label class="ws-label" for="launch-permissions">{t('Permissions')}</label>
    <p class="ws-hint">{t('Which actions need your approval.')}</p>
  </div>
  <div class="ws-control">
    <select
      id="launch-permissions"
      disabled={ws.busy}
      value={draft.permission ?? ''}
      onchange={(e) =>
        (draft.permission =
          permissionsFor(draft.agent).find(
            (p) => p === e.currentTarget.value,
          ) ?? null)}
    >
      <option value="">{t(AS_CONFIGURED)}</option>
      {#each permissionsFor(draft.agent) as p (p)}
        <option value={p}>{t(PERMISSION_LABEL[p])}</option>
      {/each}
    </select>
    <p class="ws-hint" class:ws-warn={draft.permission === 'bypass'}>
      {t(HELP[draft.permission ?? 'configured'])}
    </p>
  </div>
</div>

<div class="ws-row">
  <div>
    <label class="ws-label" for="project-instructions"
      >{t('Project instructions')}</label
    >
    <p class="ws-hint">
      {t('The CLAUDE.md or AGENTS.md of the working directory.')}
    </p>
  </div>
  {#if draft.instructions}
    <div class="ws-control">
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
