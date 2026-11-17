<script lang="ts">
  import { t } from '../../i18n/index.svelte';

  let {
    label,
    checked,
    disabled = false,
    detail = '',
    meta = '',
    onchange,
  }: {
    label: string;
    checked: boolean;
    disabled?: boolean;
    detail?: string;
    meta?: string;
    onchange: (checked: boolean) => void;
  } = $props();
</script>

<button
  class="toggle-row"
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={detail ? `${label}, ${detail}${meta ? `, ${meta}` : ''}` : label}
  {disabled}
  onclick={() => onchange(!checked)}
>
  <span class="toggle-label">{label}</span>
  {#if detail}<span class="toggle-detail">{detail}</span>{/if}
  {#if meta}<span class="toggle-meta">{meta}</span>{/if}
  <span class="toggle-control" aria-hidden="true">
    <span class="toggle-mark">{checked ? '✓' : '—'}</span>
    <span class="toggle-thumb"></span>
  </span>
  <span class="toggle-state">{checked ? t('On') : t('Off')}</span>
</button>

<style>
  .toggle-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, auto) auto auto auto;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-width: 0;
    min-height: 40px;
    padding: 4px 8px;
    border: 0;
    border-bottom: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text);
    text-align: left;
    cursor: pointer;
  }
  .toggle-row:hover:not(:disabled) {
    background: var(--surface-hover);
  }
  .toggle-row:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }
  .toggle-label {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .toggle-detail {
    min-width: 0;
    color: var(--muted);
    font-size: var(--text-xs);
    overflow-wrap: anywhere;
  }
  .toggle-meta {
    min-width: 0;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    white-space: nowrap;
  }
  .toggle-control {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 40px;
    height: 22px;
    padding: 2px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface-hover);
  }
  [aria-checked='true'] .toggle-control {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .toggle-mark {
    position: absolute;
    left: 4px;
    font-size: var(--text-xs);
    line-height: 1;
    color: var(--text);
  }
  [aria-checked='true'] .toggle-mark {
    left: auto;
    right: 5px;
  }
  .toggle-thumb {
    z-index: 1;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--surface);
    border: 1px solid var(--line);
  }
  [aria-checked='true'] .toggle-thumb {
    transform: translateX(16px);
    background: var(--accent);
    border-color: var(--accent);
  }
  .toggle-state {
    min-width: 30px;
    color: var(--muted);
    font-size: var(--text-xs);
  }
  @media (max-width: 1023px) {
    .toggle-row {
      grid-template-columns: minmax(0, 1fr) auto auto auto;
    }
    .toggle-detail {
      grid-column: 1 / -1;
      grid-row: 2;
      padding: 0 0 2px;
    }
  }
</style>
