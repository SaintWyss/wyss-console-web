import { afterEach, expect, it } from 'vitest';
import type { Imported } from '../src/lib/contracts/arsenal';
import { bulkSummary } from '../src/lib/features/arsenal/controller';
import {
  importMessage,
  incomingMessage,
} from '../src/lib/features/arsenal/messages';
import {
  setLanguage,
  t,
  tIncoming,
  tPhrase,
} from '../src/lib/i18n/index.svelte';

afterEach(() => setLanguage('en'));

it('draws Arsenal and Workspace text in Spanish and preserves English', () => {
  setLanguage('es');
  expect(t('Workspace could not be read.')).toBe(
    'No se pudo leer el Workspace.',
  );

  setLanguage('en');
  expect(t('Workspace could not be read.')).toBe(
    'Workspace could not be read.',
  );
});

it('translates interpolated import and bulk notices', () => {
  const imported = {
    capability: 'sample',
    revision: 8,
    outcome: 'created',
  } as Imported;
  const revised = { ...imported, outcome: 'new_revision' } as Imported;
  const unchanged = { ...imported, outcome: 'unchanged' } as Imported;
  const run = {
    total: 4,
    done: 4,
    created: 1,
    newRevision: 2,
    unchanged: 1,
    failures: [],
    stopped: null,
    finished: true,
  };

  setLanguage('es');
  expect(tPhrase(importMessage('sample', imported))).toBe(
    'Se importó sample como revisión 8.',
  );
  expect(tPhrase(importMessage('sample', revised))).toBe(
    'Se importó sample como revisión 8. El origen había cambiado.',
  );
  expect(tPhrase(importMessage('sample', unchanged))).toBe(
    'sample ya está importada en la revisión 8. No hubo cambios.',
  );
  expect(tPhrase(bulkSummary(run))).toBe(
    'Importación en lote: 1 importadas, 2 con una revisión nueva, 1 sin cambios en la biblioteca.',
  );
  expect(
    tPhrase(
      bulkSummary({
        ...run,
        failures: [
          {
            id: 'candidate-another',
            name: 'another',
            text: 'This skill cannot be imported.',
          },
        ],
        stopped:
          'The Arsenal library is damaged, so nothing was changed. Keep the file and report it.',
      }),
    ),
  ).toBe(
    'Importación en lote: 1 importadas, 2 con una revisión nueva, 1 sin cambios en la biblioteca, 1 con error. Se detuvo: La biblioteca de Arsenal está dañada, así que no se cambió nada. Guardá el archivo y avisalo.',
  );

  setLanguage('en');
  expect(tPhrase(importMessage('sample', imported))).toBe(
    'Imported sample as revision 8.',
  );
  expect(tPhrase(importMessage('sample', revised))).toBe(
    'Imported sample as revision 8. The source had changed.',
  );
  expect(tPhrase(importMessage('sample', unchanged))).toBe(
    'sample is already imported at revision 8. Nothing changed.',
  );
  expect(tPhrase(bulkSummary(run))).toBe(
    'Bulk import: 1 imported, 2 updated to a new revision, 1 already in the library, unchanged.',
  );
});

it('translates incoming Arsenal reasons and keeps identifiers intact', () => {
  setLanguage('es');
  expect(tIncoming('Built for Claude Code; this terminal runs Codex.')).toBe(
    'Preparado para Claude Code; esta terminal usa Codex.',
  );
  expect(tIncoming('The session settings could not be combined.')).toBe(
    'No se pudieron combinar los ajustes de la sesión.',
  );

  setLanguage('en');
  expect(tIncoming('Built for Claude Code; this terminal runs Codex.')).toBe(
    'Built for Claude Code; this terminal runs Codex.',
  );
  expect(tIncoming('The session settings could not be combined.')).toBe(
    'The session settings could not be combined.',
  );
});

it('translates Rust format strings whose source escapes the value quotes', () => {
  const warning =
    'The selection keeps "system-skills", which is not installed for this provider.';
  const applied =
    'Arsenal selection "Starter": 2 installed skill(s) switched off for this session.';
  const changed = `${applied} The configuration changed between the preview and this record.`;

  setLanguage('es');
  expect(incomingMessage(warning)).toBe(
    'La selección conserva «system-skills», que no está instalado para este proveedor.',
  );
  expect(incomingMessage(applied)).toBe(
    'Selección de Arsenal «Starter»: se desactivan las skills instaladas en esta sesión (2).',
  );
  expect(incomingMessage(changed)).toBe(
    'Selección de Arsenal «Starter»: se desactivan las skills instaladas en esta sesión (2). La configuración cambió entre la vista previa y este registro.',
  );

  setLanguage('en');
  expect(incomingMessage(warning)).toBe(warning);
  expect(incomingMessage(applied)).toBe(applied);
  expect(incomingMessage(changed)).toBe(changed);
});
