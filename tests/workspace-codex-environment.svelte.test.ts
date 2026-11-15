import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import NativeHarness from './NativeHarness.svelte';
import { fakeClient, launcher } from './native-harness';

// The Arsenal answers of this window: one Codex preset whose environment leaves a hook out.
const plan = vi.hoisted(() => ({
  value: null as unknown,
}));
vi.mock('../src/lib/desktop/arsenal-client', async (original) => {
  const real =
    await original<typeof import('../src/lib/desktop/arsenal-client')>();
  return {
    ...real,
    arsenalClient: {
      ...real.arsenalClient,
      bindings: vi.fn(async () => []),
      selections: vi.fn(async () => [
        {
          id: 'sel-1',
          name: 'Frontend',
          provider: 'codex',
          items: [],
          composites: [],
          created_at: 1,
          updated_at: 1,
        },
      ]),
      projectSelection: vi.fn(async () => 'sel-1'),
      terminalPlan: vi.fn(async () => plan.value),
      bindTerminal: vi.fn(async () => ({
        state: 'applied',
        selection_name: 'Frontend',
      })),
    },
  };
});

let component: ReturnType<typeof mount> | undefined;
afterEach(() => {
  if (component) unmount(component);
  component = undefined;
});
const settle = async () => {
  for (let i = 0; i < 60; i++) await new Promise((r) => setTimeout(r, 0));
  flushSync();
};
const text = (node: Element | null | undefined) =>
  node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const button = (label: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
    text(b).includes(label),
  )!;

function codexPlan(over: Record<string, unknown>) {
  return {
    selection: 'sel-1',
    selection_name: 'Frontend',
    provider: 'codex',
    provider_version: 'codex-cli 0.159.0',
    project: 'app',
    status: 'ready',
    can_apply: false,
    enforcement: {
      state: 'unqualified',
      reason: 'Not qualified for this Codex build.',
      evidence: null,
    },
    items: [],
    kept: [],
    excluded: [],
    inherited_off: [],
    excluded_files: [],
    untouched: [],
    composites: [],
    conflicts: [],
    warnings: [],
    overlay: '',
    config_hash: 'e'.repeat(64),
    codex_environment: { instructions: false, hooks_off: ['k1'] },
    ...over,
  };
}

async function openCodex() {
  const client = fakeClient({
    launcher: vi.fn(async () =>
      launcher({
        agents: [
          {
            agent_id: 'claude_code',
            name: 'Claude Code',
            executable: 'claude',
            installed: true,
            path: '/home/u/.local/bin/claude',
            version: '2.1.303 (Claude Code)',
          },
          {
            agent_id: 'codex',
            name: 'Codex',
            executable: 'codex',
            installed: true,
            path: '/home/u/.local/bin/codex',
            version: 'codex-cli 0.159.0',
          },
        ],
      }),
    ),
  });
  component = mount(NativeHarness, {
    target: document.body,
    props: { client },
  });
  await settle();
  const radios = [
    ...document.querySelectorAll<HTMLInputElement>('.native-agent input'),
  ];
  const codex = radios.find((r) => text(r.closest('label')).includes('Codex'))!;
  codex.click();
  flushSync();
  await settle();
  return client;
}

describe('a Codex preset that leaves something out, in the launcher', () => {
  it('cannot start when it cannot be applied: no checkboxes, Start disabled, nothing started', async () => {
    plan.value = codexPlan({ can_apply: false });
    const client = await openCodex();
    const skills = document.querySelector('.launch-skills')!;
    expect(
      skills.querySelectorAll('input[type=checkbox]'),
      text(skills),
    ).toHaveLength(0);
    expect(text(skills)).toContain('cannot be applied now, so it cannot start');
    expect(text(skills)).not.toContain('Apply to this terminal');
    expect(text(skills)).not.toContain('Start without applying');
    // The summary says it is not applied, and Start is closed.
    expect(button('Start Codex').disabled).toBe(true);
    button('Start Codex').click();
    await settle();
    expect(client.start).not.toHaveBeenCalled();
  });

  it('control: the same preset without an environment can be started without applying', async () => {
    plan.value = codexPlan({ can_apply: false, codex_environment: null });
    await openCodex();
    const skills = document.querySelector('.launch-skills')!;
    expect(text(skills)).toContain('Start without applying');
  });

  it('control: when it can be applied it starts, with the preview that binds it', async () => {
    plan.value = codexPlan({
      can_apply: true,
      enforcement: { state: 'available', reason: 'ok', evidence: null },
    });
    const client = await openCodex();
    expect(
      document.querySelectorAll('.launch-skills input[type=checkbox]'),
    ).toHaveLength(0);
    expect(button('Start Codex').disabled).toBe(false);
    button('Start Codex').click();
    await settle();
    expect(client.start).toHaveBeenCalledTimes(1);
  });
});
