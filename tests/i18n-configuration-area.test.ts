import { afterEach, expect, it } from 'vitest';
import { setLanguage, t, tIncoming } from '../src/lib/i18n/index.svelte';

afterEach(() => setLanguage('en'));

it('draws configuration-owned text in Spanish and preserves English', () => {
  setLanguage('es');
  expect(t('The distributors could not be reached.')).toBe(
    'No se pudo acceder a los distribuidores.',
  );
  expect(t('The desktop could not complete the request.')).toBe(
    'La aplicación no pudo completar la solicitud.',
  );
  setLanguage('en');
  expect(t('The distributors could not be reached.')).toBe(
    'The distributors could not be reached.',
  );
  expect(t('The desktop could not complete the request.')).toBe(
    'The desktop could not complete the request.',
  );
});

it('translates plan names and host errors with their filled values', () => {
  setLanguage('es');
  expect(tIncoming('add MCP server · docs')).toBe(
    'Agregar servidor MCP · docs',
  );
  expect(tIncoming('only the first 32 files are read')).toBe(
    'Solo se leen los primeros 32 archivos.',
  );
  setLanguage('en');
  expect(tIncoming('add MCP server · docs')).toBe('add MCP server · docs');
  expect(tIncoming('only the first 32 files are read')).toBe(
    'only the first 32 files are read',
  );
});
