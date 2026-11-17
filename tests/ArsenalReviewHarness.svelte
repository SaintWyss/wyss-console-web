<script lang="ts">
  import { onDestroy } from 'svelte';
  import LibraryView from '../src/lib/features/arsenal/LibraryView.svelte';
  import { GuideStore } from '../src/lib/features/arsenal/guide-store.svelte';
  import { ArsenalController } from '../src/lib/features/arsenal/controller';
  import { ConfigurationController } from '../src/lib/features/configuration/controller';
  import {
    ChangesController,
    type ChangesClient,
  } from '../src/lib/features/configuration/changes-controller';
  import type { Guide } from '../src/lib/contracts/arsenal';
  import type { InventoryReply } from '../src/lib/contracts/configuration';

  let {
    guide,
    reply,
    client,
  }: { guide: Guide; reply: InventoryReply; client: ChangesClient } = $props();
  // Each test mounts one fixed client and inventory.
  const store = new GuideStore({
    guide: async () => guide,
    guideBody: async (id) => ({
      id,
      text: '',
      text_es: null,
      cut: false,
      files: [],
      more_files: 0,
      files_cut: false,
    }),
  });
  const configurationController = new ConfigurationController(
    (next) => (configuration = next),
    {
      inventory: async () => reply,
      changes: async (revision) => ({ result: 'same', revision }),
    },
  );
  let configuration = $state(configurationController.state());
  $effect(() => {
    configurationController.setVisible(true);
  });
  // svelte-ignore state_referenced_locally
  const changesController = new ChangesController(
    (next) => (changes = next),
    () => undefined,
    client,
  );
  let changes = $state(changesController.state());
  const arsenalController = new ArsenalController(() => undefined);
  const arsenal = arsenalController.snapshot();
  onDestroy(() => {
    configurationController.dispose();
    changesController.dispose();
    arsenalController.dispose();
  });
</script>

<LibraryView
  visible
  {store}
  {configuration}
  {configurationController}
  {changes}
  {changesController}
  {arsenal}
  {arsenalController}
  oneditlaunch={() => undefined}
  oncreatelaunch={() => undefined}
/>
