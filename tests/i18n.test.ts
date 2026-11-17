import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { LANGUAGES } from '../src/lib/contracts/settings';
import { ES } from '../src/lib/i18n/es';
import {
  currentLanguage,
  msg,
  setLanguage,
  t,
  tJoin,
  tPhrase,
  type Phrase,
} from '../src/lib/i18n/index.svelte';
import type { EventRow } from '../src/lib/contracts/events';
import { activityLabel } from '../src/lib/features/agent/present';
import { eventDetail, eventTitle } from '../src/lib/features/events/present';
import {
  composeImpact,
  failureMessage,
  observedModelLine,
  pendingMessage,
  runtimeLine,
} from '../src/lib/features/sessions/present';
import {
  AS_CONFIGURED,
  BYPASS_WARNING,
  FAILURE_TEXT,
  modelFacts,
  PERMISSION_LABEL,
  startedWith,
  START_UNRECORDED,
  STATE_NOTE,
  stateLabel,
  switchHint,
} from '../src/lib/features/native/present';
import {
  detailLines,
  failureText,
  outcomeText,
} from '../src/lib/features/configuration/present';

afterEach(() => setLanguage('en'));

/** Every literal sentence `src/` passes to `t()` or marks with `msg()`. */
function sentences(): Map<string, string> {
  const found = new Map<string, string>();
  const call = /\b(?:t|msg)\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/gs;
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|svelte)$/.test(name) && !path.includes('/i18n/'))
        for (const match of readFileSync(path, 'utf8').matchAll(call))
          found.set(match[2].replace(/\\(['"`])/g, '$1'), path);
    }
  };
  walk(join(process.cwd(), 'src'));
  return found;
}
const places = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

it('is English, unchanged, until Spanish is chosen', () => {
  expect(currentLanguage()).toBe('en');
  expect(t('Settings')).toBe('Settings');
  expect(t('{count} waiting', { count: 3 })).toBe('3 waiting');
  setLanguage('es');
  expect(document.documentElement.lang).toBe('es');
  expect(t('Settings')).toBe('Ajustes');
  expect(t('{count} waiting', { count: 3 })).toBe('3 en espera');
  setLanguage('en');
  expect(t('Settings')).toBe('Settings');
});

it('shows a sentence it has no translation for in English, never as nothing', () => {
  setLanguage('es');
  expect(t('A sentence nobody translated {n}', { n: 2 })).toBe(
    'A sentence nobody translated 2',
  );
  // A place with no value is left as written rather than printed as "undefined".
  expect(t('Version {version}')).toBe('Versión {version}');
});

it('marks a sentence without changing it', () => {
  expect(msg('Console')).toBe('Console');
});

it('draws a phrase whose place takes another phrase, and joins phrases', () => {
  const nested = {
    text: 'The turn was not started. {reason}',
    values: { reason: { text: 'Codex refused the turn.' } },
  };
  setLanguage('es');
  expect(tPhrase(nested)).toBe(
    'El turno no se inició. Codex rechazó el turno.',
  );
  expect(tJoin(activityLabel('command_completed', 2))).toBe(
    'Comando terminado · 2',
  );
  setLanguage('en');
  expect(tPhrase(nested)).toBe(
    'The turn was not started. Codex refused the turn.',
  );
  expect(tJoin(activityLabel('command_completed', 2))).toBe(
    'Command finished · 2',
  );
});

it('draws the sessions sentences in Spanish, with their nested places', () => {
  const runtime = { mode: 'local_tools' as const, workspace: '/a/rag-corp' };
  setLanguage('es');
  const line = runtimeLine(runtime);
  expect(line && tPhrase(line)).toBe(
    'Codex corre en Local Tools para rag-corp',
  );
  expect(
    tPhrase(
      observedModelLine({ binding: 'bound_attached', observed_model: null }),
    ),
  ).toBe('Modelo en uso: el runtime no lo informó');
  expect(tPhrase(pendingMessage('activate', 'starting', 'local_tools'))).toBe(
    'Iniciando Codex en Local Tools…',
  );
  expect(tPhrase(failureMessage('resume', 'rejected'))).toBe(
    'La sesión no se reanudó. Codex rechazó reanudar esta sesión. Una sesión solo se reanuda en el modo en que se creó: si Codex corre ahora en el otro, cambiá el modo de esta sesión.',
  );
  const impact = composeImpact('inference', null, runtime);
  expect(impact && tPhrase(impact)).toBe(
    'Codex corre en Local Tools para rag-corp ahora, y la autoridad corre un solo runtime de Codex. Activar esta sesión lo reinicia en Inference, y las sesiones conectadas a él quedan desconectadas. Una sesión creada en Local Tools no se puede reanudar en Inference.',
  );
  setLanguage('en');
  expect(impact && tPhrase(impact)).toBe(
    'Codex runs in Local Tools for rag-corp now, and the authority runs one Codex runtime. Activating this session restarts it in Inference, and the sessions attached to it are detached. A session created in Local Tools cannot be resumed in Inference.',
  );
});

it('draws the credentials notices and their dates in Spanish', () => {
  setLanguage('es');
  expect(t('Key kept, sealed.')).toBe('Clave guardada, sellada.');
  expect(t('kept {date}', { date: '11 nov 2026' })).toBe(
    'guardada el 11 nov 2026',
  );
  setLanguage('en');
  expect(t('kept {date}', { date: '11 nov 2026' })).toBe('kept 11 nov 2026');
});

it('draws the configuration sentences in Spanish, with their nested places', () => {
  const read = (unrecognised: number) =>
    ({
      outcome: 'read',
      unrecognised,
      conflict_copy: false,
    }) as unknown as Parameters<typeof outcomeText>[0];
  const [hidden] = detailLines({ kind: 'hidden', value: 'environment_value' });
  setLanguage('es');
  expect(tPhrase(outcomeText(read(1)))).toBe(
    'Leído. 1 entrada no se reconoció y quedó sin tocar.',
  );
  expect(tPhrase(outcomeText(read(2)))).toBe(
    'Leído. 2 entradas no se reconocieron y quedaron sin tocar.',
  );
  expect(
    tPhrase(failureText({ failure: 'malformed', line: 1, column: 3 })),
  ).toBe('No es válido: la lectura se detuvo en la línea 1, columna 3.');
  expect(hidden && tPhrase(hidden.value as Phrase)).toBe(
    'oculto (valor de entorno)',
  );
  setLanguage('en');
  expect(tPhrase(outcomeText(read(2)))).toBe(
    'Read. 2 entries were not recognised and left untouched.',
  );
  expect(hidden && tPhrase(hidden.value as Phrase)).toBe(
    'hidden (environment value)',
  );
});

it('draws the events sentences in Spanish, with their nested places', () => {
  const event = (fields: Record<string, unknown>) =>
    ({ disposition: 'normal', ...fields }) as unknown as EventRow;
  const proposal = event({
    kind: 'approval_requested',
    category: 'approval',
    facts: { approval_kind: 'file_change' },
  });
  const granted = event({
    kind: 'lease_granted',
    category: 'lease',
    facts: { scopes: ['session_resume', 'turn_start'] },
  });
  const ready = event({
    kind: 'runtime_ready',
    category: 'runtime',
    facts: { runtime_version: '0.9.1' },
  });
  const exited = event({
    kind: 'runtime_exited',
    category: 'runtime',
    facts: { expected: true, exit: 'child_exited' },
  });
  setLanguage('es');
  expect(t(eventTitle(proposal))).toBe('Se pidió aprobar un cambio de archivo');
  expect(tPhrase(eventDetail(proposal))).toBe(
    'Codex propuso un cambio de archivo y la autoridad dejó la propuesta pendiente de aprobación. La propuesta en sí no forma parte del registro.',
  );
  expect(tPhrase(eventDetail(granted))).toBe(
    'La autoridad otorgó un permiso de ejecución a esta sesión. Ese permiso le permitía a la sesión conectarse a Codex, iniciar un turno.',
  );
  expect(tPhrase(eventDetail(ready))).toBe(
    'Codex 0.9.1 se inició, se verificó y está listo.',
  );
  expect(tPhrase(eventDetail(exited))).toBe(
    'El proceso de Codex terminó. La autoridad lo quiso así.',
  );
  setLanguage('en');
  expect(t(eventTitle(proposal))).toBe('File change approval requested');
  expect(tPhrase(eventDetail(proposal))).toBe(
    'Codex proposed a file change and the authority held it for a decision. The proposal itself is not part of the record.',
  );
  expect(tPhrase(eventDetail(granted))).toBe(
    'The authority granted a lease for this session. It allowed the session to attach to Codex, start a turn.',
  );
  expect(tPhrase(eventDetail(ready))).toBe(
    'Codex 0.9.1 started, was checked and is ready.',
  );
  expect(tPhrase(eventDetail(exited))).toBe(
    'The Codex process ended. The authority meant it to.',
  );
});

it('draws the native permission and session sentences in Spanish', () => {
  setLanguage('es');
  expect(t(FAILURE_TEXT.profile_not_applicable)).toBe(
    'Este permiso no se puede aplicar a ese agente.',
  );
  expect(t(FAILURE_TEXT.internal)).toBe('Algo salió mal en el escritorio.');
  expect(t(AS_CONFIGURED)).toBe('Como está configurado');
  expect(
    (['ask', 'read_only', 'edits', 'bypass'] as const).map((p) =>
      t(PERMISSION_LABEL[p]),
    ),
  ).toEqual([
    'Preguntar antes de actuar',
    'Solo lectura',
    'Aceptar ediciones',
    'Acceso total',
  ]);
  expect(
    tPhrase(startedWith({ id: 'b'.repeat(32), name: 'Estudio', version: 1 })),
  ).toBe('Perfil Estudio');
  expect(t(BYPASS_WARNING)).toBe(
    'Acceso total: el agente no pregunta nada y ejecuta cada comando y cada edición sin sandbox, con los permisos de tu cuenta.',
  );
  expect(t(switchHint('claude_code'))).toBe(
    'Para cambiar el modelo en esta sesión, escribí /model en ella. Claude Code también guarda tu elección como predeterminada.',
  );
  expect(t(START_UNRECORDED)).toMatch(
    /^La consola no pudo registrar este inicio/,
  );
  setLanguage('en');
  expect(t(FAILURE_TEXT.profile_not_applicable)).toBe(
    'This permission cannot be applied to that agent.',
  );
  expect(t(switchHint('claude_code'))).toBe(
    'To change the model in this session, type /model in it. Claude Code also saves your choice as its default.',
  );
});

it('draws the native state phrase, facts and notes in Spanish, with their places', () => {
  const exited = {
    state: 'exited',
    exit_code: 2,
    exit_signal: null,
    restart_of: null,
  } as unknown as Parameters<typeof stateLabel>[0];
  const bare = { agent_id: 'codex', profile: null } as unknown as Parameters<
    typeof modelFacts
  >[0];
  setLanguage('es');
  expect(tPhrase(stateLabel(exited).label)).toBe('Falló (2)');
  expect(t(STATE_NOTE.exited)).toBe('El proceso terminó solo.');
  expect(t(FAILURE_TEXT.internal)).toBe('Algo salió mal en el escritorio.');
  expect(t(START_UNRECORDED)).toMatch(/^La consola no pudo registrar/);
  const facts = modelFacts(bare, null);
  expect(t(facts.configured)).toBe('todavía sin leer (abre Configuración)');
  expect(t(facts.inUse)).toBe('el agente no lo informa');
  setLanguage('en');
  expect(tPhrase(stateLabel(exited).label)).toBe('Failed (2)');
  expect(t(facts.configured)).toBe('not read yet (open Configuration)');
  expect(t(facts.inUse)).toBe('not reported by the agent');
});

it('has a Spanish sentence for every sentence the window can show', () => {
  const missing = [...sentences()]
    .filter(([text]) => !Object.hasOwn(ES, text))
    .map(([text, path]) => `${path}: ${text}`);
  expect(missing).toEqual([]);
});

it('keeps the same places in both languages', () => {
  const different = Object.entries(ES)
    .filter(([en, es]) => places(en).join() !== places(es).join())
    .map(([en]) => en);
  expect(different).toEqual([]);
});

it('never answers with an empty or untouched translation by accident', () => {
  for (const [en, es] of Object.entries(ES)) {
    expect(es.trim(), en).not.toBe('');
    expect(es, en).toBe(es.trim());
  }
});

it('offers exactly the languages that have a dictionary', () => {
  expect([...LANGUAGES]).toEqual(['en', 'es']);
});
