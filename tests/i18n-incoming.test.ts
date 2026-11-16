import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { INCOMING as A } from '../src/lib/i18n/incoming/arsenal';
import { INCOMING as N } from '../src/lib/i18n/incoming/native';
import { INCOMING as C } from '../src/lib/i18n/incoming/configuration';
import { INCOMING as R } from '../src/lib/i18n/incoming/rest';
import { INCOMING_SCREENS as S } from '../src/lib/i18n/screens';
import {
  fillTemplate,
  setLanguage,
  tIncoming,
} from '../src/lib/i18n/index.svelte';

function rustSources(): string {
  let all = '';
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith('.rs')) all += readFileSync(path, 'utf8');
    }
  };
  walk(join(process.cwd(), 'src-tauri/src'));
  return all;
}

afterEach(() => setLanguage('en'));
const names = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

it('every area entry keeps its {name} places and no sentence is in two areas', () => {
  const seen = new Map<string, string>();
  for (const [area, dict] of Object.entries({ A, N, C, R })) {
    for (const [en, es] of Object.entries(dict)) {
      expect(names(es), `${area}: ${en}`).toEqual(names(en));
      expect(es.trim().length, `${area}: ${en}`).toBeGreaterThan(0);
      expect(seen.has(en), `${en} in ${seen.get(en)} and ${area}`).toBe(false);
      seen.set(en, area);
    }
  }
});

it('every area entry is a sentence the desktop (Rust) writes', () => {
  const rust = rustSources();
  for (const dict of [A, N, C, R, S])
    for (const en of Object.keys(dict))
      for (const part of en
        .split(/\{\w+\}/)
        .filter((p) => p.trim().length >= 4))
        expect(
          rust.includes(part),
          `not in src-tauri: "${part}" of "${en}"`,
        ).toBe(true);
});

it('translates an exact sentence, a filled sentence, and leaves the rest as it came', () => {
  setLanguage('en');
  expect(tIncoming('anything')).toBe('anything');
  setLanguage('es');
  expect(tIncoming('not a known sentence 123')).toBe(
    'not a known sentence 123',
  );
  expect(
    fillTemplate(
      'Built for {a}; this terminal runs {b}.',
      'Hecha para {a}; esta terminal corre {b}.',
      'Built for Codex; this terminal runs Claude Code.',
    ),
  ).toBe('Hecha para Codex; esta terminal corre Claude Code.');
  expect(tIncoming('This profile was not written for this agent.')).toBe(
    N['This profile was not written for this agent.'],
  );
  const filled = Object.entries({ ...A, ...N, ...C, ...R }).find(([en]) =>
    /^\{\w+\} /.test(en),
  );
  expect(filled, 'a sentence that starts with a part').toBeDefined();
  const [en, es] = filled!;
  const part = en.match(/^\{(\w+)\}/)![1];
  expect(tIncoming(en.replace(`{${part}}`, 'XYZ'))).toBe(
    es.replace(`{${part}}`, 'XYZ'),
  );
  for (const word of ['constructor', 'toString', '__proto__', 'hasOwnProperty'])
    expect(tIncoming(word)).toBe(word);
  expect(
    fillTemplate('Built for {a}.', 'Hecha para {a}.', 'Other text.'),
  ).toBeNull();
});
