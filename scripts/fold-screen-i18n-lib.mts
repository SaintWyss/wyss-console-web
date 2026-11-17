/**
 * Text operations of scripts/fold-screen-i18n.mts, kept apart so they can be tested.
 *
 * Keys are found with the TypeScript parser, by their decoded value: a key may be written
 * quoted, bare (`checksum:`), numeric (`404:`) or with escapes (`'line\nbreak'`), and all of
 * those are the same property as the plain English sentence.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';

/** Where the value of each property `en` is written in `text` (every copy, in file order). */
function valueSpans(
  text: string,
  en: string,
): { start: number; end: number }[] {
  const file = ts.createSourceFile(
    'dict.ts',
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  const spans: { start: number; end: number }[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node)) {
      const name = node.name;
      const key =
        ts.isIdentifier(name) ||
        ts.isStringLiteral(name) ||
        ts.isNoSubstitutionTemplateLiteral(name)
          ? name.text
          : ts.isNumericLiteral(name)
            ? String(Number(name.text))
            : null;
      if (key === en)
        spans.push({
          start: node.initializer.getStart(file),
          end: node.initializer.getEnd(),
        });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return spans;
}

/** Replaces the value of every copy of `en` in `text`, or returns null when the key is not there. */
export function replaceValue(
  text: string,
  en: string,
  es: string,
): string | null {
  const spans = valueSpans(text, en);
  if (spans.length === 0) return null;
  let out = text;
  for (const { start, end } of spans.reverse())
    out = `${out.slice(0, start)}${JSON.stringify(es)}${out.slice(end)}`;
  return out;
}

/** An emptied fragment, written whole: a sentence may itself contain `};` (e.g. `{name};`),
 * so the old contents are never cut by pattern. */
export function emptyFragment(screen: string): string {
  return `/**
 * Working fragment of screen "${screen}" during the per-screen translation (docs/plans/traduccion-por-pantalla.md).
 * Spanish for new sentences and corrections of existing ones; folded into es.ts / incoming/ and emptied at integration.
 */
export const ES_SCREEN: Readonly<Record<string, string>> = {};
/** Sentences the desktop (Rust) writes, shown on this screen: English exactly as Rust writes it, {name} for parts. */
export const INCOMING_SCREEN: Readonly<Record<string, string>> = {};
`;
}

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

/** Folds every fragment under `root` into its dictionaries and empties the fragments. */
export async function runFold(
  root: string,
  {
    dry = false,
    log = console.log,
    load = (path: string) => import(path),
  }: {
    dry?: boolean;
    log?: (line: string) => void;
    /** Reads one fragment module; tests pass their own. */
    load?: (path: string) => Promise<Record<string, unknown>>;
  } = {},
): Promise<void> {
  const own: Entries = new Map();
  const incoming: Entries = new Map();
  const screens = readdirSync(`${root}/${DIR}`).filter(
    (f) => f.endsWith('.ts') && f !== 'index.ts',
  );
  for (const f of screens) {
    const m = await load(`${root}/${DIR}/${f}`);
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
        { encoding: 'utf8', cwd: root },
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
    const texts = new Map(
      files.map((f) => [f, readFileSync(`${root}/${f}`, 'utf8')]),
    );
    const added: string[] = [];
    for (const [en, { es, from }] of entries) {
      // Every copy is replaced: the dictionaries are merged with spreads, so whichever copy wins
      // the merge must carry the new Spanish.
      const homes: string[] = [];
      for (const f of files) {
        const replaced = replaceValue(texts.get(f)!, en, es);
        if (replaced === null) continue;
        texts.set(f, replaced);
        homes.push(f);
      }
      if (homes.length)
        log(
          `replaced in ${homes.join(', ')} (${from}): ${en}\n    drawn in: ${drawnIn(en)}`,
        );
      else added.push(`  ${JSON.stringify(en)}: ${JSON.stringify(es)},`);
    }
    if (added.length) {
      const text = texts.get(appendTo)!;
      if (!anchor.test(text)) throw new Error(`no anchor in ${appendTo}`);
      texts.set(
        appendTo,
        text.replace(anchor, (a) => `${added.join('\n')}\n${a}`),
      );
      log(`added ${added.length} to ${appendTo}`);
    }
    if (!dry) for (const [f, t] of texts) writeFileSync(`${root}/${f}`, t);
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
      writeFileSync(
        `${root}/${DIR}/${f}`,
        emptyFragment(f.replace(/\.ts$/, '')),
      );
}
