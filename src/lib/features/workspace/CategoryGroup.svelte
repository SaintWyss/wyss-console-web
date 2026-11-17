<script lang="ts">
  import type { Snippet } from 'svelte';
  import { t } from '../../i18n/index.svelte';

  let {
    id,
    label,
    enabled,
    total,
    expanded,
    disabled = false,
    ontoggle,
    ontoggleall,
    children,
  }: {
    id: string;
    label: string;
    enabled: number;
    total: number;
    expanded: boolean;
    disabled?: boolean;
    ontoggle: () => void;
    ontoggleall: (checked: boolean) => void;
    children: Snippet;
  } = $props();

  const checked = $derived(enabled === total && total > 0);
  const mixed = $derived(enabled > 0 && enabled < total);
</script>

<section class="category-group">
  <div class="category-head">
    <button
      type="button"
      class="category-open"
      aria-expanded={expanded}
      aria-controls={`category-${id}`}
      {disabled}
      onclick={ontoggle}
    >
      <svg class:expanded viewBox="0 0 16 16" aria-hidden="true">
        <path d="m5 3 5 5-5 5" />
      </svg>
      <span class="category-name">{label}</span>
      <span class="category-count"
        >{t('{on} of {all}', { on: enabled, all: total })}</span
      >
    </button>
    <button
      type="button"
      class="category-toggle"
      role="checkbox"
      aria-checked={mixed ? 'mixed' : checked}
      aria-label={t('Toggle all {name}', { name: label })}
      {disabled}
      onclick={() => ontoggleall(enabled < total)}
    >
      <span class="category-toggle-icon" aria-hidden="true">
        {checked ? '✓' : mixed ? '−' : '×'}
      </span>
      <span>{mixed ? t('Mixed') : checked ? t('On') : t('Off')}</span>
    </button>
  </div>
  {#if expanded}
    <div class="category-rows" id={`category-${id}`}>
      {@render children()}
    </div>
  {/if}
</section>

<style>
  .category-group {
    border-bottom: 1px solid var(--line);
  }
  .category-head {
    display: flex;
    align-items: center;
    min-height: 48px;
    gap: 8px;
  }
  .category-open,
  .category-toggle {
    min-height: 40px;
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text);
  }
  .category-open {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: 10px;
    padding: 4px 8px;
    text-align: left;
  }
  .category-open:hover,
  .category-toggle:hover:not(:disabled) {
    background: var(--surface-hover);
  }
  .category-open svg {
    flex: none;
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    transition: transform 160ms ease;
  }
  .category-open svg.expanded {
    transform: rotate(90deg);
  }
  .category-name {
    min-width: 0;
    overflow-wrap: anywhere;
    font-weight: 600;
  }
  .category-count {
    margin-left: auto;
    flex: none;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }
  .category-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    color: var(--muted);
    font-size: var(--text-xs);
  }
  .category-toggle[aria-checked='true'] {
    color: var(--text);
  }
  .category-toggle:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }
  .category-toggle-icon {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--surface);
    font-size: var(--text-xs);
    line-height: 1;
  }
  [aria-checked='true'] .category-toggle-icon {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .category-rows {
    min-width: 0;
    padding-left: 24px;
  }
  @media (prefers-reduced-motion: reduce) {
    .category-open svg {
      transition: none;
    }
  }
</style>
