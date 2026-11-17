# Auditoría en inglés — shell

Auditor Claude Sonnet, solo lectura, 2026-11-16, sobre 5f709e5/7bc208a. Hallazgos SIN verificar salvo que el plan diga lo contrario.

Diff `f2a913e..5f709e5` sobre `src/lib/shell` y `src/App.svelte`: vacío. Esos archivos no cambiaron en ese rango, así que auditué el estado actual. Todo está en `src/lib/shell`. No ejecuté tests ni toqué nada. Las frases de Rust que se ven en el shell son cero: los textos de estado viven en TS y Rust solo manda enums. Los diccionarios `es*.ts` no mostraron huecos en las frases que probé, y no corrí el test del diccionario.

## Hallazgos

| Clase          | archivo:línea                                    | Texto actual                                                                                        | Por qué (evidencia)                                                                                                                                                                                                                                                         | Arreglo                                                                                                                                                                                            |
| -------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ERROR_DE_HECHO | `lifecycle.ts:145`, `lifecycle.ts:269-271`       | Pastilla "Failed to start" y aviso "The Wyss authority could not start"                             | Se aplican a todo `failure` no quieto. Entre ellos están `socket_unavailable` ("The authority is running and did not answer in time.", `:182`) y `socket_unsafe` (`:185`). El texto del cuerpo dice que la autoridad está corriendo, así que el título contradice al texto. | Para esos dos fallos: pastilla "Not answering" y título "The Wyss authority is not answering". Hay que agregar las claves a `es.ts`.                                                               |
| ERROR_DE_HECHO | `nav.ts:27`, `Sidebar.svelte:115-124`            | Comentario "its tooltip under More"                                                                 | `subtitle` no se lee en ningún lado (`grep \.subtitle` en `src` da cero). Los botones del menú Más no tienen `title`, y el de los iconos del riel muestra solo la etiqueta. Se ven 13 frases a las que nadie llega.                                                         | Agregar `title={t(item.subtitle)}` al botón del menú Más (`Sidebar.svelte:116`). Si no, borrar `subtitle` y sus `msg()`.                                                                           |
| FALLO          | `Sidebar.svelte:87`                              | `title={t(item.label)}` ("Console", "Workspace", "Personalization", "Activity", "Settings", "More") | La ayuda repite la etiqueta y no dice qué abre cada icono. Workspace abre el editor de lanzamientos (`launches`), no la vista "Terminal agents". Personalization abre la última pestaña visitada. Activity abre Approvals y Events juntos.                                  | Añadir `hint` al riel. Textos: "Start an agent in a folder" (Workspace), "Distributors, Arsenal and Credentials" (Personalization), "Approvals and events" (Activity), "Open another view" (More). |
| DUPLICADO      | `nav.ts:276-283`                                 | Settings aparece en el riel y también en More                                                       | `own` no incluye `'settings'`, pero `moreItems` filtra `NAV_ITEMS`, que sí lo trae (`nav.ts:100`). El comentario de `nav.ts:272` lo da por intencional. La misma etiqueta, el mismo icono y la misma vista salen dos veces.                                                 | Agregar `'settings'` a `own`, o borrar la mención en el comentario.                                                                                                                                |
| FALLO          | `authority.ts:258`                               | `desired {state}` con valor `running`/`stopped`                                                     | El valor es el enum crudo del contrato. En Spanish queda "desired running" mezclado. Los `Phrase.values` aceptan otro `Phrase`.                                                                                                                                             | `values: { state: { text: agent.desired === 'running' ? msg('running') : msg('stopped') } }`.                                                                                                      |
| FALLO          | `authority.ts:247`, `authority.ts:257`           | `agent.adapter` crudo como `name` y frase `{name}` sola                                             | Cuando `adapter` no es `codex`, se muestra el id interno sin traducir. La frase `'{name}'` es una línea sin contenido propio.                                                                                                                                               | Si no hay versión, omitir esa parte de `detail`. El nombre ya está en la clave de la pastilla.                                                                                                     |
| EXCESIVO       | `StatusList.svelte:51`, `StatusList.svelte:62`   | "Authority P2" / "Authority P1" y títulos "Protocol 1/2 authority"                                  | Solo se dibuja una de las dos a la vez (`{#if f8}…{:else}`). La persona no puede distinguir P1 de P2, es jerga interna.                                                                                                                                                     | Clave "Authority" en ambas. Quitar "Protocol N" de los títulos.                                                                                                                                    |
| EXCESIVO       | `nav.ts:61`                                      | "Structured handoff and finite OL3 coordination"                                                    | "OL3" es un código interno sin explicación en pantalla.                                                                                                                                                                                                                     | "Hand work between agents in set steps".                                                                                                                                                           |
| FALLO          | `Sidebar.svelte:112`                             | `aria-label={t('More')}` sobre un `div`                                                             | Un `div` sin rol ignora `aria-label`, así que la etiqueta no llega a los lectores de pantalla.                                                                                                                                                                              | Agregar `role="group"`.                                                                                                                                                                            |
| FALLO          | `lifecycle.ts:85-87`                             | `connecting` rotulado "Starting"                                                                    | Es igual que `starting`, con detalle distinto. La pastilla no distingue "arrancando" de "esperando respuesta".                                                                                                                                                              | "Waiting" o dejar solo el detalle. Opcional.                                                                                                                                                       |
| FALLO          | `present.ts:236-237` frente a `authority.ts:195` | f8 muestra "Connecting" para `synchronizing`, P1 muestra "Syncing"                                  | El mismo estado se dice distinto según la pastilla.                                                                                                                                                                                                                         | Usar "Syncing" en `present.ts`.                                                                                                                                                                    |
| FALLO          | `runtime.ts:18`                                  | "Error"                                                                                             | Con `workspace.error` oculta el estado de la sesión activa, y la palabra no dice de qué.                                                                                                                                                                                    | "Terminal error".                                                                                                                                                                                  |

## Frases inglesas (ninguna es de Rust)

**Sidebar.svelte**

- Primary
- {count} waiting
- More

**nav.ts, etiquetas**

- Console
- Terminal agents
- Sessions
- Agents
- Pipelines
- Remote PCs
- Approvals
- Events
- Arsenal
- Arsenal presets
- Credentials
- Settings
- Runtimes
- Providers
- Projects
- Workspace
- Personalization
- Activity
- More
- Distributors

**nav.ts, subtítulos** (hoy invisibles)

- Local terminal workspace
- Agents running in your terminals
- Managed agent sessions
- Work with Codex in a session
- Structured handoff and finite OL3 coordination
- Hosts and sessions · transport not selected
- Actions waiting for a decision
- What the authority recorded
- Installed capabilities
- The earlier Arsenal screen: presets by provider
- API keys, kept sealed
- Preferences and about
- One isolated runtime per managed session
- What each provider profile can do, and why not
- Folders, workspaces and the sessions they show

**nav.ts, pistas de Personalization**

- Which agents are installed and their version, how to update them, the models each offers, and what runs now.
- Skills, agents, MCP servers and presets: what a session can load.
- The API keys each distributor needs, kept sealed.

**runtime.ts**

- No terminals
- Error
- Starting
- Running
- Closing
- Exited
- Closed
- Failed

**StatusBar y StatusList**

- Status
- Terminal
- Local terminal. It runs with or without the authority.
- Protocol 2 authority
- Authority P2
- Protocol 1 authority
- Authority P1

**authority.ts, estados**

- Offline
- Reconnecting
- Incompatible
- Rejected
- Unsafe
- Connecting
- Unavailable
- Connected
- Syncing
- Stopped
- Ready
- Initializing
- Stopping
- Unknown

**authority.ts, detalles**

- The authority is not running. Local terminals do not depend on it.
- The authority stopped answering. Reconnecting.
- The authority speaks another protocol or storage version.
- The authority broke the control protocol and was disconnected.
- The runtime directory or control socket is not private.
- Looking for the Wyss authority.
- The desktop could not read the authority state.
- {count} session
- {count} sessions
- Wyss authority {version}
- Wyss authority
- protocol {protocol}
- sessions: {prepared} prepared, {closed} closed
- event head {sequence}
- Reading the canonical authority state.
- The console is closing its authority link.
- Codex status is known only while the authority is connected.
- {name} {version}
- {name}
- desired {state}
- {count} model
- {count} models
- managed by the authority

**lifecycle.ts, estados**

- Installing
- Starting
- Failed to start

**lifecycle.ts, detalles y notas**

- Installing the Wyss authority for this account.
- Starting the Wyss authority.
- The Wyss authority is starting. Waiting for it to answer.
- started by Wyss Console
- started outside Wyss Console
- a newer authority is installed the next time it starts
- update pending
- An incompatible Wyss authority is running.

**lifecycle.ts, causas de fallo** (los 12 textos de `FAILURE`)

- No Wyss authority is running. Automatic authority management is disabled: opening the GUI does not install or start an authority. Start wyss-control yourself and it is used as soon as it answers.
- The authority packaged with this application could not be trusted: it is missing, it is not the one this application was built with, or it is in a folder others can write to. Nothing was installed.
- The authority was not installed: the place it is installed in is not safely yours (a link, another owner, or a folder others can write to). Nothing was changed.
- A service definition Wyss Console did not write is in the place of its own. It was left as it is, and the authority was not started.
- The authority could not be installed. Nothing is half installed: what was there before is still in place.
- No user service manager answered, so the authority could not be started. Wyss Console starts its authority through the service manager of your login session.
- The service manager did not start the authority.
- The authority was started and ended before it answered.
- The authority ended repeatedly and is no longer being restarted.
- The authority is not running: it was stopped, or it ended and was not restarted.
- The authority is running and did not answer in time.
- The control socket of the authority is not private to you, so it is not used.

**lifecycle.ts, diagnóstico**

- Packaged: carries its own authority
- Development: uses an authority that is already running
- Packaged, but its authority cannot be found
- Not checked yet
- Not installed
- Installed
- Installed by another version
- A service definition that is not Wyss Console’s
- Not safely yours
- No service manager answered
- Not running
- Running
- Failed
- This build
- Installation
- Service

**lifecycle.ts, avisos**

- An incompatible Wyss authority is running
- It is this installation’s own, from another version. It is replaced the next time it starts; it is not restarted under work that may be running.
- It was not started by this installation, so it is left exactly as it is. Wyss Console cannot work with it.
- The Wyss authority is not running
- The Wyss authority could not start

**AuthorityNotice.svelte**

- Authority status
- Retrying…
- Retry
- Details

**App.svelte**

- Skip to main content
- Session {id}
- Activity (título)
- Los títulos de `workspace`, `agents` y `projects` reutilizan las etiquetas de `nav.ts`.
- `Wyss Console` y `v{version}` no pasan por `t()`. Es el nombre del producto, no es un fallo.

**present.ts (lo que sale en la pastilla f8)**

- Connected
- Connecting
- Offline
- Stopped
- Texto de falla `FAULT[...]` (no auditado a fondo)

## Verificado sin hallazgo

- Cada estado de `FAULTS` se muestra en la condición que dice: `reason` solo existe con `connection === 'waiting'` (`contracts/authority.ts:165`), y un `connecting` sin motivo cae a "Connecting".
- "Connected" solo sale con `connection === 'connected'` y `view.authority`. El ciclo `ready` no lo fuerza (`lifecycle.ts:112`).
- `{count}`, `{version}`, `{protocol}`, `{prepared}`, `{closed}`, `{sequence}`, `{name}` y `{state}` reciben su valor en cada uso.

Sin verificar: el subtítulo "Hosts and sessions · transport not selected" frente a lo que dibuja `RemoteView`, y los textos de `FAULT` en `features/f8/present.ts`, que están fuera del alcance pedido.
