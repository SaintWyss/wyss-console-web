# Auditoría en inglés — arsenal

Auditor Claude Sonnet, solo lectura, 2026-11-16, sobre 5f709e5/7bc208a. Hallazgos SIN verificar salvo que el plan diga lo contrario.

Auditoría de solo lectura de Arsenal (`LibraryView` y los pop-ups de `configuration`), sin editar nada. No corrí la app ni los tests, así que todo sale de leer el código. Hay seis errores de hecho, algunos duplicados de vocabulario y varios fallos de texto.

El diff `f2a913e..5f709e5` toca `messages.ts` (importMessage/phrase/incomingMessage) y `ChangePlan.svelte` (`tIncoming` sobre `plan.name` y `line.text`). `importMessage` solo lo usa la pantalla vieja y está fuera de alcance. Los dos cambios de `ChangePlan` están bien.

## Hallazgos

| Clase | archivo:línea | Texto actual | Por qué (evidencia) | Arreglo |
|---|---|---|---|---|
| ERROR_DE_HECHO | `LibraryView.svelte:283-285,329,334` | `Hooks · Kept aside` / `No hook is kept aside.` | `parked` filtra solo `state==='parked'`. `parkedTool` (l.282) nunca filtra: solo arma el id de la lista. La página de Codex muestra los hooks apartados de Claude y al revés. Además mete en "Hooks" los MCP, plugins y archivos apartados (`park_mcp`, `codex_park_mcp`, `park_plugin`, `delete_document`). | Filtrar `records` por proveedor y tipo. Si no se puede, el título pasa a `Kept aside` y el vacío a `Nothing is kept aside.` |
| ERROR_DE_HECHO | `map.ts:~205` (`count>0 \|\| tool==='opencode'`) → nodo `Hooks` de OpenCode | `Hooks` (0) | OpenCode no lee hooks: `opencode.rs` no tiene ninguno. La página vacía ofrece `Add a hook…` (`ConfigurationView:248`), que escribe un hook de Claude Code (`authorHook` con `agent` por defecto `claude_code`). | No mostrar `Hooks` en OpenCode. |
| ERROR_DE_HECHO | `ConfigurationView.svelte:405-410` (embedded, pestaña MCP) | `Agent` → OpenCode / Codex | La pestaña MCP de Claude Code ofrece crear un servidor para otro agente. El MCP de Claude no se puede crear desde acá. | Preseleccionar y fijar el agente de la pestaña y ocultar el select; en Claude, no mostrar `Add an MCP server…`. |
| ERROR_DE_HECHO | `LibraryView.svelte:397-401` (select de eventos para Codex) | `{HOOK_EVENT_NAME} · {name}` con 12 eventos | `HOOK_EVENTS` en `author.rs:22` se llama "Claude Code's hook events". El formulario de Codex ofrece los mismos 12, entre ellos `Notification`, `PreCompact` y `SubagentStop`. Es una sospecha: no pude confirmar la lista de Codex. | Pasar la lista de eventos del agente. Sin fuente verificada, avisar. |
| ERROR_DE_HECHO | `LibraryView.svelte:494,499` + `present.ts:354` | botón `Delete`, título `It is kept aside and can be brought back.` | El botón dispara `park_hook`, y el plan dice `Turn off this hook: …`. El usuario toca "Delete", confirma "Turn off" y lo busca en "Kept aside". | `Move aside` (botón) y `Turn off this hook` → `Keep this hook aside`. |
| ERROR_DE_HECHO | `ConfigurationView.svelte:526-529,534` | `Nothing is turned off` / `A hook you turn off is removed from its file…` / `Turned-off hooks` | Esa pestaña lista todos los registros apartados: MCP, plugins y archivos (`parked` sin filtro, l.63). | `Nothing is kept aside` / `Anything you turn off or delete here is removed from its file and kept here, so it can be put back exactly.` / `Kept entries` |
| DUPLICADO | `LibraryView.svelte:329,347` / `present.ts:68` / `ConfigurationView:234,526` / `present.ts:555` | `Kept aside` / `Parked` / `Turned off` / `Put back` / `Turned off` (en el aviso `imported`) | Cuatro nombres para lo mismo. El aviso `Imported. It is listed under Turned off.` apunta a la pestaña "Turned off", que dentro de Arsenal se superpone con el árbol "Kept aside". | Unificar en `Kept aside` y `Put back`. `Parked` → `Kept aside`. |
| DUPLICADO | `LibraryView.svelte:421-430` + `ConfigurationView.svelte:243-249` | `Add a hook` y `Add a hook…` | Claude y Codex tienen el botón en la lista del evento. Cada uno ofrece además, en su pestaña Hooks, el formulario del `ConfigurationView`, con otro texto. Dos caminos al mismo formulario, con etiquetas distintas. | Dejar uno solo. |
| DUPLICADO | `LibraryView.svelte:592,605` vs `present.ts:582-613` | `Switch on` / `Switch off`, estado `Switched on/off` | La misma acción dice `Turn on` / `Turn off` (`changeFor`, `OPERATION_LABEL`) y el estado `On in the file` / `Off in the file`. | Usar `Turn on` / `Turn off` y `On` / `Off`. |
| FALLO | `LibraryView.svelte:399` | opción `PostToolUseFailure · PostToolUseFailure` | `HOOK_EVENT_NAME` tiene 9 eventos y `HOOK_EVENTS` 12. Faltan `PostToolUseFailure`, `PermissionRequest` y `SubagentStart`: la opción repite el nombre y la lista muestra el id crudo. | Agregar `When a tool fails`, `When a permission is asked` y `When a subagent starts`. En el select, omitir el sufijo si coincide. |
| FALLO | `ChangePlan.svelte:62-70` | `Prediction, not a reading: managed Inference` + `can start` + `now` + `and this change does not alter that.` | Cinco fragmentos concatenados dan una oración rota, p. ej. `…cannot start: a hook is enabled in Codex’s files now and would …`. | Una sola frase con placeholders, sin "Inference". |
| FALLO | `hook.ts:13` | `[hidden]` | Es el comando del hook cuando está oculto. Sin `t()`, se ve en la lista y en la ficha. | `t('hidden')` o `—`. |
| FALLO | `LibraryView.svelte:515-518` | `This hook cannot be changed here.` + `Read-only for now: changing it is not available yet` | El caso que se alcanza es `not_writable='not_in_this_phase'` sin cambio posible (hook de proyecto, plugin o ya apagado). Dice dos veces lo mismo y "for now/not available yet" promete algo que no está. | Una frase: `This hook cannot be changed from here.` Si es de Codex, nombrar el motivo real. |
| FALLO | `ArsenalBrowser.svelte:211` | `aria-haspopup="dialog"` en `Configuration`/`MCP` | La configuración se abre en línea, no es un diálogo. El lector de pantalla anuncia algo que no ocurre. | Borrar el atributo. |
| FALLO | `ChangePlan.svelte:44-46` | `Another account you named in trusted-writers can also write this file’s folder. It is accepted because you named it.` | Está partido en tres `t()` y se rompe en el orden de ES. | Una frase con `{key}`. |
| FALLO | `LibraryView.svelte:338-353` | `<ChangePlan>` dentro de `<ul>` | Un `<section>` hijo directo de `<ul>` es HTML inválido. | Moverlo dentro del `<li>`. |
| EXCESIVO | `LibraryView.svelte:698` | `Codex’s copy is different.` | Aparece también en la ficha de Codex, donde "Codex’s copy" es la propia, y no dice distinta de qué. | `The copy in Claude Code's folder is different.` (y simétrico en la ficha de Codex). |
| EXCESIVO | `LibraryView.svelte:462-465` | `Codex asks you to trust a new or changed hook…` | Correcto como aviso. Solo es largo para una nota: se repite en cada hook de Codex. | Mostrar una vez por página, o dejarlo. |
| EXCESIVO | `ConfigurationView.svelte:177-181` | nota larga (solo no embebido) | Fuera de la ruta de Arsenal (`embedded` la oculta). | Sin acción. |

## Frases en inglés de la pantalla, por componente

**ArsenalBrowser**
- `Search`, `Search skills and agents`, `Show the tree` / `Hide the tree`, `Arsenal`.
- `{n} found for “{q}”`, `Choose a category in the tree.`
- `Its text could not be read.`, `Its file has no description.`

**LibraryView, árbol y mapa**
- `Skills`, `Agents`, `Personal`, `Sets`, `Hooks`, `Kept aside`, `MCP`, `Configuration`.
- `Claude account`, `Included with Codex`, `Git repos`.
- `Anthropic · Claude Code`, `OpenAI · Codex`, `OpenCode`.
- Los 9 eventos `When a session opens` … `Before the context is compacted`.

**LibraryView, ficha de skill**
- `Back`, `Its text could not be read ({reason}).`, `its link leads out of the agents’ folders` / `its link leads nowhere` / `it has no SKILL.md` / `the file cannot be read`.
- `Its file has no description.`, `The description is longer: only its beginning is shown.`
- `Use it when`, `Do not use it when`, `State`, `Switched on/off`, `Switch on/off`, `Undo`.
- `Instructions`, `Original text: what the tool reads.` / `Translated text; the tool reads the original.`, `See translation` / `See original`, `Reading…`, `The file could not be read.`
- `Code ({n} lines)`, `Only the first 256 KB are shown.`, `Location`, `Files ({n})`, `and {n} more`, `The folder holds more files than are counted here.`
- `Claude`, `Codex`, `Both · global`, `Only Claude Code sees it.`, `Only Codex sees it.`, `It is in the folders both tools read, so it loads in every session of each.`, `Codex’s copy is different.`

**LibraryView, ficha de hook y errores de página**
- `Every tool`, `What it runs`, `Stops after {n} s.`, `Actions`, `Edit`, `Delete`, `It is kept aside and can be brought back.`, `This hook cannot be changed here.`
- `The skills on disk could not be read.`, `Try again`, `A folder holds more than is read: the lists are incomplete.`

**LibraryView, formulario y página "Kept aside"**
- `When it runs`, `For which tools (empty = all)`, `Write the command…`, `Cancel`, `Add a hook`.
- `Put back`, `No hook is kept aside.`

**ConfigurationView (embebido)**
- Vista: `Items`, `Turned off`, `History`.
- Acciones: `Add a hook…`, `Add an MCP server…`, `New instruction file…`, `Choose project…`, `Project: {project}`, `No project`.
- Formularios: `Event`, `Matcher (optional)`, `Agent`, `Name`, `Kind`, `Starts a program`, `Connects to an address`, `Where`, `What to create`, `Continue…`.
- Plantillas y avisos: `Start from a sealed template…`, `Import a kept hook…`, `Export…`, `Forget`, `Older changes`.
- Estados: `Reading configuration…`, `The configuration could not be read`, `There is no configuration to read here`, `Nothing to show`, `Nothing matches this filter.`
- Detalle: `Search by name`, `Details`, `Found in`, `In the file`, `In use`, `Changing it`, `Fingerprint`, `Change it…`, `Export template…`, `Apply template…`, `Delete…`, `Settings`, `Where this was read from`.

**ChangePlan**
- `Change to confirm`, `What would change`, `Apply`, `Continue to confirm`, `Waiting for the confirmation window…`, `Preparing the change…`.
- Las tablas de `present.ts`, unas 120 frases: `OPERATION_LABEL`, `EFFECT_LABEL`, `OUTCOME_LABEL`, `CHANGE_FAILURE_TEXT`, `SOURCE_LABEL`, `NOT_WRITABLE_LABEL`, `RISK_LABEL`, `STORAGE_LABEL`.

**Frases de Rust (`tIncoming`)**
- Aparecen en el plan de confirmación (`plan.name` y `line.text`).
- `plan.rs`: `All hooks`, `"disableAllHooks": true/false`, líneas `"{skill}": "off"` (JSON literal, sin traducir).
- `author.rs`: `take back an authored change`, `the file goes back to exactly what it was`, más los nombres `add hook · {event} · {matcher}` y `edit hook · {event}`.
- `opencode_plan.rs` y `changes.rs`: `enabled: {true|false|(not set, so on)}`, `enabled: (the line is removed)`, y en Codex `enabled: {x} (the line is removed)`.
- `guide.rs`: `Claude account`, `Included with Codex`, `Git repos`. Los tres tienen versión en el cliente.
- Lo que no cubre el diccionario `incoming/configuration.ts` (solo 11 de sus 59 claves son de esta pantalla; el resto es de Distribuidores):
  - `enabled: (not set, so on)`, `enabled: true` y `enabled: false`.
  - La variante de Codex, `enabled: {x} (the line is removed)`.
  - Los nombres de plan `disableAllHooks`.
- En español queda esa parte mezclada, pero son sintaxis de configuración, no prosa.

## Notas
- `CONFIG_KINDS.global` incluye `plugin`, pero los plugins de Claude/Codex no están en `changeFor`. En la página "Configuration" se ven y no se pueden operar; el texto lo dice (`Read-only…`), así que no es un error.
- No audité `SyncLine.svelte` ni `ArsenalView`/`PresetsTab`. `LibraryView` no importa `SyncLine`.

Rutas relevantes:
- `/home/saintwyss/Github_repos/wyss-console-ux/src/lib/features/arsenal/LibraryView.svelte`
- `/home/saintwyss/Github_repos/wyss-console-ux/src/lib/features/arsenal/ArsenalBrowser.svelte`
- `/home/saintwyss/Github_repos/wyss-console-ux/src/lib/features/arsenal/map.ts`
- `/home/saintwyss/Github_repos/wyss-console-ux/src/lib/features/arsenal/hook.ts`
- `/home/saintwyss/Github_repos/wyss-console-ux/src/lib/features/configuration/ConfigurationView.svelte`
- `/home/saintwyss/Github_repos/wyss-console-ux/src/lib/features/configuration/ChangePlan.svelte`
- `/home/saintwyss/Github_repos/wyss-console-ux/src/lib/features/configuration/present.ts`
- `/home/saintwyss/Github_repos/wyss-console-ux/src-tauri/src/agentconfig/author.rs`
