<script lang="ts">
  import { onMount } from 'svelte';
  import {
    permissionProfileId,
    permissionsFor,
    type AgentId,
    type NativeSession,
    type Permission,
    type Preview,
  } from '../../contracts/native';
  import type { NativeController, NativeState } from './controller';
  import {
    AGENT_LABEL,
    AS_CONFIGURED,
    BYPASS_WARNING,
    PERMISSION_LABEL,
  } from './present';
  import { t, tIncoming } from '../../i18n/index.svelte';

  let {
    session,
    native,
    controller,
    onclose,
    onstarted,
  }: {
    session: NativeSession;
    native: NativeState;
    controller: NativeController;
    onclose: () => void;
    /** An agent was started with the brief: the window shows its terminal. */
    onstarted: () => void;
  } = $props();

  let text = $state('');
  let loading = $state(true);
  let screen = $state(false);
  let preview = $state<Preview | null>(null);
  let previewFailed = $state(false);
  // svelte-ignore state_referenced_locally
  let target = $state<AgentId>(
    session.agent_id === 'claude_code' ? 'codex' : 'claude_code',
  );
  let permission = $state<Permission | null>(null);
  // The fixed template the permission is sent as; none when the agent starts as configured.
  const profile = $derived(permissionProfileId(permission));
  const agents = $derived(
    (native.launcher?.agents ?? []).filter(
      (a) => a.installed && a.agent_id !== 'hermes',
    ),
  );
  const permissions = $derived(permissionsFor(target));
  const tooLong = $derived(text.length > 16 * 1024);
  const ready = $derived(
    !loading &&
      !native.starting &&
      !tooLong &&
      text.startsWith('# ') &&
      (profile === null || preview?.can_start === true) &&
      agents.some((a) => a.agent_id === target),
  );
  $effect(() => {
    if (permission && !permissions.includes(permission)) permission = null;
  });
  let previewSeq = 0;
  $effect(() => {
    const selectedAgent = target;
    const selectedProfile = profile;
    const sequence = ++previewSeq;
    preview = null;
    previewFailed = false;
    if (!selectedProfile) return;
    void controller.preview(selectedAgent, selectedProfile).then(
      (next) => {
        if (sequence === previewSeq) preview = next;
      },
      () => {
        if (sequence === previewSeq) previewFailed = true;
      },
    );
  });
  onMount(async () => {
    const brief = await controller.handoff(session.id);
    if (brief) {
      text = brief.text;
      screen = brief.screen_included;
    }
    loading = false;
  });
  async function start() {
    if (
      await controller.startAgent(
        target,
        session.project,
        profile,
        text,
        preview,
      )
    )
      onstarted();
  }
</script>

<section
  class="native-card native-handoff"
  aria-label={t('Hand off to another agent')}
>
  <h3>{t('Hand off {agent}’s work', { agent: session.agent_name })}</h3>
  <p class="native-note">
    {t('This starts a')} <strong>{t('new')}</strong>
    {t(
      'session of the agent you choose, in the same folder, with the text below as its first message. It is not a transfer: the new agent has only this text and the files, not {agent}’s context, and nothing is moved or ended. Read it and change it before starting. Secrets found in it were removed.',
      { agent: session.agent_name },
    )}
  </p>
  <p class="native-warning" role="note">
    {t(
      'Hermes Native remains available as a separate interactive provider. It is omitted here because its pinned CLI does not expose a verified reviewed first-message interface without entering an effectful one-shot mode.',
    )}
  </p>
  {#if loading}
    <p class="sessions-status" role="status" aria-busy="true">
      {t('Preparing the brief…')}
    </p>
  {:else}
    {#if !screen}
      <p class="native-warning">
        {t(
          'The screen of that session is no longer held, so the brief has the repository state only.',
        )}
      </p>
    {/if}
    <div class="native-field">
      <label for="handoff-text">{t('Brief (Markdown, starts with “# ”)')}</label
      >
      <textarea id="handoff-text" rows="16" bind:value={text}></textarea>
      {#if tooLong}<p class="native-warning">
          {t('Longer than 16 KiB: shorten it.')}
        </p>{/if}
    </div>
    <div class="native-field">
      <label for="handoff-target">{t('Start')}</label>
      <div class="native-row">
        <select id="handoff-target" bind:value={target}>
          {#each agents as a (a.agent_id)}
            <option value={a.agent_id}>{a.name}</option>
          {/each}
        </select>
        <select
          id="handoff-permission"
          aria-label={t('Permissions')}
          bind:value={permission}
        >
          <option value={null}>{t(AS_CONFIGURED)}</option>
          {#each permissions as p (p)}
            <option value={p}>{t(PERMISSION_LABEL[p])}</option>
          {/each}
        </select>
      </div>
    </div>
    {#if permission === 'bypass'}
      <p class="native-warning" role="status">{t(BYPASS_WARNING)}</p>
    {/if}
    {#if profile && previewFailed}
      <p class="native-warning" role="status">
        {t(
          'Could not check what this permission would pass. Refresh Native before starting.',
        )}
      </p>
    {:else if preview}
      <ul class="native-preview" aria-label={t('What the permission passes')}>
        {#each preview.applied as line (line)}<li>{tIncoming(line)}</li>{/each}
        {#each preview.with_cost as line (line)}<li class="cost">
            {tIncoming(line)}
          </li>{/each}
        {#each preview.not_applicable as line (line)}<li class="refused">
            {tIncoming(line)}
          </li>{/each}
        {#each preview.warnings as line (line)}<li class="evidence">
            {tIncoming(line)}
          </li>{/each}
      </ul>
    {/if}
    <div class="native-plan-actions">
      <button
        type="button"
        class="action primary"
        disabled={!ready}
        onclick={start}
      >
        {native.starting
          ? t('Starting…')
          : t('Start {agent} with this brief', { agent: AGENT_LABEL[target] })}
      </button>
      <button
        type="button"
        class="action"
        disabled={loading || tooLong}
        onclick={() => controller.saveBrief(text)}
      >
        {t('Save to a file…')}
      </button>
      <button type="button" class="action" onclick={onclose}
        >{t('Cancel')}</button
      >
    </div>
  {/if}
</section>
