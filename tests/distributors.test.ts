import { afterEach, expect, it } from 'vitest';
import { parseInventoryReply } from '../src/lib/contracts/configuration';
import { ConfigurationController } from '../src/lib/features/configuration/controller';
import {
  distributorCards,
  distributorOf,
  SUGGESTED,
  versionNumber,
} from '../src/lib/features/distributors/present';
import { setLanguage, tPhrase } from '../src/lib/i18n/index.svelte';
import inventory from './fixtures/configuration-inventory-v1.json';
import { launcher } from './native-harness';

afterEach(() => {
  localStorage.clear();
  setLanguage('en');
});

const card = (cards: ReturnType<typeof distributorCards>, id: string) =>
  cards.find((c) => c.id === id)!;

it('says installed with the version, not installed, or unknown, as the launcher answered', () => {
  const cards = distributorCards(launcher());
  expect(cards.map((c) => c.name)).toEqual(['Anthropic', 'OpenAI', 'OpenCode']);
  expect(cards.map((c) => c.tool)).toEqual([
    'Claude Code',
    'Codex',
    'OpenCode',
  ]);
  // Only the number: the tool's own name is already on the card.
  expect(card(cards, 'anthropic').status).toEqual({
    text: '{version}',
    values: { version: '2.1.303' },
  });
  expect(versionNumber('codex-cli 0.169.0')).toBe('0.169.0');
  expect(versionNumber('1.2.3-beta.1 (x)')).toBe('1.2.3-beta.1');
  expect(versionNumber('nightly')).toBe('nightly');
  expect(card(cards, 'anthropic').installed).toBe(true);
  expect(card(cards, 'openai').status).toEqual({ text: 'Tool not installed' });
  expect(card(cards, 'openai').installed).toBe(false);
  // The launcher answered and did not name it: nothing is known of it.
  expect(card(cards, 'opencode').status).toEqual({ text: 'Unknown' });

  // An installed tool whose version was not reported is still installed.
  const unversioned = launcher();
  unversioned.agents[0].version = null;
  expect(card(distributorCards(unversioned), 'anthropic').status).toEqual({
    text: 'Installed',
  });

  // The launcher did not answer: every tool is unknown, none is said to be missing.
  const unknown = distributorCards(null);
  for (const id of ['anthropic', 'openai', 'opencode']) {
    expect(card(unknown, id).status, id).toEqual({ text: 'Unknown' });
    expect(card(unknown, id).installed, id).toBe(false);
  }
  expect(JSON.stringify([cards, unknown])).not.toMatch(/connected/i);
});

it('keeps the known tools, their update commands, and the Add suggestions', () => {
  const cards = distributorCards(null);
  expect(cards.map((c) => c.id)).toEqual(['anthropic', 'openai', 'opencode']);
  expect(card(cards, 'anthropic').update).toBe('claude update');
  expect(card(cards, 'openai').update).toBe('codex update');
  // OpenCode's update command is not checked: it has none.
  expect(card(cards, 'opencode').update).toBeNull();
  expect(SUGGESTED.map((s) => s.open)).toEqual(['kimi', 'gemini', 'aider']);
});

it('maps each agent to its distributor', () => {
  expect(distributorOf('claude_code')).toBe('Anthropic');
  expect(distributorOf('codex')).toBe('OpenAI');
  expect(distributorOf('opencode')).toBe('OpenCode');
});

it('says launcher status in Spanish', () => {
  setLanguage('es');
  const cards = distributorCards(launcher());
  expect(tPhrase(card(cards, 'anthropic').status)).toBe('2.1.303');
  expect(tPhrase(card(cards, 'openai').status)).toBe('No instalado');
  expect(tPhrase(card(cards, 'opencode').status)).toBe('Desconocido');
});

it('lets a configuration read be waited for, and reports a failed one as older', async () => {
  const reply = parseInventoryReply(inventory);
  let answer!: {
    resolve: (v: typeof reply) => void;
    reject: (e: unknown) => void;
  };
  let reads = 0;
  const controller = new ConfigurationController(() => undefined, {
    inventory: () => {
      reads++;
      return new Promise((resolve, reject) => (answer = { resolve, reject }));
    },
    changes: async () => ({ result: 'same', revision: reply.revision }),
  });
  let done = false;
  void Promise.all([controller.refresh(), controller.refresh()]).then(
    () => (done = true),
  );
  for (let i = 0; i < 20; i++) await Promise.resolve();
  expect(reads).toBe(1);
  expect(done).toBe(false);
  answer.resolve(reply);
  for (let i = 0; i < 20; i++) await Promise.resolve();
  expect(done).toBe(true);
  expect(controller.state().stale).toBe(false);
  // A read that fails still settles, and what is held is said to be older.
  const failed = controller.refresh();
  answer.reject(new Error('gone'));
  await failed;
  expect(controller.state().reply).toBe(reply);
  expect(controller.state().stale).toBe(true);
  controller.dispose();
});
