# Auditoría en inglés — consola

Auditor Claude Sonnet, solo lectura, 2026-11-16, sobre 5f709e5/7bc208a. Hallazgos SIN verificar salvo que el plan diga lo contrario.

Auditoría de solo lectura de la pantalla Console. No edité nada ni corrí tests. El diff `f2a913e..5f709e5` sobre `terminal/` toca solo `TerminalView.svelte` y `failure-words.ts`. No rompió lógica ni cambió inglés (detalle al final).

| Clase | Archivo:línea | Texto actual | Por qué (evidencia) | Arreglo |
|---|---|---|---|---|
| FALLO | `TerminalView.svelte:~447` (title del `.launch-item`) | `` `${Claude Code\|Codex}${ · permiso} in ${launch.directory}` `` | Visible como tooltip, pero el ` in ` está pegado como texto suelto y no pasa por `t()`. En español queda "Claude Code · Solo lectura in /ruta". | `t('{agent} in {directory}', {agent: …, directory: launch.directory})`. Con permiso: `t('{agent} · {permission} in {directory}', …)`. |
| FALLO | `TerminalPanel.svelte:~94` | `<span class="dot"></span>Native` | Etiqueta visible sin `t()`. En `es-rest.ts:95` existe `native: 'Native'` (no es el mismo mecanismo). | `{t('Native')}` y agregar la clave al catálogo. |
| FALLO | `launch.ts:295` | `` `The Arsenal selection ${plan!.selection_name} cannot be applied with this permission now; start it from Agents to choose.` `` | Es una frase con nombre interpolado. `explain()` la manda por `tIncoming` (`TerminalView.svelte:~146`) y ninguna clave en `i18n/` la contiene, así que se ve siempre en inglés. | Cambiar a `new LaunchRefusal(msg('The Arsenal selection “{name}” cannot be applied with this permission now; start it from Agents to choose.'), {name: plan!.selection_name})` y traducirla. |
| FALLO | `LifecycleCard.svelte` (celda `{event.basis}`, `title={event.known_by}`) | Frases de Rust, p. ej. `"The host is a separate process with a group of its own; closing the window signals nothing in it."` y `known_by: "tested: a terminal outlives…"` | Vienen de `src-tauri/src/host/persistence.rs:154-190` y se pintan crudas, sin `tIncoming`. El resto de la tarjeta sí usa `t()`. No pude confirmar con `grep` si hay una pantalla distinta de Console que monte la tarjeta (`--include` falló en zsh). | `{tIncoming(event.basis)}` y `title={tIncoming(event.known_by)}`, y agregar las frases a `INCOMING_ES`. |
| FALLO | `failure-words.ts:36-56` y `session-manager.ts:319,358,372` | Frases con regex `^Terminal limit reached \((\d+)\)…` | No es un error hoy. El "16" y el texto están fijos como string en TS y `workspaceErrorText` los reconoce por regex, así que si cambia el wording se vuelve a mostrar en inglés sin avisar. | Sin cambio obligatorio. Opcional: guardar el código de error en `this.error`, no la frase. |
| DUPLICADO | `TerminalPanel.svelte:~92-97` y `SessionBar.svelte:~83` | Barra del panel: `Native` + `{agent} · {startedWith}`. Pie: `Native · {agent} · {startedWith}` | En una sesión nativa, el mismo dato (nativo, agente, permiso con el que arrancó) sale dos veces a la vez: `tabStartedWith(native.profile)` en `TerminalPanel.svelte:~50` y en `session-bar.ts:agentPart`. | Quitar `{session.native.agent}{startedWith…} ·` de la barra del panel y dejar solo el pill `Native` con su tooltip, o quitar el lado "agente" del pie. Recomiendo borrar el texto del panel. |
| DUPLICADO | `TerminalPanel.svelte:~90` y `TerminalView.svelte:~374` | Tooltip `Started by the Console in your shell. Not mediated, contained or approved by the Console.`, y en la pestaña `◆` | La pestaña ya marca "nativa" con `◆` (`aria-hidden`), el panel con el pill y el pie con `Native · …`. Son tres marcas del mismo dato. | Conservar solo el pill del panel, con su tooltip. Quitar `Native ·` del pie dejando `{agent}`. |
| EXCESIVO | `TerminalPanel.svelte:~117` | `· Output truncated` | No pude verificar con evidencia que sobre. Lo dejo como sospecha, no como hallazgo. | — |

**Hechos verificados contra el código (sin errores de hecho).**
- El límite de 16 terminales y de 16 paneles coincide con `SESSION_LIMIT` (`session-manager.ts:76`) y `MAX_PANES` (`layout.ts:24`).
- El "64 KiB" de `input_limit` coincide con `INPUT_CAPACITY` (`controller.ts:29`).
- El `+` tras 5000 coincide con `MAX_MATCHES` (`renderer.ts:48`).
- Los atajos de `KEY_LEGEND` coinciden con `keymap.ts` (`KeyT`, `D`, `E`, `W`, `F`, flechas, `Period`, `Comma`, `PageUp/PageDown`, `Digit1-9`).
- `Ctrl+Shift+W` ("Close the pane") llama a `manager.close(activeId)`, que cierra el panel, no la pestaña.
- `Ctrl+Shift+D` es lado a lado (`row`) y `Ctrl+Shift+E` uno sobre otro (`col`), tal como dicen los tooltips.

**Revisión del diff de agentes previos.** No hay ERROR_DE_HECHO ni FALLO nuevo.
- `explain()` agregó `incoming?` y lo pone solo en las ramas `reasons`/`Error`. Las ramas traducibles quedan igual.
- `{tIncoming(bad.error)}` envuelve texto que ya era visible. No cambió ningún inglés.
- `workspaceErrorText` reproduce exactamente las 3 frases de `session-manager.ts:319/358/372`. Los placeholders `{count}` se llenan con el grupo capturado, y lo que no coincide pasa por `tIncoming`.

**Todas las frases en inglés que muestra la pantalla.** Las que marco con (Rust) llegan por `tIncoming` o desde campos del host.

- **Contenedor y barra**
  - `Local terminal workspace`, `Terminal sessions`, `Terminal tools`
  - `Close {name}`, `Terminal`
  - Estados de pestaña: `starting`, `running`, `closing`, `exited`, `closed`, `failed`
  - `Split side by side (Ctrl+Shift+D)`, `Split side by side`
  - `Split, one above the other (Ctrl+Shift+E)`, `Split one above the other`
  - `Keyboard shortcuts`, `Your saved launches`, `+ Launch`, `Launches`
- **Panel de launches**
  - `Reading launches…`
  - `No launches. Add a file in {folder}.`
  - `Files in {folder}`, `Done`, `Order`
  - `Move {name} up`, `Move {name} down`
  - `Full access`, más `BYPASS_WARNING`, `PERMISSION_LABEL` (Ask before acting, Read only, Accept edits, Full access)
  - `Claude Code` y `Codex` (nombres propios)
  - Errores de `*.toml` rechazados (Rust, `tIncoming(bad.error)`)
- **Leyenda de atajos** (9 en `keymap.ts:61-71`)
  - `New terminal in a new tab`, `Split the pane side by side`, `Split the pane, one above the other`, `Close the pane`
  - `Search the pane’s scrollback`, `Move to the pane in that direction`, `Next and previous pane`
  - `Next and previous tab`, `Go to that tab`
  - Nota: `Every other key goes to the program in the terminal.`
- **Estado vacío:** `No terminals open.`, `New terminal`
- **Errores del workspace**
  - Terminales y paneles: `Terminal limit reached ({count}). Close a terminal to create another.`, `… to open another.`, `A tab holds at most {count} panes.`
  - Errores de launch (con `msg`, `launch.ts`): "The preset … cannot be applied…", "No preset named…", "More than one preset…", "This launch has no commands…", "The launch instructions file…", "ENVIRONMENT_UNREADABLE", "The launch … leaves out a hook…", "changes the project instructions…", "leaves a Codex hook or AGENTS.md out…", `HOME_FOLDER_REFUSED`
  - Errores de launch (con `failureText` / otros): `The launch could not be opened.`, "This launch’s folder is not a project…", `failureText(code)`
  - Errores de launch (Rust): `e.reasons[0]` y `error.message` por `tIncoming`
  - Notas de launch: `A command before the start did not succeed ({result}); the agent started anyway.`, `Started with {selection} applied.`, `Started without applying {selection}; the selection is recorded.`, `The terminal started, but Arsenal could not record its selection.`
- **Panel** (`TerminalPanel.svelte`)
  - `Native`, el tooltip de nativas, `Starting agent…`, `Starting terminal…`, `Running`, `Agent exited`, `Shell exited`, `Closing terminal…`, `Terminal closed`
  - `Terminal failed: {reason}`, `Output truncated`
  - Frases de `FAILURES` (14): `The terminal size was refused.`, `The folder to start in does not exist or cannot be opened.`, `The shell could not be started.`, `Input could not be written…`, `…could not be resized.`, `…stayed busy…`, `The limit of open terminals…`, `…did not answer in time.`, `…did not close in time.`, `…could not be closed.`, `…could not be drawn in this window.`, `The terminal host is not answering. Nothing was sent.`, `The terminal host did not confirm this request…`, `The terminal stopped with an error.`
  - `InputNotice`: `The host did not confirm the last input…`, `That input was not sent: … (64 KiB)…`
  - Búsqueda: `Search this terminal`, `Search…`, `No matches`, `{current} of {total}{suffix}`, `Previous match`, `Next match`, `Match case`, `Close search`
- **Notas del parser** (6, con `title`, `parser-status.ts`)
  - `Screen restored · {count} KiB of output was missed while it was kept`
  - `Screen rebuilt from the end of the output · {count} KiB before it is not included`
  - `Screen restored · {count} older lines not shown`
  - `Output replayed · no screen state was kept`, con `{reason}` desde Rust (`host_without_screen`, `commands.rs:291`) y `_` cambiado por espacio
  - `Output was missed while the screen was kept`, `Screen parser restarting`, `Screen parser unavailable`
- **Pie de sesión** (`session-bar.ts`)
  - `Session`, `Branch`, `no git`, `detached HEAD`, `✓ all committed`, `● 1 change not committed`, `● {count} changes not committed`, `↑{count} not pushed`
  - `Terminal`, `Native · {agent}`, más `tabStartedWith` (permisos)
  - Datos crudos del host (Rust): ruta de la carpeta y nombre de la rama
- **Tarjeta de ciclo de vida** (`LifecycleCard.svelte`)
  - Títulos de `TITLES` (8), `Keeps running`, `Ends`, `Not certain here`, `Reading…`, `What survives what could not be read from the host.`
  - `Your terminals belong to a host process…`, `What survives what`, `When`, `Terminals`, `Why`
  - `Lingering keeps your user session manager running…`, `not something this system lets the Console read`, `on`, `off`
  - `Confirm lingering`, "This runs “loginctl enable-linger”…", "… disable-linger…", `Turn lingering on`, `Turn lingering off`, `Cancel`, `Turn lingering off…`, `Keep terminals after logout…`
  - `Lingering is on/off for your account.`, `This system does not expose a lingering setting…`, `The setting could not be changed. Nothing was changed.`
  - (Rust, sin traducir) `basis` y `known_by` de `src-tauri/src/host/persistence.rs:154+` (8 frases)

Los tres FALLO (`launch.ts:295`, `TerminalPanel.svelte` "Native" y `LifecycleCard.svelte`) se arreglan sin tocar `distributors`.
