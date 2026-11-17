<script lang="ts">
  import type { Permission } from '../../../contracts/native';
  import type { Roles } from '../../../desktop/arsenal-client';
  import { t } from '../../../i18n/index.svelte';
  import {
    AS_CONFIGURED,
    BYPASS_WARNING,
    PERMISSION_HELP,
    PERMISSION_LABEL,
  } from '../../native/present';
  import { PERMISSIONS, permissionsFor } from '../../../contracts/native';
  import type { LaunchDraft } from '../plan';
  import Section from '../Section.svelte';

  let {
    draft,
    busy = false,
    readOnly = false,
    roles,
    allRoles,
    saved,
    used,
    rolesOpen,
    newRole,
    onBrowse,
    onSetAgent,
    onToggleRoles,
    onNewRole,
    onAddRole,
    onRemoveRole,
  }: {
    draft: LaunchDraft;
    busy?: boolean;
    readOnly?: boolean;
    roles: Roles;
    allRoles: readonly { id: string; name: string; basic: boolean }[];
    saved: readonly string[];
    used: readonly { path: string; last_used: number }[];
    rolesOpen: boolean;
    newRole: string;
    onBrowse: () => void;
    onSetAgent: (agent: 'claude_code' | 'codex') => void;
    onToggleRoles: () => void;
    onNewRole: (name: string) => void;
    onAddRole: () => void;
    onRemoveRole: (id: string) => void;
  } = $props();

  const permissions = $derived(permissionsFor(draft.agent));
  const permissionHelp = $derived(
    draft.permission === 'bypass'
      ? BYPASS_WARNING
      : draft.permission === null
        ? PERMISSION_HELP
        : permissionDescription(draft.permission),
  );
  const permissionIsWarning = $derived(draft.permission === 'bypass');
  const savedOnly = $derived(saved.filter((path) => path !== draft.directory));
  const recentOnly = $derived(
    used.filter(
      (entry) => entry.path !== draft.directory && !saved.includes(entry.path),
    ),
  );

  function permissionDescription(permission: Permission): string {
    const descriptions: Record<Permission, string> = {
      ask: t('The agent asks before every change.'),
      read_only: t('The agent reads and plans; it changes nothing.'),
      edits: t(
        'The agent edits files without asking; it still asks before running commands. Claude Code only.',
      ),
      bypass: t(BYPASS_WARNING),
    };
    return descriptions[permission];
  }

  const selectablePermissions = $derived(
    PERMISSIONS.filter((permission) => permissions.includes(permission)),
  );
</script>

<Section title={t('General')}>
  <div class="workspace-row">
    <div class="row-label">
      <label for="launch-application">{t('Application')}</label>
      <p>{t('Choose which coding agent this launch starts.')}</p>
    </div>
    <div class="row-control">
      <select
        id="launch-application"
        disabled={busy || readOnly}
        value={draft.agent}
        onchange={(event) =>
          onSetAgent(event.currentTarget.value as 'claude_code' | 'codex')}
      >
        <option value="claude_code">Claude Code</option>
        <option value="codex">Codex</option>
      </select>
    </div>
  </div>

  <div class="workspace-row">
    <div class="row-label">
      <label for="launch-directory">{t('Working directory')}</label>
      <p>{t('The agent works with files in this folder.')}</p>
    </div>
    <div class="row-control directory-control">
      <select
        id="launch-directory"
        disabled={busy || readOnly}
        value={draft.directory}
        onchange={(event) => (draft.directory = event.currentTarget.value)}
      >
        <option value={draft.directory}
          >{draft.directory || t('Select a folder')}</option
        >
        {#if savedOnly.length > 0}
          <optgroup label={t('Saved')}>
            {#each savedOnly as path (path)}<option value={path}>{path}</option
              >{/each}
          </optgroup>
        {/if}
        {#if recentOnly.length > 0}
          <optgroup label={t('Recent')}>
            {#each recentOnly as entry (entry.path)}<option value={entry.path}
                >{entry.path}</option
              >{/each}
          </optgroup>
        {/if}
      </select>
      <button
        type="button"
        class="action select-folder"
        disabled={busy || readOnly}
        onclick={onBrowse}>{t('Select')}</button
      >
    </div>
  </div>

  <div class="workspace-row role-row">
    <div class="row-label">
      <label for="launch-role">{t('Role')}</label>
      <p>{t('Only used to group launches in this list.')}</p>
    </div>
    <div class="row-control role-control">
      <select
        id="launch-role"
        bind:value={draft.role}
        disabled={busy || readOnly}
      >
        {#each allRoles as role (role.id)}<option value={role.id}
            >{role.name}</option
          >{/each}
      </select>
      <button
        type="button"
        class="action roles-button"
        disabled={busy || readOnly}
        aria-expanded={rolesOpen}
        onclick={onToggleRoles}>{t('Roles')}</button
      >
      {#if rolesOpen}
        <div class="roles-admin" aria-label={t('Roles')}>
          {#each allRoles as role (role.id)}
            <div class="role-admin-row">
              <span>{role.name}</span>
              {#if role.basic}
                <span class="role-meta">{t('Basic role')}</span>
              {:else}
                <button
                  type="button"
                  class="role-delete"
                  aria-label={t('Delete role {name}', { name: role.name })}
                  disabled={busy}
                  onclick={() => onRemoveRole(role.id)}>{t('Delete')}</button
                >
              {/if}
            </div>
          {/each}
          <form
            class="new-role"
            onsubmit={(event) => {
              event.preventDefault();
              onAddRole();
            }}
          >
            <label class="visually-hidden" for="new-role-name"
              >{t('New role name')}</label
            >
            <input
              id="new-role-name"
              placeholder={t('New role name')}
              maxlength="40"
              bind:value={newRole}
              oninput={(event) => onNewRole(event.currentTarget.value)}
              disabled={busy}
            />
            <button
              type="submit"
              class="action"
              disabled={busy || !newRole.trim()}>{t('Add')}</button
            >
          </form>
          <p class="role-meta">
            {t('Launches of a deleted role become Worker.')}
          </p>
          {#if roles.damaged}<p class="role-meta">
              {t(
                'Roles could not be read; fix or remove the roles file before saving changes.',
              )}
            </p>{/if}
        </div>
      {/if}
    </div>
  </div>

  <div class="workspace-row">
    <div class="row-label">
      <label for="launch-permission">{t('Permissions')}</label>
      <p>{t('The permission this launch requests from its agent.')}</p>
    </div>
    <div class="row-control permission-control">
      <select
        id="launch-permission"
        disabled={busy || readOnly}
        value={draft.permission ?? ''}
        onchange={(event) => {
          const value = event.currentTarget.value;
          draft.permission =
            selectablePermissions.find((permission) => permission === value) ??
            null;
        }}
      >
        <option value="">{t(AS_CONFIGURED)}</option>
        {#each selectablePermissions as permission (permission)}
          <option value={permission}>{t(PERMISSION_LABEL[permission])}</option>
        {/each}
      </select>
      <p class="permission-help" class:warning={permissionIsWarning}>
        <span aria-hidden="true">{permissionIsWarning ? '⚠' : 'i'}</span>
        <span>{t(permissionHelp)}</span>
      </p>
    </div>
  </div>
</Section>

<style>
  .workspace-row:last-child {
    border-bottom: 0;
  }
  .row-label p,
  .permission-help,
  .role-meta {
    color: var(--muted);
    font-size: var(--text-xs);
    font-weight: 400;
  }
  .row-control {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    min-width: 0;
  }
  .directory-control,
  .role-control {
    grid-template-columns: minmax(0, 1fr) 140px;
  }
  .role-control {
    position: relative;
  }
  select,
  input {
    width: 100%;
    min-width: 0;
    min-height: var(--control-h);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text);
    font: var(--text-sm) var(--font-sans);
  }
  .action {
    width: 100%;
    min-height: var(--control-h);
  }
  .permission-help {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    overflow-wrap: anywhere;
  }
  .permission-help > span:first-child {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 20px;
    height: 20px;
    border: 1px solid var(--line);
    border-radius: 50%;
    color: var(--muted);
    font-family: var(--font-mono);
  }
  .permission-help.warning {
    border-color: var(--warn);
    background: var(--warn-soft);
    color: var(--warn);
  }
  .permission-help.warning > span:first-child {
    border-color: var(--warn);
    color: var(--warn);
  }
  .roles-admin {
    grid-column: 1 / -1;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  .role-admin-row,
  .new-role {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 40px;
    border-bottom: 1px solid var(--line);
  }
  .role-delete {
    min-height: var(--control-h);
    color: var(--error);
  }
  .new-role input {
    flex: 1;
    padding: 0 8px;
  }
  .roles-admin p {
    margin: 8px 0 0;
  }
  @media (max-width: 1023px) {
    .workspace-row {
      grid-template-columns: minmax(0, 1fr);
      gap: 8px;
    }
  }
  @media (max-width: 420px) {
    .directory-control,
    .role-control {
      grid-template-columns: minmax(0, 1fr);
    }
    .select-folder,
    .roles-button {
      width: 140px;
    }
  }
</style>
