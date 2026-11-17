<script lang="ts">
  import type { Snippet } from 'svelte';
  let {
    title,
    count = '',
    children,
  }: { title: string; count?: string; children: Snippet } = $props();
</script>

<section class="workspace-section" aria-label={title}>
  <h2>
    <span class="section-mark" aria-hidden="true">§</span>
    <span>{title}</span>
    {#if count}<span class="section-count">{count}</span>{/if}
  </h2>
  <div class="section-content">{@render children()}</div>
</section>

<style>
  .workspace-section {
    min-width: 0;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 18px 0 6px;
    color: var(--text);
    font-size: var(--text-sm);
    font-weight: 600;
  }
  .section-mark {
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }
  .section-count {
    margin-left: auto;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 400;
  }
</style>
