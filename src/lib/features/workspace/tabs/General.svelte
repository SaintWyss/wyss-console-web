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

  let rolesOpen = $state(false);
  let newRole = $state('');
  const folders = $derived([
    ...new Set([draft.directory, ...ws.saved, ...ws.used.map((u) => u.path)]),
  ]);
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
    <label class="ws-label" for="launch-role">{t('Role')}</label>
    <p class="ws-hint">{t('A label for the launch.')}</p>
  </div>
  <div class="ws-control">
    <div class="ws-pair">
      <select id="launch-role" disabled={ws.busy} bind:value={draft.role}>
        {#each ws.allRoles as role (role.id)}<option value={role.id}
            >{role.name}</option
          >{/each}
      </select>
      <button
        type="button"
        class="action"
        aria-expanded={rolesOpen}
        onclick={() => (rolesOpen = !rolesOpen)}>{t('Roles')}</button
      >
    </div>
    {#if rolesOpen}
      <ul class="ws-roles">
        {#each ws.allRoles as role (role.id)}
          <li>
            <span>{role.name}</span>
            {#if !role.basic}
              <button
                type="button"
                class="ws-link"
                aria-label={t('Delete role {name}', { name: role.name })}
                onclick={() => void ws.removeRole(role.id)}
                >{t('Delete')}</button
              >
            {/if}
          </li>
        {/each}
        <li>
          <form
            class="ws-pair"
            onsubmit={(e) => {
              e.preventDefault();
              void ws.addRole(newRole).then(() => (newRole = ''));
            }}
          >
            <input
              aria-label={t('New role name')}
              placeholder={t('New role')}
              maxlength="40"
              bind:value={newRole}
            />
            <button type="submit" class="action" disabled={!newRole.trim()}
              >{t('Add')}</button
            >
          </form>
        </li>
      </ul>
    {/if}
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
