<script lang="ts">
  import WorkspaceView from '../src/lib/features/native/WorkspaceView.svelte';
  import {
    NativeController,
    type NativeClient,
  } from '../src/lib/features/native/controller';
  import type { StartReply } from '../src/lib/contracts/native';

  let {
    client,
    visible = true,
    started = () => undefined,
    onconsole = () => undefined,
    onupdate = () => undefined,
    onarsenal = undefined,
  }: {
    client: NativeClient;
    onarsenal?: () => void;
    visible?: boolean;
    started?: (reply: StartReply) => void;
    onconsole?: () => void;
    onupdate?: (title: string, cwd: string, input: string) => void;
  } = $props();
  // Built once for one client, as the application does.
  // svelte-ignore state_referenced_locally
  const controller = new NativeController(
    (next) => {
      native = next;
    },
    (reply) => started(reply),
    client,
    { overview: 20, background: 40 },
  );
  let native = $state(controller.state());
  $effect(() => {
    controller.setVisible(visible);
    return () => controller.dispose();
  });
</script>

<WorkspaceView
  {native}
  {controller}
  {visible}
  {onconsole}
  {onupdate}
  {onarsenal}
/>
