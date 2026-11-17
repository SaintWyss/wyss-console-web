import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  emptyFragment,
  replaceValue,
  runFold,
} from '../scripts/fold-screen-i18n-lib.mjs';

const OWN = ['es-arsenal', 'es-native', 'es-configuration'];
const INCOMING = ['arsenal', 'native', 'configuration'];

/** A copy of the dictionary layout with only what each case needs. */
function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'fold-'));
  const base: Record<string, string> = {
    'src/lib/i18n/es.ts':
      'export const ES: Record<string, string> = {\n  ...ES_ARSENAL,\n};\n',
  };
  for (const f of OWN)
    base[`src/lib/i18n/${f}.ts`] =
      'export const X: Record<string, string> = {};\n';
  for (const f of INCOMING)
    base[`src/lib/i18n/incoming/${f}.ts`] =
      'export const X: Record<string, string> = {\n};\n';
  for (const [path, text] of Object.entries({ ...base, ...files })) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

/** Loads a fragment from outside the project, where the test runner does not import from. */
async function load(path: string): Promise<Record<string, unknown>> {
  const js = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} as Record<string, unknown> };
  new Function('exports', 'module', js)(module.exports, module);
  return module.exports;
}

const read = (root: string, path: string) =>
  readFileSync(join(root, path), 'utf8');

/** Syntax errors TypeScript finds in a file, as text. */
function syntaxErrors(text: string): number {
  const file = ts.createSourceFile('f.ts', text, ts.ScriptTarget.Latest);
  return (file as unknown as { parseDiagnostics: unknown[] }).parseDiagnostics
    .length;
}

describe('fold-screen-i18n: finding a key', () => {
  it('finds a key that prettier wrote without quotes', () => {
    const dict = "const ES = {\n  checksum: 'checksum',\n};\n";
    expect(replaceValue(dict, 'checksum', 'suma')).toBe(
      'const ES = {\n  checksum: "suma",\n};\n',
    );
  });

  it('finds a key written with escapes, by its value', () => {
    const dict =
      "const ES = {\n  'line\\nbreak': 'old',\n  '\\u0061b': 'old',\n};\n";
    expect(replaceValue(dict, 'line\nbreak', 'nuevo')).toContain(
      '\'line\\nbreak\': "nuevo"',
    );
    expect(replaceValue(dict, 'ab', 'nuevo')).toContain('"nuevo"');
  });

  it('finds a numeric key', () => {
    const dict = "const ES = {\n  404: 'old',\n};\n";
    expect(replaceValue(dict, '404', 'nuevo')).toContain('404: "nuevo"');
  });

  it('replaces every copy in a file and says null when the key is absent', () => {
    const dict =
      "const A = {\n  Save: 'a',\n};\nconst B = {\n  Save: 'b',\n};\n";
    expect(replaceValue(dict, 'Save', 'Guardar')).toBe(
      'const A = {\n  Save: "Guardar",\n};\nconst B = {\n  Save: "Guardar",\n};\n',
    );
    expect(replaceValue(dict, 'Missing', 'x')).toBeNull();
  });
});

describe('fold-screen-i18n: the whole fold', () => {
  it('replaces a bare key in place, never appends a second copy', async () => {
    const root = tree({
      'src/lib/i18n/es.ts':
        "export const ES: Record<string, string> = {\n  checksum: 'checksum',\n  ...ES_ARSENAL,\n};\n",
      'src/lib/i18n/screens/console.ts':
        "export const ES_SCREEN = { checksum: 'suma de verificación' };\nexport const INCOMING_SCREEN = {};\n",
    });
    await runFold(root, { log: () => {}, load });
    const es = read(root, 'src/lib/i18n/es.ts');
    expect(es.match(/checksum/g)).toHaveLength(1);
    expect(es).toContain('checksum: "suma de verificación"');
  });

  it('empties a fragment whose sentence contains `};`, leaving valid code', async () => {
    const root = tree({
      'src/lib/i18n/screens/console.ts':
        "export const ES_SCREEN = {\n  'Run {name}; the selection is recorded.':\n    'Ejecutar {name}; la selección queda registrada.',\n};\nexport const INCOMING_SCREEN = {};\n",
    });
    await runFold(root, { log: () => {}, load });
    const fragment = read(root, 'src/lib/i18n/screens/console.ts');
    expect(fragment).toBe(emptyFragment('console'));
    expect(syntaxErrors(fragment)).toBe(0);
    const es = read(root, 'src/lib/i18n/es.ts');
    expect(es).toContain('"Run {name}; the selection is recorded."');
    expect(syntaxErrors(es)).toBe(0);
  });

  it('updates the copy that wins the merge too, when a sentence lives in two files', async () => {
    const root = tree({
      'src/lib/i18n/incoming/arsenal.ts':
        "export const X: Record<string, string> = {\n  'Not found.': 'viejo',\n};\n",
      'src/lib/i18n/incoming/configuration.ts':
        "export const X: Record<string, string> = {\n  'Not found.': 'viejo',\n};\n",
      'src/lib/i18n/screens/console.ts':
        "export const ES_SCREEN = {};\nexport const INCOMING_SCREEN = { 'Not found.': 'No se encontró.' };\n",
    });
    await runFold(root, { log: () => {}, load });
    for (const f of ['arsenal', 'configuration'])
      expect(read(root, `src/lib/i18n/incoming/${f}.ts`)).toContain(
        '"No se encontró."',
      );
  });
});
