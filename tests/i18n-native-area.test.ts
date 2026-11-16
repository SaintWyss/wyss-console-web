import { afterEach, expect, it } from 'vitest';
import { workspaceErrorText } from '../src/lib/features/terminal/failure-words';
import { setLanguage, t, tIncoming } from '../src/lib/i18n/index.svelte';

afterEach(() => setLanguage('en'));

it('draws native-owned phrases in Spanish and keeps English unchanged', () => {
  setLanguage('es');
  expect(t('Managed sessions')).toBe('Sesiones Managed');
  setLanguage('en');
  expect(t('Managed sessions')).toBe('Managed sessions');
});

it('translates native plan lines from the desktop, including filled values', () => {
  setLanguage('es');
  expect(tIncoming('Model: gpt-6-luna.')).toBe('Modelo: gpt-6-luna.');
  expect(
    tIncoming('Codex: workspace-write sandbox, asks when it decides to.'),
  ).toBe(
    'Codex: aislamiento de escritura en Workspace; pregunta cuando lo decide.',
  );
  setLanguage('en');
  expect(tIncoming('Model: gpt-6-luna.')).toBe('Model: gpt-6-luna.');
});

it('translates terminal workspace limits without losing their counts', () => {
  setLanguage('es');
  expect(workspaceErrorText('A tab holds at most 4 panes.')).toBe(
    'Una pestaña admite hasta 4 paneles.',
  );
  expect(
    workspaceErrorText(
      'Terminal limit reached (16). Close a terminal to create another.',
    ),
  ).toBe(
    'No se puede crear otra terminal: se alcanzó el límite de 16. Es necesario cerrar una terminal.',
  );
});
