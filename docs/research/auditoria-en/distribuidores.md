# Auditoría en inglés — distribuidores

Auditor Claude Sonnet, solo lectura, 2026-11-16, sobre 5f709e5/7bc208a. Hallazgos SIN verificar salvo que el plan diga lo contrario.

La pantalla Distributors tiene 9 hallazgos, ninguno de ellos una regresión del diff `f2a913e..5f709e5`. No corrí tests ni la app: todo sale de leer el código.

## Diff `f2a913e..5f709e5`

Solo cambió `DistributorsView.svelte` (+25 −10). Los textos en inglés no cambiaron, con una excepción.

- **Excepción:** antes, un `DistributorError` sin `reasons` mostraba el código crudo (`distributor_unavailable`, `internal`, `invalid_reply`), porque `DistributorError.message` es `reasons[0] ?? code` (`distributors-client.ts:37-42`). Ahora `hostMessage` muestra "The distributors could not be reached." o "The desktop could not complete the request." (`DistributorsView.svelte:77-85`). Es una mejora, pero es inglés nuevo.
- **Sin romper:**
  - `tIncoming(error.reasons[0])` y `tIncoming(r.error)` solo traducen en `es`. En `en` devuelven el texto intacto (`index.svelte.ts` `tIncoming`).
  - El chequeo `original.includes('exists')` (`:148-149`) sigue sobre el mensaje en inglés, así que no depende del idioma.
  - Las 45 frases de `t()` están en `es.ts`, salvo 2 que están en `es-configuration.ts:3,5`.
- **Fallbacks que no se ven:** `failureMessage(e, 'It could not be saved.')` y los otros tres fallbacks (`:162,174,186,196`) pasan el texto como variable a `t(fallback)`. Un extractor que lea solo `t('literal')` no los ve. Hoy `es.ts` los tiene, pero hay que cuidarlo.
- **Fallbacks casi muertos:** todo `Error` que llega a `hostMessage` devuelve algo no nulo, así que esos cuatro solo se usan si se lanza algo que no sea `Error`.

## Hallazgos

| clase                               | archivo:línea                                                              | texto actual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | por qué                                                                                                                                                                                                                                                                                           | arreglo propuesto                                                                                                                                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ERROR_DE_HECHO                      | `DistributorsView.svelte:401`                                              | `Removes its card. The tool itself stays installed.`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `delete` en `distributors.rs:341-351` también borra el lanzamiento de Workspace hecho desde ese distribuidor (`own_launch`), si no fue editado a mano. El texto no lo dice.                                                                                                                       | `Removes its card and the launch made from it. The tool itself stays installed.`                                                                                                                                             |
| ERROR_DE_HECHO                      | `DistributorsView.svelte:458`                                              | `Fills in its name and the command that opens it. Its update command depends on how you installed it.`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `onclick` (`:460-464`) también rellena "Made by" (`f.maker = s.maker`).                                                                                                                                                                                                                           | `Fills in its name, maker and the command that opens it. Its update command depends on how you installed it.`                                                                                                                |
| ERROR_DE_HECHO (leve)               | `DistributorsView.svelte:326`                                              | `“{command}” was not found where the agents are looked for.`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Con ruta absoluta, `found()` (`distributors.rs:97-111`) mira que el archivo exista y sea ejecutable. No busca en las carpetas de los agentes. El texto solo vale para nombres sueltos.                                                                                                            | `“{command}” was not found or is not executable.`                                                                                                                                                                            |
| FALLO                               | `DistributorsView.svelte:258-260` con `app.css:5632-5636`                  | `{addedError}` (`It could not be saved.`, `a distributor with that name exists`, `a launch with that name exists`, etc.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Con el diálogo abierto, un error de Save o de Make launch se escribe en `addedError`. Ese `<p class="notice">` está fuera del diálogo y `.ars-overlay` es `position: fixed; inset: 0; z-index: 50`. El error queda tapado y el usuario no ve por qué no pasó nada. El texto existe pero no se ve. | Sin cambio de inglés. Mostrar `addedError` dentro del `<form>` mientras `form` está abierto.                                                                                                                                 |
| FALLO                               | `DistributorsView.svelte:261`                                              | `It was added, but its launch could not be made: {why}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `notice` solo se pone a `null` en `makeLaunch` (`:191`). Una vez mostrado, no se cierra nunca hasta que se cree otro lanzamiento o se recargue.                                                                                                                                                   | Sin cambio de inglés. Limpiar `notice` en `submit`, `close` o `remove`.                                                                                                                                                      |
| FALLO (estado que nunca se muestra) | `present.ts:87-92`, `:134`, `:149-155` y `DistributorsView.svelte:263-318` | `This tool does not list its models to the Console.`, `Configured models are from an earlier read.`, `Configured model: {model}`, `The list could not be read: …`, `The managed Codex runtime is not running, so there is no list. …`, `Listed once by the managed Codex runtime … Read from the authority at {at}.`, `The runtime’s list continued past what was taken: this list is partial.`, `Whether this list is complete is not reported by this authority version.`, `In {folder}: started with {permission}.`, `In {folder}: started as the agent is configured.`, `{session} (managed): {line}` | La tarjeta solo dibuja `name`, `tool`, `status` y los botones. Nunca lee `card.models`, `card.notes` ni `card.fresh`. `inUse()` no se llama desde la vista. Todo ese texto es inalcanzable en esta pantalla.                                                                                      | No traducir para esta pantalla. Si no se van a mostrar, borrar el código muerto: `models`/`notes`, `fresh`/`compare`/`seen.ts`, `inUse`, `SET_UP_IN`, y los props `models`, `configItems`, `configStale`, `managed`, `ongo`. |
| DUPLICADO                           | `DistributorsView.svelte:306` y `:313`                                     | `Comes with the Console: it cannot be edited or deleted.`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | El mismo título está en Edit y en Delete, ambos deshabilitados, en cada una de las 3 tarjetas fijas. Son 6 repeticiones de la misma ayuda.                                                                                                                                                        | Dejar el texto en un solo botón o quitar los dos botones deshabilitados.                                                                                                                                                     |
| DUPLICADO / EXCESIVO                | `DistributorsView.svelte:503`, `:508`                                      | título `Typed in a new terminal by Update. Optional: it depends on how you installed the tool.` y placeholder `optional`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Dice "optional" dos veces en el mismo campo. Lo mismo pasa con los títulos `Who makes it. Optional.` (`:478`) y `Anything to remember about it. Optional.` (`:516`), que repiten lo que dice la etiqueta.                                                                                         | Título: `Typed in a new terminal by Update. It depends on how you installed the tool.` Placeholder: se queda.                                                                                                                |
| EXCESIVO                            | `DistributorsView.svelte:469`                                              | `How the card is called.`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Explica lo obvio para el campo "Name".                                                                                                                                                                                                                                                            | Borrar el `title`.                                                                                                                                                                                                           |

Dos cosas más, sin clase propia:

- **Botón sin motivo:** "Update tool" de la tarjeta OpenCode queda deshabilitado y su `title` es `''` (`:291-296`), así que no hay texto que explique por qué. El comentario de `present.ts:30-32` lo justifica, pero el usuario no ve nada.
- **Guardar sin aviso:** `formOk` deshabilita Save (`:545`) sin ningún texto de por qué. Pasa cuando el comando de abrir empieza con un carácter no válido, aunque Rust lo rechaza con `open must start with the tool's command name…`.

No hay hallazgos de FALLO por `{x}` sin llenar. Todos los `{placeholder}` de `t()` reciben su valor, y `tIncoming` rellena los de Rust por regex (`fillTemplate`).

## Frases en inglés que muestra la pantalla

**Marcado, `t()` y `title`/`aria-label`/`placeholder` en `DistributorsView.svelte`** (45 frases):

- Barra y diálogo: `Distributors` (aria-label de la sección), `Add a tool`, `Add distributor`, `Edit distributor`, `Suggestions:`.
- Botones: `Open`, `Update tool`, `Edit`, `Delete`, `Confirm delete`, `Cancel`, `Save`, `Make launch`.
- Estados: `Installed`, `Tool not installed`.
- Campos: `Name`, `Made by`, `Command to open`, `Command to update`, `Note`, y el placeholder `optional`.
- Ayudas (`title`):
  - `Types “{command}” in a new terminal of the Console.`
  - `Types “{command}” in a new terminal of the Console, where you see it run.`
  - `Comes with the Console: it cannot be edited or deleted.`
  - `Found at {path}.`
  - `“{command}” was not found where the agents are looked for.`
  - `It has no update command yet: set one in Edit.`
  - `Change its name or its commands.`
  - `Removes its card. The tool itself stays installed.`
  - `Add a tool the Console does not know: by its name and the commands that open and update it.`
  - `Fills in its name and the command that opens it. Its update command depends on how you installed it.`
  - `How the card is called.`
  - `Who makes it. Optional.`
  - `Typed in a new terminal to open it. Its first word is the command looked for to say whether it is installed.`
  - `Typed in a new terminal by Update. Optional: it depends on how you installed the tool.`
  - `Anything to remember about it. Optional.`
  - `Makes a launch in Workspace that opens it, so it starts from + Launch like the others.`
- Avisos y errores:
  - `It was added, but its launch could not be made: {why}`
  - `The added distributors did not load.`
  - `It could not be saved.`
  - `It could not be deleted.`
  - `It could not be read.`
  - `The launch could not be made.`
  - `The distributors could not be reached.`
  - `The desktop could not complete the request.`

**De `present.ts`** (visibles): el estado de las tarjetas fijas es `Unknown`, `Tool not installed`, `Installed`, o el número de versión (`{version}`).

**Sin traducir y correcto:** `Anthropic`, `OpenAI`, `OpenCode`, `Claude Code`, `Codex`, `OpenCode` (nombres propios). `Kimi CLI`, `Gemini CLI`, `Aider` y sus fabricantes `Moonshot AI` y `Google` (nombres propios). El placeholder `kimi` y el sufijo `.toml` en `{r.id}.toml:`.

**Vienen de Rust vía `tIncoming`** (`hostMessage` y `refusedFiles`), todas en `incoming/configuration.ts` y `native.ts`, que ya las tienen:

- `unknown distributor`
- `name needs at least one letter or digit`
- `name must be 1–60 characters on one line`
- `open must be one command on one line`
- `update must be one command on one line`
- `open must start with the tool's command name (like kimi) or its absolute path`
- `{what} must be at most {most} characters on one line`
- `not a distributor file: {detail}`
- `file name must be lowercase letters, digits, - or _`
- `only the first 32 files are read`
- `at most 32 distributors`
- `too long`
- `a distributor with that name exists`
- `a file with that name exists`
- `a launch with that name exists`
- `it could not be written: {e}`
- `the distributor could not be written: {e}`
- `its launch could not be written: {e}`
- `the distributor could not be deleted`
- `folder: {e}`
- `{path} is a link: nothing is written through it`
- `{path} is not a folder`
- `unreadable`
- `not a plain file`
- `larger than 64 KiB` (el número sale de `MAX_FILE_BYTES / 1024`)
- `not UTF-8`

Los códigos `distributor_unavailable`, `distributor_invalid` e `internal` no llegan crudos: `hostMessage` los reemplaza por las dos frases de `t()` de arriba.

**Archivo clave:** `/home/saintwyss/Github_repos/wyss-console-ux/src/lib/features/distributors/DistributorsView.svelte`. `src/lib/i18n/screens/distributors.ts` está vacío, o sea que no hay pendientes registrados ahí.
