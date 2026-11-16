<script lang="ts">
  import { t, tJoin } from '../i18n/index.svelte';
  import { summarizeAgent, type AuthorityObservation } from './authority';
  import { summarizeLink, type LifecycleObservation } from './lifecycle';
  import type { RuntimeSummary } from './runtime';

  let {
    runtime,
    authority,
    lifecycle,
  }: {
    /** The local human terminal. It never depends on the authority. */
    runtime: RuntimeSummary;
    authority: AuthorityObservation;
    /** What is being done to make the authority available, while it is not. */
    lifecycle: LifecycleObservation;
  } = $props();
  const agent = $derived(summarizeAgent(authority));
  const link = $derived(summarizeLink(authority, lifecycle));
</script>

<!-- One status per line. Collapsed, only the dots stay; the words are read out and in the tooltip. -->
<div class="status-cluster" role="group" aria-label={t('Status')}>
  <span
    class="pill terminal"
    data-tone={runtime.tone}
    title={`${t(runtime.label)} · ${t('Local terminal. It runs with or without the authority.')}`}
  >
    <span class="pill-key">{t('Terminal')}</span>
    <span class="dot" aria-hidden="true"></span>
    <span class="pill-value">{t(runtime.label)}</span>
  </span>
  <span
    class="pill agent"
    data-tone={agent.tone}
    title={`${t(agent.label)} · ${tJoin(agent.detail)}`}
  >
    <span class="pill-key">{agent.key}</span>
    <span class="dot" aria-hidden="true"></span>
    <span class="pill-value">{t(agent.label)}</span>
  </span>
  <span
    class="pill authority"
    data-tone={link.tone}
    title={`${t('Protocol 1 authority')} · ${t(link.label)} · ${tJoin(link.detail)}`}
  >
    <span class="pill-key">{t('Authority P1')}</span>
    <span class="dot" aria-hidden="true"></span>
    <span class="pill-value">{t(link.label)}</span>
    {#if link.note}<span class="pill-note"
        >{t(link.note.text, link.note.values)}</span
      >{/if}
  </span>
</div>
