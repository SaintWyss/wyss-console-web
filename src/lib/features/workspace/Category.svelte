<script lang="ts">
  import type { Snippet } from 'svelte';
  import Toggle from './Toggle.svelte';

  let {
    label,
    count,
    on,
    disabled = false,
    onchange,
    children,
  }: {
    label: string;
    count: string;
    on: boolean;
    disabled?: boolean;
    onchange: (on: boolean) => void;
    children: Snippet;
  } = $props();
  let open = $state(true);
</script>

<section class="ws-category">
  <div class="ws-line ws-category-head">
    <button
      type="button"
      class="ws-fold"
      aria-expanded={open}
      onclick={() => (open = !open)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg
      >
      <span>{label}</span>
    </button>
    <span class="ws-meta">{count}</span>
    <Toggle {label} {on} {disabled} {onchange} />
  </div>
  {#if open}{@render children()}{/if}
</section>
