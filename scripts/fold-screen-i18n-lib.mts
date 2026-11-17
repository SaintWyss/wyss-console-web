/**
 * Text operations of scripts/fold-screen-i18n.mts, kept apart so they can be tested.
 */

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** The key as it may be written in a dictionary: single-quoted (prettier), double-quoted, or bare
 * when it is an identifier (prettier drops the quotes then, e.g. `checksum:`). */
export function keyForms(en: string): string[] {
  const single = `'${en.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const forms = [single, JSON.stringify(en)];
  if (IDENTIFIER.test(en)) forms.push(en);
  return forms;
}

/** Replaces the value of `en` in `text`, or returns null when the key is not there. */
export function replaceValue(
  text: string,
  en: string,
  es: string,
): string | null {
  for (const key of keyForms(en)) {
    const at = text.indexOf(`\n  ${key}:`);
    if (at < 0) continue;
    const valueStart = at + 3 + key.length + 1;
    // The value is the next quoted string, on this line or the next one.
    const m = /\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/y;
    m.lastIndex = valueStart;
    const found = m.exec(text);
    if (!found) throw new Error(`cannot read the value of "${en}"`);
    const end = valueStart + found[0].length;
    return `${text.slice(0, valueStart)} ${JSON.stringify(es)}${text.slice(end)}`;
  }
  return null;
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
