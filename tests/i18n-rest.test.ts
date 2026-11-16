import { afterEach, expect, it } from 'vitest';
import { inputReportPhrase } from '../src/lib/features/projects/input-queue';
import { setLanguage, tIncoming, tPhrase } from '../src/lib/i18n/index.svelte';

afterEach(() => setLanguage('en'));

it('draws the project input reports in Spanish and keeps their English', () => {
  const refused = inputReportPhrase({ kind: 'refused_full', bytes: 70000 });
  const partial = inputReportPhrase({
    kind: 'partial',
    delivered: 3,
    dropped: 2,
  });
  const unknown = inputReportPhrase({
    kind: 'unknown',
    uncertain: 2,
    delivered: 3,
    dropped: 4,
  });

  setLanguage('es');
  expect(tPhrase(refused)).toBe(
    'No se aceptó esa entrada (70000 bytes): quedarían más de 64 KiB en espera. No se envió nada.',
  );
  expect(tPhrase(partial)).toBe(
    'La terminal solo recibió parte de la entrada: llegaron 3 bytes; no se enviaron 2 bytes ni se volverán a enviar.',
  );
  expect(tPhrase(unknown)).toBe(
    'El equipo no confirmó 2 bytes de la entrada: es posible que haya llegado a la terminal o que no, y no se volverá a enviar. 3 bytes antes de que llegaran a la terminal. Se descartaron 4 bytes que todavía estaban en espera. Mira la pantalla antes de seguir escribiendo.',
  );

  setLanguage('en');
  expect(tPhrase(refused)).toBe(
    'That input (70000 bytes) was not taken: more than 64 KiB would be waiting. None of it was sent.',
  );
  expect(tPhrase(partial)).toBe(
    'The terminal took only part of the input: 3 bytes arrived, 2 bytes were not sent and are not sent again.',
  );
  expect(tPhrase(unknown)).toBe(
    'The host did not confirm 2 bytes of input: they may or may not have reached the terminal and were not sent again. 3 bytes before it reached the terminal. 4 bytes still waiting were dropped. Check the screen before typing on.',
  );
});

it('translates exact desktop sentences for projects, insight and M3', () => {
  const pattern =
    'Domain at the center, with application, infrastructure and adapters (ports & adapters) around it.';
  const rollback =
    'Disabling returns to the older windows. The store, its tombstones and the migration snapshot are kept for forward recovery; no older file is restored over a live writer and no session is stopped. The older window can recreate missing shells by its own behaviour.';

  setLanguage('es');
  expect(tIncoming('Clean Architecture / Hexagonal')).toBe(
    'Arquitectura limpia / hexagonal',
  );
  expect(tIncoming(pattern)).toBe(
    'El dominio está en el centro, rodeado por la aplicación, la infraestructura y los adaptadores (puertos y adaptadores).',
  );
  expect(tIncoming(rollback)).toContain(
    'Al deshabilitar se vuelve a las ventanas anteriores.',
  );
  expect(tIncoming('the runtime stopped responding')).toBe(
    'el runtime dejó de responder',
  );

  setLanguage('en');
  expect(tIncoming(pattern)).toBe(pattern);
});
