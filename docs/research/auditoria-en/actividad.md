# Auditoría en inglés — actividad

Auditor Claude Sonnet, solo lectura, 2026-11-16, sobre 5f709e5/7bc208a. Hallazgos SIN verificar salvo que el plan diga lo contrario.

**Alcance.** Auditoría solo de lectura. `git diff f2a913e 5f709e5 -- approvals events` no mostró cambios en esas dos carpetas, así que no hay diff que revisar ahí. Rust no manda ningún texto en inglés a esta pantalla: `src-tauri/src/events/view.rs` solo emite códigos cerrados (kind, reason, exit, scopes, revocation) y todo el texto sale de `approvals/present.ts` y `events/present.ts`. No hay frases Rust que marcar. No corrí tests ni la app.

## Hallazgos

| Clase | archivo:línea | Texto actual | Por qué (evidencia) | Arreglo |
|---|---|---|---|---|
| ERROR_DE_HECHO | `events/present.ts` (case `lease_revoked`) | `The lease was given back.` | El `else` cubre `revocation === 'user_request'` y también `null`, cuando `view.rs` no pudo leer `revocation_reason`. "Given back" afirma que quien la tenía la devolvió, y el contrato solo dice "user_request". | `The lease was revoked.` |
| ERROR_DE_HECHO | `events/EventsView.svelte:518` | `What it is about is shown in Approvals.` | `contracts/approval.rs:328` guarda command y files como "transient". `ApprovalsView.svelte:90-124` muestra comando y archivos solo en las tarjetas pendientes. Los aprobados, denegados o vencidos aparecen en "Recently ended" sin contenido. La frase se muestra siempre que detail traiga command o files, que es solo cuando está pendiente (y entonces sí es cierta); si el estado ya terminó y quedó algún dato, la frase no es verdadera. | Mostrarla solo si `now.state === 'pending'`. Si no, `The authority no longer holds what it was about.` |
| ERROR_DE_HECHO | `events/present.ts` (case `turn_cancel_requested`) + `agent/present.ts:33` | `Stopped at your request.` | El evento `turn_cancel_requested` solo registra el pedido. La razón `user_cancel` se reutiliza y dice "stopped", aunque en ese momento el turno todavía no paró. | Para ese kind usar `A cancel of the turn was recorded.` y no `TURN_REASON`. |
| ERROR_DE_HECHO | `events/EventsView.svelte:409` | `Kind` | El valor que muestra es `CATEGORY_LABEL` (Session, Runtime, Turn…), no el kind. El kind real es el título del panel. | `Category` |
| ERROR_DE_HECHO | `ApprovalCard.svelte:75-79` + `ApprovalCard.svelte:177-179` | `The authority no longer holds what this approval was about.` y `Read the whole change to approve it.` | Con `command === null` y `files === null`, `wholeShown` da false (`present.ts`) y `open` es true. Salen las dos frases a la vez. Hay nada que leer y Approve queda deshabilitado para siempre. | Mostrar la nota "Read the whole change…" solo si `card.files !== null`. En el otro caso: `Approval is unavailable: the authority no longer holds what it was about.` |
| FALLO | `ApprovalCard.svelte:174-181` | (sin texto) | Si `decidable` es false, o si no hay conexión, Approve y Deny quedan deshabilitados sin explicación. El caso `decidable` false no tiene motivo en pantalla. | Nota `This approval cannot be decided from here.` cuando `connected && !card.approval.decidable`. |
| FALLO | `EventsView.svelte:370-374` | `…read from another stream (` … `) and are not continued by them: positions of the two are unrelated.` | La frase se parte en dos `t()` alrededor de un `<span>`. Los fragmentos `(` y `) and…` no se pueden traducir bien y el orden queda fijo. | Una sola clave: `…read from another stream ({id}) and are not continued by them: …`, con `short(events.previous.stream)` como valor. Mismo cambio para el texto de `:371`. |
| FALLO | `EventsView.svelte:371-374` | `are not continued by them: positions of the two are unrelated.` | Inglés torpe. | `The events above belong to the stream the authority holds now. The ones below come from another stream ({id}) and do not continue it: their positions are unrelated.` |
| DUPLICADO | `ApprovalsView.svelte:41-46` y `:56-59` | `Connecting to the authority` (cabecera) y `Connecting to the authority…` (cuerpo) | Los dos son visibles a la vez. Pasa igual con `Authority unavailable` y `The authority is unavailable`, y con `Reading` y `Reading approvals…`. Lo mismo en `EventsView.svelte:193-196` frente a `:250-274`. | En la cabecera mostrar solo el conteo (vacío mientras conecta, lee o no está disponible). |
| DUPLICADO | `EventsView.svelte:199` y `:331` | `newest first` y `Events, newest first` | El orden se dice en el contador y en el aria-label de la lista. | Cambiar el aria-label a `Events` (dejar el contador). |
| FALLO | `ApprovalCard.svelte:97` | `{t('session')}` y `{t('turn')}` | Claves en minúscula sueltas, sin contexto para traducir (en español dependen del género y la posición). | Usar etiquetas completas: `Session {id}` y `Turn {id}`. `Session {id}` ya existe. |
| FALLO | `approvals/present.ts` (`approvalsReadFailure`) y `events/present.ts` (`eventsReadFailure`) | `Nothing is shown rather than something unverified.` | Inglés torpe. Además la rama "default" se muestra con cualquier código que no sea unavailable ni busy. | `Nothing is shown, because nothing unverified is shown.` o `Approvals could not be read. Nothing unverified is shown.` (igual para Events). |
| FALLO | `events/present.ts` (`runtime_desired`) | `…and recorded what it should be.` | Frase vaga. El título ya dice start o stop. | `The authority accepted a request for the managed Codex runtime and recorded the state it should be in.` |
| EXCESIVO | `ApprovalCard.svelte:60` | `The authority checks the action again before anything runs.` | Se repite en cada tarjeta pendiente. Es verdad, pero es ruido fijo junto a la hora límite. | Borrar. Podría quedar solo en un `title`. |
| EXCESIVO | `events/EventsView.svelte:458-462` | `This is a record of what happened then. What it may…` | Se muestra en todos los eventos y repite lo que ya dice la sección. | Borrar, o reducir a `A record of what happened. What it concerns may have changed since.` |

Marcas menores (sin tabla):
- `approvals/present.ts` `DECISION.not_allowed`: `The approval had already ended.` asume el motivo. `not_allowed` también puede ser un decide sobre algo no decidible.
- `ApprovalCard.svelte:97`: la tarjeta muestra el session id completo, la lista "Recently ended" usa `slice(0,8)`. Es una inconsistencia aceptada y comentada en el código.
- `shownOf` (`approvals/present.ts`): el comentario dice "N of M bytes shown", pero el texto real es `Preview truncated: {shown} of {total} bytes shown.`

## Todas las frases en inglés (ninguna es de Rust)

**`approvals/present.ts`**
- Estados: Pending, Approved, Denied, Cancelled, Expired, No longer applies, Outcome unknown.
- Tipos: Command, File change.
- Razones: Nobody decided it in time. / The execution lease of its turn expired. / The execution lease of its turn was revoked. / Its turn was cancelled. / Its turn ended. / Its session was closed. / Codex stopped while it waited. / The authority shut down while it waited. / The authority restarted while it waited. / It was approved, and the authority could not confirm what Codex did with that. / Codex asked for something that cannot be approved. / Codex acted outside what the session allows.
- Archivos: Add, Delete, Modify, Move.
- Títulos: Codex wants to run a command / Codex wants to change files / a file / {count} files.
- Otras: Session {id}, Asking the authority to approve it… / deny it…, It was not approved. / It was not denied.
- Errores de decisión: The console sent a request it should not have. Nothing changed. / The authority no longer has this approval. / The approval changed after it was shown. It has been read again. / The approval had already ended. / The authority denied it: the lease its turn was admitted under does not allow this action. / Codex is no longer there to answer. / The authority is busy with another operation. Try again in a moment. / The authority could not confirm what Codex did with the answer. Nothing is sent again by itself. / That request was already used for another decision. / This console and the authority speak different versions. / The authority did not answer, so it is not known whether the decision was taken. Retrying repeats the same decision: it cannot decide twice. / Something unexpected happened. Nothing is assumed to have changed.
- Lecturas fallidas: Approvals could not be read: the authority did not answer. / …The authority is busy; try again in a moment. / …Nothing is shown rather than something unverified.
- Preview truncated: {shown} of {total} bytes shown.

**`ApprovalCard.svelte`**
- Approval, session, turn, Command, Directory, Reading…, Show the rest, The rest of this change could not be read., {shown} of {total} files shown., Show more files, The authority no longer holds what this approval was about., Waits until, The authority checks the action again before anything runs., Retry, Dismiss, Approve, Deny, Read the whole change to approve it.

**`ApprovalsView.svelte`**
- Approvals, Connecting to the authority, Authority unavailable, Reading, {count} waiting for a decision, Refresh, Connecting to the authority…, The authority is unavailable, Approvals are read from the authority and cannot be decided until it is connected. Nothing is approved or denied in the meantime. Your local terminals keep working., Try again, Reading approvals…, Nothing is waiting for a decision., In Local Tools, every command and file change Codex proposes stops here until you approve or deny it. Inference sessions propose none., Pending approvals, Recently ended, Ended approvals, session, turn, Older approvals are not listed.

**`events/present.ts`**
- Filtros: All, Sessions, Runtime, Turns, Approvals, Security.
- Categorías: Session, Runtime, Turn, Approval, Lease, Authority.
- Marcas: Needs a look, Failed, Isolation.
- Alcances: bind a workspace, attach to Codex, start a turn, run approved commands, apply approved file changes.
- Salidas (EXIT):
  - Codex was not available to start. / The authority could not launch Codex. / The connection to Codex failed. / Codex did not answer in time when it started.
  - Codex did not speak the protocol the authority expects. / Codex asked for something this runtime is not allowed to answer.
  - Codex refused the configuration it was started with. / Codex refused the model catalog it was started with.
  - The Codex process ended. / The authority could not record what Codex was doing.
  - Codex acted outside what its isolation allows, and the authority stopped it. / The authority could not prove the isolation of the runtime, and did not let it run.
- Títulos:
  - Managed session prepared / closed, Session bound to a workspace, Session attached to Codex.
  - Workspace binding outcome unknown, Uncertain binding attempt discarded.
  - Codex runtime start accepted / stop accepted / request accepted.
  - Codex runtime ready / contained / stopped / ended unexpectedly.
  - Managed turn admitted / running / completed / interrupted / failed / outcome unknown, Turn cancellation requested.
  - Command approval requested, File change approval requested, Approval requested.
  - Approval accepted, Approved action confirmed by Codex, Approval denied / cancelled, Approval expired undecided, Approval no longer applies, Approval outcome unknown.
  - Execution lease granted / renewed / revoked / expired, Authority event.
- Sujetos: a command, the approved command, a file change, the approved file change, an action, the approved action.
- Detalles:
  - Turno: The authority admitted the turn under an execution lease. What was asked of Codex is not part of the record. / Codex took the turn and started working on it. / A cancel of the turn was recorded. / The authority recorded how the turn ended.
  - Aprobación: Codex proposed {about} and the authority held it for a decision. The proposal itself is not part of the record. / The approval of {about} was accepted and the answer was sent to Codex. / Codex reported what it did with {approved}. / The approval of {about} was denied. Nothing was run or changed for it. / The authority recorded how the approval ended.
  - Lease: {lead} It allowed the session to {scopes}. / The lease ended because its session was closed. / The lease was given back. / The lease reached its time limit. / The authority extended a lease for this session. / The authority granted a lease for this session.
  - Runtime: The authority accepted a request for the managed Codex runtime and recorded what it should be. / Codex {version} started, was checked and is ready. / Codex started, was checked and is ready. / {exit} The authority meant it to.
  - Sesión:
    - A managed session was created. It has no workspace until it is bound.
    - The session was closed. Closing is final.
    - The authority bound the session to a project folder. Which folder is not part of the record.
    - The session was attached to the Codex runtime that was running.
    - The authority could not confirm whether Codex created the workspace binding.
    - An uncertain binding attempt was given up on explicitly.
  - Authority: The authority recorded an event of a kind this version of the console does not know. Nothing else of it is shown.
- Inicio y errores:
  - This is the beginning of the event stream. / History before this point is unavailable.
  - Events could not be read: the authority did not answer. / …The authority is busy; try again in a moment. / The event history changed while it was being read. / …Nothing is shown rather than something unverified.
  - Older events could not be read: the authority holds another history than the one shown. The newest events were read again. / …the authority did not answer. / Older events could not be read.

**`EventsView.svelte`**
- Events, Events, newest first, Authority unavailable, Connecting to the authority, Reading, {count} loaded, newest first, {count} shown, Newest events, Refresh, Authority offline. Showing previously loaded history: it was read before the connection was lost and nothing newer is known., Showing previously loaded history. It is being read again., The authority restarted. It kept the same event stream: the history below continues, and what it ended on the way is recorded in it., Dismiss, Try again.
- Connecting to the authority…, The authority is unavailable, Events are the authority's own record and are read from it. Nothing is shown until it is connected. Your local terminals keep working., Reading events…, No events yet., The authority records every session, runtime, turn, approval and lease change it commits. Nothing has been recorded in this stream.
- Filter events, Turn {id}, Session {id}, Clear, Filters apply to the events loaded here, not to all of history., New events available, No loaded event matches., Reading…, Load older, Older events exist and are not loaded.
- New authority event stream, The events above belong to the stream the authority holds now. The ones below were read from another stream ( / ) and are not continued by them: positions of the two are unrelated., Events of an earlier stream.
- Event details, Hide details, Time, Kind, Session, Turn, Approval, Lease until, Position, in stream {id}.
- This record was read from a stream the authority no longer holds here. What it is about cannot be opened or read from this authority., This is a record of what happened then. What it may have changed since: that is read from the authority where it lives.
- Open session, Open in Agents, Show events of this turn / this session, Check what it is now, Open Approvals.
- Now:, The authority no longer holds what it was about., What it is about is shown in Approvals., Approval detail is no longer available. The record above is still what happened., The approval could not be read from the authority.

**Compartidas de otra carpeta (`agent/present.ts`, usadas por los detalles de turno):**
- Stopped at your request. / Its execution lease expired, so the authority stopped it. / Its execution lease was revoked, so the authority stopped it. / The session was closed while it ran. / Codex was stopped while it ran. / The authority shut down while it ran. / The authority restarted while it ran. What Codex did after that is not known. / Codex stopped unexpectedly. / Codex reported that the turn failed. / The authority could not confirm whether Codex received the turn. / Codex tried to act outside what this session allows, and the authority stopped it. / Codex did not confirm the cancel in time. What it did is not known. (Hay más claves en `agent/present.ts` después de la línea 55 que no leí.)

La frase de `EventsView.svelte:460` la cité resumida en la tabla. El texto exacto es "This is a record of what happened then. What it is about may have changed since: that is read from the authority where it lives."
