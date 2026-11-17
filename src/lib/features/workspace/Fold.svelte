<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    label,
    count = '',
    children,
  }: { label: string; count?: string; children: Snippet } = $props();
  let open = $state(false);
</script>

<section class="ws-fold-section">
  <button
    type="button"
    class="ws-fold ws-section"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
    <span>{label}</span>
    {#if count}<span class="ws-meta">{count}</span>{/if}
  </button>
  {#if open}<div class="ws-fold-body">{@render children()}</div>{/if}
</section>
