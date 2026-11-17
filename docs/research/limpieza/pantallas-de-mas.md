# Mapa de dependencias de las pantallas de Más (Fable, solo lectura, 2026-11-16, HEAD 2a09a96)

Ruta: RESPOND · R0 · ui · mapa de dependencias de solo lectura, sin cambios

# Mapa de borrado de las pantallas de "Más" — wyss-console-ux

Las nueve pantallas se pueden sacar del front (unas 43.000 líneas entre fuente y tests). Tres cosas cambian lo que conviene aprobar:

- **Actividad queda sin fuente de datos nuevos.** Sin Sessions y Agents la ventana no puede crear sesiones ni turnos administrados, que es lo único que produce approvals y events.
- **Terminal agents y Arsenal presets son la única UI de funciones que hoy andan**: parar, reiniciar y olvidar agentes, handoff, delegación, y crear, editar o borrar presets.
- **Quitar `sessions`/`agents` del enum de "Open on" en Rust sin migración resetea todas las preferencias** de quien tenga ese valor guardado.

No edité el repo ni corrí tests. Rutas relativas a `/home/saintwyss/Github_repos/wyss-console-ux`. Rama `ux/rediseno-consola` en `2a09a96`, árbol limpio.

**Método.** Grafo de imports de `src/` y `tests/` (320 archivos), alcanzabilidad desde `src/main.ts` cortando las aristas de `src/App.svelte` a cada pantalla, y cruce de los 188 `#[tauri::command]` con sus referencias en TS. Scripts y salidas en `/tmp/claude-1000/-home-saintwyss/5371837e-b489-4d25-8d18-5ed3ed9562e9/scratchpad/mas-audit/`.

**Nombres que se pisan:**

- `workspace` es la vista Terminal agents (`WorkspaceView`); el rail "Workspace" abre `launches` (`LaunchEditor`, queda).
- `desktop/workspace.rs` es el diálogo de carpeta de Sessions.
- Los "workspaces" de Projects son otra cosa, y `native.launcher.projects` no es la pantalla Projects.

---

## 1. Por pantalla

### 1.1 `workspace` — Terminal agents

**Quién enlaza:** solo el menú Más (`nav.ts:40-45`). Dos restos:

- `App.svelte:207` (`TITLED`).
- `terminal/launch.ts:295`: el error dice "start it from Agents to choose", que queda sin destino.

| Se borra                                                                                                                                                                        | Líneas         | Evidencia                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------- |
| `features/native/WorkspaceView.svelte`                                                                                                                                          | 1279           | único importador: `App.svelte:37`                           |
| `features/native/HandoffPanel.svelte`, `DelegationsPanel.svelte`, `delegations.ts`                                                                                              | 208 / 385 / 91 | solo los importa WorkspaceView                              |
| `features/arsenal/ArsenalTerminalPanel.svelte`, `arsenal/terminal.ts`                                                                                                           | 487 / 88       | solo WorkspaceView                                          |
| Tests: `native-view`, `native-readiness-view`, `native-stop-sync`, `workspace-codex-environment.svelte`, `delegations-panel`, `arsenal-terminal.svelte`, `NativeHarness.svelte` | 1958           | todos montan WorkspaceView vía `tests/NativeHarness.svelte` |

**Tests a editar:** `workspace-launch-save.test.ts` (usa NativeHarness y `onOffCounts` de `arsenal/terminal`, pero también `openLaunch`, que queda), `ux-structure.test.ts`, `i18n.test.ts:429`.

**Comparte, no se borra:**

- `NativeController`: App lo sigue usando para `state`, `rediscover`, `choose`, `setVisible`, `dispose` (`App.svelte:152,239,248,322,472`). `DistributorsView` usa el tipo `NativeState`.
- `native/present.ts`, `native/bridge.ts`, `desktop/native-client.ts`: los usan `terminal/launch-deps.ts`, `TerminalView`, `LaunchEditor`.

**Queda muerto dentro de lo compartido (segunda pasada):**

- Métodos de `NativeController` que solo llama WorkspaceView o HandoffPanel: `startAgent`, `startWithArsenal`, `restart`, `stop`, `forget`, `forgetFinished`, `restoreLost`, `handoff`, `saveBrief`, `setDelegation`, `hasTab`, `showTerminal`, `checkLauncher`, `preview`.
- El callback `onstarted` de `App.svelte:140-150`.

**Pérdida funcional:** es la única UI para parar, reiniciar u olvidar un agente nativo, restaurar perdidos, armar el brief de handoff, ver o cancelar delegaciones y prender la delegación. `startNative` desde un launch guardado no pasa `delegation` (`launch-deps.ts:33-41`).

### 1.2 `sessions`

**Quién enlaza:**

- Events, botón "Open session": `EventsView.svelte:471` → `App.svelte:367 showSession`.
- AgentView, `onsessions`: `App.svelte:500`.
- Settings "Open on": valor `sessions`.
- Textos en archivos que quedan: `LaunchEditor.svelte:94` ("Managed… starts from Sessions") y `agent/present.ts:129,131,287,289`.

| Se borra                                                | Líneas | Evidencia                                                                                                                                   |
| ------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/sessions/SessionsView.svelte`                 | 620    | único importador: App                                                                                                                       |
| `features/sessions/controller.ts`                       | 703    | fuera de App y la vista solo queda un `import type` en `sessions/present.ts`; lee únicamente con la vista visible (`controller.ts:264-296`) |
| Tests `sessions-view`, `sessions`, `session-activation` | 2860   | sujeto: vista y controller                                                                                                                  |

**Comparte:**

- `sessions/present.ts`: quedan vivos `folderName`, `shortId`, `localTime`, `sessionNames`, `sessionLabel` (ApprovalsView, EventsView, `approvals/present.ts`); unos 14 de 22 exports mueren.
- `desktop/sessions-client.ts`: solo `SessionCallError` tiene usuarios que quedan.
- `contracts/sessions.ts`: `parseSessionFailure`.
- `tests/sessions-harness.ts`: lo usa `events-controller.test.ts`.

**Efecto en Actividad:** `names` y `nameOf` (`App.svelte:343-344`) salen de la página de Sessions, que solo se lee al visitar esa vista. Sin Sessions quedan siempre vacíos y Approvals/Events muestran ids cortos.

### 1.3 `agents`

**Quién enlaza:**

- Events, botón "Open in Agents": `EventsView.svelte:477` → `App.svelte:371 showAgent`.
- Sessions, `onagent`: `App.svelte:490`.
- Settings "Open on": valor `agents`.
- `App.svelte:207` (`TITLED`) y `App.svelte:217` (`approvalsController.setWatching(agent.following)`).

| Se borra                                              | Líneas | Evidencia                                         |
| ----------------------------------------------------- | ------ | ------------------------------------------------- |
| `features/agent/AgentView.svelte`                     | 509    | único importador: App                             |
| `features/agent/controller.ts`                        | 1051   | queda solo un `import type` en `agent/present.ts` |
| `desktop/turns-client.ts`                             | 158    | único importador: `agent/controller.ts`           |
| Tests `agent-view`, `agent`, `agent-history`, `turns` | 3290   | sujeto: vista, controller y cliente de turnos     |

**Comparte:**

- `agent/present.ts`: quedan `outcomeUnknown`, `localClock` (ApprovalCard) y `TURN_REASON` (`events/present.ts`); 10 de 14 exports mueren.
- `contracts/turns.ts`: quedan 3 de 17 exports.
- `tests/agent-harness.ts`: lo importan seis tests de pantallas que quedan (`approvals-view`, `events-view`, `product-polish`, `lifecycle-view`, `distributors-view`, `configuration-app`). Hay que recortarlo, no borrarlo.

### 1.4 `pipelines`

**Quién enlaza:** solo Más. Hacia afuera, `onruntimes` → `go('runtimes')` (`App.svelte:505`).

| Se borra                                                        | Líneas    | Evidencia             |
| --------------------------------------------------------------- | --------- | --------------------- |
| `features/orchestration/PipelinesView.svelte`                   | 2293      | único importador: App |
| `desktop/orchestration-client.ts`, `contracts/orchestration.ts` | 401 / 223 | solo PipelinesView    |
| Tests `orchestration-view`, `orchestration-capability`          | 694       | —                     |

Usa `contracts/f8.ts` y `sessions-client` (`prepareSession`, `chooseWorkspace`): va antes o junto con Runtimes.

### 1.5 `remote`

**Quién enlaza:** solo Más. Es estática, sin cliente ni comando.

| Se borra                                                 | Líneas | Evidencia             |
| -------------------------------------------------------- | ------ | --------------------- |
| `features/remote/RemoteView.svelte`                      | 226    | único importador: App |
| `tests/remote-view.test.ts` y el caso `i18n.test.ts:183` | 61     | —                     |

El módulo Rust `remote/` (3.537 líneas) no lo usa la vista ni nadie fuera de sus tests (`main.rs:36-39`).

### 1.6 `arsenal-presets`

**Quién enlaza:** solo Más. WorkspaceView tiene un "Edit in Arsenal" que va a `arsenal`, no acá.

Por lectura de código, hoy abre en blanco: `ArsenalView` está dentro de `.personal`, que lleva `hidden` cuando la vista no es una pestaña de Personalización (`App.svelte:519`, `app.css:5085`), y `arsenal-presets` no lo es. Sin verificar en la app corriendo.

| Se borra                                                                                                               | Líneas          | Evidencia                                                 |
| ---------------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------- |
| `arsenal/ArsenalView.svelte`, `PresetsTab.svelte`                                                                      | 1523 / 1454     | App → ArsenalView → PresetsTab                            |
| `arsenal/controller.ts`                                                                                                | 746             | `LibraryView` no lo recibe; solo ArsenalView y PresetsTab |
| `arsenal/EnvironmentPanel.svelte`, `SyncLine.svelte`, `sync-present.ts`                                                | 452 / 159 / 166 | solo desde los de arriba                                  |
| Tests `arsenal-view`, `arsenal-presets-view`, `arsenal-controller`, `arsenal-sync`, `arsenal-environment-panel.svelte` | 2555            | editar además `i18n-arsenal.test.ts`                      |

**Comparte:** `arsenal-client.ts`, `contracts/arsenal.ts`, `presets.ts`, `environment.ts`, `groups.ts`, `catalogue.ts`, `guide*`, `messages.ts`, `map.ts` (LibraryView, LaunchEditor, `launch.ts`).

**Pérdida funcional:**

- No queda UI para crear, editar o borrar presets, importar skills, mover grupos o categorías, ni para "sync now" y su línea de estado.
- `terminal/launch.ts:158` le dice al usuario "Delete the extra ones in Arsenal", que ya no se podría hacer.
- La sincronización automática sigue corriendo sola (`arsenal/mod.rs:58-59`, `sync.rs:1918`).

### 1.7 `runtimes`

**Quién enlaza:**

- Más, solo si `f8.gate === 'active'`. En esta PC el `.desktop` instalado no pasa `--f8-authority`, así que hoy no aparece.
- Pipelines (`onruntimes`).
- `StatusBar`, prop `f8` (`App.svelte:438-440,617`).
- Texto de Settings "shown in Runtimes" (`SettingsView.svelte:425`).
- `App.svelte:274`: `f8Controller.start()` al montar.

| Se borra                                                                                                                    | Líneas     | Evidencia                                       |
| --------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------- |
| `features/f8/*` (9 archivos)                                                                                                | 3660       | importadores: App y entre sí                    |
| `desktop/f8-client.ts`, `contracts/f8.ts`                                                                                   | 362 / 1010 | solo f8 y PipelinesView                         |
| `contracts/models.ts`                                                                                                       | 176        | solo `contracts/f8.ts` y código ya inalcanzable |
| Tests `f8-view`, `f8-controller`, `f8-contract`, `f8-harness`, `f8-requests`, `f8-visible`, `f8-capability`, `preview/f8.*` | 2462       | editar `topbar-authority.test.ts`               |

Limpiar también `RUNTIMES_NAV_ITEM` y el primer parámetro de `navItems` (`nav.ts:112-161`).

### 1.8 `providers`

**Quién enlaza:** solo Más; siempre ofrecida (`App.svelte:197`, tercer argumento `true`).

| Se borra                                                                             | Líneas   | Evidencia                                         |
| ------------------------------------------------------------------------------------ | -------- | ------------------------------------------------- |
| `features/m3/*` (8 archivos)                                                         | 1276     | solo App                                          |
| `desktop/m3-client.ts`, `contracts/m3.ts`                                            | 31 / 851 | solo m3                                           |
| Tests `m3-view`, `m3-controller`, `m3-contract`, `M3Harness.svelte`, `m3-capability` | 763      | editar `i18n.test.ts:344`, `i18n-rest.test.ts:44` |

### 1.9 `projects`

**Quién enlaza:**

- Más, solo si `projects.overview.enabled`. En esta PC no existe `~/.local/state/wyss-console/projects/`, así que hoy no aparece.
- `ProjectsGate` dentro de Settings (`App.svelte:607`): el interruptor que la prende.
- `src/main.ts:3,27`: monta `ProjectsWindow` cuando `location.hash === '#workspace'`.
- `App.svelte:250`, `App.svelte:207` (`TITLED`), `App.svelte:275`.

| Se borra                                                                                                                                                                                              | Líneas          | Evidencia                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------- |
| `features/projects/*` (12 archivos, incluye `ProjectsGate` y `ProjectsWindow`)                                                                                                                        | 2892            | importadores: App y `main.ts` |
| `features/insight/*` (5 archivos)                                                                                                                                                                     | 1285            | solo projects                 |
| `desktop/projects-client.ts`, `contracts/projects.ts`, `contracts/insight.ts`                                                                                                                         | 275 / 710 / 191 | solo projects                 |
| Tests `projects-view`, `projects-controller`, `projects-contract`, `projects-harness`, `ProjectsHarness.svelte`, `projects-input-queue`, `projects-capability`, `insight-contract`, `uml`, `markdown` | 2612            | editar `i18n-rest.test.ts`    |

---

## 2. Settings "Open on"

- **Enum cerrado de cinco valores**: `console`, `sessions`, `agents`, `approvals`, `events`, en `contracts/settings.ts:9-15` y `src-tauri/src/settings/model.rs:17-23`. Solo `sessions` y `agents` apuntan a vistas a borrar.
- **Si se quita la variante en Rust sin migración**: un `preferences.json` con ese valor falla en serde → `Parsed::Rejected` → `set_aside()` lo renombra a `preferences.invalid.json` y cargan todos los defaults (tema, idioma, fuente), con estado `Recovered` (`settings/store.rs:174-177,183-191,338-341`; `settings/service.rs:116`).
- **Si se quita solo en TS**: `parsePreferences` tira `invalid('landing')` y Settings queda en `failed`; la ventana abre en Console (`App.svelte:259-263`).
- **El redirect de `go()` no aplica**: el valor guardado se asigna directo a `activeView` (`App.svelte:266`).
- **Camino seguro**: esquema 4 con migración `sessions`/`agents` → `console`, siguiendo `migrate_v1`/`migrate_v2` (`store.rs:255-318`). Tocar `settings/tests.rs:207-215`, `desktop/settings.rs:231`, `settings/present.ts:21`, `tests/settings*.test.ts`.
- **En esta PC** el archivo dice `landing_page: console`. La otra PC, sin verificar.

No encontré atajos de teclado hacia ninguna de estas vistas.

---

## 3. Front vs backend

### 3.1 Comandos Tauri sin consumidor si se borran las nueve

| Grupo                  | Comandos                                                                                                                                                                                                             | Dónde                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| F8                     | 24 `f8_*`                                                                                                                                                                                                            | `desktop/f8.rs` (610) + `desktop/f8/` (1187); `capabilities/f8.json`; `f8_state` en `main.json` |
| M3                     | `m3_state` + 5 `m3_fixture_*`                                                                                                                                                                                        | `m3/gui.rs`, `m3/fixture/host.rs`; `capabilities/m3.json`                                       |
| Orquestación           | `orchestration_call`                                                                                                                                                                                                 | `orchestration_commands.rs` (133)                                                               |
| Projects               | 26 `projects_*`                                                                                                                                                                                                      | `projects/commands.rs`; `capabilities/projects.json` (ventanas `w-*`)                           |
| Sesiones P1            | `managed_sessions_page`, `managed_session_{prepare,resume,close,activate,abandon,mode}`, `choose_workspace`                                                                                                          | `desktop/sessions.rs`, `desktop/workspace.rs`                                                   |
| Turnos P1              | `managed_turns`, `managed_turns_older`, `managed_turn_{read,start,cancel}`                                                                                                                                           | `desktop/turns.rs`                                                                              |
| Nativos                | `native_restart`, `native_stop`, `native_forget`, `native_handoff_{prepare,save}`, `native_delegations`, `native_delegation_cancel`                                                                                  | `native/commands.rs`                                                                            |
| Arsenal                | `arsenal_discover`, `_candidate`, `_import`, `_presets`, `_preset_write`, `_preset_delete`, `_preset_plan`, `_selection_delete`, `_category_write`, `_group_move`, `_terminal_bindings`, `_sync_status`, `_sync_now` | `arsenal/commands.rs`                                                                           |
| Arsenal, certeza media | `arsenal_file`, `_restore`, `_categories`, `_groups`, `_capability`, `_preview`                                                                                                                                      | no hallé llamada `.método(` en archivos que quedan                                              |

- `managed_model_catalogue` ya no tiene llamador alcanzable hoy.
- Siguen con consumidor: `native_launcher`, `native_readiness`, `native_sessions`, `native_choose_project`, `native_preview`, `native_start`.
- `permissions/autogenerated/` está en `.gitignore`: los permisos salen de las listas de `src-tauri/build.rs:82-260` y de `capabilities/*.json`.
- Tests Rust que afirman el contenido de capabilities: `desktop/sessions.rs:502`, `configuration.rs:1176`, `arsenal/commands.rs:2728`, `projects/commands.rs:963-970`. `orchestration_commands.rs:123` incluye `capabilities/projects.json`. En TS, `tests/terminal-view.test.ts:247`.

### 3.2 Módulos Rust

| Módulo                                                                   | Líneas aprox. | ¿Sale sin tocar otra cosa?                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects/`                                                              | 16.570        | Sí: solo lo nombra `main.rs:137`. Tiene store persistido propio.                                                                                                                                                                                            |
| `remote/`                                                                | 3.537         | Sí: sin consumidores. Hay un `android/` en la raíz.                                                                                                                                                                                                         |
| `orchestration/` + `orchestration_commands.rs`                           | 10.759        | Casi: lo usan tests de `f8/v10.rs` y `f8/workspace_guard.rs`, y el flag `--wyss-orchestrator` (`main.rs:69-74`). En esta PC existe `~/.local/state/wyss-console/orchestration.sqlite3`.                                                                     |
| `desktop/f8*` + `f8/gui`                                                 | ~5.200        | Parcial: `F8Gui` lo usan `desktop/select.rs` (`--f8-authority`), `examples/f8_local_gui.rs`, `tests/f8_codex_process.rs`, `tests/f8_fixture_process.rs`.                                                                                                    |
| `f8/` (resto)                                                            | ~60.000       | No: está enlazado en la autoridad (`control/store.rs:314,814`, `control/server.rs:908-987`, `control/bindings.rs:440-620`, `control/application.rs:152-298`, `contracts/control.rs:671,996`, `bin/wyss-control.rs:11`, `bin/wyss-credential-agent.rs:136`). |
| `m3/`                                                                    | ~6.500        | Solo `m3/gui*` y `m3/fixture*`: el resto lo usa `f8/claude/{admission,worker}.rs` y `f8/engine.rs:96` en producción.                                                                                                                                        |
| `delegate/` + `handoff.rs`                                               | ~3.950        | Quedan sin activación desde la ventana; `--wyss-delegate-mcp` sigue en `main.rs:103`.                                                                                                                                                                       |
| `sessions/`, `turns/`, `desktop/sessions.rs`, `desktop/turns.rs`         | ~10.400       | No mientras quede Actividad: `SessionService` es el transporte de approvals y events (`desktop.rs:255-258`) y `managed_approval*` vive en `desktop/turns.rs`.                                                                                               |
| `control/`, `authority/`, `lifecycle/`, `events/`, `bin/wyss-control.rs` | —             | Autoridad P1: se queda mientras quede Actividad.                                                                                                                                                                                                            |

Los fixtures `tests/fixtures/f8-gui-v1.json`, `f8-requests-v1.json`, `fixtures/m3/*` y `projects-v1.json` los incluyen tests Rust: en un borrado solo-front se quedan.

### 3.3 ¿Actividad sigue teniendo contenido?

- **Approvals**: existen solo para un turno administrado que corre (`App.svelte:211-218`). El único que llama `managed_turn_start` es `AgentController`; el único que llama `managed_session_prepare` son Sessions, F8 y Pipelines. Sin ellas la ventana no genera approvals nuevas.
- **Events**: son lo que registró la autoridad P1. Los agentes nativos, el host y la delegación no escriben ahí (sin referencias a `control::` ni `events::` en `native/`, `host/`, `delegate/`, `arsenal/`, `launch.rs`).
- **Resultado**: Actividad pasa a ser un visor de historia vieja, o de lo que cree otro cliente P1 (en el repo solo `examples/control_client.rs`).
- **En esta PC** no hay `wyss-control.service` instalado (solo `wyss-console-f8` y `wyss-console-host`, ambos inactivos), así que Actividad hoy solo puede mostrar el aviso de autoridad.

---

## 4. Riesgo y orden sugerido

1. **Restricciones que valen para todas las unidades.**
   - `tests/i18n.test.ts` falla si una entrada de `es.ts` queda sin uso: cada unidad poda `src/lib/i18n/es.ts` en el mismo commit. Estimo unas 1.137 de 2.805 claves en total, por coincidencia de texto.
   - `tests/ux-structure.test.ts:46-59` y `tests/app-shell.test.ts:162` fijan la lista exacta de Más: se tocan en cada unidad.
   - `src/app.css` tiene unas 2.087 líneas de reglas exclusivas de estos archivos (estimación por nombre de clase). La leen `appearance.test.ts` y `view-visibility.test.ts`.
2. **Primero las hojas**: Remote, Providers, Pipelines, Runtimes, Projects. Dos de ellas ya no se ven en esta PC.
3. **Después las que quitan función**: Arsenal presets, Terminal agents.
4. **Al final las acopladas**: Agents, luego Sessions, con la migración de "Open on" y la decisión sobre Actividad.
5. **Cierre**: shell (menú Más, `ViewId`, `moreItems`), CSS y segunda pasada de exports muertos.

**Verificación por unidad** (`docs/DEVELOPMENT.md`; no hay `AGENTS.md` ni `CLAUDE.md` en el repo): `npm run typecheck`, `npm run lint`, `npx vitest run` de los tests tocados más `i18n`, `ux-structure`, `app-shell`, `view-visibility` y `appearance`. `npm run check:rust` solo en unidades que toquen `src-tauri`.

---

## 5. Resumen: unidades de borrado (un commit cada una)

| #     | Unidad                                                                                                                                     | Fuente + tests                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| U1    | Remote (vista)                                                                                                                             | 226 + 61                          |
| U2    | Providers (vista, m3 front)                                                                                                                | 2158 + 763                        |
| U3    | Pipelines (vista, cliente, contrato)                                                                                                       | 2917 + 694                        |
| U4    | Runtimes (f8 front, prop `f8` de StatusBar)                                                                                                | 5208 + 2462                       |
| U5    | Projects (vista, insight, `ProjectsGate`, `ProjectsWindow`)                                                                                | 5353 + 2612                       |
| U6    | Arsenal presets                                                                                                                            | 4500 + 2555                       |
| U7    | Terminal agents                                                                                                                            | 2538 + 1958                       |
| U8    | Agents (vista, controller, `turns-client`)                                                                                                 | 1718 + 3290                       |
| U9    | Sessions (vista, controller) + migración de "Open on"                                                                                      | 1323 + 2860, más Rust de settings |
| U10   | Shell: menú Más, `nav.ts`, tests de estructura                                                                                             | ~150                              |
| U11   | `app.css`                                                                                                                                  | ~2.087 (estimado)                 |
| U12   | Segunda pasada: métodos de `NativeController`, exports de `present.ts`, clientes y contratos                                               | sin medir                         |
| B1–B5 | Backend, solo si se aprueba: comandos y capabilities sin consumidor; `projects/`; `orchestration/`; `remote/`; superficie de ventana F8/M3 | ver 3.2                           |

U1 a U9 suman 43.196 líneas, a las que se agrega la poda de `es.ts`.

Aparte, hay 1.425 líneas que ya son inalcanzables desde `main.ts` hoy: `features/models/*`, `desktop/models-client.ts`, `features/foundation/`, `features/pty-diagnostic/`, `contracts/agent-adapter*.ts`, `contracts/event-envelope.ts`. Los contratos tienen tests de paridad con Rust, así que no los metería en esta limpieza sin decidirlo.

## Decisiones que necesita el dueño

1. **Actividad**: ¿se queda como visor de historia de la autoridad P1, o se va junto con Sessions y Agents? Arrastra la sección de autoridad de Settings, `AuthorityNotice` y el estado en StatusBar.
2. **Terminal agents**: ¿se aceptan las pérdidas (parar, reiniciar, olvidar, restaurar, handoff, delegación) o alguna se muda a Console o Workspace antes de borrar?
3. **Arsenal presets**: ¿se acepta quedar sin alta, edición y borrado de presets, import de skills y "sync now", o se mudan a Arsenal antes?
4. **"Open on"**: ¿migración a esquema 4 (`sessions`/`agents` → `console`)? ¿`approvals` y `events` siguen como destinos si desaparece el menú Más?
5. **Menú Más**: sin las nueve le quedan Approvals, Events y Settings, que ya están en el rail. ¿Se elimina?
6. **Projects**: ¿se borra también el interruptor de Settings y la ventana `#workspace`? ¿Y el store persistido en la PC donde se haya adoptado?
7. **Backend**: ¿solo front por ahora, o también B1–B5? Sacar `f8/` o la autoridad P1 es un cambio de arquitectura aparte.
8. **Código ya inalcanzable** (1.425 líneas): ¿entra en esta limpieza?

---

**Estado: LISTO CON RESERVAS.** Auto-rating 8/10.

- **Estimaciones, no conteos exactos**: claves de `es.ts`, líneas de `app.css` y exports muertos de `present.ts` y contratos salen de coincidencia de texto.
- **Certeza media**: los seis comandos de Arsenal de la última fila de 3.1.
- **Sin ejecutar**: que "Arsenal presets" abre en blanco es lectura de código.
- **Tests que montan `App`** (`approvals-view`, `events-view`, `settings-view`, `configuration-app`, `product-polish`, `terminal-lifecycle`, `lifecycle-view`): los clasifiqué por imports y menciones, no los leí caso por caso. Tampoco revisé `tests/preview/app.ts` ni `docs/` (`REQUIREMENTS.md`, `ARCHITECTURE.md`, `contracts/interface.md` mencionan estas vistas).
- **Solo esta PC**: P1 sin instalar, F8 inactivo, Projects sin adoptar, landing `console`.
- **Rama de traducción**: `origin/wip/traduccion-es` apunta al mismo commit que HEAD según el ref local, sin fetch.
- **Scratchpad compartido**: escribí `graph.json`, `orph.json` y `cmds.json` en su raíz antes de mudarme a `mas-audit/`. Otro proceso pisó `graph.json` después; si alguien más usaba ese nombre, pude haberle pisado el suyo.

No hay nada que reiniciar. Próxima acción: que el dueño responda las decisiones 1 a 5; con eso el orden U1–U5 puede arrancar sin esperar el resto.
