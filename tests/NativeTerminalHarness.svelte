<script lang="ts">
  import { onMount } from 'svelte';
  import type { StartReply } from '../src/lib/contracts/native';
  import TerminalView from '../src/lib/features/terminal/TerminalView.svelte';
  import {
    NativeController,
    type NativeState,
  } from '../src/lib/features/native/controller';
  import { whenWorkspaceReady } from '../src/lib/features/native/bridge';

  let {
    oncontroller,
  }: {
    oncontroller?: (controller: NativeController) => void;
  } = $props();

  let native = $state<NativeState>({
    phase: 'idle',
    launcher: null,
    sessions: [],
    starting: false,
    failure: null,
    m9Uncertain: true,
    m9Blocked: true,
    checkingLauncher: false,
  });

  const nativeController = new NativeController(
    (next) => (native = next),
    (reply: StartReply) => {
      whenWorkspaceReady((manager) => {
        const tab = manager.tabOf(reply.session.id);
        if (tab) manager.activate(tab);
        else manager.createNative(reply);
      });
    },
  );

  onMount(() => {
    oncontroller?.(nativeController);
    nativeController.start0();
    return () => nativeController.dispose();
  });
</script>

<TerminalView {native} {nativeController} visible />
