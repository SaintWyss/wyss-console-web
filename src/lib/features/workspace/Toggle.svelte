<script lang="ts">
  let {
    label,
    on,
    disabled = false,
    onchange,
  }: {
    label: string;
    on: boolean;
    disabled?: boolean;
    onchange: (on: boolean) => void;
  } = $props();
</script>

<button
  type="button"
  class="ws-switch"
  role="switch"
  aria-label={label}
  aria-checked={on}
  {disabled}
  onclick={() => onchange(!on)}
></button>
