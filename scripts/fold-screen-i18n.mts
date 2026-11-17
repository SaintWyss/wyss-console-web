/**
 * Folds the per-screen translation fragments (src/lib/i18n/screens/*.ts) into the shared
 * dictionaries and empties them (docs/plans/traduccion-por-pantalla.md).
 *
 * - A sentence already in a dictionary gets its Spanish replaced where it lives (an area file
 *   is merged after es.ts and wins, so it is replaced there, not shadowed).
 * - A new sentence is appended to es.ts (own text) or incoming/configuration.ts (Rust text).
 * - Two fragments giving one sentence different Spanish stop the fold.
 * - For each replaced sentence, the folders that draw it are printed: a fix is global.
 *
 * Usage: npx tsx scripts/fold-screen-i18n.mts [--dry]
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { emptyFragment, replaceValue } from './fold-screen-i18n-lib.mjs';

const dry = process.argv.includes('--dry');
const DIR = 'src/lib/i18n/screens';
const OWN_FILES = [
  'src/lib/i18n/es-arsenal.ts',
  'src/lib/i18n/es-native.ts',
  'src/lib/i18n/es-configuration.ts',
  'src/lib/i18n/es.ts',
];
const INCOMING_FILES = [
  'src/lib/i18n/incoming/arsenal.ts',
  'src/lib/i18n/incoming/native.ts',
  'src/lib/i18n/incoming/configuration.ts',
];

type Entries = Map<string, { es: string; from: string }>;
const own: Entries = new Map();
const incoming: Entries = new Map();
const screens = readdirSync(DIR).filter(
  (f) => f.endsWith('.ts') && f !== 'index.ts',
);
for (const f of screens) {
  const m = await import(`${process.cwd()}/${DIR}/${f}`);
  for (const [into, dict] of [
    [own, m.ES_SCREEN],
    [incoming, m.INCOMING_SCREEN],
  ] as [Entries, Record<string, string>][])
    for (const [en, es] of Object.entries(dict)) {
      const had = into.get(en);
      if (had && had.es !== es)
        throw new Error(`"${en}": ${had.from} and ${f} disagree`);
      into.set(en, { es, from: f });
    }
}

function drawnIn(en: string): string {
  try {
    return execFileSync(
      'git',
      [
        'grep',
        '-l',
        '-F',
        '--',
        en,
        'src/lib/features',
        'src/lib/shell',
        'src/App.svelte',
      ],
      { encoding: 'utf8' },
    )
      .trim()
      .split('\n')
      .join(', ');
  } catch {
    return 'Rust or a computed sentence';
  }
}

function fold(
  entries: Entries,
  files: string[],
  appendTo: string,
  anchor: RegExp,
) {
  const texts = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));
  const added: string[] = [];
  for (const [en, { es, from }] of entries) {
    const home = files.find(
      (f) => replaceValue(texts.get(f)!, en, es) !== null,
    );
    if (home) {
      texts.set(home, replaceValue(texts.get(home)!, en, es)!);
      console.log(
        `replaced in ${home} (${from}): ${en}\n    drawn in: ${drawnIn(en)}`,
      );
    } else added.push(`  ${JSON.stringify(en)}: ${JSON.stringify(es)},`);
  }
  if (added.length) {
    const text = texts.get(appendTo)!;
    if (!anchor.test(text)) throw new Error(`no anchor in ${appendTo}`);
    texts.set(
      appendTo,
      text.replace(anchor, (a) => `${added.join('\n')}\n${a}`),
    );
    console.log(`added ${added.length} to ${appendTo}`);
  }
  if (!dry) for (const [f, t] of texts) writeFileSync(f, t);
}

fold(own, OWN_FILES, 'src/lib/i18n/es.ts', /^ {2}\.\.\.ES_ARSENAL,/m);
fold(
  incoming,
  INCOMING_FILES,
  'src/lib/i18n/incoming/configuration.ts',
  /^};/m,
);

if (!dry)
  for (const f of screens)
    writeFileSync(`${DIR}/${f}`, emptyFragment(f.replace(/\.ts$/, '')));
