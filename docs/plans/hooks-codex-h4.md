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
