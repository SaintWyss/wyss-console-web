import { expect, it } from 'vitest';
import type { Guide, Selection } from '../src/lib/contracts/arsenal';
import { GuideStore } from '../src/lib/features/arsenal/guide-store.svelte';
import { mapOf, type MapText } from '../src/lib/features/arsenal/map';

const text: MapText = {
  tool: { claude_code: 'Claude Code', codex: 'Codex', opencode: 'OpenCode' },
  skills: 'Skills',
  agents: 'Agents',
  personal: 'Personal',
  sets: 'Sets',
  hooks: 'Hooks',
  keptAside: 'Kept aside',
  hookEvent: (event) => event,
  mcp: 'MCP',
  configuration: 'Configuration',
  presets: 'Presets',
  setName: (key) => key,
  category: (label) => label,
};

const selection = (id: string, provider: Selection['provider']): Selection => ({
  id,
  name: id,
  provider,
  items: [],
  composites: [],
  created_at: 1,
  updated_at: 1,
});

it('adds one counted Presets node under each supported tool', () => {
  const guide: Guide = { entries: [], sets: [], truncated: false };
  const roots = mapOf(guide, [], ['claude_code', 'codex'], text, [
    selection('Claude selection', 'claude_code'),
    selection('Codex selection', 'codex'),
  ]);
  const presets = roots
    .flatMap((root) => (root.kind === 'branch' ? root.children : []))
    .filter((node) => node.kind === 'presets');
  expect(presets).toEqual([
    {
      kind: 'presets',
      key: 'claude_code/presets',
      label: 'Presets',
      count: 1,
      tool: 'claude_code',
    },
    {
      kind: 'presets',
      key: 'codex/presets',
      label: 'Presets',
      count: 1,
      tool: 'codex',
    },
  ]);
});

it('omits Hooks from OpenCode while keeping MCP and Configuration', () => {
  const roots = mapOf(
    { entries: [], sets: [], truncated: false },
    [],
    ['opencode'],
    text,
    [],
  );
  const keys = roots.flatMap((root) =>
    root.kind === 'branch' ? root.children.map((child) => child.key) : [],
  );
  expect(keys).not.toContain('opencode/hooks');
  expect(keys).toContain('opencode/mcp');
  expect(keys).toContain('opencode/global');
});

it('redirects an old OpenCode Hooks selection to Configuration', () => {
  const store = new GuideStore({
    guide: async () => ({ entries: [], sets: [], truncated: false }),
    guideBody: async () => {
      throw new Error('unused');
    },
  });
  store.choose({ tool: 'opencode', section: 'hooks' });
  expect(store.section).toBe('global');
});
