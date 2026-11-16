<script lang="ts">
  import StatusList from './StatusList.svelte';
  import type { AuthorityObservation } from './authority';
  import type { LifecycleObservation } from './lifecycle';
  import type { RuntimeSummary } from './runtime';
  let {
    hidden = false,
    runtime,
    authority,
    lifecycle,
  }: {
    hidden?: boolean;
    runtime: RuntimeSummary;
    authority: AuthorityObservation;
    lifecycle: LifecycleObservation;
  } = $props();
</script>

<!-- Terminal, agent and authority, on every view but the Console (which has its session bar). -->
<footer class="status-bar" {hidden}>
  <StatusList {runtime} {authority} {lifecycle} />
</footer>
