# Traducción completa al español — contrato congelado (4 constructores en paralelo)

Constructores: Codex gpt-6-luna max, uno por área. Corren a la vez en el mismo worktree: **cada uno
toca solo los archivos de su área** (tabla). Tocar un archivo de otra área es BLOQUEO, no se hace.

## Resultado

Con el idioma en Español, todo texto que la ventana muestra está en español rioplatense neutro
(sin voseo forzado en mensajes de sistema; el estilo de `src/lib/i18n/es.ts`), salvo nombres de
producto y de cosas que el producto no traduce (Wyss Console, Arsenal, Workspace, Claude Code,
Codex, Native, Managed, Inference, Local Tools), rutas, comandos y lo que escribe el agente o el
proveedor dentro de una terminal. En inglés la ventana queda byte por byte igual.

## Mecanismo (ya hecho en 4fc6af2, no se cambia)

- Texto propio de la ventana: `t('English sentence')` / `msg(...)` con su entrada en el diccionario
  del área `src/lib/i18n/es-<área>.ts` (se mezcla en `ES`; `tests/i18n.test.ts` exige entrada para
  cada frase y que no sobren).
- Texto que manda el escritorio (Rust: razones, líneas de plan, `applied`, `not_applicable`,
  `reason`, `limitation`, textos de error del host): donde la ventana lo muestra, envolverlo en
  `tIncoming(texto)` (de `src/lib/i18n/index.svelte`) y agregar la oración inglesa exacta tal como
  la escribe Rust en `src/lib/i18n/incoming/<área>.ts`; las partes que Rust llena con `format!`
  se escriben `{nombre}` (el mismo nombre en el español). `tests/i18n-incoming.test.ts` exige que
  las partes fijas existan en `src-tauri/src` y que los `{nombre}` coincidan.
- **No se cambia Rust** ni contratos: el escritorio sigue mandando inglés.

## Áreas

| Área (archivo de diccionario) | Front (solo estas carpetas)                                                                                                                                           | Rust a leer para las oraciones entrantes                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `arsenal`                     | `src/lib/features/arsenal`, `src/lib/features/workspace`                                                                                                              | `src-tauri/src/arsenal`, `src-tauri/src/native/arsenal.rs`, `src-tauri/src/native/capabilities.rs`                                                                             |
| `native`                      | `src/lib/features/native`, `src/lib/features/terminal`, `src/lib/features/sessions`, `src/lib/features/pty-diagnostic`                                                | `src-tauri/src/native` (salvo arsenal.rs y capabilities.rs), `src-tauri/src/host`, `src-tauri/src/terminal`, `src-tauri/src/sessions`, `src-tauri/src/delegate`                |
| `configuration`               | `src/lib/features/configuration`, `src/lib/features/settings`, `src/lib/features/models`, `src/lib/features/credentials`, `src/lib/features/distributors`             | `src-tauri/src/configuration.rs`, `src-tauri/src/agentconfig`, `src-tauri/src/settings`, `src-tauri/src/credentials`, `src-tauri/src/distributors.rs`, `src-tauri/src/desktop` |
| `rest`                        | `src/lib/features/{agent,approvals,events,f8,foundation,insight,m3,orchestration,projects,remote}`, `src/lib/shell` y demás de `src/lib` fuera de `features` e `i18n` | el resto de `src-tauri/src`                                                                                                                                                    |

`src/lib/i18n/es.ts`, `index.svelte.ts`, `msg.ts` y los tests de i18n no se tocan (los de área sí).

## Qué hacer en tu área

1. Buscar texto visible en inglés que no pasa por `t()`/`msg()`: texto suelto en el marcado,
   atributos `title`/`placeholder`/`aria-label`, cadenas asignadas y mostradas tal cual. Envolver
   en `t()` y agregar la entrada en `es-<área>.ts`.
2. Buscar dónde se muestra texto que viene del escritorio y envolverlo en `tIncoming()`; agregar
   cada oración posible de Rust de tu área en `incoming/<área>.ts` (todas las que ese lugar puede
   mostrar, no solo una).
3. Un test vitest de tu área que muestre al menos dos textos entrantes y dos propios en español.

## Verificación (en tu sandbox no corras `npm test` ni `npm run rust:test` completos)

`npx vitest run tests/i18n.test.ts tests/i18n-incoming.test.ts <tus tests>`, `npm run lint`,
`npm run typecheck`, `npx prettier --check <tus archivos>`. Sin commit, sin `git stash`, sin
instalar. Entrega: BUILD_RESULT en español con archivos tocados, cuántas frases agregaste (propias
y entrantes), salida real y BLOQUEOS.
