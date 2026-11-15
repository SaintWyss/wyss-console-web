# Hooks de Codex y home por lanzamiento (H4)

Decisión del dueño del 2026-11-15: opción **b**. En el Arsenal se crean, editan, borran y recuperan los hooks de Codex como los de Claude Code, y en Workspace cada lanzamiento de Codex elige de a uno qué hooks corren. Para eso cada lanzamiento usa su propia carpeta de Codex (`CODEX_HOME`), con el `HOME` real. El dueño autorizó que esa carpeta use su credencial de Codex.

Investigación previa: [arsenal-home-por-lanzamiento](../research/arsenal-home-por-lanzamiento.md) (codex 0.167.0; hoy 0.169.0, recalificar).

## Hechos medidos (2026-11-15, .18)

- `~/.codex/hooks.json` declara 3 hooks (SessionStart, 2 PreToolUse); `config.toml` tiene `hooks = true` y 6 huellas en `[hooks.state]` (3 sin hook).
- La huella `trusted_hash` **no** se reproduce con sha256 del comando, del handler, del grupo ni del handler+matcher (JSON con y sin orden de claves). La consola no escribe confianza: la pide Codex.
- Las claves de `[hooks.state]` son `<ruta de hooks.json>:<evento>:<grupo>:<hook>`: en otra carpeta no hay confianza, y apagar un hook corre las posiciones.
- Codex no apaga un hook suelto por invocación (`-c` solo prende o apaga todos con `features.hooks`).
- `--dangerously-bypass-hook-trust` existe; no se usa sin pedido explícito (ADR 0059).
- `present.ts`: "Codex: … Never a hook" es la regla escrita que esta fase cambia; el doc cambia en el mismo commit.

## Estado (2026-11-15)

- **H4.0 hecho.** Inventario real (test ignorado `real_account_check`): con `trusted-writers` = `agent`, los 9 hooks de Claude, los 3 de Codex y las 390 skills quedan escribibles. Marcador (test ignorado `marker_homes` + `claude -p` sin login, SessionStart dispara igual): el home con el hook prendido escribe el marcador; con su clave en `hooks_off`, no. No cubre Workspace → host (el host que corre es el viejo).
- **H4.1 hecho.** `~/.codex/hooks.json` es fuente escribible (`CodexUserHooks`); `AddCodexHook`, `EditHook`, `ParkHook` y `RestoreHook` usan los mismos borradores que Claude (misma forma de JSON). Agregar va al final del evento. Test: agregar → editar → guardar aparte devuelve el archivo byte a byte → recuperar. Arsenal: rama Hooks en Codex con la misma ficha y un aviso de confianza.
- **H4.2 hecho.** `launch_home_codex::build` arma el home (`config.toml` regenerado con la confianza del propio home, `hooks.json` filtrado, `AGENTS.md`, `auth.json`, `auth.lock` y `sessions` enlazados). Codex 0.169.0 renueva bajo `auth.json.lock` junto al `auth.json` resuelto, así que todos los homes comparten el candado.
- **H4.3 hecho (con tests).** Un lanzamiento de Codex cuyo preset no cambia nada arranca como antes, sin `CODEX_HOME`. Si el preset apaga un hook de `hooks.json` o el `AGENTS.md`, el host arma `launch-homes/codex/<preset>` y lanza con `CODEX_HOME` y el `HOME` real; si el armado falla, el lanzamiento no arranca (`arsenal_home_failed`). La elección vive en `environment-codex.json`, junto a `environment.json`, y sigue a un hook editado en el Arsenal. El home enlaza además `rules`, `skills`, `plugins`, `memories`, `agents`, `prompts` y `hooks` del dueño, para que el lanzamiento difiera solo en lo apagado. Los hooks que declara `config.toml` (`[[hooks.<evento>]]`) no se filtran: Workspace y el panel de entorno del Arsenal los muestran como fijos. Comandos: `arsenal_codex_environment`, `arsenal_codex_environment_options`, `arsenal_codex_environment_write`.
- **Calificación de Codex 0.169.0 hecha** (2026-11-15, `ARSENAL_CODEX` y `docs/research/arsenal-am1a/ARSENAL-CODEX-0169-QUALIFICATION-2026-11-15.md`): probes sin inferencia en el `~/.codex` real y dentro de un home de lanzamiento; la concurrencia de dos terminales interactivas no se midió de nuevo.
- **H4.4 en curso.** Hecho: mecanismo de punta a punta con `codex exec --dangerously-bypass-hook-trust` en dos homes de prueba (hook prendido deja el marcador, apagado no; `auth.json` sin cambios; `codex login status` = 0 por el home y por el normal). Falta: revisión externa `+security`, y la matriz por Workspace con la aprobación de confianza en la TUI (paso del dueño) tras reiniciar el host.

## Riesgo de credencial (bloquea H4.2)

La investigación usó un enlace a `~/.codex/auth.json`. No se probó la renovación: si Codex reescribe la credencial con `rename`, el enlace se vuelve archivo y `~/.codex` queda con un refresh token viejo; si rota refresh tokens, el login real se invalida. Antes de construir: leer cómo escribe Codex `auth.json` (código o documentación de 0.169.0). Si el login real deja de valer en cualquier prueba: **parar, no re-loguear**, avisar.

## Etapas

| Etapa | Entrega                                                                                                                                                                                                                                                                                                                         | Verificación                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| H4.0  | Comprobar en la consola instalada que la ficha de un hook de Claude trae Editar y Borrar (trusted-writers). E2E de hooks de Claude por lanzamiento con un hook marcador.                                                                                                                                                        | archivo marcador aparece solo con el hook prendido                                                       |
| H4.1  | Operaciones de plan `codex_add_hook`, `codex_edit_hook`, `codex_park_hook`, `codex_restore_hook` sobre `~/.codex/hooks.json`, calcadas de `codex_*_mcp`. Arsenal: rama Hooks en Codex como en Claude.                                                                                                                           | tests de Rust del plan (añadir, editar, guardar aparte, recuperar; diff de `hooks.json`) + test de vista |
| H4.2  | Home de Codex por lanzamiento en `~/.local/state/wyss-console/launch-homes/codex/<preset>`: `config.toml` del dueño regenerado (conservando el `[hooks.state]` del propio home), `hooks.json` filtrado por `hooks_off` (misma clave `hook_key`), `AGENTS.md` y `auth.json` enlazados, sesiones enlazadas a `~/.codex/sessions`. | tests de Rust del armado; credencial: mtime/tamaño de `~/.codex/auth.json` antes y después               |
| H4.3  | Workspace: lista de hooks de Codex por lanzamiento (como Claude). El host lanza Codex con `CODEX_HOME` del home.                                                                                                                                                                                                                | test de vista + test del comando que arma el host                                                        |
| H4.4  | E2E real (abajo) y revisión externa `+security`. Reiniciar el host solo con aviso al dueño (corta terminales).                                                                                                                                                                                                                  | matriz completa                                                                                          |

## Test de aceptación (E2E)

Hook marcador en `SessionStart` que escribe `~/.cache/wyss-hook-test/<herramienta>-<lanzamiento>` (no gasta modelo).

|                             | Hook prendido                            | Hook apagado |
| --------------------------- | ---------------------------------------- | ------------ |
| Claude Code desde Workspace | aparece el archivo                       | no aparece   |
| Codex desde Workspace       | aparece (tras aprobar confianza una vez) | no aparece   |

Además: la segunda vez Codex no vuelve a pedir confianza; `codex login status` real sigue válido; `~/.claude/settings.json` y `~/.codex/hooks.json` reales iguales a su respaldo salvo lo creado a propósito; el hook marcador se borra al final.
