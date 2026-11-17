# Traducción por pantalla — hoja de ruta

Este plan reemplaza al reparto por áreas de `traduccion-es.md`. Cada pantalla pasa por tres pasos en orden:

1. Auditoría en inglés.
2. Arreglos.
3. Traducción al español.

Una pantalla se traduce recién cuando su inglés quedó verificado.

## Base (hecha, 7bc208a en `wip/traduccion-es`)

- Se borraron 1135 frases que estaban repetidas de forma idéntica entre `es.ts` y los diccionarios por área. No había ninguna con distinto español.
- Los tests siguen en inglés. El test del controller de Arsenal lee las frases ya resueltas en inglés.
- Hallazgos de Sol Medium resueltos: el 4 (`tIncoming` tiene test positivo) y el 5 (`tIncoming` usa solo claves propias). Los hallazgos 1, 2 y 3 entran en la pantalla Workspace.
- Cadena corrida sobre `f2a913e..HEAD`:
  - npm test: 1578 de 1578.
  - lint ok.
  - typecheck: 0 errores y 3 avisos de CSS que ya estaban en `f2a913e`.
  - prettier ok sobre todo lo que cambió.
  - build ok y scan:repo 5/5.
  - Rust: sin cambios.

## Pantallas (sacadas de `nav.ts` y `App.svelte`, medidas por script)

Ya casi todo pasa por `t()`/`msg()` y tiene español en `es.ts`. Las columnas del medio salen de un conteo heurístico por carpeta: «sin envolver» es texto visible en el marcado sin `t()`, y «atributos» son `title`/`placeholder`/`aria-label` sueltos. Por eso el trabajo grande es la auditoría en inglés y volver a traducir lo que cambie, no envolver texto.

| #   | Pantalla (barra)                          | Componente                                          | Carpetas                   | Sin envolver / atributos | t/msg | tIncoming |
| --- | ----------------------------------------- | --------------------------------------------------- | -------------------------- | ------------------------ | ----- | --------- |
| 0   | Shell: barra, pie, avisos, menú Más       | `App.svelte`, `shell/*`                             | `src/lib/shell`            | 0 / 0                    | 140   | 0         |
| 1   | Consola                                   | `TerminalView`                                      | `terminal`                 | 3 / 0                    | 117   | 5         |
| 2   | Workspace (+ hallazgos 1-3 de Sol Medium) | `LaunchEditor`                                      | `workspace`                | 2 / 0                    | 121   | 6         |
| 3   | Personalización › Distribuidores          | `DistributorsView`                                  | `distributors`             | 1 / 1                    | 51    | 4         |
| 4   | Personalización › Arsenal                 | `LibraryView` (+ Configuración/Hooks/MCP en pop-up) | `arsenal`, `configuration` | 11 / 5                   | 753   | 18        |
| 5   | Personalización › Credenciales + Ajustes  | `CredentialsView`, `SettingsView`                   | `credentials`, `settings`  | 1 / 0                    | 119   | 0         |
| 6   | Actividad                                 | `ApprovalsView` + `EventsView`                      | `approvals`, `events`      | 1 / 0                    | 218   | 0         |

**Pantallas de Más (fuera de esta tanda salvo decisión del dueño):** Terminal agents (`WorkspaceView`, `native`), Sessions, Agents, Pipelines, Remote PCs, Arsenal presets (`ArsenalView`), Runtimes, Providers y Projects. El español que ya tienen se queda como está.

**Piloto: Distribuidores.** Es chica y tiene los tres casos: texto sin envolver, un atributo y frases que vienen de Rust (`tIncoming`).

**Revisión del diff de los 4 agentes (`f2a913e..5f709e5`):** nadie la hizo todavía. Entra en el paso A de cada pantalla, que lee los cambios de su carpeta desde `f2a913e`.

## Paso A · Auditoría en inglés (solo lectura, en paralelo)

Hay un auditor por pantalla, en Claude Sonnet, que no edita. Tiene dos insumos:

- el código de la pantalla;
- una captura de esa pantalla abierta en el display aislado :78, que saca el orquestador.

Devuelve una lista con `archivo:línea` y una de estas cuatro clases:

- **Error de hecho:** el texto dice algo que el código no hace.
- **Duplicado:** el mismo dato o la misma ayuda aparece dos veces.
- **Fallo:** texto roto, placeholder sin llenar, inglés mal escrito o estado que no se muestra.
- **Excesivo:** texto que sobra.

## Paso B · Arreglos

- Los errores de hecho, los duplicados y los fallos los arregla el orquestador sin preguntar, con su test.
- Lo excesivo se le presenta al dueño como lista por pantalla y solo se recorta lo que él apruebe.
- Cambiar una frase en inglés obliga a cambiar su clave en `es.ts` en el mismo cambio. Lo controla `i18n.test.ts`.
- Si la frase viene de Rust, cambian Rust, `incoming/` y los tests en el mismo cambio.

## Paso C · Traducción con Codex Luna Max (uno por pantalla)

- Cada agente trabaja en su propio worktree y su propia rama.
- Toca solo los archivos de su pantalla.
- Escribe en `src/lib/i18n/screens/<pantalla>.ts`, un fragmento que el orquestador crea y enchufa antes de abrir los worktrees. Ahí van las entradas nuevas y las correcciones del español existente de su pantalla. Las frases que vienen de Rust van en `screens/<pantalla>.incoming.ts`.
- Ningún agente toca `es.ts` ni `incoming/`. Al integrar, un script del orquestador pasa los fragmentos a esos archivos y borra los fragmentos.
- El texto compartido entre pantallas (shell, `msg()` de presenters comunes) tiene un solo dueño: la pantalla 0.
- La cadena completa la corre el orquestador. El agente solo corre tests filtrados.
- El orquestador integra los fragmentos. Si dos pantallas traducen la misma frase de forma distinta, la conserva el dueño de esa frase.

## Verificación por pantalla

- La revisión la hace otro modelo, Codex Sol Medium, en una sola pasada.
- Se saca una captura en español y otra en inglés en :78.
- La pantalla queda cerrada cuando la cadena completa está en verde.

## Cierre

Paquete, `install.sh --keep-host`, merge de `wip/traduccion-es` a main/ux y push.

## Puntos de consulta al advisor

1. Antes de empezar, con este plan.
2. Después del piloto (pantalla 3, Distribuidores, la más chica).
3. Antes del merge a main.

## Glosario (decisión del dueño, 2026-11-17)

- Quedan en inglés: **Wyss Console**, **Workspace**, **Arsenal**, **preset**, **hook**, y los nombres de producto (Claude Code, Codex, OpenCode).
- En español: **Consola** (la pestaña), **Actividad**, **Personalización**, **Ajustes**, **Credenciales**, **Distribuidores**, **lanzamiento**, **autoridad**, **sesión**, **aprobación**, **permiso**.
- Rioplatense neutro de interfaz: imperativo con voseo solo donde ya se usa en es.ts; si no, infinitivo en botones ("Guardar", "Probar").
- Corrige el español existente que contradiga este glosario (p. ej. «Console» suelto → «Consola»).
