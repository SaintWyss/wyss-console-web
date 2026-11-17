import { afterEach, expect, it } from 'vitest';
import { setLanguage, tIncoming } from '../src/lib/i18n/index.svelte';

afterEach(() => setLanguage('en'));

it.each([
  ['directory not found', 'no se encontró la carpeta'],
  ['directory is not a folder', 'la ruta no es una carpeta'],
  ['unknown launch', 'No se encontró el lanzamiento.'],
  ['each distribution once', 'cada distribución debe aparecer una sola vez'],
  [
    'a launch needs commands or at least one distribution',
    'un lanzamiento necesita comandos o al menos una distribución',
  ],
  [
    'the launch could not be written: disk full',
    'no se pudo escribir el lanzamiento: disk full',
  ],
  [
    'no preset named “Work” for this agent',
    'no hay un preset llamado «Work» para este agente',
  ],
  [
    'distro.arch needs at least one command',
    'distro.arch necesita al menos un comando',
  ],
])('regression: translates the Workspace host reason %s', (en, es) => {
  setLanguage('es');
  expect(tIncoming(en)).toBe(es);
});
