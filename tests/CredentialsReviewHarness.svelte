<script lang="ts">
  import { onMount } from 'svelte';
  import CredentialsView from '../src/lib/features/credentials/CredentialsView.svelte';
  import {
    CredentialsController,
    type CredentialsClient,
  } from '../src/lib/features/credentials/controller';

  let { client }: { client: CredentialsClient } = $props();
  // svelte-ignore state_referenced_locally
  const controller = new CredentialsController((next) => {
    credentials = next;
  }, client);
  let credentials = $state(controller.state());
  onMount(() => {
    void controller.refresh();
    return () => controller.dispose();
  });
</script>

<CredentialsView {credentials} {controller} visible={true} />
