/** Spanish for the window's own text, area: native. Same rules as `es.ts`; merged into `ES`. */
export const ES_AREA: Readonly<Record<string, string>> = {
  ', effort {level}': ', esfuerzo {level}',
  '{action}. {reason}': '{action}. {reason}',
  '{action}. The authority refused to start Codex in Local Tools: it could not set up or prove the isolation that mode requires. Nothing runs without it.':
    '{action}. La autoridad rechazó iniciar Codex en Local Tools: no pudo preparar ni comprobar el aislamiento que ese modo exige. Nada corre sin él.',
  '{count} agent': '{count} agente',
  '{count} agents': '{count} agentes',
  '{count} processes': '{count} procesos',
  '{current} now, and the authority runs one Codex runtime. Activating this session restarts it in {to}, and the sessions attached to it are detached.':
    '{current} ahora, y la autoridad corre un solo runtime de Codex. Activar esta sesión lo reinicia en {to}, y las sesiones conectadas a él quedan desconectadas.',
  '{current} of {total}{suffix}': '{current} de {total}{suffix}',
  '{n} completed step(s)': '{n} paso(s) completado(s)',
  '{n} installed skill(s) switched off':
    '{n} skill(s) instalada(s) desactivada(s)',
  '{name} · not applied': '{name} · sin aplicar',
  '{on} on · {off} off': '{on} activas · {off} apagadas',
  '{prepared} prepared · {closed} closed':
    '{prepared} preparadas · {closed} cerradas',
  '{restart} {kept}': '{restart} {kept}',
  '↑{count} not pushed': '↑{count} sin subir',
  '● {count} changes not committed': '● {count} cambios sin commitear',
  '● 1 change not committed': '● 1 cambio sin commitear',
  '✓ all committed': '✓ todo commiteado',
  'A closed session cannot be resumed.':
    'Una sesión cerrada no se puede reanudar.',
  'A command before the start did not succeed ({result}); the agent started anyway.':
    'Un comando previo al inicio no tuvo éxito ({result}); el agente arrancó igual.',
  'A file of launch environments (environment.json for Claude, environment-codex.json for Codex) cannot be read, so what a preset leaves out is not known. Launches with a preset of that tool do not start until the file is fixed or removed. It was not changed.':
    'Un archivo de entornos de lanzamiento (environment.json de Claude o environment-codex.json de Codex) no se puede leer, así que no se sabe qué deja afuera cada preset. Los lanzamientos con un preset de esa herramienta no arrancan hasta que el archivo se arregle o se borre. No se modificó.',
  'A file of launch environments would be too long with this change, so it was not saved. Leave fewer things out, or delete presets you no longer use.':
    'Con este cambio, un archivo de entornos de lanzamiento quedaría demasiado largo, así que no se guardó. Dejá menos cosas afuera o borrá presets que ya no uses.',
  'A hook this preset leaves out is no longer in hooks.json: it was edited or removed. Nothing was started. Check the preset’s hooks and save it.':
    'Un hook que este preset deja afuera ya no está en hooks.json: se editó o se borró. No se inició nada. Revisá los hooks del preset y guardalo.',
  'A launch with a folder of its own cannot use your home folder as its project: your configuration (hooks, instructions, skills) would load anyway. Choose a project folder.':
    'Con una carpeta propia para este lanzamiento no se puede usar tu carpeta personal como proyecto: tu configuración (hooks, instrucciones, skills) se cargaría igual. Elegí una carpeta de proyecto.',
  'A launch with that name exists.': 'Ya hay un lanzamiento con ese nombre.',
  'A running session cannot be removed. Stop it first.':
    'No se puede quitar una sesión que corre. Detenela primero.',
  'A session created in {from} cannot be resumed in {to}.':
    'Una sesión creada en {from} no se puede reanudar en {to}.',
  'A start is already in progress.': 'Ya hay un inicio en curso.',
  'A tab holds at most {count} panes.':
    'Una pestaña admite hasta {count} paneles.',
  'A turn is running, and the runtime it runs on is not restarted under it. Wait for it or cancel it.':
    'Hay un turno en curso y el runtime en el que corre no se reinicia por debajo. Esperá a que termine o cancelalo.',
  'a workspace': 'un workspace',
  'Accept edits': 'Aceptar ediciones',
  Activate: 'Activar',
  'Activate {name}': 'Activar {name}',
  'Activate binds a project folder and attaches the session to Codex.':
    'Activar asocia una carpeta de proyecto y conecta la sesión a Codex.',
  'Activate session': 'Activar sesión',
  'Activation outcome uncertain': 'Resultado de la activación incierto',
  'Activation outcome uncertain: the authority could not confirm whether Codex created the workspace binding. Nothing is sent again by itself.':
    'Resultado de la activación incierto: la autoridad no pudo confirmar si Codex creó la asociación de workspace. Nada se vuelve a enviar por sí solo.',
  Active: 'Activa',
  agent: 'agente',
  Agent: 'Agente',
  'Agent exited': 'El agente terminó',
  'Agents cannot be started here': 'Los agentes no se pueden iniciar aquí',
  'Agents started from the Console': 'Agentes iniciados desde la Console',
  Arsenal: 'Arsenal',
  'Arsenal does not read this project folder, so its selection cannot be applied here.':
    'Arsenal no lee esta carpeta de proyecto, así que su selección no se puede aplicar acá.',
  'As configured': 'Como está configurado',
  'Ask before acting': 'Preguntar antes de actuar',
  'Attaching…': 'Conectando…',
  'Authority unavailable': 'Autoridad no disponible',
  Binding: 'Asociando',
  'Bound to a workspace and attached to the running agent.':
    'Asociada a un workspace y conectada al agente en ejecución.',
  'Bound to a workspace and not attached to the running agent.':
    'Asociada a un workspace y no conectada al agente en ejecución.',
  Branch: 'Rama',
  'Brief (Markdown, starts with “# ”)': 'Brief (Markdown, empieza con “# ”)',
  'bytes received:': 'bytes recibidos:',
  Cancel: 'Cancelar',
  cancelled: 'cancelado(s)',
  Cancelled: 'Cancelada',
  'Capability evidence and limits': 'Evidencia y límites de capacidades',
  Change: 'Cambiar',
  'Change folder': 'Cambiar carpeta',
  Check: 'Verificar',
  'Check again': 'Revisar de nuevo',
  'Checked {date}.': 'Verificado el {date}.',
  'Checking what this permission would pass…':
    'Comprobando qué pasaría este permiso…',
  'Checking…': 'Verificando…',
  'Choose folder': 'Elegir carpeta',
  'Choose…': 'Elegir…',
  Close: 'Cerrar',
  'Close {name}': 'Cerrar {name}',
  'Close search': 'Cerrar búsqueda',
  'Close session': 'Cerrar sesión',
  'Close the pane': 'Cerrar el panel',
  'Close this session? It cannot be reopened, and its execution lease is revoked.':
    '¿Cerrar esta sesión? No se puede reabrir, y su concesión de ejecución queda revocada.',
  closed: 'cerrada',
  Closed: 'Cerrada',
  closing: 'cerrando',
  'Closing session…': 'Cerrando la sesión…',
  'Closing terminal…': 'Cerrando terminal…',
  'Closing this window': 'Cerrar esta ventana',
  'Codex did not come up in that mode. The runtime is as the authority reports it.':
    'Codex no arrancó en ese modo. El runtime queda como lo informa la autoridad.',
  'Codex is not ready, so the session could not be bound or attached.':
    'Codex no está listo, así que la sesión no se pudo asociar ni conectar.',
  'Codex may propose commands and file changes in this folder. Each one waits for your approval.':
    'Codex puede proponer comandos y cambios de archivos en esta carpeta. Cada uno espera tu aprobación.',
  'Codex refused the request.': 'Codex rechazó la solicitud.',
  'Codex refused to resume this session in that mode. A session resumes only in the mode it was created in. The runtime now runs in the mode that was asked for.':
    'Codex rechazó reanudar esta sesión en ese modo. Una sesión solo se reanuda en el modo en que se creó. El runtime ahora corre en el modo que se pidió.',
  'Codex refused to resume this session. A session resumes only in the mode it was created in: if Codex runs in the other one now, change the mode for this session instead.':
    'Codex rechazó reanudar esta sesión. Una sesión solo se reanuda en el modo en que se creó: si Codex corre ahora en el otro, cambiá el modo de esta sesión.',
  'Codex runs in Inference': 'Codex corre en Inference',
  'Codex runs in Local Tools for {folder}':
    'Codex corre en Local Tools para {folder}',
  'configuration did not match': 'la configuración no coincide',
  'configuration not checked yet': 'configuración sin verificar todavía',
  'configuration not verifiable': 'la configuración no se puede verificar',
  'configuration verified': 'configuración verificada',
  'Confirm close': 'Confirmar cierre',
  'Confirm discard': 'Confirmar descarte',
  'Confirm lingering': 'Confirmar lingering',
  'Confirm mode': 'Confirmar modo',
  'Connecting to the authority': 'Conectando con la autoridad',
  'Connecting to the authority…': 'Conectando con la autoridad…',
  'Could not check what this permission would pass. Refresh Native before starting.':
    'No se pudo comprobar qué pasaría este permiso. Actualizá Native antes de iniciar.',
  'Could not check what this permission would pass. Start stays disabled until a fresh check succeeds.':
    'No se pudo comprobar qué pasaría este permiso. Iniciar sigue deshabilitado hasta que una comprobación nueva funcione.',
  'Create & activate': 'Crear y activar',
  'Create a session to let Wyss supervise Codex in one of your projects.':
    'Creá una sesión para que Wyss supervise Codex en uno de tus proyectos.',
  Created: 'Creada',
  'Creating workspace binding…': 'Creando la asociación de workspace…',
  'Cwd:': 'Directorio:',
  'Delegated agents': 'Agentes delegados',
  Delegation: 'Delegación',
  Delete: 'Borrar',
  'Delete {name}?': '¿Borrar {name}?',
  'Deleting…': 'Borrando…',
  Detached: 'Desconectada',
  'detached HEAD': 'HEAD suelta',
  'Did not start': 'No arrancó',
  'Discard attempt': 'Descartar intento',
  'Discard the uncertain attempt? The authority records that it was abandoned and stops holding the session for it. If Codex did create a thread for that attempt, the empty thread is left behind. The session can then be activated again.':
    '¿Descartar el intento incierto? La autoridad registra que se abandonó y deja de retener la sesión por él. Si Codex sí creó un hilo para ese intento, el hilo vacío queda. Después la sesión se puede volver a activar.',
  'Discarding the uncertain attempt…': 'Descartando el intento incierto…',
  Dismiss: 'Descartar',
  done: 'terminado(s)',
  Done: 'Listo',
  'Edit in Arsenal': 'Editar en Arsenal',
  'effort not reported': 'esfuerzo no informado',
  'Enable Local Tools': 'Habilitar Local Tools',
  'Enable Local Tools for {name}?': '¿Habilitar Local Tools para {name}?',
  'ended {time}': 'terminó {time}',
  'Ended by a signal': 'Terminada por una señal',
  Ends: 'Termina',
  Events: 'Eventos',
  'Every other key goes to the program in the terminal.':
    'Cualquier otra tecla va al programa de la terminal.',
  exited: 'terminó',
  'Exited (0)': 'Terminó (0)',
  failed: 'falló',
  Failed: 'Falló',
  'Failed ({code})': 'Falló ({code})',
  Files: 'Archivos',
  'Files in {folder}': 'Archivos en {folder}',
  Folder: 'Carpeta',
  'for a reason this app does not know': 'por un motivo que esta app no conoce',
  'for a safety reason it named': 'por un motivo de seguridad que nombró',
  'From {provider} session {id}': 'Desde la sesión de {provider} {id}',
  'Full access': 'Acceso total',
  'Full access: the agent asks nothing and runs every command and edit without a sandbox, with your account’s rights.':
    'Acceso total: el agente no pregunta nada y ejecuta cada comando y cada edición sin sandbox, con los permisos de tu cuenta.',
  'Go to that tab': 'Ir a esa pestaña',
  'Hand off {agent}’s work': 'Traspasar el trabajo de {agent}',
  'Hand off to another agent': 'Traspasar el trabajo a otro agente',
  'Hand off…': 'Transferir…',
  'Hermes Native does not have a verified interactive handoff argument. It was not started with this brief.':
    'Hermes Native no tiene un argumento de traspaso interactivo verificado. No se inició con este brief.',
  'Hermes Native is a full-account provider session. Its approval prompts and hooks are not a Wyss security boundary. Hermes planner admission is separately blocked pending tested OS isolation. The installed version is not probed because Hermes version output performs an update check.':
    'Hermes Native es una sesión de proveedor con toda la cuenta. Sus avisos de aprobación y sus hooks no son una frontera de seguridad de Wyss. La admisión del planificador de Hermes está bloqueada aparte hasta probar un aislamiento del sistema. La versión instalada no se sondea, porque la salida de versión de Hermes hace una comprobación de actualización.',
  'Hermes Native remains available as a separate interactive provider. It is omitted here because its pinned CLI does not expose a verified reviewed first-message interface without entering an effectful one-shot mode.':
    'Hermes Native sigue disponible como proveedor interactivo aparte. Acá se omite porque su CLI fijada no expone una interfaz de primer mensaje verificada y revisada sin entrar en un modo de una sola ejecución con efectos.',
  'Hide details': 'Ocultar detalles',
  'Home · {path}': 'Inicio · {path}',
  'How to change the model in a running session is not verified, so none is suggested.':
    'No está verificado cómo cambiar el modelo en una sesión en curso, así que no se sugiere ninguno.',
  'How to change the model of a running Codex session is not verified, so none is suggested.':
    'No está verificado cómo cambiar el modelo de una sesión de Codex en curso, así que no se sugiere ninguno.',
  in: 'en',
  'Input could not be written to the terminal.':
    'No se pudo escribir la entrada en la terminal.',
  installed: 'instalado',
  'Interface: {interface}. Format: {format}. Scope: {scope}.':
    'Interfaz: {interface}. Formato: {format}. Alcance: {scope}.',
  interrupted: 'interrumpido',
  Interrupted: 'Interrumpido',
  'Keep it': 'Conservarlo',
  'Keep open': 'Mantenerla abierta',
  'Keep running': 'Seguir corriendo',
  'Keep terminals after logout…':
    'Mantener las terminales después de cerrar sesión…',
  'Keeps running': 'Sigue corriendo',
  'Keyboard shortcuts': 'Atajos de teclado',
  Launch: 'Lanzar',
  'Launch name': 'Nombre del lanzamiento',
  'Launch saved as “{name}”. Find it in Launch ▾.':
    'Lanzamiento guardado como “{name}”. Está en Launch ▾.',
  Launches: 'Lanzamientos',
  'Leaving a terminal (detach)': 'Salir de una terminal (desconectar)',
  'Let it hand tasks to Claude Code and Codex through Wyss (2 agents at a time, 20 minutes each, writes only in the workspace).':
    'Permitir que pase tareas a Claude Code y Codex a través de Wyss (de a 2 agentes a la vez, 20 minutos cada uno, escribe solo en el workspace).',
  'Limit: {limit}.': 'Límite: {limit}.',
  'Lingering is off for your account.':
    'Lingering está desactivado para tu cuenta.',
  'Lingering is on for your account.':
    'Lingering está activado para tu cuenta.',
  'Lingering keeps your user session manager running after you log out. It is {state}. The Console never turns it on by itself.':
    'Lingering mantiene el administrador de tu sesión de usuario corriendo después de cerrar sesión. Está {state}. La Consola nunca lo activa por sí sola.',
  'Local terminal workspace': 'Terminales locales',
  'Local Tools for this folder': 'Local Tools para esta carpeta',
  'Local Tools gives Codex more to work with, not more authority: every command and file change waits for your approval. The authority runs one Codex runtime, in one mode and for one folder at a time.':
    'Local Tools le da a Codex más con qué trabajar, no más autoridad: cada comando y cambio de archivo espera tu aprobación. La autoridad corre un solo runtime de Codex, en un modo y para una carpeta a la vez.',
  'Locking the screen': 'Bloquear la pantalla',
  'Logging out, lingering off': 'Cerrar sesión, con lingering desactivado',
  'Logging out, lingering on': 'Cerrar sesión, con lingering activado',
  'Longer than 16 KiB: shorten it.': 'Más de 16 KiB: acortalo.',
  'Looking for your agents…': 'Buscando tus agentes…',
  Lost: 'Perdida',
  'Managed sessions': 'Sesiones Managed',
  'Match case': 'Distinguir mayúsculas',
  Mode: 'Modo',
  'Model in use: {model}{effort} (reported by the runtime when the session was resumed)':
    'Modelo en uso: {model}{effort} (informado por el runtime cuando la sesión se reanudó)',
  'Model in use: {model}{effort} (reported by the runtime when the session was started)':
    'Modelo en uso: {model}{effort} (informado por el runtime cuando la sesión se inició)',
  'Model in use: {model}{effort} (the runtime said it rerouted a turn from {from}, {reason}; whether later turns stay on it is not documented)':
    'Modelo en uso: {model}{effort} (el runtime dijo que redirigió un turno desde {from}, {reason}; no está documentado si los turnos siguientes siguen en él)',
  'Model in use: not known while detached':
    'Modelo en uso: no se conoce mientras está desconectada',
  'Model in use: not reported by the runtime':
    'Modelo en uso: el runtime no lo informó',
  'Model: set in its files {configured} · in use: {inUse} · Effort: set in its files {configuredEffort}':
    'Modelo: en sus archivos {configured} · en uso: {inUse} · Esfuerzo: en sus archivos {configuredEffort}',
  'More than one preset is named “{name}” for this agent. Delete the extra ones in Arsenal, then start again.':
    'Hay más de un preset llamado “{name}” para este agente. Borra los sobrantes en Arsenal y vuelve a iniciar.',
  'Move {name} down': 'Mover {name} hacia abajo',
  'Move {name} up': 'Mover {name} hacia arriba',
  'Move to the pane in that direction': 'Ir al panel en esa dirección',
  'Native · {agent}': 'Nativa · {agent}',
  'Native plane': 'Plano Native',
  'Native sessions': 'Sesiones Native',
  "Native sessions: the provider's own tools, configuration and privileges stay active. The Console does not mediate, contain or approve their effects.":
    'Sesiones Native: las herramientas, la configuración y los privilegios del proveedor siguen activos. La Console no media, contiene ni aprueba sus efectos.',
  new: 'nueva',
  'New Local Tools session': 'Nueva sesión de Local Tools',
  'New managed session': 'Nueva sesión Managed',
  'New session': 'Nueva sesión',
  'New terminal': 'Nueva terminal',
  'New terminal in a new tab': 'Nueva terminal en una pestaña nueva',
  Newer: 'Más nuevas',
  'Newest sessions': 'Sesiones más nuevas',
  'Next and previous pane': 'Panel siguiente y anterior',
  'Next and previous tab': 'Pestaña siguiente y anterior',
  'Next match': 'Coincidencia siguiente',
  'No agent sessions yet': 'Todavía no hay sesiones de agentes',
  'No folder selected': 'Ninguna carpeta elegida',
  'no git': 'sin git',
  'No launches. Add a file in {folder}.':
    'No hay lanzamientos. Agregá un archivo en {folder}.',
  'No managed sessions yet.': 'Todavía no hay sesiones Managed.',
  'No matches': 'Sin coincidencias',
  'No preset named “{name}” for this agent. Create it in Arsenal, or change the launch file.':
    'No hay un preset llamado “{name}” para este agente. Créalo en Arsenal o cambia el archivo del lanzamiento.',
  'No presets for {agent}.': 'No hay presets para {agent}.',
  'No PTY created.': 'No se creó ningún PTY.',
  'No saved launches yet.': 'Todavía no hay lanzamientos guardados.',
  'No terminals open.': 'No hay terminales abiertas.',
  'No workspace': 'Sin workspace',
  'No workspace is bound to this session.':
    'Esta sesión no tiene un workspace asociado.',
  None: 'Ninguna',
  'None — all installed skills': 'Ninguno — todas las skills instaladas',
  'none of your own': 'ninguna propia',
  'None yet. A Claude Code or Codex session started with delegation on can give a task to the other one.':
    'Todavía no hay ninguno. Una sesión de Claude Code o Codex iniciada con delegación activada puede darle una tarea a la otra.',
  'Not attached': 'Sin conectar',
  'Not certain here': 'No está claro acá',
  'Not installed': 'No instalada',
  'not observed by this provider configuration view':
    'no lo observa esta vista de configuración del proveedor',
  'not read yet (open Configuration)': 'todavía sin leer (abre Configuración)',
  'not reported by the agent': 'el agente no lo informa',
  'not set in its files': 'sin fijar en sus archivos',
  'not something this system lets the Console read':
    'algo que este sistema no deja leer a la Consola',
  'Observed:': 'Observado:',
  off: 'desactivado',
  Older: 'Más viejas',
  'Older sessions · page {page}': 'Sesiones más viejas · página {page}',
  on: 'activado',
  'Only the first 2,000 sessions can be listed.':
    'Solo se pueden listar las primeras 2.000 sesiones.',
  Open: 'Abrir',
  'Open agent': 'Abrir agente',
  'OpenCode and Hermes are blocked: the Console could not confirm its private M9 session store, because a read or a write failed. Claude Code and Codex stay available where the Console allows them.':
    'OpenCode y Hermes están bloqueados: la Console no pudo confirmar su almacén privado de sesiones M9, porque falló una lectura o una escritura. Claude Code y Codex siguen disponibles donde la Console los permite.',
  'OpenCode and Hermes wait until the Console confirms its private M9 session store again.':
    'OpenCode y Hermes esperan a que la Console vuelva a confirmar su almacén privado de sesiones M9.',
  Order: 'Orden',
  other: 'otro(s)',
  'Output replayed · no screen state was kept':
    'Salida reproducida · no se guardó estado de pantalla',
  'Output truncated': 'Salida recortada',
  'Output was missed while the screen was kept':
    'Se perdió salida mientras se guardaba la pantalla',
  Permissions: 'Permisos',
  'PID (observed):': 'PID (observado):',
  Prepared: 'Preparada',
  'Preparing session…': 'Preparando la sesión…',
  'Preparing the brief…': 'Preparando el brief…',
  Preset: 'Preset',
  'Preset {name}': 'Preset {name}',
  'Preset: {name}': 'Preset: {name}',
  'Previous match': 'Coincidencia anterior',
  'process {pid}': 'proceso {pid}',
  'Profile {name}': 'Perfil {name}',
  Project: 'Proyecto',
  'Project folder': 'Carpeta del proyecto',
  'PTY diagnostic — Sprint 1A': 'Diagnóstico de PTY — Sprint 1A',
  'PTY smoke failed; backend cleanup requested.':
    'La prueba de PTY falló; se pidió limpiar el backend.',
  'PTY smoke PASS — create, input, output, resize, close.':
    'Prueba de PTY APROBADA — crear, escribir, leer, cambiar tamaño, cerrar.',
  'Read only': 'Solo lectura',
  'Reading launches…': 'Leyendo lanzamientos…',
  'Reading sessions…': 'Leyendo sesiones…',
  'Reading…': 'Leyendo…',
  Ready: 'Listo',
  'Ready: attached to the running agent.':
    'Lista: conectada al agente en ejecución.',
  'Reboot or power-off': 'Reinicio o apagado',
  Refresh: 'Actualizar',
  'Reload: {reload}.': 'Recarga: {reload}.',
  Remove: 'Quitar',
  'Remove finished': 'Quitar terminadas',
  Replace: 'Reemplazar',
  Restart: 'Reiniciar',
  'restart {count}': 'reinicio {count}',
  'Restart Codex & activate': 'Reiniciar Codex y activar',
  Restarting: 'Reiniciando',
  Result: 'Resultado',
  Resume: 'Reanudar',
  'Resume has to wait until the workspace binding is settled.':
    'Reanudar tiene que esperar a que la asociación de workspace esté definida.',
  'Resume needs a workspace bound to the session.':
    'Reanudar necesita un workspace asociado a la sesión.',
  'Resuming session…': 'Reanudando la sesión…',
  Retry: 'Reintentar',
  'Retry preview': 'Reintentar vista previa',
  Revision: 'Revisión',
  'Run PTY smoke': 'Ejecutar prueba de PTY',
  running: 'en curso',
  Running: 'En ejecución',
  'Running PTY smoke…': 'Ejecutando prueba de PTY…',
  'Runs “{command}” in a new terminal':
    'Ejecuta “{command}” en una terminal nueva',
  Runtime: 'Runtime',
  'Save as launch': 'Guardar como lanzamiento',
  'Save as launch…': 'Guardar como lanzamiento…',
  'Save launch': 'Guardar lanzamiento',
  'Save to a file…': 'Guardar en un archivo…',
  'Saved launches': 'Lanzamientos guardados',
  'Saving…': 'Guardando…',
  'Screen parser restarting': 'Reiniciando el analizador de pantalla',
  'Screen parser unavailable': 'Analizador de pantalla no disponible',
  'Screen rebuilt from the end of the output · {count} KiB before it is not included':
    'Pantalla reconstruida desde el final de la salida · {count} KiB anteriores no están incluidos',
  'Screen restored · {count} KiB of output was missed while it was kept':
    'Pantalla restaurada · se perdieron {count} KiB de salida mientras se guardaba',
  'Screen restored · {count} older lines not shown':
    'Pantalla restaurada · {count} líneas anteriores no se muestran',
  'Search the pane’s scrollback':
    'Buscar en el historial de desplazamiento del panel',
  'Search this terminal': 'Buscar en esta terminal',
  'Search…': 'Buscar…',
  'Selection: {name}': 'Selección: {name}',
  Session: 'Sesión',
  'Session {id}': 'Sesión {id}',
  'Session details': 'Detalles de la sesión',
  'session of the agent you choose, in the same folder, with the text below as its first message. It is not a transfer: the new agent has only this text and the files, not {agent}’s context, and nothing is moved or ended. Read it and change it before starting. Secrets found in it were removed.':
    'sesión del agente que elegís, en la misma carpeta, con el texto de abajo como primer mensaje. No es un traspaso: el agente nuevo tiene solo este texto y los archivos, no el contexto de {agent}, y no se mueve ni se termina nada. Leelo y cambialo antes de iniciar. Los secretos que había en él se quitaron.',
  'Session storage is busy. Readiness could not be checked; it will be retried.':
    'El almacenamiento de sesiones está ocupado. No se pudo verificar la disponibilidad; se volverá a intentar.',
  Sessions: 'Sesiones',
  'Sessions are read from the authority and cannot be created, activated, resumed or closed until it is connected. The Console keeps working.':
    'Las sesiones se leen de la autoridad y no se pueden crear, activar, reanudar ni cerrar hasta que esté conectada. La consola sigue funcionando.',
  'Sessions could not be read: the authority did not answer.':
    'No se pudieron leer las sesiones: la autoridad no respondió.',
  'Sessions could not be read. {reason}':
    'No se pudieron leer las sesiones. {reason}',
  'Sessions could not be read. Nothing is shown rather than something unverified.':
    'No se pudieron leer las sesiones. No se muestra nada en lugar de algo no verificado.',
  'Sessions in {folder}': 'Sesiones en {folder}',
  'Shell exited': 'El shell terminó',
  'Shell:': 'Shell:',
  'Show terminal': 'Mostrar terminal',
  'Skill exclusion is not qualified for this exact Codex build, so nothing was started with it. Start without applying the selection, or use a qualified Codex build.':
    'Sacar skills no está calificado para esta versión exacta de Codex, así que no se inició nada con eso. Arrancá sin aplicar la selección o usá una versión de Codex calificada.',
  Skills: 'Skills',
  'Something unexpected happened. Nothing is assumed to have changed.':
    'Pasó algo inesperado. No se asume que haya cambiado nada.',
  'Something went wrong in the desktop.': 'Algo salió mal en el escritorio.',
  'Source: {source}.': 'Fuente: {source}.',
  'Split one above the other': 'Dividir una arriba de la otra',
  'Split side by side': 'Dividir lado a lado',
  'Split side by side (Ctrl+Shift+D)': 'Dividir lado a lado (Ctrl+Shift+D)',
  'Split the pane side by side': 'Dividir el panel lado a lado',
  'Split the pane, one above the other':
    'Dividir el panel, una arriba de la otra',
  'Split, one above the other (Ctrl+Shift+E)':
    'Dividir, una arriba de la otra (Ctrl+Shift+E)',
  Start: 'Iniciar',
  'Start {agent}': 'Iniciar {agent}',
  'Start {agent} with this brief': 'Iniciar {agent} con este brief',
  'Start {count} lost sessions again':
    'Iniciar de nuevo {count} sesiones perdidas',
  'Start again': 'Iniciar de nuevo',
  'Start an agent': 'Iniciar un agente',
  'Start one above. It opens in the Console as a terminal tab.':
    'Inicia una arriba. Se abre en la Console como una pestaña de terminal.',
  'Start the lost session again': 'Iniciar de nuevo la sesión perdida',
  'started {date}': 'iniciada {date}',
  'Started by the Console in your shell. Not mediated, contained or approved by the Console.':
    'Iniciada por la Consola en tu shell. La Consola no la media, no la contiene ni la aprueba.',
  'started directly': 'iniciada directamente',
  'Started with {name} applied.': 'Iniciado con {name} aplicado.',
  'Started with {selection} applied.': 'Iniciado con {selection} aplicado.',
  'Started without applying {name}; the selection is recorded.':
    'Iniciado sin aplicar {name}; la selección queda registrada.',
  'Started without applying {selection}; the selection is recorded.':
    'Iniciado sin aplicar {selection}; la selección queda registrada.',
  starting: 'iniciando',
  Starting: 'Iniciando',
  'Starting agent…': 'Iniciando agente…',
  'Starting Codex in {mode}…': 'Iniciando Codex en {mode}…',
  'Starting Codex…': 'Iniciando Codex…',
  'Starting terminal…': 'Iniciando terminal…',
  'Starting…': 'Iniciando…',
  'Starts directly with the Console’s own environment.':
    'Inicia directamente con el entorno propio de la Console.',
  'Starts through your shell ({family}): same environment as typing the command yourself.':
    'Inicia a través de tu shell ({family}): mismo entorno que si escribieras el comando vos mismo.',
  'State:': 'Estado:',
  Stop: 'Detener',
  'Stop agent': 'Detener agente',
  'Stop this agent? Its unfinished work is lost.':
    '¿Detener este agente? Su trabajo sin terminar se pierde.',
  Stopped: 'Detenida',
  'Stopping the managed runtime…': 'Deteniendo el runtime administrado…',
  'Stopping…': 'Deteniendo…',
  'Suspend and resume': 'Suspender y reanudar',
  'Temporary backend smoke test. No terminal renderer. Preview capped at 8,192 characters.':
    'Prueba de humo temporal del backend. Sin renderer de terminal. La vista previa se limita a 8.192 caracteres.',
  Terminal: 'Terminal',
  'Terminal closed': 'Terminal cerrada',
  'Terminal commands · {folder}': 'Comandos de terminal · {folder}',
  'Terminal failed: {reason}': 'La terminal falló: {reason}',
  'Terminal limit reached ({count}). Close a terminal to create another.':
    'No se puede crear otra terminal: se alcanzó el límite de {count}. Es necesario cerrar una terminal.',
  'Terminal limit reached ({count}). Close a terminal to open another.':
    'Se alcanzó el límite de terminales ({count}). Hace falta cerrar una para abrir otra.',
  'Terminal sessions': 'Sesiones de terminal',
  'Terminal tools': 'Herramientas de terminal',
  'TerminalId:': 'Id de terminal:',
  Terminals: 'Terminales',
  'Terminals after the window closes':
    'Terminales después de cerrar la ventana',
  'Text only. Codex is offered no tool.':
    'Solo texto. No se le ofrece ninguna herramienta a Codex.',
  'That agent is not installed on this computer.':
    'Ese agente no está instalado en esta computadora.',
  'That Arsenal selection no longer exists.':
    'Esa selección de Arsenal ya no existe.',
  'That folder cannot be used: its path is too long or cannot be written as text.':
    'Esa carpeta no se puede usar: su ruta es demasiado larga o no se puede escribir como texto.',
  'That folder cannot be used. Choose a folder with the folder button.':
    'Esa carpeta no se puede usar. Elegí una carpeta con el botón de carpeta.',
  'That input was not sent: with what is already waiting it is more than a terminal holds (64 KiB). Nothing of it reached the program; what was waiting before it still goes.':
    'Esa entrada no se envió: con lo que ya está esperando, supera lo que cabe en una terminal (64 KiB). Nada de ella llegó al programa; lo que esperaba antes sigue su curso.',
  'That request was already used for something else. Try again.':
    'Esa solicitud ya se usó para otra cosa. Probá de nuevo.',
  'That session is not known any more.': 'Esa sesión ya no está registrada.',
  'That session is not running.': 'Esa sesión no está corriendo.',
  'The agent could not be started.': 'No se pudo iniciar el agente.',
  'The agent refused to resume this session.':
    'El agente rechazó reanudar esta sesión.',
  'The agent runtime is not ready, so there is nothing to attach to.':
    'El runtime del agente no está listo, así que no hay a qué conectarse.',
  'The agent’s process is alive in its terminal.':
    'El proceso del agente está vivo en su terminal.',
  'The Arsenal library or the installed skills could not be read, so nothing was started with the selection.':
    'No se pudo leer la biblioteca de Arsenal ni las skills instaladas, así que no se inició nada con la selección.',
  'The Arsenal plan changed since it was shown: the library, the installed skills or the provider build moved. Review the new plan and start again.':
    'El plan de Arsenal cambió desde que se mostró: cambiaron la biblioteca, las skills instaladas o la versión del proveedor. Revisá el plan nuevo y volvé a iniciar.',
  'The Arsenal plan has items that cannot be carried or names a skill that is not installed, so nothing was started with it.':
    'El plan de Arsenal tiene elementos que no se pueden llevar o nombra una skill que no está instalada, así que no se inició nada con él.',
  'The attempt was not discarded': 'El intento no se descartó',
  'The authority asked Codex to bind a workspace and could not confirm what Codex did. Nothing asks again by itself: a second request could create a second thread.':
    'La autoridad le pidió a Codex asociar un workspace y no pudo confirmar qué hizo. Nada vuelve a pedirlo por sí solo: una segunda solicitud podría crear un segundo hilo.',
  'The authority could not confirm what the agent did. Check the session before trying again.':
    'La autoridad no pudo confirmar qué hizo el agente. Revisá la sesión antes de volver a intentarlo.',
  'The authority could not confirm whether the workspace binding was created.':
    'La autoridad no pudo confirmar si se creó la asociación de workspace.',
  'The authority decides whether the folder can be a workspace, starts Codex if it is not running, and binds the session to it. A session keeps the mode it is created in.':
    'La autoridad decide si la carpeta puede ser un workspace, arranca Codex si no está corriendo y asocia la sesión a él. Una sesión conserva el modo con el que se creó.',
  'The authority denied it because the agent runtime is not ready.':
    'La autoridad lo denegó porque el runtime del agente no está listo.',
  'The authority denied it: no execution lease allows this for the session.':
    'La autoridad lo denegó: ninguna concesión de ejecución permite esto para la sesión.',
  'The authority did not accept that folder as a workspace. Nothing was bound.':
    'La autoridad no aceptó esa carpeta como workspace. No se asoció nada.',
  'The authority did not answer, so the result is unknown. Retrying repeats the same request safely.':
    'La autoridad no respondió, así que el resultado es desconocido. Reintentar repite la misma solicitud sin riesgo.',
  'The authority holds no uncertain attempt for this session any more.':
    'La autoridad ya no tiene ningún intento incierto para esta sesión.',
  'The authority is binding a workspace to this session.':
    'La autoridad está asociando un workspace a esta sesión.',
  'The authority is busy with another operation. Try again in a moment.':
    'La autoridad está ocupada con otra operación. Probá de nuevo en un momento.',
  'The authority is unavailable': 'La autoridad no está disponible',
  'The authority no longer has this session.':
    'La autoridad ya no tiene esta sesión.',
  'The authority refused to start Codex.':
    'La autoridad rechazó iniciar Codex.',
  'The authority refused: the session no longer allows it.':
    'La autoridad rechazó: la sesión ya no lo permite.',
  "The authority reports a session's mode while it is attached.":
    'La autoridad informa el modo de la sesión mientras está conectada.',
  'The brief must start with a “# ” heading, hold no NUL and be at most 16 KiB.':
    'El brief tiene que empezar con un encabezado “# ”, no tener NUL y pesar 16 KiB como máximo.',
  'The combined global instructions and role are too long for Codex. Nothing was started.':
    'Las instrucciones globales y el rol juntos son demasiado largos para Codex. No se inició nada.',
  'The Console could not record this start, so a process may exist. Check the sessions below. Nothing is started again automatically, and OpenCode and Hermes wait until the store is confirmed.':
    'La consola no pudo registrar este inicio, así que puede existir un proceso. Revisá las sesiones de abajo. No se vuelve a iniciar nada solo, y OpenCode y Hermes esperan hasta que se confirme el almacenamiento.',
  'The Console could not write its own state.':
    'La consola no pudo escribir su propio estado.',
  'The Console has no private folder to keep native sessions in, so it cannot start agents.':
    'La consola no tiene una carpeta privada donde guardar las sesiones nativas, así que no puede iniciar agentes.',
  'The console sent a request it should not have. Nothing changed.':
    'La consola envió un pedido que no debía enviar. No cambió nada.',
  'The Console was restarted and did not see how it ended. Its terminal went with the window, so it is not running.':
    'La consola se reinició y no vio cómo terminó. Su terminal se fue con la ventana, así que no está corriendo.',
  'The desktop did not answer. Nothing was started.':
    'El escritorio no respondió. No se inició nada.',
  'The file could not be written.': 'No se pudo escribir el archivo.',
  'The folder dialog could not be opened.':
    'No se pudo abrir el diálogo de carpetas.',
  'The folder dialog is already open.':
    'El diálogo de carpetas ya está abierto.',
  'The folder of this launch could not be prepared, so nothing was started. Your own configuration was not changed. Try again; if it keeps failing, save the launch again in Workspace.':
    'No se pudo preparar la carpeta de este lanzamiento, así que no se inició nada. Tu configuración no se tocó. Probá de nuevo; si sigue fallando, guardá el lanzamiento otra vez en Workspace.',
  'The folder to start in does not exist or cannot be opened.':
    'La carpeta de inicio no existe o no se puede abrir.',
  'The host did not confirm the last input: it may or may not have reached the program. It was not sent again, and input still waiting was dropped. Check the screen before typing on.':
    'El host no confirmó la última entrada: puede que haya llegado al programa o no. No se volvió a enviar, y la entrada que seguía esperando se descartó. Revisá la pantalla antes de seguir escribiendo.',
  'The host had no screen for this terminal ({reason}), so what it kept of the output was replayed and the program was asked to draw again.':
    'El host no tenía pantalla para esta terminal ({reason}), así que lo que guardó de la salida se reprodujo y se le pidió al programa que volviera a dibujar.',
  'The host stopping or crashing': 'El host se detiene o se cae',
  'The launch “{name}” leaves out a hook that is no longer in hooks.json: it was edited or removed. Nothing was started. Open the launch in Workspace, check its hooks and save.':
    'El lanzamiento “{name}” deja afuera un hook que ya no está en hooks.json: se editó o se borró. No se inició nada. Abrí el lanzamiento en Workspace, revisá sus hooks y guardá.',
  'The launch could not be deleted.': 'No se pudo borrar el lanzamiento.',
  'The launch could not be opened.': 'No se pudo abrir el lanzamiento.',
  'The launch could not be saved.': 'No se pudo guardar el lanzamiento.',
  'The launch instructions file (role-instructions.json) cannot be read. Launches with custom instructions do not start. The file was not changed.':
    'No se puede leer el archivo de instrucciones de lanzamiento (role-instructions.json). Los lanzamientos con instrucciones propias no arrancan. El archivo no se modificó.',
  'The limit of open terminals was reached. Close one first.':
    'Se alcanzó el límite de terminales abiertas. Cerrá una primero.',
  'The parser that keeps this screen was restarted and only the output the host still held was replayed into it. State set earlier (an alternate screen, a mode) may be missing until the program draws again.':
    'Se reinició el analizador que guarda esta pantalla y solo se reprodujo en él la salida que todavía tenía el host. El estado definido antes (una pantalla alternativa, un modo) puede faltar hasta que el programa vuelva a dibujar.',
  'The permission changed. Checking what it would pass before Start.':
    'El permiso cambió. Se comprueba qué pasaría antes de Iniciar.',
  'The preset “{name}” cannot be applied because these items are missing or rejected: {items}, and {count} more. Uncheck them or restore them in Arsenal. Nothing was started.':
    'El preset «{name}» no se puede aplicar porque estos ítems faltan o fueron rechazados: {items}, y {count} más. Destildalos o restauralos en el Arsenal. No se inició nada.',
  'The preset “{name}” cannot be applied because these items are missing or rejected: {items}. Uncheck them or restore them in Arsenal. Nothing was started.':
    'El preset «{name}» no se puede aplicar porque estos ítems faltan o fueron rechazados: {items}. Destildalos o restauralos en el Arsenal. No se inició nada.',
  'The preset “{name}” changes the project instructions, and it cannot be applied now: {reason} Nothing was started.':
    'El preset “{name}” cambia las instrucciones del proyecto y ahora no se puede aplicar: {reason} No se inició nada.',
  'The preset “{name}” leaves a Codex hook or AGENTS.md out, and it cannot be applied now: {reason} Nothing was started.':
    'El preset “{name}” deja afuera un hook de Codex o el AGENTS.md, y ahora no se puede aplicar: {reason} No se inició nada.',
  'The process ended by itself.': 'El proceso terminó solo.',
  'The process never ran.': 'El proceso nunca corrió.',
  'The process was stopped, but the Console could not record that. Nothing was started again, and OpenCode and Hermes stay blocked until the store is confirmed.':
    'El proceso se detuvo, pero la consola no pudo registrarlo. No se volvió a iniciar nada, y OpenCode y Hermes siguen bloqueados hasta que se confirme el almacenamiento.',
  'The program printed faster than the screen could be kept, so part of its output never reached it. What is drawn may differ from the program until the program draws again.':
    'El programa imprimió más rápido de lo que se podía guardar la pantalla, así que parte de su salida nunca llegó. Lo dibujado puede diferir del programa hasta que el programa vuelva a dibujar.',
  'The program printed faster than the screen could be kept. The terminal itself is complete; a window opened later may show a screen that differs until the program draws again.':
    'El programa imprimió más rápido de lo que se podía guardar la pantalla. La terminal en sí está completa; una ventana abierta después puede mostrar una pantalla distinta hasta que el programa vuelva a dibujar.',
  'The project path contains characters that cannot be used for instruction exclusions. Nothing was started.':
    'La ruta del proyecto contiene caracteres que no se pueden usar para excluir instrucciones. No se inició nada.',
  'The request was not valid.': 'La solicitud no era válida.',
  'The saved launches did not load.':
    'Los lanzamientos guardados no se cargaron.',
  'The screen and its recent history were redrawn from the host. Older history was past what is kept.':
    'La pantalla y su historial reciente se volvieron a dibujar desde el host. El historial más viejo quedó fuera de lo que se guarda.',
  'The screen of that session is no longer held, so the brief has the repository state only.':
    'La pantalla de esa sesión ya no se conserva, así que el brief tiene solo el estado del repositorio.',
  'The session already has a workspace binding. It has been read again.':
    'La sesión ya tiene una asociación de workspace. Se volvió a leer.',
  'The session changed after it was shown. It has been read again.':
    'La sesión cambió después de mostrarse. Se volvió a leer.',
  'The session could not be stopped.': 'No se pudo detener la sesión.',
  'The session is closed, so the authority refused.':
    'La sesión está cerrada, así que la autoridad la rechazó.',
  'The session is not ready': 'La sesión no está lista',
  'The session is not ready in that mode':
    'La sesión no está lista en ese modo',
  'The session was not closed': 'La sesión no se cerró',
  'The session was not resumed': 'La sesión no se reanudó',
  'The setting could not be changed. Nothing was changed.':
    'No se pudo cambiar la opción. No se cambió nada.',
  'The shell could not be started.': 'No se pudo iniciar el shell.',
  'The start was accepted and is being prepared.':
    'El inicio fue aceptado y se está preparando.',
  'The start was not checked first. Choose the permission again and start.':
    'El inicio no se comprobó antes. Elegí el permiso de nuevo e iniciá.',
  'The terminal could not be closed.': 'No se pudo cerrar la terminal.',
  'The terminal could not be drawn in this window.':
    'No se pudo dibujar la terminal en esta ventana.',
  'The terminal could not be resized.': 'No se pudo redimensionar la terminal.',
  'The terminal did not answer in time.': 'La terminal no respondió a tiempo.',
  'The terminal did not close in time.': 'La terminal no se cerró a tiempo.',
  'The terminal host did not confirm this request: it may or may not have taken effect, and it was not sent again. Check the sessions listed here before repeating it, so nothing runs twice.':
    'El host de terminales no confirmó esta solicitud: puede que haya surtido efecto o no, y no se volvió a enviar. Revisá las sesiones listadas acá antes de repetirla, para que nada corra dos veces.',
  'The terminal host did not confirm this request. It may or may not have taken effect, and it was not sent again. Check the kept terminals before starting another.':
    'El host de terminales no confirmó este pedido. Puede que haya surtido efecto o no, y no se volvió a enviar. Revisá las terminales guardadas antes de iniciar otra.',
  'The terminal host did not list delegated agents.':
    'El host de terminales no pudo listar los agentes delegados.',
  'The terminal host is not answering. Nothing was sent; nothing changed.':
    'El host de terminales no responde. No se envió nada; no cambió nada.',
  'The terminal host is not answering. Nothing was sent.':
    'El host de terminales no responde. No se envió nada.',
  'The terminal host is older than this window and cannot start with this option. Update it before using it; existing sessions are unchanged.':
    'El host de terminales es más viejo que esta ventana y no puede iniciar con esta opción. Actualizalo antes de usarla; las sesiones existentes no cambian.',
  'The terminal itself is not affected. The screen state is being rebuilt from the output the host still holds.':
    'La terminal en sí no se ve afectada. El estado de pantalla se está reconstruyendo desde la salida que todavía tiene el host.',
  'The terminal limit (16) is reached. Close one to start another.':
    'Se alcanzó el límite de terminales (16). Cerrá una para abrir otra.',
  'The terminal size was refused.': 'Se rechazó el tamaño de la terminal.',
  'The terminal started, but Arsenal could not record its selection.':
    'La terminal inició, pero Arsenal no pudo registrar su selección.',
  'The terminal stayed busy and did not take the input.':
    'La terminal siguió ocupada y no tomó la entrada.',
  'The terminal stopped with an error.': 'La terminal se detuvo con un error.',
  'The terminal works. If this window is closed and opened again, the output the host kept is replayed instead of a saved screen.':
    'La terminal funciona. Si esta ventana se cierra y se vuelve a abrir, se reproduce la salida que guardó el host en lugar de una pantalla guardada.',
  'The version of this agent could not be read, so the launch was not started with a folder of its own. Check that the agent runs from a terminal and try again.':
    'No se pudo leer la versión de este agente, así que el lanzamiento no arrancó con carpeta propia. Fijate que el agente corra desde una terminal y probá de nuevo.',
  'this agent': 'este agente',
  'This console and the authority speak different versions.':
    'Esta consola y la autoridad hablan versiones distintas.',
  'This exact provider build is not verified for permission flags, so nothing was launched with them. Choose “As configured” or use a qualified build.':
    'Esta versión exacta del proveedor no está verificada para los flags de permisos, así que no se lanzó nada con ellos. Elegí “Como está configurado” o usá una versión calificada.',
  'This launch has no commands for this distribution. Add one in Workspace.':
    'Este lanzamiento no tiene comandos para esta distribución. Agregala en Workspace.',
  'This launch starts Claude Code with a folder of its own, and that needs your long-lived sign-in token from the keyring. None could be read from it, so nothing was started. The launch environment panel in Arsenal says how to store it.':
    'Este lanzamiento arranca Claude Code con carpeta propia, y para eso hace falta tu token de acceso de larga duración del llavero. No se pudo leer ninguno, así que no se inició nada. El panel de entorno de lanzamiento del Arsenal explica cómo guardarlo.',
  'This launch’s folder is not a project the Console knows. Choose it once with Browse… in Workspace, then try again.':
    'La carpeta de este lanzamiento no es un proyecto que la Consola conozca. Elegila una vez con Examinar… en Workspace y volvé a probar.',
  'This permission cannot be applied to {agent}, so it will not start.':
    'Este permiso no se puede aplicar a {agent}, así que no se iniciará.',
  'This permission cannot be applied to that agent.':
    'Este permiso no se puede aplicar a ese agente.',
  'This restarts the managed Codex runtime in Inference. Sessions attached now are detached. A session created in Local Tools cannot be resumed in Inference.':
    'Esto reinicia el runtime de Codex administrado en Inference. Las sesiones conectadas ahora quedan desconectadas. Una sesión creada en Local Tools no se puede reanudar en Inference.',
  'This restarts the managed Codex runtime in Local Tools for this workspace. Sessions attached now are detached. A session created in Inference cannot be resumed in Local Tools. Every command and file change still waits for your approval.':
    'Esto reinicia el runtime de Codex administrado en Local Tools para este workspace. Las sesiones conectadas ahora quedan desconectadas. Una sesión creada en Inference no se puede reanudar en Local Tools. Cada comando y cambio de archivo sigue esperando tu aprobación.',
  'This runs “loginctl disable-linger” for your account: your user manager will stop when you log out, and anything running inside it with it.':
    'Esto ejecuta “loginctl disable-linger” para tu cuenta: el administrador de usuario se detendrá al cerrar sesión, y con él todo lo que corra dentro.',
  'This runs “loginctl enable-linger” for your account: your user services will start at boot and stay after you log out. You can turn it off here at any time.':
    'Esto ejecuta “loginctl enable-linger” para tu cuenta: tus servicios de usuario arrancarán al iniciar y seguirán después de cerrar sesión. Podés desactivarlo acá en cualquier momento.',
  'This session has no workspace binding to resume.':
    'Esta sesión no tiene una asociación de workspace para reanudar.',
  'This session has no workspace to run a mode for.':
    'Esta sesión no tiene un workspace en el que correr un modo.',
  'This session is attached in the other mode: its conversation exists only there.':
    'Esta sesión está conectada en el otro modo: su conversación existe solo ahí.',
  'This session runs in Inference: Codex is offered no tool. Local Tools needs a session of its own, because a conversation stays in the mode it was created in.':
    'Esta sesión corre en Inference: a Codex no se le ofrece ninguna herramienta. Local Tools necesita una sesión propia, porque una conversación se queda en el modo en que se creó.',
  'This session runs in Local Tools. Every command and file change Codex proposes waits for your approval.':
    'Esta sesión corre en Local Tools. Cada comando y cambio de archivo que propone Codex espera tu aprobación.',
  'This starts a': 'Esto inicia una',
  'This system does not expose a lingering setting the Console can read.':
    'Este sistema no expone una opción de lingering que la Consola pueda leer.',
  'This terminal host predates M9. OpenCode and Hermes Native require a matching M9 host; existing Native sessions remain available.':
    'Este host de terminal es anterior a M9. OpenCode y Hermes Native requieren un host M9 compatible; las sesiones Native existentes siguen disponibles.',
  Time: 'Hora',
  'timed out': 'agotado(s)',
  'Timed out': 'Agotado',
  'To change the model in this session, type /model in it. Claude Code also saves your choice as its default.':
    'Para cambiar el modelo en esta sesión, escribí /model en ella. Claude Code también guarda tu elección como predeterminada.',
  'Try again': 'Reintentar',
  'Turn lingering off': 'Desactivar lingering',
  'Turn lingering off…': 'Desactivar lingering…',
  'Turn lingering on': 'Activar lingering',
  'Two sessions run here and can write the same files. Nothing coordinates them.':
    'Dos sesiones corren aquí y pueden escribir los mismos archivos. Nada las coordina.',
  Uncertain: 'Incierto',
  'up {time}': 'activa {time}',
  'Update {agent}': 'Actualizar {agent}',
  Updated: 'Actualizada',
  'Use Inference': 'Usar Inference',
  'Use Inference for {name}?': '¿Usar Inference para {name}?',
  'What survives what': 'Qué sobrevive a qué',
  'What survives what could not be read from the host.':
    'No se pudo leer del host qué sobrevive a qué.',
  'What the agent may do without asking you. “As configured” passes nothing: the agent starts with the permissions of its own settings. The model and the effort are chosen inside the agent.':
    'Qué puede hacer el agente sin preguntarte. “Como está configurado” no pasa nada: el agente arranca con los permisos de su propia configuración. El modelo y el esfuerzo se eligen dentro del agente.',
  'What the permission passes': 'Qué pasa el permiso',
  'What the start would do changed after it was checked. Check it again and start.':
    'Lo que haría el inicio cambió después de comprobarlo. Comprobalo de nuevo e iniciá.',
  'What this session was started with no longer exists, so it cannot start that way. Start a new one from Workspace.':
    'Eso con lo que arrancó esta sesión ya no existe, así que no puede arrancar igual. Iniciá una nueva desde Workspace.',
  When: 'Cuándo',
  Why: 'Por qué',
  Workspace: 'Workspace',
  'You stopped it.': 'La detuviste vos.',
  'Your saved launches': 'Tus lanzamientos guardados',
  'Your terminals belong to a host process, not to this window. Closing the window does not stop them; this is what happens in the other cases on this machine.':
    'Tus terminales pertenecen a un proceso host, no a esta ventana. Cerrar la ventana no las detiene; esto es lo que pasa en los otros casos de esta máquina.',
};
