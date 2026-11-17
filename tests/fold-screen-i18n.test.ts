import { describe, expect, it } from 'vitest';
import {
  emptyFragment,
  keyForms,
  replaceValue,
} from '../scripts/fold-screen-i18n-lib.mjs';

describe('fold-screen-i18n', () => {
  it('finds a key that prettier wrote without quotes, instead of adding it again', () => {
    const dict =
      "export const ES = {\n  checksum: 'checksum',\n  Skills: 'Skills',\n};\n";
    expect(keyForms('checksum')).toContain('checksum');
    expect(replaceValue(dict, 'checksum', 'suma de verificación')).toBe(
      'export const ES = {\n  checksum: "suma de verificación",\n  Skills: \'Skills\',\n};\n',
    );
  });

  it('does not take a sentence with spaces as a bare key', () => {
    expect(keyForms('Not a key')).toHaveLength(2);
  });

  it('still finds quoted keys', () => {
    const dict = "const ES = {\n  'Save it': 'Guardalo',\n};\n";
    expect(replaceValue(dict, 'Save it', 'Guardar')).toContain('"Guardar"');
    expect(replaceValue(dict, 'Missing', 'x')).toBeNull();
  });

  it('empties a fragment whole even when a sentence contains `};`', () => {
    const empty = emptyFragment('console');
    expect(empty).toContain('screen "console"');
    expect(empty).toMatch(
      /ES_SCREEN: Readonly<Record<string, string>> = \{\};/,
    );
    expect(empty).toMatch(
      /INCOMING_SCREEN: Readonly<Record<string, string>> = \{\};/,
    );
    expect(empty).not.toContain('};\n the');
  });
});
