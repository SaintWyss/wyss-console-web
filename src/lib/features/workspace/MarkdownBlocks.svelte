<script lang="ts">
  import type { Block } from '../arsenal/guide';
  let { nodes }: { nodes: readonly Block[] } = $props();
</script>

<div class="markdown-blocks">
  {#each nodes as block, index (`${block.kind}-${index}`)}
    {#if block.kind === 'heading'}
      <svelte:element this={`h${Math.min(block.level, 6)}`}
        >{block.text}</svelte:element
      >
    {:else if block.kind === 'paragraph'}
      <p>{block.text}</p>
    {:else if block.kind === 'list'}
      <ul>
        {#each block.items as item, i (`${index}-${i}`)}<li>{item}</li>{/each}
      </ul>
    {:else}
      <pre><code>{block.text}</code></pre>
    {/if}
  {/each}
</div>

<style>
  .markdown-blocks {
    min-width: 0;
    color: var(--muted);
    font-size: var(--text-xs);
    overflow-wrap: anywhere;
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 8px 0 4px;
    color: var(--text);
    font-size: var(--text-sm);
  }
  p,
  ul,
  pre {
    margin: 6px 0;
  }
  ul {
    padding-left: 20px;
  }
  pre {
    max-width: 100%;
    overflow: auto;
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--surface);
    white-space: pre-wrap;
  }
  code {
    font-family: var(--font-mono);
  }
</style>
