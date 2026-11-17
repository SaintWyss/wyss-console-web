<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { ArsenalState } from '../src/lib/features/arsenal/controller';
  import { ArsenalController } from '../src/lib/features/arsenal/controller';
  import PresetsPanel from '../src/lib/features/arsenal/PresetsPanel.svelte';

  let {
    oncontroller,
  }: {
    oncontroller?: (controller: ArsenalController) => void;
  } = $props();

  let arsenal = $state<ArsenalState | null>(null);
  const controller = new ArsenalController((next) => (arsenal = next));
  const panelState = $derived(arsenal ?? controller.snapshot());

  const launches = async () => ({
    folder: '/home/u/.config/wyss-console/launch',
    launches: [],
    refused: [],
    system: { id: 'linux', like: [], name: 'Linux' },
  });

  onMount(() => {
    oncontroller?.(controller);
    controller.setVisible(true);
  });
  onDestroy(() => controller.dispose());
</script>

<PresetsPanel
  visible
  provider="claude_code"
  arsenal={panelState}
  {controller}
  onedit={() => undefined}
  oncreate={() => undefined}
  {launches}
/>
