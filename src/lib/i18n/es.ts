import { ES_AREA as ES_ARSENAL } from './es-arsenal';
import { ES_AREA as ES_NATIVE } from './es-native';
import { ES_AREA as ES_CONFIGURATION } from './es-configuration';
import { ES_SCREENS } from './screens';

/**
 * Spanish for the window's own text. The key is the English sentence exactly as it is written
 * where it is used; `tests/i18n.test.ts` fails when a sentence in `src/` has no entry here, when
 * the `{name}` places of the two do not match.
 *
 * Product and provider names (Wyss Console, Arsenal, Workspace, Codex, Claude Code) are not
 * translated, and neither are the words the product uses as names of things (Inference, Local
 * Tools, Native, Managed).
 */
export const ES: Readonly<Record<string, string>> = {
  // Shell: navigation
  Terminals: 'Terminales',
  System: 'Sistema',
  More: 'Más',
  Distributors: 'Distribuidores',
  // Distributors
  'Tool not installed': 'No instalado',
  // Workspace: launch editor
  'Choose it with Browse… or from the known folders.':
    'Elegila con Examinar… o entre las carpetas conocidas.',
  'This launch’s folder is not a project the Console knows. Choose it once with Browse… in Workspace, then try again.':
    'La carpeta de este lanzamiento no es un proyecto que la Consola conozca. Elegila una vez con Examinar… en Workspace y volvé a probar.',
  'This launch is saved as {file}.toml. Saving writes {next}.toml and removes {file}.toml.':
    'Este lanzamiento está guardado como {file}.toml. Al guardar se escribe {next}.toml y se borra {file}.toml.',
  role: 'rol',
  'Saved as “{name}”. The file under the old name could not be deleted: it is still listed.':
    'Se guardó como “{name}”. No se pudo borrar el archivo con el nombre anterior: sigue en la lista.',
  'roles.json could not be read. Roles are shown as the basic ones and are not saved until the file is fixed or removed.':
    'No se pudo leer roles.json. Se muestran los roles básicos y no se guardan hasta que el archivo se arregle o se borre.',
  Orchestrator: 'Orquestador',
  Worker: 'Trabajador',
  Researcher: 'Investigador',
  Reviewer: 'Revisor',
  'Workspace could not be read.': 'No se pudo leer el Workspace.',
  'New launch': 'Lanzamiento nuevo',
  'not measured': 'sin medir',
  'Account skills': 'Skills de la cuenta',
  'The role could not be saved.': 'No se pudo guardar el rol.',
  'The role could not be deleted.': 'No se pudo borrar el rol.',
  'preset “{name}” (a copy: the other launches keep theirs)':
    'preset “{name}” (una copia: los otros lanzamientos conservan el suyo)',
  'preset “{name}”': 'preset “{name}”',
  environment: 'entorno',
  launch: 'lanzamiento',
  'Saved.': 'Guardado.',
  'It could not be saved.': 'No se pudo guardar.',
  '{what} Saved so far: {done}. Nothing else changed.':
    '{what} Se guardó: {done}. Nada más cambió.',
  'Search launches': 'Buscar lanzamientos',
  Roles: 'Roles',
  basic: 'básico',
  'Delete role {name}': 'Borrar el rol {name}',
  'New role…': 'Rol nuevo…',
  'New role name': 'Nombre del rol nuevo',
  'Launches of a deleted role become Worker.':
    'Los lanzamientos de un rol borrado pasan a Trabajador.',
  New: 'Nuevo',
  'of {total} · estimated, MCP not measured':
    'de {total} · estimado, MCP sin medir',
  'No estimate for Codex yet.': 'Todavía no hay estimación para Codex.',
  'Delete launch': 'Borrar lanzamiento',
  'Save and try': 'Guardar y probar',
  Try: 'Probar',
  'This launch runs commands from its file. It opens from here; edit it in its file.':
    'Este lanzamiento corre comandos de su archivo. Se abre desde acá; editalo en su archivo.',
  Role: 'Rol',
  Distributor: 'Distribuidor',
  'Saved and recent folders': 'Carpetas guardadas y recientes',
  'Browse…': 'Examinar…',
  Saved: 'Guardadas',
  'Recently used': 'Usadas hace poco',
  'AGENTS.md of your Codex folder: what you told Codex to always follow. Switched off, this launch starts without it.':
    'El AGENTS.md de tu carpeta de Codex: lo que le dijiste a Codex que siga siempre. Apagado, este lanzamiento arranca sin él.',
  'A launch that leaves a hook or AGENTS.md out runs in its own Codex folder, with your own Codex sign-in. Codex asks you to approve the hooks the first time in each new folder.':
    'Un lanzamiento que deja afuera un hook o el AGENTS.md corre en su propia carpeta de Codex, con tu propio inicio de sesión de Codex. Codex pedirá aprobar los hooks la primera vez en cada carpeta nueva.',
  'Declared in config.toml: these run in every launch and cannot be switched off here.':
    'Declarados en config.toml: corren en todos los lanzamientos y no se pueden apagar por lanzamiento.',
  'What this preset loads besides its skills. Anything unticked is not loaded in that terminal.':
    'Lo que carga este preset además de sus skills. Lo desmarcado no se carga en esa terminal.',
  'No hooks in hooks.json.': 'No hay hooks en hooks.json.',
  'Hooks of config.toml': 'Hooks de config.toml',
  'This terminal gets its own Codex folder and signs in with your own Codex sign-in. Your own hooks.json and config.toml are not changed.':
    'Esta terminal tiene su propia carpeta de Codex e inicia sesión con tu propio inicio de sesión de Codex. Tu hooks.json y tu config.toml no cambian.',
  'This terminal uses your own Codex configuration as it is.':
    'Esta terminal usa tu configuración de Codex tal como está.',
  'Codex asks you to approve the hooks the first time in each new folder.':
    'Codex pedirá aprobar los hooks la primera vez en cada carpeta nueva.',
  'For Codex a launch chooses skills, agents, AGENTS.md and the hooks of hooks.json. MCP servers and account skills are Claude Code only.':
    'En Codex un lanzamiento elige skills, agentes, el AGENTS.md y los hooks de hooks.json. Los servidores MCP y las skills de la cuenta son solo de Claude Code.',
  '{on} of {all}': '{on} de {all}',
  'Nothing of this kind.': 'No hay nada de este tipo.',
  // Console: toolbar and session bar
  'Your saved launches': 'Tus lanzamientos guardados',
  'No terminals open.': 'No hay terminales abiertas.',
  Branch: 'Rama',
  'no git': 'sin git',
  'detached HEAD': 'HEAD suelta',
  '✓ all committed': '✓ todo commiteado',
  '● 1 change not committed': '● 1 cambio sin commitear',
  '● {count} changes not committed': '● {count} cambios sin commitear',
  '↑{count} not pushed': '↑{count} sin subir',
  'Native · {agent}': 'Nativa · {agent}',
  Console: 'Consola',
  'Local terminal workspace': 'Terminales locales',
  Workspace: 'Workspace',
  'Agent actions': 'Acciones del agente',
  'Agent registry': 'Registro de agentes',
  'Start it again': 'Volver a iniciar',
  '{finished} agents finished in the registry ({lost} lost)':
    '{finished} agentes terminados en el registro ({lost} perdidos)',
  'Reopen {count} lost agents': 'Volver a abrir los {count} agentes perdidos',
  'Clear the registry': 'Limpiar el registro',
  Sessions: 'Sesiones',
  'Managed agent sessions': 'Sesiones de agentes Managed',
  Agents: 'Agentes',
  'Work with Codex in a session': 'Trabajar con Codex en una sesión',

  Approvals: 'Aprobaciones',
  'Actions waiting for a decision': 'Acciones que esperan una decisión',
  Events: 'Eventos',
  'What the authority recorded': 'Lo que registró la autoridad',
  Arsenal: 'Arsenal',
  'Installed capabilities': 'Capacidades instaladas',
  'Library: {imported} imported · {new} new on disk':
    'Biblioteca: {imported} importadas · {new} nuevas en disco',
  'Searching for new capabilities…': 'Buscando capacidades nuevas…',
  'New capabilities could not be read.':
    'No se pudieron leer las capacidades nuevas.',
  'Import the {count} new capabilities':
    'Importar las {count} capacidades nuevas',
  'No presets for this tool.': 'No hay presets para esta herramienta.',
  'Duplicate preset names block launches using that name.':
    'Los nombres de preset duplicados impiden iniciar lanzamientos que los usan.',
  'Duplicate name': 'Nombre duplicado',
  'Edit launch {name} in Workspace':
    'Editar el lanzamiento {name} en Workspace',
  'No launch uses this preset.': 'Ningún lanzamiento usa este preset.',
  'Create launch with it': 'Crear un lanzamiento con este preset',
  'Remove duplicate preset names before creating a launch.':
    'Borrá los presets con nombres duplicados antes de crear un lanzamiento.',
  'No launch on this computer uses this preset. Deleting it syncs to the other computer; its launches are not visible here.':
    'Ningún lanzamiento de esta computadora usa este preset. Al borrarlo, el cambio se sincroniza con la otra computadora; sus lanzamientos no se ven acá.',
  'Deleting this preset stops {launches} from starting. The deletion syncs to the other computer; its launches are not visible here.':
    'Al borrar este preset, {launches} dejarán de iniciar. El borrado se sincroniza con la otra computadora; sus lanzamientos no se ven acá.',
  'That preset is no longer available. Refresh and try again.':
    'Ese preset ya no está disponible. Actualizá la lista y volvé a probar.',
  'No preset named “{name}” for this agent. Create it in Workspace, or change the launch file.':
    'No hay un preset llamado “{name}” para este agente. Crealo en Workspace o cambiá el archivo del lanzamiento.',
  'More than one preset is named “{name}” for this agent. Delete the extra presets in Arsenal › Presets, then start again.':
    'Hay más de un preset llamado “{name}” para este agente. Borrá los demás en Arsenal › Presets y volvé a iniciar.',
  'The Arsenal selection “{name}” cannot be applied with this permission. Choose the preset for this launch in Workspace, then try again. Nothing was started.':
    'No se puede aplicar la selección “{name}” de Arsenal con este permiso. Elegí el preset de este lanzamiento en Workspace y volvé a probar. No se inició nada.',
  Configuration: 'Configuración',
  Models: 'Modelos',

  Credentials: 'Credenciales',
  'API keys, kept sealed': 'Claves de API, guardadas selladas',
  Settings: 'Ajustes',
  'Preferences and about': 'Preferencias y acerca de',

  Primary: 'Principal',
  '{count} waiting': '{count} en espera',

  // Shell: top bar
  'Terminal tools': 'Herramientas de terminal',
  'Split side by side': 'Dividir lado a lado',
  'Split side by side (Ctrl+Shift+D)': 'Dividir lado a lado (Ctrl+Shift+D)',
  'Split one above the other': 'Dividir una arriba de la otra',
  'Split, one above the other (Ctrl+Shift+E)':
    'Dividir, una arriba de la otra (Ctrl+Shift+E)',
  'Keyboard shortcuts': 'Atajos de teclado',
  Launch: 'Lanzar',

  // Shell: status
  Status: 'Estado',
  Terminal: 'Terminal',
  'Local terminal. It runs with or without the authority.':
    'Terminal local. Funciona con o sin la autoridad.',
  'Protocol 1 authority': 'Autoridad de protocolo 1',

  'Authority P1': 'Autoridad P1',

  'Authority status': 'Estado de la autoridad',
  Details: 'Detalles',
  'No terminals': 'Sin terminales',
  Error: 'Error',
  Starting: 'Iniciando',
  Running: 'En ejecución',
  Closing: 'Cerrando',
  Exited: 'Terminó',
  Closed: 'Cerrada',
  Failed: 'Falló',
  Offline: 'Sin conexión',
  Reconnecting: 'Reconectando',
  Incompatible: 'Incompatible',
  Rejected: 'Rechazada',
  Unsafe: 'No segura',
  Connecting: 'Conectando',
  Unavailable: 'No disponible',
  Connected: 'Conectada',
  Syncing: 'Sincronizando',
  Stopped: 'Detenida',
  Ready: 'Listo',
  Initializing: 'Inicializando',
  Stopping: 'Deteniendo',
  Unknown: 'Desconocido',
  Installing: 'Instalando',
  'Failed to start': 'No pudo iniciar',
  'Not checked yet': 'Todavía no se revisó',

  // Shell: authority and lifecycle
  'The authority is not running. Local terminals do not depend on it.':
    'La autoridad no está corriendo. Las terminales locales no dependen de ella.',
  'The authority stopped answering. Reconnecting.':
    'La autoridad dejó de responder. Reconectando.',
  'The authority speaks another protocol or storage version.':
    'La autoridad habla otro protocolo o versión de almacenamiento.',
  'The authority broke the control protocol and was disconnected.':
    'La autoridad rompió el protocolo de control y se desconectó.',
  'The runtime directory or control socket is not private.':
    'El directorio de runtime o el socket de control no son privados.',
  'Looking for the Wyss authority.': 'Buscando la autoridad Wyss.',
  'The desktop could not read the authority state.':
    'El escritorio no pudo leer el estado de la autoridad.',
  'Reading the canonical authority state.':
    'Leyendo el estado canónico de la autoridad.',
  'The console is closing its authority link.':
    'La consola está cerrando su conexión con la autoridad.',
  '{count} session': '{count} sesión',
  '{count} sessions': '{count} sesiones',
  'Wyss authority {version}': 'Autoridad Wyss {version}',
  'Wyss authority': 'Autoridad Wyss',
  'protocol {protocol}': 'protocolo {protocol}',
  'sessions: {prepared} prepared, {closed} closed':
    'sesiones: {prepared} preparadas, {closed} cerradas',
  'event head {sequence}': 'último evento {sequence}',
  'Codex status is known only while the authority is connected.':
    'El estado de Codex solo se conoce mientras la autoridad está conectada.',
  '{name} {version}': '{name} {version}',
  '{name}': '{name}',
  'desired {state}': 'deseado {state}',
  '{count} model': '{count} modelo',
  '{count} models': '{count} modelos',
  'managed by the authority': 'administrado por la autoridad',
  'Installing the Wyss authority for this account.':
    'Instalando la autoridad Wyss para esta cuenta.',
  'Starting the Wyss authority.': 'Iniciando la autoridad Wyss.',
  'The Wyss authority is starting. Waiting for it to answer.':
    'La autoridad Wyss está iniciando. Esperando que responda.',
  'started by Wyss Console': 'iniciada por Wyss Console',
  'started outside Wyss Console': 'iniciada fuera de Wyss Console',
  'a newer authority is installed the next time it starts':
    'se instala una autoridad más nueva la próxima vez que arranque',
  'update pending': 'actualización pendiente',
  'An incompatible Wyss authority is running.':
    'Hay corriendo una autoridad Wyss incompatible.',
  'An incompatible Wyss authority is running':
    'Hay corriendo una autoridad Wyss incompatible',
  'It is this installation’s own, from another version. It is replaced the next time it starts; it is not restarted under work that may be running.':
    'Es de esta instalación, de otra versión. Se reemplaza la próxima vez que arranque; no se reinicia mientras puede haber trabajo corriendo.',
  'It was not started by this installation, so it is left exactly as it is. Wyss Console cannot work with it.':
    'No la inició esta instalación, así que se deja tal como está. Wyss Console no puede trabajar con ella.',
  'The Wyss authority is not running': 'La autoridad Wyss no está corriendo',
  'The Wyss authority could not start': 'La autoridad Wyss no pudo iniciar',
  'This build': 'Esta compilación',
  Service: 'Servicio',
  'No Wyss authority is running. Automatic authority management is disabled: opening the GUI does not install or start an authority. Start wyss-control yourself and it is used as soon as it answers.':
    'No hay ninguna autoridad Wyss corriendo. La administración automática está desactivada: abrir la GUI no instala ni inicia una autoridad. Iniciá wyss-control vos mismo y se usa en cuanto responda.',
  'The authority packaged with this application could not be trusted: it is missing, it is not the one this application was built with, or it is in a folder others can write to. Nothing was installed.':
    'No se pudo confiar en la autoridad empaquetada con esta aplicación: falta, no es la que se compiló con ella, o está en una carpeta en la que otros pueden escribir. No se instaló nada.',
  'The authority was not installed: the place it is installed in is not safely yours (a link, another owner, or a folder others can write to). Nothing was changed.':
    'La autoridad no se instaló: el lugar donde se instalaría no es seguro para vos (un enlace, otro dueño o una carpeta en la que otros pueden escribir). No se cambió nada.',
  'A service definition Wyss Console did not write is in the place of its own. It was left as it is, and the authority was not started.':
    'Hay una definición de servicio que Wyss Console no escribió en el lugar que le corresponde. Se dejó como está y la autoridad no se inició.',
  'The authority could not be installed. Nothing is half installed: what was there before is still in place.':
    'No se pudo instalar la autoridad. No quedó nada a medio instalar: lo que había antes sigue en su lugar.',
  'No user service manager answered, so the authority could not be started. Wyss Console starts its authority through the service manager of your login session.':
    'Ningún administrador de servicios de usuario respondió, así que no se pudo iniciar la autoridad. Wyss Console la inicia a través del administrador de servicios de tu sesión.',
  'The service manager did not start the authority.':
    'El administrador de servicios no inició la autoridad.',
  'The authority was started and ended before it answered.':
    'La autoridad se inició y terminó antes de responder.',
  'The authority ended repeatedly and is no longer being restarted.':
    'La autoridad terminó varias veces y ya no se reinicia.',
  'The authority is not running: it was stopped, or it ended and was not restarted.':
    'La autoridad no está corriendo: se detuvo, o terminó y no se reinició.',
  'The authority is running and did not answer in time.':
    'La autoridad está corriendo y no respondió a tiempo.',
  'The control socket of the authority is not private to you, so it is not used.':
    'El socket de control de la autoridad no es privado para vos, así que no se usa.',
  'Packaged: carries its own authority':
    'Empaquetado: trae su propia autoridad',
  'Development: uses an authority that is already running':
    'Desarrollo: usa una autoridad que ya está corriendo',
  'Packaged, but its authority cannot be found':
    'Empaquetado, pero no se encuentra su autoridad',
  Installed: 'Instalada',
  'Installed by another version': 'Instalada por otra versión',
  'A service definition that is not Wyss Console’s':
    'Una definición de servicio que no es de Wyss Console',
  'Not safely yours': 'No es de tu propiedad de forma segura',
  'No service manager answered':
    'No respondió ningún administrador de servicios',

  // Settings
  'Reading preferences': 'Leyendo preferencias',
  'Preferences unavailable': 'Preferencias no disponibles',
  'Saving…': 'Guardando…',
  'Loading…': 'Cargando…',
  'Saved on this computer': 'Guardado en esta computadora',
  'Preferences could not be read, so the defaults are shown. Nothing is saved until they can be.':
    'No se pudieron leer las preferencias, así que se muestran los valores por defecto. No se guarda nada hasta que se puedan leer.',
  'Try again': 'Reintentar',
  'Preferences change how Wyss Console looks and where it opens. They never change what Codex may do: sessions start in Inference, Local Tools is chosen for each session, and every command or file change it proposes waits for your approval.':
    'Las preferencias cambian cómo se ve Wyss Console y dónde abre. Nunca cambian lo que Codex puede hacer: las sesiones arrancan en Inference, Local Tools se elige en cada sesión, y cada comando o cambio de archivo que propone espera tu aprobación.',
  Appearance: 'Apariencia',
  'Color theme': 'Tema de color',
  Dark: 'Oscuro',
  Light: 'Claro',
  'High contrast': 'Alto contraste',
  'Changes appearance only. It does not change provider or approval permissions.':
    'Solo cambia la apariencia. No cambia permisos de proveedores ni de aprobaciones.',
  Interface: 'Interfaz',
  Language: 'Idioma',
  'The language of Wyss Console itself. What an agent, a provider or the system writes is shown as it arrives.':
    'El idioma de Wyss Console. Lo que escribe un agente, un proveedor o el sistema se muestra como llega.',
  'Open on': 'Abrir en',
  'The view shown when Wyss Console starts.':
    'La vista que se muestra cuando arranca Wyss Console.',
  'Font size': 'Tamaño de fuente',
  'History kept': 'Historial guardado',
  '{count} lines': '{count} líneas',
  'How far back each terminal can scroll. Larger values use more memory.':
    'Hasta dónde se puede volver atrás en cada terminal. Los valores más grandes usan más memoria.',
  Cursor: 'Cursor',
  Block: 'Bloque',
  Bar: 'Barra',
  Underline: 'Subrayado',
  'Blinking cursor': 'Cursor parpadeante',
  'These apply to every terminal, open or new. What a terminal runs is not a preference.':
    'Se aplican a todas las terminales, abiertas o nuevas. Lo que corre una terminal no es una preferencia.',
  Time: 'Hora',
  'Follow the system': 'Seguir al sistema',
  '12-hour': '12 horas',
  '24-hour': '24 horas',
  'Show first': 'Mostrar primero',
  'All events': 'Todos los eventos',
  Runtime: 'Runtime',
  Turns: 'Turnos',
  Security: 'Seguridad',
  'Only narrows what is shown. The authority records every event either way.':
    'Solo acota lo que se muestra. La autoridad registra todos los eventos igual.',
  'Authority · protocol 1': 'Autoridad · protocolo 1',
  Retry: 'Reintentar',
  'Retrying…': 'Reintentando…',
  'The protocol 1 authority keeps its sessions, approvals and history, and keeps running when this window is closed. Local terminals and these preferences work without it. Managed runtimes use a separate protocol 2 connection.':
    'La autoridad de protocolo 1 conserva sus sesiones, aprobaciones e historial, y sigue corriendo cuando se cierra esta ventana. Las terminales locales y estas preferencias funcionan sin ella. Los runtimes Managed usan una conexión aparte de protocolo 2.',
  About: 'Acerca de',
  'Version {version}': 'Versión {version}',
  'Not available': 'No disponible',
  Build: 'Compilación',
  Platform: 'Plataforma',
  'Authority protocol': 'Protocolo de la autoridad',
  Reset: 'Restablecer',
  'Reset all preferences to their defaults?':
    '¿Restablecer todas las preferencias a sus valores por defecto?',
  'Your sessions, history, approvals, workspaces and Codex login are not touched.':
    'No se tocan tus sesiones, historial, aprobaciones, workspaces ni el inicio de sesión de Codex.',
  'Reset preferences': 'Restablecer preferencias',
  Cancel: 'Cancelar',
  'Reset preferences…': 'Restablecer preferencias…',
  'Restores the defaults on this screen. Nothing else is deleted.':
    'Restaura los valores por defecto de esta pantalla. No se borra nada más.',
  'Your saved preferences could not be read':
    'No se pudieron leer tus preferencias guardadas',
  'They were set aside and the defaults are in use. Change a preference to save a new set, or reset to start clean.':
    'Se apartaron y se usan los valores por defecto. Cambiá una preferencia para guardar un conjunto nuevo, o restablecé para empezar de cero.',
  'Saved by a newer version of Wyss Console':
    'Guardadas por una versión más nueva de Wyss Console',
  'These preferences were left as they are and the defaults are in use. They cannot be changed from this version until they are reset.':
    'Estas preferencias se dejaron como están y se usan los valores por defecto. Desde esta versión no se pueden cambiar hasta restablecerlas.',
  'Your saved preferences were not trusted':
    'No se confió en tus preferencias guardadas',
  'The file is not private to you, so it was not read and the defaults are in use. Changing a preference replaces it.':
    'El archivo no es privado tuyo, así que no se leyó y se usan los valores por defecto. Cambiar una preferencia lo reemplaza.',
  'Preferences cannot be saved here': 'Acá no se pueden guardar preferencias',
  'The place they are kept in is not safely yours, so the defaults are in use and changes are not kept.':
    'El lugar donde se guardan no es tuyo de forma segura, así que se usan los valores por defecto y los cambios no se conservan.',
  'That value is not allowed.': 'Ese valor no está permitido.',
  'These preferences were saved by a newer version. Reset them to change them from this version.':
    'Estas preferencias las guardó una versión más nueva. Restablecelas para cambiarlas desde esta versión.',
  'The preference could not be saved. Nothing was changed.':
    'No se pudo guardar la preferencia. No cambió nada.',
  'Wyss Console is busy. Try again in a moment.':
    'Wyss Console está ocupada. Probá de nuevo en un momento.',
  Authority: 'Autoridad',
  'Not running': 'No está corriendo',
  'Codex runtime': 'Runtime de Codex',
  'Not available while offline': 'No disponible sin conexión',
  Installation: 'Instalación',
  'Managed by Wyss Console': 'Administrada por Wyss Console',
  'Started outside Wyss Console': 'Iniciada fuera de Wyss Console',
  'Installed by Wyss Console': 'Instalada por Wyss Console',
  'Not installed': 'No instalada',
  'Not known yet': 'Todavía no se sabe',
  Compatibility: 'Compatibilidad',
  'This Wyss authority is not compatible with this version of the app.':
    'Esta autoridad Wyss no es compatible con esta versión de la app.',
  Compatible: 'Compatible',
  'Checked when the authority answers':
    'Se comprueba cuando la autoridad responde',
  'Authority version': 'Versión de la autoridad',
  'Not reported': 'No informada',
  Protocol: 'Protocolo',
  Update: 'Actualización',
  'Update tool': 'Actualizar',
  'A newer authority is installed the next time it starts':
    'Se instala una autoridad más nueva la próxima vez que arranque',

  // App shell and diagnostics
  'Skip to main content': 'Saltar al contenido principal',
  'Session {id}': 'Sesión {id}',
  Name: 'Nombre',

  // Agent: the turn view and the presenter that words its states
  Agent: 'Agente',
  'Open sessions': 'Abrir sesiones',
  'Active session': 'Sesión activa',
  'Turn being started': 'Turno que se está iniciando',
  'No session is open.': 'No hay ninguna sesión abierta.',
  'Open a Ready session from Sessions to give Codex an objective in its project.':
    'Abrí una sesión en estado Listo desde Sesiones para darle a Codex un objetivo en su proyecto.',
  'Go to Sessions': 'Ir a Sesiones',
  'Close {name}': 'Cerrar {name}',
  Refresh: 'Actualizar',
  'Connecting to the authority…': 'Conectando con la autoridad…',
  'What is shown was read before the connection was lost.':
    'Lo que se muestra se leyó antes de que se cortara la conexión.',
  'Reload turns': 'Recargar turnos',
  'Loading older turns…': 'Cargando turnos anteriores…',
  'No turns in the part of the history just searched. There is more further back.':
    'No hay turnos en el tramo del historial que se acaba de buscar. Hay más hacia atrás.',
  'Keep looking': 'Seguir buscando',
  'Load older turns': 'Cargar turnos anteriores',
  '{count} older turns are shown, the most this view keeps.':
    'Se muestran {count} turnos anteriores, el máximo que guarda esta vista.',
  'Start over from the newest': 'Empezar otra vez desde el más nuevo',
  "This is the start of this session's history.":
    'Este es el comienzo del historial de esta sesión.',
  'Reading turns…': 'Leyendo turnos…',
  'No turns yet.': 'Todavía no hay turnos.',
  'Write an objective below. The authority decides whether the turn may start and what Codex is allowed to do in it.':
    'Escribí un objetivo abajo. La autoridad decide si el turno puede empezar y qué puede hacer Codex en él.',
  Turn: 'Turno',
  Accepted: 'Aceptado',
  You: 'Vos',
  'The input of this turn is not shown: Wyss keeps no conversation text.':
    'La entrada de este turno no se muestra: Wyss no guarda texto de conversación.',
  'The beginning of this output is no longer shown.':
    'Ya no se muestra el principio de esta salida.',
  'Output here was not kept by the authority.':
    'La autoridad no guardó esta salida.',
  'This turn produced no answer.': 'Este turno no produjo respuesta.',
  'The authority no longer holds the output of this turn.':
    'La autoridad ya no tiene la salida de este turno.',
  'Thinking…': 'Pensando…',
  'Waiting for approval': 'Esperando aprobación',
  'Cancelling…': 'Cancelando…',
  'Read again': 'Leer de nuevo',
  'Asking the authority to start the turn…':
    'Pidiéndole a la autoridad que inicie el turno…',
  Dismiss: 'Descartar',
  'New turn': 'Turno nuevo',
  Objective: 'Objetivo',
  'What should Codex do in this project?':
    '¿Qué debería hacer Codex en este proyecto?',

  'Cancel turn': 'Cancelar turno',
  Run: 'Ejecutar',
  Completed: 'Completado',
  Interrupted: 'Interrumpido',
  Indeterminate: 'Indeterminado',
  'Stopped at your request.': 'Detenido a tu pedido.',
  'Its execution lease expired, so the authority stopped it.':
    'Venció su concesión de ejecución, así que la autoridad lo detuvo.',
  'Its execution lease was revoked, so the authority stopped it.':
    'Se revocó su concesión de ejecución, así que la autoridad lo detuvo.',
  'The session was closed while it ran.': 'La sesión se cerró mientras corría.',
  'Codex was stopped while it ran.': 'Codex se detuvo mientras corría.',
  'The authority shut down while it ran.':
    'La autoridad se apagó mientras corría.',
  'The authority restarted while it ran. What Codex did after that is not known.':
    'La autoridad se reinició mientras corría. No se sabe qué hizo Codex después.',
  'Codex stopped unexpectedly.': 'Codex se detuvo de forma inesperada.',
  'Codex reported that the turn failed.': 'Codex informó que el turno falló.',
  'The authority could not confirm whether Codex received the turn.':
    'La autoridad no pudo confirmar si Codex recibió el turno.',
  'Codex tried to act outside what this session allows, and the authority stopped it.':
    'Codex intentó actuar fuera de lo que permite esta sesión, y la autoridad lo detuvo.',
  'Codex did not confirm the cancel in time. What it did is not known.':
    'Codex no confirmó la cancelación a tiempo. No se sabe qué hizo.',
  'The approval it waited on expired undecided.':
    'La aprobación que esperaba venció sin decisión.',
  'Codex asked for an action this session cannot allow.':
    'Codex pidió una acción que esta sesión no puede permitir.',
  'Command proposed': 'Comando propuesto',
  'Command started': 'Comando iniciado',
  'Command output': 'Salida del comando',
  'Command finished': 'Comando terminado',
  'Command failed': 'Comando con error',
  'File change proposed': 'Cambio de archivo propuesto',
  'File change started': 'Cambio de archivo iniciado',
  'File change applied': 'Cambio de archivo aplicado',
  'File change failed': 'Cambio de archivo con error',
  'Approval requested': 'Aprobación pedida',
  Activity: 'Actividad',
  'Approval accepted': 'Aprobación aceptada',
  'Approval declined': 'Aprobación rechazada',
  'Approval cancelled': 'Aprobación cancelada',
  'Approval expired undecided': 'Aprobación vencida sin decidir',
  'Approval no longer applies': 'La aprobación ya no aplica',
  'Approval outcome unknown': 'Resultado de la aprobación desconocido',
  'Approval closed': 'Aprobación cerrada',
  'Codex asked to run a command. The authority holds the turn until that is decided, or until {until}.':
    'Codex pidió ejecutar un comando. La autoridad retiene el turno hasta que se decida, o hasta {until}.',
  'Codex asked to change files. The authority holds the turn until that is decided, or until {until}.':
    'Codex pidió cambiar archivos. La autoridad retiene el turno hasta que se decida, o hasta {until}.',
  'The authority did not answer.': 'La autoridad no respondió.',
  'This console and the authority speak different versions.':
    'Esta consola y la autoridad hablan versiones distintas.',
  'The console sent a request it should not have. Nothing changed.':
    'La consola envió un pedido que no debía enviar. No cambió nada.',
  'The authority no longer has it.': 'La autoridad ya no lo tiene.',
  'It changed after it was shown. It has been read again.':
    'Cambió después de mostrarse. Se volvió a leer.',
  'The authority refused: it is no longer allowed.':
    'La autoridad lo rechazó: ya no está permitido.',
  'The session has no workspace. Activate it in Sessions.':
    'La sesión no tiene workspace. Activala en Sesiones.',
  'The session is not attached to a running Codex. Resume it in Sessions.':
    'La sesión no está conectada a un Codex en ejecución. Reanudala en Sesiones.',
  'The authority refused to start Codex.':
    'La autoridad rechazó iniciar Codex.',
  'A turn is running. The runtime is not restarted under it.':
    'Hay un turno corriendo. El runtime no se reinicia mientras tanto.',
  'The session is attached in the other mode: its conversation exists only there.':
    'La sesión está conectada en el otro modo: su conversación existe solo ahí.',
  'The authority did not accept the workspace.':
    'La autoridad no aceptó el workspace.',
  'The session already has a workspace binding.':
    'La sesión ya tiene un workspace asociado.',
  'The authority denied it: no execution lease allows a turn for this session.':
    'La autoridad lo denegó: ninguna concesión de ejecución permite un turno en esta sesión.',
  'The authority is busy with another operation. Try again in a moment.':
    'La autoridad está ocupada con otra operación. Probá de nuevo en un momento.',
  'Codex refused it.': 'Codex lo rechazó.',
  'The authority could not confirm what Codex did. Nothing is sent again by itself.':
    'La autoridad no pudo confirmar lo que hizo Codex. No se vuelve a enviar nada por sí solo.',
  'That request was already used for something else.':
    'Ese pedido ya se usó para otra cosa.',
  'Something unexpected happened. Nothing is assumed to have changed.':
    'Pasó algo inesperado. No se asume que haya cambiado nada.',
  'The authority did not answer, so it is not known whether the turn started. Retrying repeats the same request: it cannot start a second turn.':
    'La autoridad no respondió, así que no se sabe si el turno empezó. Reintentar repite el mismo pedido: no puede iniciar un segundo turno.',
  'The input is empty or longer than a turn can carry.':
    'La entrada está vacía o es más larga de lo que puede tener un turno.',
  'The authority no longer has this session.':
    'La autoridad ya no tiene esta sesión.',
  'The session changed after it was shown. It has been read again.':
    'La sesión cambió después de mostrarse. Se volvió a leer.',
  'The session is closed, so the authority refused.':
    'La sesión está cerrada, así que la autoridad la rechazó.',
  'Another turn is running. The authority runs one turn at a time.':
    'Hay otro turno corriendo. La autoridad corre un turno a la vez.',
  'Codex refused the turn.': 'Codex rechazó el turno.',
  'The authority could not confirm whether Codex received the turn. Nothing is sent again by itself.':
    'La autoridad no pudo confirmar si Codex recibió el turno. No se vuelve a enviar nada por sí solo.',
  'That request was already used for another input.':
    'Ese pedido ya se usó para otra entrada.',
  'The turn was not started. {reason}': 'El turno no se inició. {reason}',
  'The authority did not answer, so it is not known whether the cancel was taken. The turn is shown as the authority reports it.':
    'La autoridad no respondió, así que no se sabe si la cancelación se tomó. El turno se muestra como lo informa la autoridad.',
  'The authority no longer has this turn.':
    'La autoridad ya no tiene este turno.',
  'The turn changed after it was shown. Try again.':
    'El turno cambió después de mostrarse. Probá de nuevo.',
  'The turn had already ended.': 'El turno ya había terminado.',
  'The cancel was not taken. {reason}': 'La cancelación no se tomó. {reason}',
  'This could not be read: the authority did not answer.':
    'No se pudo leer: la autoridad no respondió.',
  'This could not be read: the authority no longer has it.':
    'No se pudo leer: la autoridad ya no lo tiene.',
  'This could not be read. {reason}': 'No se pudo leer. {reason}',
  'This could not be read. Nothing is shown rather than something unverified.':
    'No se pudo leer. No se muestra nada en lugar de algo sin verificar.',
  'Older turns could not be loaded: the authority did not answer.':
    'No se pudieron cargar los turnos anteriores: la autoridad no respondió.',
  'The history changed while it was being read, so the place reached in it is no longer good. Reload the turns to start again from the newest.':
    'El historial cambió mientras se leía, así que el lugar al que se llegó ya no sirve. Recargá los turnos para empezar otra vez desde el más nuevo.',
  'Older turns could not be loaded: the authority no longer has this session.':
    'No se pudieron cargar los turnos anteriores: la autoridad ya no tiene esta sesión.',
  'Older turns could not be loaded. {reason}':
    'No se pudieron cargar los turnos anteriores. {reason}',
  'Older turns could not be loaded. Nothing is shown rather than something unverified.':
    'No se pudieron cargar los turnos anteriores. No se muestra nada en lugar de algo sin verificar.',
  'The authority is unavailable: a turn cannot be started.':
    'La autoridad no está disponible: no se puede iniciar un turno.',
  'Starting the turn…': 'Iniciando el turno…',
  'Retry or dismiss the turn that was not started.':
    'Reintentá o descartá el turno que no se inició.',
  'The session could not be read.': 'No se pudo leer la sesión.',
  'Reading the session…': 'Leyendo la sesión…',
  'This session is closed.': 'Esta sesión está cerrada.',
  'A turn is running. The authority runs one at a time.':
    'Hay un turno corriendo. La autoridad corre uno a la vez.',
  'This session has no workspace. Activate it in Sessions.':
    'Esta sesión no tiene workspace. Activala en Sesiones.',
  'This session is not attached to Codex. Resume it in Sessions.':
    'Esta sesión no está conectada a Codex. Reanudala en Sesiones.',
  'The workspace binding of this session is not settled.':
    'La asociación de workspace de esta sesión no está definida.',
  'The authority reports that a turn cannot start now.':
    'La autoridad informa que ahora no se puede iniciar un turno.',
  'The input is longer than one turn can carry.':
    'La entrada es más larga de lo que puede tener un turno.',

  // Sessions: the managed session view and the presenter that words it
  'Managed sessions': 'Sesiones Managed',
  'Connecting to the authority': 'Conectando con la autoridad',
  'Authority unavailable': 'Autoridad no disponible',
  'New session': 'Nueva sesión',
  'Activate {name}': 'Activar {name}',
  'Activate session': 'Activar sesión',
  'New managed session': 'Nueva sesión Managed',
  Project: 'Proyecto',
  'No folder selected': 'Ninguna carpeta elegida',
  Mode: 'Modo',
  'The authority decides whether the folder can be a workspace, starts Codex if it is not running, and binds the session to it. A session keeps the mode it is created in.':
    'La autoridad decide si la carpeta puede ser un workspace, arranca Codex si no está corriendo y asocia la sesión a él. Una sesión conserva el modo con el que se creó.',
  'Local Tools gives Codex more to work with, not more authority: every command and file change waits for your approval. The authority runs one Codex runtime, in one mode and for one folder at a time.':
    'Local Tools le da a Codex más con qué trabajar, no más autoridad: cada comando y cambio de archivo espera tu aprobación. La autoridad corre un solo runtime de Codex, en un modo y para una carpeta a la vez.',
  'Change folder': 'Cambiar carpeta',
  'Choose folder': 'Elegir carpeta',
  'Restart Codex & activate': 'Reiniciar Codex y activar',
  Activate: 'Activar',
  'Create & activate': 'Crear y activar',
  'The authority is unavailable': 'La autoridad no está disponible',
  'Sessions are read from the authority and cannot be created, activated, resumed or closed until it is connected. The Console keeps working.':
    'Las sesiones se leen de la autoridad y no se pueden crear, activar, reanudar ni cerrar hasta que esté conectada. La consola sigue funcionando.',
  'Reading sessions…': 'Leyendo sesiones…',
  'No managed sessions yet.': 'Todavía no hay sesiones Managed.',
  'Create a session to let Wyss supervise Codex in one of your projects.':
    'Creá una sesión para que Wyss supervise Codex en uno de tus proyectos.',
  Updated: 'Actualizada',
  'Only the first 2,000 sessions can be listed.':
    'Solo se pueden listar las primeras 2.000 sesiones.',
  'Newest sessions': 'Sesiones más nuevas',
  'Older sessions · page {page}': 'Sesiones más viejas · página {page}',
  Newer: 'Más nuevas',
  Older: 'Más viejas',
  'Session details': 'Detalles de la sesión',
  'Hide details': 'Ocultar detalles',
  'Confirm close': 'Confirmar cierre',
  'Close this session? It cannot be reopened, and its execution lease is revoked.':
    '¿Cerrar esta sesión? No se puede reabrir, y su concesión de ejecución queda revocada.',
  'Close session': 'Cerrar sesión',
  'Keep open': 'Mantenerla abierta',
  'Confirm discard': 'Confirmar descarte',
  'Discard the uncertain attempt? The authority records that it was abandoned and stops holding the session for it. If Codex did create a thread for that attempt, the empty thread is left behind. The session can then be activated again.':
    '¿Descartar el intento incierto? La autoridad registra que se abandonó y deja de retener la sesión por él. Si Codex sí creó un hilo para ese intento, el hilo vacío queda. Después la sesión se puede volver a activar.',
  'Discard attempt': 'Descartar intento',
  'Keep it': 'Conservarlo',
  'Confirm mode': 'Confirmar modo',
  'Enable Local Tools for {name}?': '¿Habilitar Local Tools para {name}?',
  'Use Inference for {name}?': '¿Usar Inference para {name}?',
  'Enable Local Tools': 'Habilitar Local Tools',
  'Use Inference': 'Usar Inference',
  'Activation outcome uncertain': 'Resultado de la activación incierto',
  'The authority asked Codex to bind a workspace and could not confirm what Codex did. Nothing asks again by itself: a second request could create a second thread.':
    'La autoridad le pidió a Codex asociar un workspace y no pudo confirmar qué hizo. Nada vuelve a pedirlo por sí solo: una segunda solicitud podría crear un segundo hilo.',
  'Open agent': 'Abrir agente',
  Resume: 'Reanudar',
  Close: 'Cerrar',
  'This session runs in Inference: Codex is offered no tool. Local Tools needs a session of its own, because a conversation stays in the mode it was created in.':
    'Esta sesión corre en Inference: a Codex no se le ofrece ninguna herramienta. Local Tools necesita una sesión propia, porque una conversación se queda en el modo en que se creó.',
  'New Local Tools session': 'Nueva sesión de Local Tools',
  'This session runs in Local Tools. Every command and file change Codex proposes waits for your approval.':
    'Esta sesión corre en Local Tools. Cada comando y cambio de archivo que propone Codex espera tu aprobación.',
  'Activate binds a project folder and attaches the session to Codex.':
    'Activar asocia una carpeta de proyecto y conecta la sesión a Codex.',
  Session: 'Sesión',
  Revision: 'Revisión',
  Created: 'Creada',
  None: 'Ninguna',
  "The authority reports a session's mode while it is attached.":
    'La autoridad informa el modo de la sesión mientras está conectada.',
  '{prepared} prepared · {closed} closed':
    '{prepared} preparadas · {closed} cerradas',
  Prepared: 'Preparada',
  'No workspace': 'Sin workspace',
  'No workspace is bound to this session.':
    'Esta sesión no tiene un workspace asociado.',
  Binding: 'Asociando',
  'The authority is binding a workspace to this session.':
    'La autoridad está asociando un workspace a esta sesión.',
  Uncertain: 'Incierto',
  'The authority could not confirm whether the workspace binding was created.':
    'La autoridad no pudo confirmar si se creó la asociación de workspace.',
  Detached: 'Desconectada',
  'Bound to a workspace and not attached to the running agent.':
    'Asociada a un workspace y no conectada al agente en ejecución.',
  'Bound to a workspace and attached to the running agent.':
    'Asociada a un workspace y conectada al agente en ejecución.',
  'Text only. Codex is offered no tool.':
    'Solo texto. No se le ofrece ninguna herramienta a Codex.',
  'Codex may propose commands and file changes in this folder. Each one waits for your approval.':
    'Codex puede proponer comandos y cambios de archivos en esta carpeta. Cada uno espera tu aprobación.',
  'Model in use: not reported by the runtime':
    'Modelo en uso: el runtime no lo informó',
  'Model in use: not known while detached':
    'Modelo en uso: no se conoce mientras está desconectada',
  ', effort {level}': ', esfuerzo {level}',
  'Model in use: {model}{effort} (the runtime said it rerouted a turn from {from}, {reason}; whether later turns stay on it is not documented)':
    'Modelo en uso: {model}{effort} (el runtime dijo que redirigió un turno desde {from}, {reason}; no está documentado si los turnos siguientes siguen en él)',
  'for a safety reason it named': 'por un motivo de seguridad que nombró',
  'for a reason this app does not know': 'por un motivo que esta app no conoce',
  'Model in use: {model}{effort} (reported by the runtime when the session was resumed)':
    'Modelo en uso: {model}{effort} (informado por el runtime cuando la sesión se reanudó)',
  'Model in use: {model}{effort} (reported by the runtime when the session was started)':
    'Modelo en uso: {model}{effort} (informado por el runtime cuando la sesión se inició)',
  'Not attached': 'Sin conectar',
  'Codex runs in Local Tools for {folder}':
    'Codex corre en Local Tools para {folder}',
  'a workspace': 'un workspace',
  'Codex runs in Inference': 'Codex corre en Inference',
  'This restarts the managed Codex runtime in Local Tools for this workspace. Sessions attached now are detached. A session created in Inference cannot be resumed in Local Tools. Every command and file change still waits for your approval.':
    'Esto reinicia el runtime de Codex administrado en Local Tools para este workspace. Las sesiones conectadas ahora quedan desconectadas. Una sesión creada en Inference no se puede reanudar en Local Tools. Cada comando y cambio de archivo sigue esperando tu aprobación.',
  'This restarts the managed Codex runtime in Inference. Sessions attached now are detached. A session created in Local Tools cannot be resumed in Inference.':
    'Esto reinicia el runtime de Codex administrado en Inference. Las sesiones conectadas ahora quedan desconectadas. Una sesión creada en Local Tools no se puede reanudar en Inference.',
  '{current} now, and the authority runs one Codex runtime. Activating this session restarts it in {to}, and the sessions attached to it are detached.':
    '{current} ahora, y la autoridad corre un solo runtime de Codex. Activar esta sesión lo reinicia en {to}, y las sesiones conectadas a él quedan desconectadas.',
  'Local Tools for this folder': 'Local Tools para esta carpeta',
  '{restart} {kept}': '{restart} {kept}',
  'A session created in {from} cannot be resumed in {to}.':
    'Una sesión creada en {from} no se puede reanudar en {to}.',
  'Resuming session…': 'Reanudando la sesión…',
  'Closing session…': 'Cerrando la sesión…',
  'Discarding the uncertain attempt…': 'Descartando el intento incierto…',
  'Preparing session…': 'Preparando la sesión…',
  'Stopping the managed runtime…': 'Deteniendo el runtime administrado…',
  'Starting Codex…': 'Iniciando Codex…',
  'Creating workspace binding…': 'Creando la asociación de workspace…',
  'Attaching…': 'Conectando…',
  'Starting Codex in {mode}…': 'Iniciando Codex en {mode}…',
  'The session is not ready': 'La sesión no está lista',
  'The session is not ready in that mode':
    'La sesión no está lista en ese modo',
  'The session was not resumed': 'La sesión no se reanudó',
  'The session was not closed': 'La sesión no se cerró',
  'The attempt was not discarded': 'El intento no se descartó',
  'The authority did not answer, so the result is unknown. Retrying repeats the same request safely.':
    'La autoridad no respondió, así que el resultado es desconocido. Reintentar repite la misma solicitud sin riesgo.',
  'This session has no workspace binding to resume.':
    'Esta sesión no tiene una asociación de workspace para reanudar.',
  'The authority denied it because the agent runtime is not ready.':
    'La autoridad lo denegó porque el runtime del agente no está listo.',
  'A turn is running, and the runtime it runs on is not restarted under it. Wait for it or cancel it.':
    'Hay un turno en curso y el runtime en el que corre no se reinicia por debajo. Esperá a que termine o cancelalo.',
  'This session is attached in the other mode: its conversation exists only there.':
    'Esta sesión está conectada en el otro modo: su conversación existe solo ahí.',
  'The authority did not accept that folder as a workspace. Nothing was bound.':
    'La autoridad no aceptó esa carpeta como workspace. No se asoció nada.',
  'The session already has a workspace binding. It has been read again.':
    'La sesión ya tiene una asociación de workspace. Se volvió a leer.',
  'The authority denied it: no execution lease allows this for the session.':
    'La autoridad lo denegó: ninguna concesión de ejecución permite esto para la sesión.',
  'The agent refused to resume this session.':
    'El agente rechazó reanudar esta sesión.',
  'The authority could not confirm what the agent did. Check the session before trying again.':
    'La autoridad no pudo confirmar qué hizo el agente. Revisá la sesión antes de volver a intentarlo.',
  'That request was already used for something else. Try again.':
    'Esa solicitud ya se usó para otra cosa. Probá de nuevo.',
  'The authority refused: the session no longer allows it.':
    'La autoridad rechazó: la sesión ya no lo permite.',
  'Codex is not ready, so the session could not be bound or attached.':
    'Codex no está listo, así que la sesión no se pudo asociar ni conectar.',
  'Codex refused the request.': 'Codex rechazó la solicitud.',
  'Codex did not come up in that mode. The runtime is as the authority reports it.':
    'Codex no arrancó en ese modo. El runtime queda como lo informa la autoridad.',
  'Codex refused to resume this session in that mode. A session resumes only in the mode it was created in. The runtime now runs in the mode that was asked for.':
    'Codex rechazó reanudar esta sesión en ese modo. Una sesión solo se reanuda en el modo en que se creó. El runtime ahora corre en el modo que se pidió.',
  'This session has no workspace to run a mode for.':
    'Esta sesión no tiene un workspace en el que correr un modo.',
  'Codex refused to resume this session. A session resumes only in the mode it was created in: if Codex runs in the other one now, change the mode for this session instead.':
    'Codex rechazó reanudar esta sesión. Una sesión solo se reanuda en el modo en que se creó: si Codex corre ahora en el otro, cambiá el modo de esta sesión.',
  'The authority holds no uncertain attempt for this session any more.':
    'La autoridad ya no tiene ningún intento incierto para esta sesión.',
  '{action}. The authority refused to start Codex in Local Tools: it could not set up or prove the isolation that mode requires. Nothing runs without it.':
    '{action}. La autoridad rechazó iniciar Codex en Local Tools: no pudo preparar ni comprobar el aislamiento que ese modo exige. Nada corre sin él.',
  'Activation outcome uncertain: the authority could not confirm whether Codex created the workspace binding. Nothing is sent again by itself.':
    'Resultado de la activación incierto: la autoridad no pudo confirmar si Codex creó la asociación de workspace. Nada se vuelve a enviar por sí solo.',
  '{action}. {reason}': '{action}. {reason}',
  'Sessions could not be read: the authority did not answer.':
    'No se pudieron leer las sesiones: la autoridad no respondió.',
  'Sessions could not be read. {reason}':
    'No se pudieron leer las sesiones. {reason}',
  'Sessions could not be read. Nothing is shown rather than something unverified.':
    'No se pudieron leer las sesiones. No se muestra nada en lugar de algo no verificado.',
  'That folder cannot be used: its path is too long or cannot be written as text.':
    'Esa carpeta no se puede usar: su ruta es demasiado larga o no se puede escribir como texto.',
  'The folder dialog is already open.':
    'El diálogo de carpetas ya está abierto.',
  'The folder dialog could not be opened.':
    'No se pudo abrir el diálogo de carpetas.',
  'A closed session cannot be resumed.':
    'Una sesión cerrada no se puede reanudar.',
  'Ready: attached to the running agent.':
    'Lista: conectada al agente en ejecución.',
  'Resume needs a workspace bound to the session.':
    'Reanudar necesita un workspace asociado a la sesión.',
  'Resume has to wait until the workspace binding is settled.':
    'Reanudar tiene que esperar a que la asociación de workspace esté definida.',
  'The agent runtime is not ready, so there is nothing to attach to.':
    'El runtime del agente no está listo, así que no hay a qué conectarse.',

  // Models: what is offered, configured, selected and reported in use
  offers: 'ofrece',
  configured: 'configurado',
  selects: 'selecciona',

  '{effort}': '{effort}',
  'not shown here': 'no se muestra acá',

  // Credentials: the API keys the desktop keeps sealed
  'API credentials': 'Credenciales de API',
  'API keys for the AI services, kept sealed on this computer (the key that seals them is in your Secret Service). A key is typed in a window of its own and is never shown again, never sent to this page and never written unsealed. Only a name, the service and a short checksum are listed. Nothing here starts an agent with a key.':
    'Claves de API de los servicios de IA, guardadas selladas en esta computadora (la clave que las sella está en tu Secret Service). Una clave se escribe en una ventana propia y nunca se vuelve a mostrar, nunca se envía a esta página y nunca se escribe sin sellar. Solo se listan un nombre, el servicio y un checksum corto. Acá nada arranca un agente con una clave.',
  'The name must be 1 to 60 characters, without control characters.':
    'El nombre tiene que tener de 1 a 60 caracteres, sin caracteres de control.',
  'The key may not be empty, hold spaces or line breaks, or be longer than 4096 characters.':
    'La clave no puede estar vacía, tener espacios o saltos de línea, ni superar los 4096 caracteres.',
  'That key is not kept any more.': 'Esa clave ya no está guardada.',
  'There are too many keys (100).': 'Hay demasiadas claves (100).',
  'No key store (the Secret Service) is available, so nothing was kept. A key is never kept unsealed.':
    'No hay un almacén de claves (el Secret Service) disponible, así que no se guardó nada. Una clave nunca se guarda sin sellar.',
  'The key that sealed this record is gone from the key store. Replace the key.':
    'La clave que selló este registro ya no está en el almacén de claves. Reemplazá la clave.',
  'The record is damaged. Replace the key.':
    'El registro está dañado. Reemplazá la clave.',
  'The Console could not write its own state.':
    'La consola no pudo escribir su propio estado.',
  'Something went wrong in the desktop.': 'Algo salió mal en el escritorio.',
  'The folder of this launch could not be prepared, so nothing was started. Your own configuration was not changed. Try again; if it keeps failing, save the launch again in Workspace.':
    'No se pudo preparar la carpeta de este lanzamiento, así que no se inició nada. Tu configuración no se tocó. Probá de nuevo; si sigue fallando, guardá el lanzamiento otra vez en Workspace.',
  'The version of this agent could not be read, so the launch was not started with a folder of its own. Check that the agent runs from a terminal and try again.':
    'No se pudo leer la versión de este agente, así que el lanzamiento no arrancó con carpeta propia. Fijate que el agente corra desde una terminal y probá de nuevo.',
  'This launch starts Claude Code with a folder of its own, and that needs your long-lived sign-in token from the keyring. None could be read from it, so nothing was started. The launch environment panel in Arsenal says how to store it.':
    'Este lanzamiento arranca Claude Code con carpeta propia, y para eso hace falta tu token de acceso de larga duración del llavero. No se pudo leer ninguno, así que no se inició nada. El panel de entorno de lanzamiento del Arsenal explica cómo guardarlo.',
  'A file of launch environments would be too long with this change, so it was not saved. Leave fewer things out, or delete presets you no longer use.':
    'Con este cambio, un archivo de entornos de lanzamiento quedaría demasiado largo, así que no se guardó. Dejá menos cosas afuera o borrá presets que ya no uses.',
  'Skill exclusion is not qualified for this exact Codex build, so nothing was started with it. Start without applying the selection, or use a qualified Codex build.':
    'Sacar skills no está calificado para esta versión exacta de Codex, así que no se inició nada con eso. Arrancá sin aplicar la selección o usá una versión de Codex calificada.',
  'The launch environment could not be saved: the file of launch environments cannot be read. It was not changed.':
    'No se pudo guardar el entorno de lanzamiento: el archivo de entornos no se puede leer. No se modificó.',
  Other: 'Otro',
  'Add a key': 'Agregar una clave',
  'Enter the key…': 'Ingresar la clave…',
  'Reading…': 'Leyendo…',
  Global: 'Global',
  '1 launch': '1 lanzamiento',
  Context: 'Contexto',
  No: 'No',
  'Not known': 'No se sabe',
  Origin: 'Origen',
  'What it does': 'Qué hace',
  Yes: 'Sí',
  'Arsenal presets': 'Presets de Arsenal',
  'The earlier Arsenal screen: presets by provider':
    'La pantalla anterior de Arsenal: presets por proveedor',
  'No keys yet': 'Todavía no hay claves',
  'Add one above. Its value is asked for in a separate window.':
    'Agregá una arriba. Su valor se pide en una ventana aparte.',
  Keys: 'Claves',
  'New name': 'Nombre nuevo',
  checksum: 'checksum',
  'kept {date}': 'guardada el {date}',
  'changed {date}': 'cambiada el {date}',
  'Save name': 'Guardar nombre',
  'Replace key…': 'Reemplazar clave…',
  Rename: 'Renombrar',
  Check: 'Verificar',
  'Delete…': 'Eliminar…',
  'Key kept, sealed.': 'Clave guardada, sellada.',
  'Key replaced.': 'Clave reemplazada.',
  'Renamed.': 'Renombrada.',
  'Key deleted.': 'Clave eliminada.',
  'The key opens and matches its checksum.':
    'La clave se abre y coincide con su checksum.',
  'The record is damaged: replace the key.':
    'El registro está dañado: reemplazá la clave.',

  Approve: 'Aprobar',
  Deny: 'Rechazar',

  // Configuration: the items view, its changes and history, and the sentences of its presenter
  item: 'elemento',
  items: 'elementos',
  from: 'de',
  places: 'lugares',
  Reading: 'Leyendo',
  'This is what Claude Code and Codex are set up with, read from their own files. Nothing changes until you confirm a plan, and Claude Code hooks and skills, Codex skills and MCP servers, and OpenCode MCP servers and plugins can be switched here. You can also write a Claude Code hook or an MCP server for Codex or OpenCode, in a separate window. Secrets in commands, environments and headers are never shown.':
    'Esto es lo que tienen configurado Claude Code y Codex, leído de sus propios archivos. No cambia nada hasta que confirmes un plan, y los hooks y skills de Claude Code, las skills y los servidores MCP de Codex, y los servidores MCP y plugins de OpenCode se pueden activar o desactivar desde acá. También podés escribir un hook de Claude Code o un servidor MCP para Codex u OpenCode, en una ventana aparte. Los secretos de comandos, entornos y encabezados nunca se muestran.',
  'Change to confirm': 'Cambio para confirmar',
  'What would change': 'Qué cambiaría',
  'Another account you named in': 'Otra cuenta que nombraste en',
  'can also write this file’s folder. It is accepted because you named it.':
    'también puede escribir la carpeta de este archivo. Se acepta porque la nombraste.',
  'This entry holds values that are not shown here.':
    'Esta entrada tiene valores que no se muestran acá.',
  'Prediction, not a reading: managed Inference':
    'Predicción, no una lectura: Inference administrado',
  now: 'ahora',
  'and this change does not alter that.': 'y este cambio no lo altera.',
  'and would': 'y',
  'after it.': 'después de este cambio.',
  'Waiting for the confirmation window…':
    'Esperando la ventana de confirmación…',
  'Applying…': 'Aplicando…',
  'Continue to confirm': 'Seguir para confirmar',
  Apply: 'Aplicar',
  'Preparing the change…': 'Preparando el cambio…',
  'This could not be read again just now. What is shown is from the last successful read.':
    'No se pudo volver a leer ahora mismo. Lo que se muestra es de la última lectura exitosa.',
  'There are more items than this app reads at once. Some are not listed.':
    'Hay más elementos de los que esta app lee de una vez. Algunos no aparecen.',
  'Reading configuration…': 'Leyendo configuración…',
  'There is no configuration to read here':
    'Acá no hay configuración para leer',
  'The app could not find where your account keeps its files. Nothing is shown, which does not mean there is nothing configured.':
    'La app no encontró dónde guarda tu cuenta sus archivos. No se muestra nada, lo que no quiere decir que no haya nada configurado.',
  'The configuration could not be read': 'No se pudo leer la configuración',
  View: 'Vista',
  Items: 'Elementos',
  'Turned off': 'Desactivados',
  History: 'Historial',
  'Add a hook…': 'Agregar un hook…',
  'Add an MCP server…': 'Agregar un servidor MCP…',
  'New instruction file…': 'Nuevo archivo de instrucciones…',
  'Choose the project whose instruction files and skills are listed and may be changed.':
    'Elegí el proyecto cuyos archivos de instrucciones y skills se listan y se pueden cambiar.',
  'Choose another project.': 'Elegí otro proyecto.',
  'Choose project…': 'Elegir proyecto…',
  'Project: {project}': 'Proyecto: {project}',
  'No project': 'Sin proyecto',
  'Add a hook': 'Agregar un hook',
  'New instruction file': 'Nuevo archivo de instrucciones',
  'Add an MCP server': 'Agregar un servidor MCP',
  'Choose when it runs. The command is typed next, in a separate window.':
    'Elegí cuándo corre. El comando se escribe después, en una ventana aparte.',
  Event: 'Evento',
  'Matcher (optional)': 'Coincidencia (opcional)',
  'Start from a sealed template (asks for the file and its passphrase; what it holds is shown for review before anything is planned)':
    'Empezar desde una plantilla sellada (pide el archivo y su frase de paso; lo que tiene se muestra para revisar antes de planear algo)',
  'Creates a file that does not exist yet. The name (where one is needed) and the text are typed next, in a separate window; nothing is written until you review the plan and confirm it separately. Undo removes it again.':
    'Crea un archivo que todavía no existe. El nombre (cuando hace falta) y el texto se escriben después, en una ventana aparte; no se escribe nada hasta que revises el plan y lo confirmes por separado. Deshacer lo borra de nuevo.',
  Where: 'Dónde',
  'Project “{project}”': 'Proyecto “{project}”',
  'What to create': 'Qué crear',
  'Start from a sealed template (asks for the file and its passphrase)':
    'Empezar desde una plantilla sellada (pide el archivo y su frase de paso)',
  'Name the server and say what it is. What it starts or connects to is typed next, in a separate window.':
    'Poné nombre al servidor y decí qué es. Lo que arranca o a lo que se conecta se escribe después, en una ventana aparte.',
  Kind: 'Tipo',
  'Starts a program': 'Arranca un programa',
  'Connects to an address': 'Se conecta a una dirección',
  'Continue…': 'Continuar…',
  'Reading the history…': 'Leyendo el historial…',
  'No changes yet': 'Todavía no hay cambios',
  'Changes you make here are listed, without their content.':
    'Los cambios que hagas acá se listan, sin su contenido.',
  Changes: 'Cambios',
  '· an undo': '· un deshacer',
  'Not finished': 'No terminado',
  Undo: 'Deshacer',
  'Older changes': 'Cambios anteriores',
  'Import a kept hook…': 'Importar un hook guardado…',
  'Nothing is turned off': 'No hay nada desactivado',
  'A hook you turn off is removed from its file and kept here, so it can be put back exactly.':
    'Un hook que desactivás se quita de su archivo y queda guardado acá, así se puede restaurar tal cual.',
  'Turned-off hooks': 'Hooks desactivados',
  Kept: 'Guardado el',
  encrypted: 'cifrado',
  'not encrypted (no secret in it)': 'sin cifrar (no tiene secretos)',
  '· holds hidden values': '· tiene valores ocultos',
  '· kept past the usual time; it stays until you decide':
    '· guardado más tiempo del habitual; queda hasta que decidas',
  'Put back': 'Restaurar',
  'Export…': 'Exportar…',
  Forget: 'Olvidar',
  'Filter by agent': 'Filtrar por agente',
  'All agents': 'Todos los agentes',
  'Filter by kind': 'Filtrar por tipo',
  Everything: 'Todo',
  'Search by name': 'Buscar por nombre',
  'Found in': 'Encontrado en',
  'In the file': 'En el archivo',
  'In use': 'En uso',
  'Changing it': 'Cambiarlo',
  'You can do it here, with a plan you confirm.':
    'Podés hacerlo acá, con un plan que confirmás.',
  'You can change it here: you review the text in a separate window, then confirm a plan.':
    'Podés cambiarlo acá: revisás el texto en una ventana aparte y después confirmás un plan.',
  Fingerprint: 'Huella',
  'Change it…': 'Cambiar…',
  'Export template…': 'Exportar plantilla…',
  'Apply template…': 'Aplicar plantilla…',
  value: 'valor',
  'Nothing to show': 'Nada para mostrar',
  'No hooks, skills, servers, rules or model settings were found in the places that were read.':
    'No se encontraron hooks, skills, servidores, reglas ni ajustes de modelo en los lugares que se leyeron.',
  'Nothing matches this filter.': 'Nada coincide con este filtro.',
  'Configuration items': 'Elementos de configuración',
  '· values hidden': '· valores ocultos',
  'Where this was read from': 'De dónde se leyó',
  problem: 'problema',
  problems: 'problemas',
  'Its folder is shared with a group, so it is only read.':
    'Su carpeta es compartida con un grupo, así que solo se lee.',
  Hooks: 'Hooks',
  Skills: 'Skills',
  'MCP servers': 'Servidores MCP',
  'Rule files': 'Archivos de reglas',
  Plugins: 'Plugins',
  Hook: 'Hook',
  Skill: 'Skill',
  'MCP server': 'Servidor MCP',
  'Rule file': 'Archivo de reglas',
  'Model setting': 'Ajuste de modelo',
  Plugin: 'Plugin',
  'On in the file': 'Activado en el archivo',
  'Off in the file': 'Desactivado en el archivo',
  'Not in the file': 'No está en el archivo',
  Parked: 'Apartado',
  'Could not be read': 'No se pudo leer',
  'Confirmed active': 'Activo confirmado',
  'Confirmed inactive': 'Inactivo confirmado',
  'As the provider documents it': 'Según documenta el proveedor',
  'Cannot be confirmed without running the provider':
    'No se puede confirmar sin ejecutar el proveedor',
  'Your account': 'Tu cuenta',
  'Managed settings': 'Ajustes administrados',
  'User settings': 'Ajustes del usuario',
  'Account file (MCP servers only)':
    'Archivo de la cuenta (solo servidores MCP)',
  'User skills folder': 'Carpeta de skills del usuario',
  'User rules': 'Reglas del usuario',
  'Project settings': 'Ajustes del proyecto',
  'Project local settings': 'Ajustes locales del proyecto',
  'Project MCP file': 'Archivo MCP del proyecto',
  'Project skills folder': 'Carpeta de skills del proyecto',
  'Project rules': 'Reglas del proyecto',
  'Administrator requirements': 'Requisitos del administrador',
  'Managed configuration': 'Configuración administrada',
  'User configuration': 'Configuración del usuario',
  'User hooks file': 'Archivo de hooks del usuario',
  'User instructions': 'Instrucciones del usuario',
  'User skills folder (~/.agents/skills)':
    'Carpeta de skills del usuario (~/.agents/skills)',
  'Project configuration': 'Configuración del proyecto',
  'Project instructions': 'Instrucciones del proyecto',
  'Set by the system; this app never changes it':
    'Lo define el sistema; esta app nunca lo cambia',
  'Owned by the provider; changed only through its own command':
    'Es del proveedor; solo se cambia con su propio comando',
  'Produced by another tool': 'Lo genera otra herramienta',
  'Its folder can be written by a group: read, never changed':
    'Su carpeta la puede escribir un grupo: solo se lee, nunca se cambia',
  'Read-only for now: changing it is not available yet':
    'Solo lectura por ahora: cambiarlo todavía no está disponible',
  'environment value': 'valor de entorno',
  header: 'encabezado',
  'address credentials': 'credenciales de la dirección',
  'secret field': 'campo secreto',
  token: 'token',
  'It is not there.': 'No está.',
  'It could not be read.': 'No se pudo leer.',
  'It kept changing while it was being read. It will be read again.':
    'Cambió mientras se leía. Se va a leer de nuevo.',
  'It holds credentials, so it is never opened.':
    'Tiene credenciales, así que nunca se abre.',
  'Where it leads is outside the places this app may read.':
    'A donde apunta está fuera de los lugares que esta app puede leer.',
  'Its place is not safe to read from: someone else owns or can change it.':
    'Su lugar no es seguro para leer: otro lo tiene o lo puede cambiar.',
  'It is behind too many links.': 'Está detrás de demasiados enlaces.',
  'It is not a regular file.': 'No es un archivo regular.',
  'It is larger than the bounds this app reads.':
    'Es más grande de lo que esta app lee.',
  'It is not valid: reading stopped at line {line}, column {column}.':
    'No es válido: la lectura se detuvo en la línea {line}, columna {column}.',
  'Read. A conflict copy of this file sits beside it, so it cannot be changed from here until that copy is dealt with.':
    'Leído. Hay una copia en conflicto de este archivo al lado, así que no se puede cambiar desde acá hasta resolver esa copia.',
  'Read. {entries}': 'Leído. {entries}',
  '{count} entry was not recognised and left untouched.':
    '{count} entrada no se reconoció y quedó sin tocar.',
  '{count} entries were not recognised and left untouched.':
    '{count} entradas no se reconocieron y quedaron sin tocar.',
  'Read.': 'Leído.',
  'Not present.': 'No está presente.',
  'Not read: Codex loads a project’s own configuration only for a project you trust.':
    'No se leyó: Codex carga la configuración propia de un proyecto solo para un proyecto de confianza.',
  empty: 'vacío',
  none: 'ninguno',
  'hidden ({kind})': 'oculto ({kind})',
  'Change this instruction file': 'Cambiar este archivo de instrucciones',
  'Create this instruction file': 'Crear este archivo de instrucciones',
  'Delete this instruction file (kept encrypted, so it can be put back)':
    'Borrar este archivo de instrucciones (queda guardado cifrado, para poder restaurarlo)',
  'Turn off this hook': 'Desactivar este hook',
  'Put this hook back': 'Volver a poner este hook',
  'Turn off every hook': 'Desactivar todos los hooks',
  'Allow hooks again': 'Volver a permitir los hooks',
  'Turn off this skill': 'Desactivar esta skill',
  'Turn on this skill': 'Activar esta skill',
  'Turn off this Codex skill': 'Desactivar esta skill de Codex',
  'Turn on this Codex skill': 'Activar esta skill de Codex',
  'Turn off this Codex MCP server': 'Desactivar este servidor MCP de Codex',
  'Turn on this Codex MCP server': 'Activar este servidor MCP de Codex',
  'Turn off this OpenCode MCP server':
    'Desactivar este servidor MCP de OpenCode',
  'Turn on this OpenCode MCP server': 'Activar este servidor MCP de OpenCode',
  'Turn off this OpenCode plugin': 'Desactivar este plugin de OpenCode',
  'Add this hook': 'Agregar este hook',
  'Change this hook’s command': 'Cambiar el comando de este hook',
  'Add this OpenCode MCP server': 'Agregar este servidor MCP de OpenCode',
  'Change this OpenCode MCP server': 'Cambiar este servidor MCP de OpenCode',
  'Delete this OpenCode MCP server (kept, so it can be put back)':
    'Borrar este servidor MCP de OpenCode (queda guardado, para poder restaurarlo)',
  'Take back what you wrote': 'Quitar lo que escribiste',
  'Add this Codex MCP server': 'Agregar este servidor MCP de Codex',
  'Change this Codex MCP server': 'Cambiar este servidor MCP de Codex',
  'Delete this Codex MCP server (kept, so it can be put back)':
    'Borrar este servidor MCP de Codex (queda guardado, para poder restaurarlo)',
  'This can switch off something that stops an action. You will be asked to confirm in a separate window.':
    'Esto puede desactivar algo que frena una acción. Te van a pedir confirmar en una ventana aparte.',
  'This writes, or puts back, something that runs programs. You will be asked to confirm in a separate window.':
    'Esto escribe, o vuelve a poner, algo que ejecuta programas. Te van a pedir confirmar en una ventana aparte.',
  'Written and read back. Reload and use by a running provider are not observed.':
    'Escrito y releído. No se observa la recarga ni el uso por un proveedor en ejecución.',
  'A new Claude Code session follows the file (checked). A session that is already running is documented to pick it up; that has not been checked.':
    'Una sesión nueva de Claude Code sigue el archivo (verificado). Una sesión que ya está corriendo, según la documentación, lo toma; eso no se verificó.',
  'A new Codex process shows the server as the file says (checked). A Codex session that is already running is not known to follow it.':
    'Un proceso nuevo de Codex muestra el servidor como dice el archivo (verificado). No se sabe si una sesión de Codex que ya está corriendo lo sigue.',
  'A new OpenCode process reads the file. That a running OpenCode follows it has not been checked.':
    'Un proceso nuevo de OpenCode lee el archivo. No se verificó que un OpenCode en ejecución lo siga.',
  'A new Codex process lists the skill as the file says (checked, through its own skills/list). A Codex session that is already running is not known to follow it.':
    'Un proceso nuevo de Codex lista la skill como dice el archivo (verificado, con su propio skills/list). No se sabe si una sesión de Codex que ya está corriendo la sigue.',
  'A new Claude Code session refuses to run a skill that is switched off (checked). Skills that come from a plugin are not affected. What a running session does is not known.':
    'Una sesión nueva de Claude Code no ejecuta una skill desactivada (verificado). Las skills que vienen de un plugin no se afectan. No se sabe qué hace una sesión que ya está corriendo.',
  'What this keeps is stored on this computer, encrypted, with a key held by your system’s credential store. If that store is reset or its key is lost, it cannot be put back from here.':
    'Lo que se guarda queda en esta computadora, cifrado, con una clave que tiene el almacén de credenciales del sistema. Si ese almacén se resetea o se pierde su clave, desde acá no se puede restaurar.',
  'What this keeps is stored on this computer as a private file that is not encrypted: it holds no secret, and no credential store could be reached.':
    'Lo que se guarda queda en esta computadora como archivo privado sin cifrar: no tiene ningún secreto, y no se pudo acceder a ningún almacén de credenciales.',
  'Done. The file was changed and read back.':
    'Listo. El archivo se cambió y se volvió a leer.',
  'Cancelled in the confirmation window. Nothing was changed.':
    'Cancelado en la ventana de confirmación. No se cambió nada.',
  'The file changed after this was planned, so nothing was written. Plan it again.':
    'El archivo cambió después de planear esto, así que no se escribió nada. Volvé a planearlo.',
  'The entry is no longer there.': 'La entrada ya no está.',
  'The entry is not the one that was planned. Nothing was written.':
    'La entrada no es la que se planeó. No se escribió nada.',
  'A conflict copy of this file exists beside it. Resolve that first; nothing was written.':
    'Hay una copia en conflicto de este archivo al lado. Resolvela primero; no se escribió nada.',
  'The plan was too old and was dropped. Plan it again.':
    'El plan era muy viejo y se descartó. Volvé a planearlo.',
  'Your system’s credential store is not available, so an entry that may hold a secret is not kept. Nothing was written.':
    'El almacén de credenciales del sistema no está disponible, así que no se guarda una entrada que puede tener un secreto. No se escribió nada.',
  'The kept entry cannot be read. Nothing was written.':
    'La entrada guardada no se puede leer. No se escribió nada.',
  'The file could not be written. It is as it was.':
    'No se pudo escribir el archivo. Quedó como estaba.',
  'The file was written, but what it holds is not what was planned. Check it.':
    'El archivo se escribió, pero lo que tiene no es lo que se planeó. Revisalo.',
  'The history could not be written, so nothing was changed.':
    'No se pudo escribir el historial, así que no se cambió nada.',
  'Interrupted, then found complete at start.':
    'Interrumpido; al arrancar se encontró completo.',
  'Interrupted before it changed the file.':
    'Interrumpido antes de cambiar el archivo.',
  'Interrupted while Claude Code was writing the same file. Its newer version was put back and nothing of ours was kept.':
    'Interrumpido mientras Claude Code escribía el mismo archivo. Se restauró su versión más nueva y no se guardó nada nuestro.',
  'Interrupted, and the file holds neither version. Check it.':
    'Interrumpido, y el archivo no tiene ninguna de las dos versiones. Revisalo.',
  'Changing the configuration is not available here.':
    'Cambiar la configuración no está disponible acá.',
  'That request is not one the app accepts.':
    'Esa solicitud no es una que la app acepte.',
  'Something went wrong. Nothing was changed.':
    'Algo salió mal. No se cambió nada.',
  'That cannot be changed from here.': 'Eso no se puede cambiar desde acá.',
  'Its file is not one this app may write: it is shared, owned by someone else, or provider-owned.':
    'Su archivo no es uno que esta app pueda escribir: es compartido, de otra persona o del proveedor.',
  'Its file is not there.': 'Su archivo no está.',
  'Its file could not be read.': 'No se pudo leer su archivo.',
  'Its file is not valid JSON, so it is left alone.':
    'Su archivo no es JSON válido, así que no se toca.',
  'The entry is not the one that was planned, or has a value this app does not know how to change.':
    'La entrada no es la que se planeó, o tiene un valor que esta app no sabe cambiar.',
  'It already is that way.': 'Ya está así.',
  'Something already has that name. It was not touched, and nothing was written.':
    'Ya existe algo con ese nombre. No se tocó nada y no se escribió nada.',
  'A different entry is where this one would go. Nothing was written.':
    'Hay otra entrada donde iría esta. No se escribió nada.',
  'Your system’s credential store is not available, and this entry may hold a secret, so it is not turned off individually. You can turn off every hook, or edit the file yourself.':
    'El almacén de credenciales del sistema no está disponible, y esta entrada puede tener un secreto, así que no se desactiva por separado. Podés desactivar todos los hooks o editar el archivo vos mismo.',
  'The kept entry is damaged and was not used.':
    'La entrada guardada está dañada y no se usó.',
  'The key that protected this entry is gone, so it cannot be put back from here.':
    'Se perdió la clave que protegía esta entrada, así que desde acá no se puede restaurar.',
  'That plan is gone. Plan it again.':
    'Ese plan ya no está. Volvé a planearlo.',
  'That cannot be undone from here.': 'Eso no se puede deshacer desde acá.',
  'That file is not a kept entry, or the passphrase is wrong.':
    'Ese archivo no es una entrada guardada, o la frase de paso es incorrecta.',
  'A passphrase is needed.': 'Hace falta una frase de paso.',
  'That is not something that can be written: an event this app does not know, an empty or multi-line command, an unusable name or address.':
    'Eso no se puede escribir: un evento que esta app no conoce, un comando vacío o de varias líneas, o un nombre o una dirección que no sirven.',
  'Cancelled. Nothing was changed.': 'Cancelado. No se cambió nada.',
  'That folder cannot be the project: it must be your own, inside your home, with no link on the way and nobody else able to write it or the folders above it.':
    'Esa carpeta no puede ser el proyecto: tiene que ser tuya, dentro de tu carpeta personal, sin enlaces en el camino y sin que otro pueda escribirla ni las carpetas de arriba.',
  'can start': 'puede arrancar',
  'cannot start: a hook is enabled in Codex’s files':
    'no puede arrancar: hay un hook activado en los archivos de Codex',
  'cannot start: an MCP server’s name or count cannot be proved':
    'no puede arrancar: no se puede comprobar el nombre ni la cantidad de un servidor MCP',
  'Exported. Keep the file and the passphrase safe.':
    'Exportado. Guardá el archivo y la frase de paso en un lugar seguro.',
  'Imported. It is listed under Turned off.':
    'Importado. Figura en Desactivados.',
  'The plan was dropped because it was too old.':
    'Se descartó el plan porque era muy viejo.',
  'Turn off': 'Desactivar',
  'Turn on': 'Activar',
  'Claude Code skill': 'Skill de Claude Code',
  'Claude Code rule (rules/…)': 'Regla de Claude Code (rules/…)',
  'Claude Code CLAUDE.md': 'CLAUDE.md de Claude Code',
  'Codex skill (~/.agents/skills)': 'Skill de Codex (~/.agents/skills)',
  'Codex AGENTS.md': 'AGENTS.md de Codex',
  'Codex AGENTS.override.md': 'AGENTS.override.md de Codex',
  'OpenCode AGENTS.md': 'AGENTS.md de OpenCode',

  // Events: the authority's record, the presenter that words each event and the window's labels
  All: 'Todos',
  Lease: 'Concesión',
  Approval: 'Aprobación',
  'Needs a look': 'Hay que revisar',
  Isolation: 'Aislamiento',
  session: 'sesión',
  '{count} loaded': '{count} cargados',
  'newest first': 'más recientes primero',
  '{count} shown': '{count} mostrados',
  'Newest events': 'Eventos más recientes',
  'Turn {id}': 'Turno {id}',
  Clear: 'Quitar',
  'Filter events': 'Filtrar eventos',
  'Events, newest first': 'Eventos, más recientes primero',
  'Event details': 'Detalles del evento',
  'Events of an earlier stream': 'Eventos de un stream anterior',
  'Load older': 'Cargar anteriores',
  'Older events exist and are not loaded.':
    'Hay eventos anteriores que no están cargados.',
  'New events available': 'Hay eventos nuevos',
  'No loaded event matches.': 'Ningún evento cargado coincide.',
  'Filters apply to the events loaded here, not to all of history.':
    'Los filtros se aplican a los eventos cargados acá, no a todo el historial.',
  'Authority offline. Showing previously loaded history: it was read before the connection was lost and nothing newer is known.':
    'Autoridad sin conexión. Se muestra el historial cargado antes: se leyó antes de que se cortara la conexión y no se sabe nada más nuevo.',
  'Showing previously loaded history. It is being read again.':
    'Se muestra el historial cargado antes. Se está leyendo de nuevo.',
  'The authority restarted. It kept the same event stream: the history below continues, and what it ended on the way is recorded in it.':
    'La autoridad se reinició. Conservó el mismo stream de eventos: el historial de abajo sigue, y lo que quedó a medio camino consta en él.',
  "Events are the authority's own record and are read from it. Nothing is shown until it is connected. Your local terminals keep working.":
    'Los eventos son el registro propio de la autoridad y se leen de ella. No se muestra nada hasta que esté conectada. Tus terminales locales siguen funcionando.',
  'Reading events…': 'Leyendo eventos…',
  'No events yet.': 'Todavía no hay eventos.',
  'The authority records every session, runtime, turn, approval and lease change it commits. Nothing has been recorded in this stream.':
    'La autoridad registra cada cambio de sesión, runtime, turno, aprobación y concesión que confirma. Todavía no se registró nada en este stream.',
  'New authority event stream': 'Nuevo stream de eventos de la autoridad',
  'The events above belong to the stream the authority holds now. The ones below were read from another stream (':
    'Los eventos de arriba pertenecen al stream que la autoridad tiene ahora. Los de abajo se leyeron de otro stream (',
  ') and are not continued by them: positions of the two are unrelated.':
    ') y no continúan en ellos: las posiciones de ambos no tienen relación entre sí.',
  'Lease until': 'Concesión hasta',
  Position: 'Posición',
  'in stream {id}': 'en el stream {id}',
  'This record was read from a stream the authority no longer holds here. What it is about cannot be opened or read from this authority.':
    'Este registro se leyó de un stream que la autoridad ya no tiene acá. Aquello a lo que se refiere no se puede abrir ni leer desde esta autoridad.',
  'This is a record of what happened then. What it is about may have changed since: that is read from the authority where it lives.':
    'Es un registro de lo que pasó en ese momento. Aquello a lo que se refiere puede haber cambiado desde entonces: eso se lee de la autoridad donde vive.',
  'Open session': 'Abrir sesión',
  'Open in Agents': 'Abrir en Agentes',
  'Show events of this turn': 'Ver eventos de este turno',
  'Show events of this session': 'Ver eventos de esta sesión',
  'Check what it is now': 'Ver cómo está ahora',
  'Open Approvals': 'Abrir Aprobaciones',
  'Now:': 'Ahora:',
  'The authority no longer holds what it was about.':
    'La autoridad ya no tiene aquello a lo que se refería.',
  'What it is about is shown in Approvals.':
    'Aquello a lo que se refiere se ve en Aprobaciones.',
  'Approval detail is no longer available. The record above is still what happened.':
    'El detalle de la aprobación ya no está disponible. El registro de arriba sigue siendo lo que pasó.',
  'The approval could not be read from the authority.':
    'No se pudo leer la aprobación desde la autoridad.',
  'bind a workspace': 'vincular un workspace',
  'attach to Codex': 'conectarse a Codex',
  'start a turn': 'iniciar un turno',
  'run approved commands': 'correr comandos aprobados',
  'apply approved file changes': 'aplicar cambios de archivos aprobados',
  'Codex was not available to start.':
    'Codex no estuvo disponible para arrancar.',
  'The authority could not launch Codex.': 'La autoridad no pudo lanzar Codex.',
  'The connection to Codex failed.': 'Falló la conexión con Codex.',
  'Codex did not answer in time when it started.':
    'Codex no respondió a tiempo al arrancar.',
  'Codex did not speak the protocol the authority expects.':
    'Codex no habló el protocolo que espera la autoridad.',
  'Codex asked for something this runtime is not allowed to answer.':
    'Codex pidió algo que este runtime no puede responder.',
  'Codex refused the configuration it was started with.':
    'Codex rechazó la configuración con la que arrancó.',
  'Codex refused the model catalog it was started with.':
    'Codex rechazó el catálogo de modelos con el que arrancó.',
  'The Codex process ended.': 'El proceso de Codex terminó.',
  'The authority could not record what Codex was doing.':
    'La autoridad no pudo registrar lo que hacía Codex.',
  'Codex acted outside what its isolation allows, and the authority stopped it.':
    'Codex actuó fuera de lo que permite su aislamiento, y la autoridad lo detuvo.',
  'The authority could not prove the isolation of the runtime, and did not let it run.':
    'La autoridad no pudo comprobar el aislamiento del runtime, y no lo dejó correr.',
  'Managed session prepared': 'Sesión Managed preparada',
  'Managed session closed': 'Sesión Managed cerrada',
  'Session bound to a workspace': 'Sesión vinculada a un workspace',
  'Session attached to Codex': 'Sesión conectada a Codex',
  'Workspace binding outcome unknown':
    'Resultado del vínculo con el workspace desconocido',
  'Uncertain binding attempt discarded':
    'Intento de vínculo incierto descartado',
  'Codex runtime start accepted': 'Inicio del runtime de Codex aceptado',
  'Codex runtime stop accepted': 'Detención del runtime de Codex aceptada',
  'Codex runtime request accepted': 'Pedido al runtime de Codex aceptado',
  'Codex runtime ready': 'Runtime de Codex listo',
  'Codex runtime contained': 'Runtime de Codex contenido',
  'Codex runtime stopped': 'Runtime de Codex detenido',
  'Codex runtime ended unexpectedly':
    'El runtime de Codex terminó de forma inesperada',
  'Managed turn admitted': 'Turno Managed admitido',
  'Managed turn running': 'Turno Managed en curso',
  'Turn cancellation requested': 'Se pidió cancelar el turno',
  'Managed turn completed': 'Turno Managed completado',
  'Managed turn interrupted': 'Turno Managed interrumpido',
  'Managed turn failed': 'Turno Managed falló',
  'Managed turn outcome unknown': 'Resultado del turno Managed desconocido',
  'Command approval requested': 'Aprobación de comando pedida',
  'File change approval requested': 'Aprobación de cambio de archivo pedida',
  'Approved action confirmed by Codex': 'Codex confirmó la acción aprobada',
  'Approval denied': 'Aprobación denegada',
  'Execution lease granted': 'Concesión de ejecución otorgada',
  'Execution lease renewed': 'Concesión de ejecución renovada',
  'Execution lease revoked': 'Concesión de ejecución revocada',
  'Execution lease expired': 'Concesión de ejecución vencida',
  'Authority event': 'Evento de la autoridad',
  'a command': 'un comando',
  'the approved command': 'el comando aprobado',
  'a file change': 'un cambio de archivo',
  'the approved file change': 'el cambio de archivo aprobado',
  'an action': 'una acción',
  'the approved action': 'la acción aprobada',
  'The authority admitted the turn under an execution lease. What was asked of Codex is not part of the record.':
    'La autoridad admitió el turno con una concesión de ejecución. Lo que se le pidió a Codex no forma parte del registro.',
  'Codex took the turn and started working on it.':
    'Codex tomó el turno y empezó a trabajar en él.',
  'A cancel of the turn was recorded.':
    'Se registró una cancelación del turno.',
  'The authority recorded how the turn ended.':
    'La autoridad registró cómo terminó el turno.',
  'Codex proposed {about} and the authority held it for a decision. The proposal itself is not part of the record.':
    'Codex propuso {about} y la autoridad retuvo esa propuesta para decidir. La propuesta en sí no forma parte del registro.',
  'The approval of {about} was accepted and the answer was sent to Codex.':
    'Se aceptó la aprobación de {about} y la respuesta se envió a Codex.',
  'Codex reported what it did with {approved}.':
    'Codex informó qué hizo con {approved}.',
  'The approval of {about} was denied. Nothing was run or changed for it.':
    'Se denegó la aprobación de {about}. No se ejecutó ni se cambió nada por ella.',
  'The authority recorded how the approval ended.':
    'La autoridad registró cómo terminó la aprobación.',
  '{lead} It allowed the session to {scopes}.':
    '{lead} Permitió a la sesión {scopes}.',
  'The lease ended because its session was closed.':
    'La concesión terminó porque se cerró su sesión.',
  'The lease was given back.': 'La concesión se devolvió.',
  'The lease reached its time limit.':
    'La concesión llegó a su límite de tiempo.',
  'The authority extended a lease for this session.':
    'La autoridad extendió una concesión para esta sesión.',
  'The authority granted a lease for this session.':
    'La autoridad otorgó una concesión para esta sesión.',
  'The authority accepted a request for the managed Codex runtime and recorded what it should be.':
    'La autoridad aceptó un pedido para el runtime de Codex Managed y registró cómo debe quedar.',
  'Codex {version} started, was checked and is ready.':
    'Codex {version} se inició, se verificó y está listo.',
  'Codex started, was checked and is ready.':
    'Codex se inició, se verificó y está listo.',
  '{exit} The authority meant it to.': '{exit} La autoridad lo quiso así.',
  'A managed session was created. It has no workspace until it is bound.':
    'Se creó una sesión Managed. No tiene workspace hasta que se vincula uno.',
  'The session was closed. Closing is final.':
    'La sesión se cerró. Cerrar es definitivo.',
  'The authority bound the session to a project folder. Which folder is not part of the record.':
    'La autoridad vinculó la sesión a una carpeta de proyecto. Cuál carpeta no forma parte del registro.',
  'The session was attached to the Codex runtime that was running.':
    'La sesión se conectó al runtime de Codex que estaba corriendo.',
  'The authority could not confirm whether Codex created the workspace binding.':
    'La autoridad no pudo confirmar si Codex creó el vínculo con el workspace.',
  'An uncertain binding attempt was given up on explicitly.':
    'Se abandonó explícitamente un intento de vínculo incierto.',
  'The authority recorded an event of a kind this version of the console does not know. Nothing else of it is shown.':
    'La autoridad registró un evento de un tipo que esta versión de la consola no conoce. No se muestra nada más de él.',
  'This is the beginning of the event stream.':
    'Este es el comienzo del stream de eventos.',
  'History before this point is unavailable.':
    'El historial anterior a este punto no está disponible.',
  'Events could not be read: the authority did not answer.':
    'No se pudieron leer los eventos: la autoridad no respondió.',
  'Events could not be read. The authority is busy; try again in a moment.':
    'No se pudieron leer los eventos. La autoridad está ocupada; probá de nuevo en un momento.',
  'The event history changed while it was being read.':
    'El historial de eventos cambió mientras se leía.',
  'Events could not be read. Nothing is shown rather than something unverified.':
    'No se pudieron leer los eventos. No se muestra nada en lugar de algo sin verificar.',
  'Older events could not be read: the authority holds another history than the one shown. The newest events were read again.':
    'No se pudieron leer los eventos anteriores: la autoridad tiene otro historial que el que se muestra. Los eventos más recientes se leyeron de nuevo.',
  'Older events could not be read: the authority did not answer.':
    'No se pudieron leer los eventos anteriores: la autoridad no respondió.',
  'Older events could not be read.':
    'No se pudieron leer los eventos anteriores.',

  'Outcome unknown': 'Resultado desconocido',

  Expired: 'Vencida',

  Folder: 'Carpeta',

  Command: 'Comando',
  Directory: 'Directorio',

  'Preview truncated:': 'Vista previa truncada:',
  'Show the rest': 'Mostrar el resto',
  'The rest of this change could not be read.':
    'No se pudo leer el resto de este cambio.',
  '{shown} of {total} files shown.': '{shown} de {total} archivos mostrados.',
  'Show more files': 'Mostrar más archivos',

  'Waits until': 'Espera hasta',

  'The authority did not answer, so it is not known whether the decision was taken. Retrying repeats the same decision: it cannot decide twice.':
    'La autoridad no respondió, así que no se sabe si la decisión se tomó. Reintentar repite la misma decisión: no puede decidir dos veces.',

  'Codex wants to run a command': 'Codex quiere ejecutar un comando',
  'Codex wants to change a file': 'Codex quiere cambiar un archivo',
  'Codex wants to change {count} files':
    'Codex quiere cambiar {count} archivos',
  'Codex wants to change files': 'Codex quiere cambiar archivos',

  Pending: 'Pendiente',
  Approved: 'Aprobada',
  Denied: 'Rechazada',
  Cancelled: 'Cancelada',
  'No longer applies': 'Ya no aplica',
  'File change': 'Cambio de archivo',
  Add: 'Agregar',
  Delete: 'Borrar',
  Modify: 'Modificar',
  Move: 'Mover',
  'Nobody decided it in time.': 'Nadie la decidió a tiempo.',
  'The execution lease of its turn expired.':
    'La concesión de ejecución de su turno venció.',
  'The execution lease of its turn was revoked.':
    'Se revocó la concesión de ejecución de su turno.',
  'Its turn was cancelled.': 'Su turno se canceló.',
  'Its turn ended.': 'Su turno terminó.',
  'Its session was closed.': 'Su sesión se cerró.',
  'Codex stopped while it waited.': 'Codex se detuvo mientras esperaba.',
  'The authority shut down while it waited.':
    'La autoridad se apagó mientras esperaba.',
  'The authority restarted while it waited.':
    'La autoridad se reinició mientras esperaba.',
  'It was approved, and the authority could not confirm what Codex did with that.':
    'Fue aprobada, y la autoridad no pudo confirmar qué hizo Codex con eso.',
  'Codex asked for something that cannot be approved.':
    'Codex pidió algo que no se puede aprobar.',
  'Codex acted outside what the session allows.':
    'Codex actuó fuera de lo que la sesión permite.',

  // ---- arsenal-d ----
  turn: 'turno',
  'Preview truncated: {shown} of {total} bytes shown.':
    'Vista previa cortada: se muestran {shown} de {total} bytes.',
  'The authority no longer holds what this approval was about.':
    'La autoridad ya no tiene lo que describe esta aprobación.',
  'The authority checks the action again before anything runs.':
    'La autoridad vuelve a verificar la acción antes de que se ejecute algo.',
  'Read the whole change to approve it.':
    'Leé el cambio completo para aprobarlo.',
  '{count} waiting for a decision': '{count} esperando una decisión',
  'Approvals are read from the authority and cannot be decided until it is connected. Nothing is approved or denied in the meantime. Your local terminals keep working.':
    'Las aprobaciones se leen de la autoridad y no se pueden decidir hasta que esté conectada. Mientras tanto no se aprueba ni se deniega nada. Tus terminales locales siguen funcionando.',
  'Reading approvals…': 'Leyendo aprobaciones…',
  'Nothing is waiting for a decision.': 'Nada espera una decisión.',
  'In Local Tools, every command and file change Codex proposes stops here until you approve or deny it. Inference sessions propose none.':
    'En Local Tools, cada comando y cambio de archivo que propone Codex se detiene acá hasta que lo apruebes o lo denegues. Las sesiones de Inference no proponen ninguno.',
  'Pending approvals': 'Aprobaciones pendientes',
  'Recently ended': 'Terminadas recientemente',
  'Ended approvals': 'Aprobaciones terminadas',
  'Older approvals are not listed.':
    'Las aprobaciones más viejas no se listan.',
  'Asking the authority to approve it…':
    'Pidiendo a la autoridad que la apruebe…',
  'Asking the authority to deny it…':
    'Pidiendo a la autoridad que la deniegue…',
  'It was not approved.': 'No se aprobó.',
  'It was not denied.': 'No se denegó.',
  'The authority no longer has this approval.':
    'La autoridad ya no tiene esta aprobación.',
  'The approval changed after it was shown. It has been read again.':
    'La aprobación cambió después de mostrarse. Se volvió a leer.',
  'The approval had already ended.': 'La aprobación ya había terminado.',
  'The authority denied it: the lease its turn was admitted under does not allow this action.':
    'La autoridad la denegó: la concesión con la que se admitió su turno no permite esta acción.',
  'Codex is no longer there to answer.': 'Codex ya no está para responder.',
  'The authority could not confirm what Codex did with the answer. Nothing is sent again by itself.':
    'La autoridad no pudo confirmar qué hizo Codex con la respuesta. No se vuelve a enviar nada por sí solo.',
  'That request was already used for another decision.':
    'Ese pedido ya se usó para otra decisión.',
  'Approvals could not be read: the authority did not answer.':
    'No se pudieron leer las aprobaciones: la autoridad no respondió.',
  'Approvals could not be read. The authority is busy; try again in a moment.':
    'No se pudieron leer las aprobaciones. La autoridad está ocupada; probá de nuevo en un momento.',
  'Approvals could not be read. Nothing is shown rather than something unverified.':
    'No se pudieron leer las aprobaciones. No se muestra nada antes que algo sin verificar.',
  Start: 'Iniciar',

  Import: 'Importar',

  'Closing this window': 'Cerrar esta ventana',
  'Leaving a terminal (detach)': 'Salir de una terminal (desconectar)',
  'Locking the screen': 'Bloquear la pantalla',
  'Logging out, lingering on': 'Cerrar sesión, con lingering activado',
  'Logging out, lingering off': 'Cerrar sesión, con lingering desactivado',
  'Suspend and resume': 'Suspender y reanudar',
  'The host stopping or crashing': 'El host se detiene o se cae',
  'Reboot or power-off': 'Reinicio o apagado',
  'Keeps running': 'Sigue corriendo',
  Ends: 'Termina',
  'Not certain here': 'No está claro acá',
  'Lingering is on for your account.':
    'Lingering está activado para tu cuenta.',
  'Lingering is off for your account.':
    'Lingering está desactivado para tu cuenta.',
  'This system does not expose a lingering setting the Console can read.':
    'Este sistema no expone una opción de lingering que la Consola pueda leer.',
  'The setting could not be changed. Nothing was changed.':
    'No se pudo cambiar la opción. No se cambió nada.',
  'Terminals after the window closes':
    'Terminales después de cerrar la ventana',
  'What survives what could not be read from the host.':
    'No se pudo leer del host qué sobrevive a qué.',
  'Your terminals belong to a host process, not to this window. Closing the window does not stop them; this is what happens in the other cases on this machine.':
    'Tus terminales pertenecen a un proceso host, no a esta ventana. Cerrar la ventana no las detiene; esto es lo que pasa en los otros casos de esta máquina.',
  'What survives what': 'Qué sobrevive a qué',
  When: 'Cuándo',
  Why: 'Por qué',
  'Lingering keeps your user session manager running after you log out. It is {state}. The Console never turns it on by itself.':
    'Lingering mantiene el administrador de tu sesión de usuario corriendo después de cerrar sesión. Está {state}. La Consola nunca lo activa por sí sola.',
  'not something this system lets the Console read':
    'algo que este sistema no deja leer a la Consola',
  on: 'activado',
  off: 'desactivado',
  'Confirm lingering': 'Confirmar lingering',
  'This runs “loginctl enable-linger” for your account: your user services will start at boot and stay after you log out. You can turn it off here at any time.':
    'Esto ejecuta “loginctl enable-linger” para tu cuenta: tus servicios de usuario arrancarán al iniciar y seguirán después de cerrar sesión. Podés desactivarlo acá en cualquier momento.',
  'This runs “loginctl disable-linger” for your account: your user manager will stop when you log out, and anything running inside it with it.':
    'Esto ejecuta “loginctl disable-linger” para tu cuenta: el administrador de usuario se detendrá al cerrar sesión, y con él todo lo que corra dentro.',
  'Turn lingering on': 'Activar lingering',
  'Turn lingering off': 'Desactivar lingering',
  'Turn lingering off…': 'Desactivar lingering…',
  'Keep terminals after logout…':
    'Mantener las terminales después de cerrar sesión…',
  'The launch could not be opened.': 'No se pudo abrir el lanzamiento.',
  starting: 'iniciando',
  running: 'en curso',
  closing: 'cerrando',
  exited: 'terminó',
  closed: 'cerrada',
  failed: 'falló',
  'Terminal sessions': 'Sesiones de terminal',
  Launches: 'Lanzamientos',
  'New terminal': 'Nueva terminal',
  'Reading launches…': 'Leyendo lanzamientos…',
  'No launches. Add a file in {folder}.':
    'No hay lanzamientos. Agregá un archivo en {folder}.',
  'Full access': 'Acceso total',
  'Move {name} up': 'Mover {name} hacia arriba',
  'Move {name} down': 'Mover {name} hacia abajo',
  'Files in {folder}': 'Archivos en {folder}',
  Done: 'Listo',
  Order: 'Orden',
  'Every other key goes to the program in the terminal.':
    'Cualquier otra tecla va al programa de la terminal.',
  'New terminal in a new tab': 'Nueva terminal en una pestaña nueva',
  'Split the pane side by side': 'Dividir el panel lado a lado',
  'Split the pane, one above the other':
    'Dividir el panel, una arriba de la otra',
  'Close the pane': 'Cerrar el panel',
  'Search the pane’s scrollback':
    'Buscar en el historial de desplazamiento del panel',
  'Move to the pane in that direction': 'Ir al panel en esa dirección',
  'Next and previous pane': 'Panel siguiente y anterior',
  'Next and previous tab': 'Pestaña siguiente y anterior',
  'Go to that tab': 'Ir a esa pestaña',
  'The preset “{name}” leaves a Codex hook or AGENTS.md out, and it cannot be applied now: {reason} Nothing was started.':
    'El preset “{name}” deja afuera un hook de Codex o el AGENTS.md, y ahora no se puede aplicar: {reason} No se inició nada.',
  'A file of launch environments (environment.json for Claude, environment-codex.json for Codex) cannot be read, so what a preset leaves out is not known. Launches with a preset of that tool do not start until the file is fixed or removed. It was not changed.':
    'Un archivo de entornos de lanzamiento (environment.json de Claude o environment-codex.json de Codex) no se puede leer, así que no se sabe qué deja afuera cada preset. Los lanzamientos con un preset de esa herramienta no arrancan hasta que el archivo se arregle o se borre. No se modificó.',
  'The launch “{name}” leaves out a hook that is no longer in hooks.json: it was edited or removed. Nothing was started. Open the launch in Workspace, check its hooks and save.':
    'El lanzamiento “{name}” deja afuera un hook que ya no está en hooks.json: se editó o se borró. No se inició nada. Abrí el lanzamiento en Workspace, revisá sus hooks y guardá.',
  'A hook this preset leaves out is no longer in hooks.json: it was edited or removed. Nothing was started. Check the preset’s hooks and save it.':
    'Un hook que este preset deja afuera ya no está en hooks.json: se editó o se borró. No se inició nada. Revisá los hooks del preset y guardalo.',
  'A hook this preset left out is no longer in hooks.json: it was edited or removed. A launch with this preset does not start until you check the hooks and save.':
    'Un hook que este preset dejaba afuera ya no está en hooks.json: se editó o se borró. Un lanzamiento con este preset no arranca hasta que revises los hooks y guardes.',
  'The hook was changed, but the launch presets that left it out could not be updated. Until you open each of them in Workspace, check its hooks and save, a launch with one of them may run the changed hook, or (Codex) may not start.':
    'El hook se cambió, pero no se pudieron actualizar los presets de lanzamiento que lo dejaban afuera. Hasta que abras cada uno en Workspace, revises sus hooks y guardes, un lanzamiento con uno de ellos puede correr el hook cambiado o (Codex) no arrancar.',
  'A command before the start did not succeed ({result}); the agent started anyway.':
    'Un comando previo al inicio no tuvo éxito ({result}); el agente arrancó igual.',
  'Started with {selection} applied.': 'Iniciado con {selection} aplicado.',
  'Started without applying {selection}; the selection is recorded.':
    'Iniciado sin aplicar {selection}; la selección queda registrada.',
  'The terminal started, but Arsenal could not record its selection.':
    'La terminal inició, pero Arsenal no pudo registrar su selección.',
  'Screen restored · {count} KiB of output was missed while it was kept':
    'Pantalla restaurada · se perdieron {count} KiB de salida mientras se guardaba',
  'The program printed faster than the screen could be kept, so part of its output never reached it. What is drawn may differ from the program until the program draws again.':
    'El programa imprimió más rápido de lo que se podía guardar la pantalla, así que parte de su salida nunca llegó. Lo dibujado puede diferir del programa hasta que el programa vuelva a dibujar.',
  'Screen rebuilt from the end of the output · {count} KiB before it is not included':
    'Pantalla reconstruida desde el final de la salida · {count} KiB anteriores no están incluidos',
  'The parser that keeps this screen was restarted and only the output the host still held was replayed into it. State set earlier (an alternate screen, a mode) may be missing until the program draws again.':
    'Se reinició el analizador que guarda esta pantalla y solo se reprodujo en él la salida que todavía tenía el host. El estado definido antes (una pantalla alternativa, un modo) puede faltar hasta que el programa vuelva a dibujar.',
  'Screen restored · {count} older lines not shown':
    'Pantalla restaurada · {count} líneas anteriores no se muestran',
  'The screen and its recent history were redrawn from the host. Older history was past what is kept.':
    'La pantalla y su historial reciente se volvieron a dibujar desde el host. El historial más viejo quedó fuera de lo que se guarda.',
  'Output replayed · no screen state was kept':
    'Salida reproducida · no se guardó estado de pantalla',
  'The host had no screen for this terminal ({reason}), so what it kept of the output was replayed and the program was asked to draw again.':
    'El host no tenía pantalla para esta terminal ({reason}), así que lo que guardó de la salida se reprodujo y se le pidió al programa que volviera a dibujar.',
  'Output was missed while the screen was kept':
    'Se perdió salida mientras se guardaba la pantalla',
  'The program printed faster than the screen could be kept. The terminal itself is complete; a window opened later may show a screen that differs until the program draws again.':
    'El programa imprimió más rápido de lo que se podía guardar la pantalla. La terminal en sí está completa; una ventana abierta después puede mostrar una pantalla distinta hasta que el programa vuelva a dibujar.',
  'Screen parser restarting': 'Reiniciando el analizador de pantalla',
  'The terminal itself is not affected. The screen state is being rebuilt from the output the host still holds.':
    'La terminal en sí no se ve afectada. El estado de pantalla se está reconstruyendo desde la salida que todavía tiene el host.',
  'Screen parser unavailable': 'Analizador de pantalla no disponible',
  'The terminal works. If this window is closed and opened again, the output the host kept is replayed instead of a saved screen.':
    'La terminal funciona. Si esta ventana se cierra y se vuelve a abrir, se reproduce la salida que guardó el host en lugar de una pantalla guardada.',
  'Started by the Console in your shell. Not mediated, contained or approved by the Console.':
    'Iniciada por la Consola en tu shell. La Consola no la media, no la contiene ni la aprueba.',
  'Starting agent…': 'Iniciando agente…',
  'Starting terminal…': 'Iniciando terminal…',
  'Agent exited': 'El agente terminó',
  'Shell exited': 'El shell terminó',
  'Closing terminal…': 'Cerrando terminal…',
  'Terminal closed': 'Terminal cerrada',
  'Terminal failed: {reason}': 'La terminal falló: {reason}',
  'Output truncated': 'Salida recortada',
  'Search this terminal': 'Buscar en esta terminal',
  'Search…': 'Buscar…',
  'No matches': 'Sin coincidencias',
  '{current} of {total}{suffix}': '{current} de {total}{suffix}',
  'Previous match': 'Coincidencia anterior',
  'Next match': 'Coincidencia siguiente',
  'Match case': 'Distinguir mayúsculas',
  'Close search': 'Cerrar búsqueda',
  'The terminal size was refused.': 'Se rechazó el tamaño de la terminal.',
  'The folder to start in does not exist or cannot be opened.':
    'La carpeta de inicio no existe o no se puede abrir.',
  'The shell could not be started.': 'No se pudo iniciar el shell.',
  'Input could not be written to the terminal.':
    'No se pudo escribir la entrada en la terminal.',
  'The terminal could not be resized.': 'No se pudo redimensionar la terminal.',
  'The terminal stayed busy and did not take the input.':
    'La terminal siguió ocupada y no tomó la entrada.',
  'The limit of open terminals was reached. Close one first.':
    'Se alcanzó el límite de terminales abiertas. Cerrá una primero.',
  'The terminal did not answer in time.': 'La terminal no respondió a tiempo.',
  'The terminal did not close in time.': 'La terminal no se cerró a tiempo.',
  'The terminal could not be closed.': 'No se pudo cerrar la terminal.',
  'The terminal could not be drawn in this window.':
    'No se pudo dibujar la terminal en esta ventana.',
  'The terminal host is not answering. Nothing was sent.':
    'El host de terminales no responde. No se envió nada.',
  'The terminal host did not confirm this request. It may or may not have taken effect, and it was not sent again. Check the kept terminals before starting another.':
    'El host de terminales no confirmó este pedido. Puede que haya surtido efecto o no, y no se volvió a enviar. Revisá las terminales guardadas antes de iniciar otra.',
  'The terminal stopped with an error.': 'La terminal se detuvo con un error.',
  'The host did not confirm the last input: it may or may not have reached the program. It was not sent again, and input still waiting was dropped. Check the screen before typing on.':
    'El host no confirmó la última entrada: puede que haya llegado al programa o no. No se volvió a enviar, y la entrada que seguía esperando se descartó. Revisá la pantalla antes de seguir escribiendo.',
  'That input was not sent: with what is already waiting it is more than a terminal holds (64 KiB). Nothing of it reached the program; what was waiting before it still goes.':
    'Esa entrada no se envió: con lo que ya está esperando, supera lo que cabe en una terminal (64 KiB). Nada de ella llegó al programa; lo que esperaba antes sigue su curso.',
  'Preset saved': 'Preset guardado',
  'Could not be saved. Nothing changed.': 'No se pudo guardar. No cambió nada.',
  Presets: 'Presets',
  'New preset': 'Nuevo preset',
  'Reading presets…': 'Leyendo presets…',
  'No presets for {provider} yet.': 'Todavía no hay presets para {provider}.',
  Duplicate: 'Duplicar',
  'Delete {name}?': '¿Borrar {name}?',
  'Deleting…': 'Borrando…',
  'Copy of {name}': 'Copia de {name}',
  Choose: 'Elegir',
  'Search capabilities': 'Buscar capacidades',
  Rules: 'Reglas',
  Family: 'Familia',
  'No capabilities match.': 'Ninguna capacidad coincide.',
  'Move to group…': 'Mover a grupo…',
  'Shows everything at once, of every type.':
    'Muestra todo junto, de todos los tipos.',
  'A hook is a script that runs by itself at a moment of the session, such as before a command or when it starts. It can stop a command or add context, without being asked.':
    'Un hook es un script que corre solo en un momento de la sesión, como antes de un comando o al arrancar. Puede frenar un comando o sumar contexto sin que se lo pidas.',
  'An MCP server connects the agent to an outside tool, such as Notion, a browser or library docs, and gives it new actions to use.':
    'Un servidor MCP conecta al agente con una herramienta de afuera, como Notion, un navegador o la documentación de una librería, y le da acciones nuevas para usar.',
  'A plugin is a package that brings several pieces together (skills, agents, hooks, MCP servers) and is switched on or off as a whole.':
    'Un plugin es un paquete que trae varias piezas juntas (skills, agentes, hooks, servidores MCP) y se prende o apaga entero.',
  'A command is a /name you type to run a saved prompt. Here only your own command files are listed; most /commands are skills.':
    'Un comando es un /nombre que escribís para correr un prompt guardado. Acá se listan solo tus archivos de comandos; la mayoría de los /comandos son skills.',
  MCP: 'MCP',
  Commands: 'Comandos',
  'Part of {name}': 'Parte de {name}',
  'No custom commands. Your /commands are skills here.':
    'No tenés comandos propios. Acá tus /comandos son skills.',
  'A rule is a file of permanent instructions, such as invariantes.md. The agent reads it when every session starts and follows it the whole time. It does not run anything.':
    'Una regla es un archivo de instrucciones permanentes, como invariantes.md. El agente lo lee al arrancar cada sesión y lo cumple todo el tiempo. No ejecuta nada.',
  'A skill is a how-to manual for one kind of task, such as designing a screen or finding a bug. The agent opens it only when the task you give it needs it.':
    'Una skill es un manual de cómo hacer un tipo de tarea, como diseñar una pantalla o encontrar un error. El agente la abre solo cuando la tarea que le das la necesita.',
  'An agent is a helper with a job of its own, such as reviewing code. The main agent hands it part of the work; it does it on its own and returns the result.':
    'Un agente es un ayudante con un trabajo propio, como revisar código. El agente principal le pasa una parte del trabajo; él la hace por su cuenta y devuelve el resultado.',
  'Only changes where it is listed on this screen, not what it does. Saved on this computer.':
    'Solo cambia dónde aparece en esta pantalla, no lo que hace. Se guarda en esta computadora.',
  'Back to automatic group': 'Volver al grupo automático',
  'No description in its file': 'Su archivo no trae descripción',
  Rule: 'Regla',
  Supported: 'Compatible',
  Unverified: 'Sin verificar',
  'Needs provider qualification': 'Necesita calificación del provider',
  'Missing dependency': 'Falta una dependencia',
  Conflicting: 'En conflicto',
  Unsupported: 'No compatible',
  'Fixing bugs': 'Depuración',
  Integrations: 'Integraciones',
  Automations: 'Automatizaciones',
  'Rules the agent always follows: standing instructions read when every session starts.':
    'Reglas que el agente cumple siempre: instrucciones fijas que lee al arrancar cada sesión.',
  'Model profiles (astra, luna, sol) that choose which model and effort a task runs with.':
    'Perfiles de modelo (astra, luna, sol) que eligen con qué modelo y esfuerzo corre una tarea.',
  'MCP servers: connections to outside tools such as Notion, a browser or library docs.':
    'Servidores MCP: conexiones a herramientas de afuera como Notion, un navegador o la documentación de una librería.',
  'Hooks that run by themselves at moments of the session and are not about security.':
    'Hooks que corren solos en momentos de la sesión y no son de seguridad.',
  'How it works': 'Cómo trabaja',
  'Before building': 'Antes de construir',
  After: 'Después',
  Environment: 'Entorno',
  'Category name': 'Nombre de la categoría',
  Save: 'Guardar',
  'Delete {name}? Its {n} capabilities go back to their default category.':
    '¿Borrar {name}? Sus {n} capacidades vuelven a su categoría automática.',
  'Terminal environment': 'Entorno de la terminal',
  'The launch environment could not be read.':
    'No se pudo leer el entorno de la terminal.',
  'The launch environment could not be saved.':
    'No se pudo guardar el entorno de la terminal.',
  'What this preset loads besides its skills. Anything unticked is not loaded in that terminal, and costs no context.':
    'Lo que este preset carga además de sus skills. Lo que destildes no se carga en esa terminal y no gasta contexto.',
  Instructions: 'Instrucciones',
  'Auto memory': 'Memoria automática',
  'Agents and account skills': 'Agentes y skills de la cuenta',
  'Your agents (~/.claude/agents, GSD included)':
    'Tus agentes (~/.claude/agents, incluido GSD)',
  'No hooks in your settings.': 'No hay hooks en tu configuración.',
  'All servers, plugins and claude.ai connectors included':
    'Todos los servidores, incluidos los de plugins y conectores de claude.ai',
  'No plugins enabled.': 'No hay plugins activados.',
  'This terminal gets its own launch folder and signs in with your stored long-lived token. Your own ~/.claude is not changed.':
    'Esta terminal arranca con su propia carpeta y entra con tu token de larga duración guardado. Tu ~/.claude no se toca.',
  'This terminal uses your own configuration as it is.':
    'Esta terminal usa tu configuración tal como está.',
  "Always loaded: the project's instructions (CLAUDE.md, CLAUDE.local.md, .claude/rules and the CLAUDE.md of each folder it reads in), its skills and hooks, and Claude Code's built-in plugins.":
    'Siempre carga: las instrucciones del proyecto (CLAUDE.md, CLAUDE.local.md, .claude/rules y el CLAUDE.md de cada carpeta donde lee), sus skills y hooks, y los plugins incluidos en Claude Code.',
  'No long-lived token is stored, so this terminal will not start. Run claude setup-token in your own terminal and store it with: secret-tool store --label "Claude Code token (Wyss Console)" service wyss-console kind claude-oauth-token':
    'No hay un token de larga duración guardado, así que esta terminal no va a arrancar. Corré claude setup-token en tu propia terminal y guardalo con: secret-tool store --label "Claude Code token (Wyss Console)" service wyss-console kind claude-oauth-token',
  'Save environment': 'Guardar entorno',
  'Not selectable yet': 'Todavía no se elige',
  'Nothing here yet.': 'Todavía no hay nada acá.',
  'New category': 'Nueva categoría',
  'The category could not be deleted. Try again.':
    'No se pudo borrar la categoría. Probá de nuevo.',
  'That name cannot be used: it is empty, longer than 40 characters, or already in this section.':
    'Ese nombre no sirve: está vacío, tiene más de 40 caracteres o ya existe en esta sección.',
  'Checks for security problems: audits, threat reviews and guards against dangerous commands.':
    'Controles de seguridad: auditorías, revisión de amenazas y frenos ante comandos peligrosos.',
  'Finding why something fails: method to chase a bug down to its cause.':
    'Encontrar por qué algo falla: método para rastrear un error hasta su causa.',
  'Writing for the web and social media, and search ranking (SEO).':
    'Escribir para la web y redes, y posicionamiento en buscadores (SEO).',
  'Animation, 3D and video.': 'Animación, 3D y video.',
  'Designing screens: visual direction, components, accessibility and turning a mockup into code.':
    'Diseñar pantallas: dirección visual, componentes, accesibilidad y pasar un mockup a código.',
  'Learning and notes: tutors, quizzes, second brain and saved links.':
    'Estudio y notas: tutores, cuestionarios, segundo cerebro y links guardados.',
  'Making a decision: arguing against an idea before you commit to it.':
    'Tomar decisiones: atacar una idea antes de comprometerte con ella.',
  'Looking things up: documentation, the web and mapping a codebase.':
    'Investigar: documentación, la web y mapear un código.',
  'Checking work: code review, tests, verification and quality checks.':
    'Revisar trabajo: revisión de código, tests, verificación y controles de calidad.',
  'Writing and converting documents: docs, reports, prompts and PDFs.':
    'Escribir y convertir documentos: docs, informes, prompts y PDF.',
  'Planning the work: specs, roadmaps, plans and the method that orders them.':
    'Planificar el trabajo: specs, roadmaps, planes y el método que los ordena.',
  'Writing the code: executing plans, fixing findings and shipping.':
    'Escribir el código: ejecutar planes, aplicar arreglos y publicar.',
  'This computer and the tools themselves: setup, health checks and upgrades.':
    'Esta computadora y las propias herramientas: configuración, chequeos de salud y actualizaciones.',
  'What no rule placed. Use Move to group… to put it where it belongs.':
    'Lo que ninguna regla ubicó. Usá Mover a grupo… para ponerlo donde va.',
  'Content and SEO': 'Contenido y SEO',
  'Animation and video': 'Animación y video',
  'Design and interface': 'Diseño e interfaz',
  'Study and knowledge': 'Estudio y conocimiento',
  Decisions: 'Decisiones',
  Research: 'Investigación',
  'Review and testing': 'Revisión y pruebas',
  'Docs and writing': 'Documentación y escritura',
  'Planning and method': 'Planificación y método',
  Building: 'Construcción',
  'System and setup': 'Sistema y entorno',
  'How it is put together': 'Cómo está armado',
  'Name the preset': 'Poné un nombre al preset',
  'Nothing chosen yet. Tick a group or a capability.':
    'Todavía no elegiste nada. Marcá un grupo o una capacidad.',
  'Checking…': 'Verificando…',
  'Could not be checked.': 'No se pudo verificar.',
  '{on} on · {off} off': '{on} activas · {off} apagadas',
  'Keep {name} ({count} skills)': 'Mantener {name} ({count} skills)',
  '{count} conflict': '{count} conflicto',
  '{count} conflicts': '{count} conflictos',
  'Same name': 'Mismo nombre',
  'Same content': 'Mismo contenido',
  'Two rules for one provider': 'Dos reglas para un mismo provider',
  'Two methodologies': 'Dos metodologías',
  'Installed in account and project': 'Instalada en la cuenta y en el proyecto',
  'How it starts': 'Cómo arranca',
  '{agent} starts with {on} capabilities from this preset. The other {off} installed skills are switched off in that terminal.':
    '{agent} arranca con {on} capacidades de este preset. Las otras {off} skills instaladas quedan apagadas en esa terminal.',
  'Save preset': 'Guardar preset',
  'Discard changes': 'Descartar cambios',
  'Keep editing': 'Seguir editando',
  'Unsaved changes': 'Cambios sin guardar',
  'Launch name': 'Nombre del lanzamiento',
  'A launch with that name exists.': 'Ya hay un lanzamiento con ese nombre.',
  Replace: 'Reemplazar',
  'No preset named “{name}” for this agent. Create it in Arsenal, or change the launch file.':
    'No hay un preset llamado “{name}” para este agente. Créalo en Arsenal o cambia el archivo del lanzamiento.',
  'More than one preset is named “{name}” for this agent. Delete the extra ones in Arsenal, then start again.':
    'Hay más de un preset llamado “{name}” para este agente. Borra los sobrantes en Arsenal y vuelve a iniciar.',
  'No saved launches yet.': 'Todavía no hay lanzamientos guardados.',
  'The launch could not be deleted.': 'No se pudo borrar el lanzamiento.',
  Preset: 'Preset',

  Blocked: 'Bloqueado',

  rejected: 'rechazado',

  Refused: 'Rechazado',

  interrupted: 'interrumpido',

  // ---- native ----
  Restarting: 'Reiniciando',
  Active: 'Activa',
  'Ended by a signal': 'Terminada por una señal',
  'Exited (0)': 'Terminó (0)',
  'Did not start': 'No arrancó',
  Lost: 'Perdida',
  'The start was accepted and is being prepared.':
    'El inicio fue aceptado y se está preparando.',
  'The agent’s process is alive in its terminal.':
    'El proceso del agente está vivo en su terminal.',
  'The process ended by itself.': 'El proceso terminó solo.',
  'You stopped it.': 'La detuviste vos.',
  'The process never ran.': 'El proceso nunca corrió.',
  'The Console was restarted and did not see how it ended. Its terminal went with the window, so it is not running.':
    'La consola se reinició y no vio cómo terminó. Su terminal se fue con la ventana, así que no está corriendo.',
  'The Console could not record this start, so a process may exist. Check the sessions below. Nothing is started again automatically, and OpenCode and Hermes wait until the store is confirmed.':
    'La consola no pudo registrar este inicio, así que puede existir un proceso. Revisá las sesiones de abajo. No se vuelve a iniciar nada solo, y OpenCode y Hermes esperan hasta que se confirme el almacenamiento.',
  'The process was stopped, but the Console could not record that. Nothing was started again, and OpenCode and Hermes stay blocked until the store is confirmed.':
    'El proceso se detuvo, pero la consola no pudo registrarlo. No se volvió a iniciar nada, y OpenCode y Hermes siguen bloqueados hasta que se confirme el almacenamiento.',
  'Ask before acting': 'Preguntar antes de actuar',
  'Full access: the agent asks nothing and runs every command and edit without a sandbox, with your account’s rights.':
    'Acceso total: el agente no pregunta nada y ejecuta cada comando y cada edición sin sandbox, con los permisos de tu cuenta.',
  'To change the model in this session, type /model in it. Claude Code also saves your choice as its default.':
    'Para cambiar el modelo en esta sesión, escribí /model en ella. Claude Code también guarda tu elección como predeterminada.',
  'How to change the model of a running Codex session is not verified, so none is suggested.':
    'No está verificado cómo cambiar el modelo de una sesión de Codex en curso, así que no se sugiere ninguno.',
  'How to change the model in a running session is not verified, so none is suggested.':
    'No está verificado cómo cambiar el modelo en una sesión en curso, así que no se sugiere ninguno.',
  'That agent is not installed on this computer.':
    'Ese agente no está instalado en esta computadora.',
  'That folder cannot be used. Choose a folder with the folder button.':
    'Esa carpeta no se puede usar. Elegí una carpeta con el botón de carpeta.',
  'A launch with a folder of its own cannot use your home folder as its project: your configuration (hooks, instructions, skills) would load anyway. Choose a project folder.':
    'Con una carpeta propia para este lanzamiento no se puede usar tu carpeta personal como proyecto: tu configuración (hooks, instrucciones, skills) se cargaría igual. Elegí una carpeta de proyecto.',
  'The Arsenal plan changed since it was shown: the library, the installed skills or the provider build moved. Review the new plan and start again.':
    'El plan de Arsenal cambió desde que se mostró: cambiaron la biblioteca, las skills instaladas o la versión del proveedor. Revisá el plan nuevo y volvé a iniciar.',
  'The Arsenal plan has items that cannot be carried or names a skill that is not installed, so nothing was started with it.':
    'El plan de Arsenal tiene elementos que no se pueden llevar o nombra una skill que no está instalada, así que no se inició nada con él.',
  'The Arsenal library or the installed skills could not be read, so nothing was started with the selection.':
    'No se pudo leer la biblioteca de Arsenal ni las skills instaladas, así que no se inició nada con la selección.',
  'That Arsenal selection no longer exists.':
    'Esa selección de Arsenal ya no existe.',
  'Arsenal does not read this project folder, so its selection cannot be applied here.':
    'Arsenal no lee esta carpeta de proyecto, así que su selección no se puede aplicar acá.',
  'Hermes Native does not have a verified interactive handoff argument. It was not started with this brief.':
    'Hermes Native no tiene un argumento de traspaso interactivo verificado. No se inició con este brief.',
  'The brief must start with a “# ” heading, hold no NUL and be at most 16 KiB.':
    'El brief tiene que empezar con un encabezado “# ”, no tener NUL y pesar 16 KiB como máximo.',
  'The terminal limit (16) is reached. Close one to start another.':
    'Se alcanzó el límite de terminales (16). Cerrá una para abrir otra.',
  'The agent could not be started.': 'No se pudo iniciar el agente.',
  'A start is already in progress.': 'Ya hay un inicio en curso.',
  'That session is not known any more.': 'Esa sesión ya no está registrada.',
  'That session is not running.': 'Esa sesión no está corriendo.',
  'A running session cannot be removed. Stop it first.':
    'No se puede quitar una sesión que corre. Detenela primero.',
  'The session could not be stopped.': 'No se pudo detener la sesión.',
  'Session storage is busy. Readiness could not be checked; it will be retried.':
    'El almacenamiento de sesiones está ocupado. No se pudo verificar la disponibilidad; se volverá a intentar.',
  'The Console has no private folder to keep native sessions in, so it cannot start agents.':
    'La consola no tiene una carpeta privada donde guardar las sesiones nativas, así que no puede iniciar agentes.',
  'The request was not valid.': 'La solicitud no era válida.',
  'The terminal host is not answering. Nothing was sent; nothing changed.':
    'El host de terminales no responde. No se envió nada; no cambió nada.',
  'The terminal host did not confirm this request: it may or may not have taken effect, and it was not sent again. Check the sessions listed here before repeating it, so nothing runs twice.':
    'El host de terminales no confirmó esta solicitud: puede que haya surtido efecto o no, y no se volvió a enviar. Revisá las sesiones listadas acá antes de repetirla, para que nada corra dos veces.',
  'The file could not be written.': 'No se pudo escribir el archivo.',
  Permissions: 'Permisos',
  'As configured': 'Como está configurado',
  new: 'nueva',
  'Delegated agents': 'Agentes delegados',
  done: 'terminado(s)',
  cancelled: 'cancelado(s)',
  other: 'otro(s)',
  Files: 'Archivos',
  in: 'en',
  Result: 'Resultado',

  Remove: 'Quitar',
  Provider: 'Proveedor',

  Dependencies: 'Dependencias',

  Source: 'Origen',

  // ---- final ----
  'Failed ({code})': 'Falló ({code})',
  'not read yet (open Configuration)': 'todavía sin leer (abre Configuración)',
  'not set in its files': 'sin fijar en sus archivos',
  'not observed by this provider configuration view':
    'no lo observa esta vista de configuración del proveedor',
  'not reported by the agent': 'el agente no lo informa',
  agent: 'agente',
  'this agent': 'este agente',
  installed: 'instalado',
  Delegation: 'Delegación',
  Change: 'Cambiar',
  Open: 'Abrir',
  Stop: 'Parar',
  Restart: 'Reiniciar',
  'Native sessions': 'Sesiones Native',
  // ---- arsenal sync ----
  Synchronization: 'Sincronización',
  Waiting: 'En espera',
  'Conflicts kept both versions': 'Conflictos: se conservaron ambas versiones',
  'Deleted on another computer': 'Borrados en otra computadora',
  'Synchronization details': 'Detalles de la sincronización',
  'This computer': 'Esta computadora',
  '{host} · {count} change(s) published':
    '{host} · {count} cambio(s) publicado(s)',
  'Shared folder': 'Carpeta compartida',
  '(Syncthing carries it)': '(Syncthing lo transporta)',
  'Last check': 'Última comprobación',
  'not yet': 'todavía no',
  'applied {applied} of {published} change(s) from here':
    'aplicó {applied} de {published} cambio(s) de esta computadora',
  'last heard {time}': 'última señal {time}',
  'Check now': 'Comprobar ahora',
  'Arsenal selection': 'Selección de Arsenal',
  Reload: 'Recargar',
  'no project': 'sin proyecto',
  pinned: 'fijada',
  prepared: 'preparada',
  missing: 'faltante',

  'Sync error': 'Error de sincronización',
  'The last run failed: {error}.': 'La última corrida falló: {error}.',
  Receiving: 'Recibiendo',
  '{changes} waiting for files still on their way.':
    '{changes} en espera de archivos que todavía vienen en camino.',
  '{count} change': '{count} cambio',
  '{count} changes': '{count} cambios',
  '{count} items': '{count} elementos',
  '{count} item': '{count} elemento',
  '{conflicts} kept both versions':
    '{conflicts}: se conservaron ambas versiones',
  '{items} refused': '{items} rechazado(s)',
  '{items} deleted on another computer, a copy kept here':
    '{items} borrado(s) en otra computadora, con una copia guardada acá',
  '{parts}. See the details.': '{parts}. Mirá los detalles.',
  '{first}; {rest}': '{first}; {rest}',
  'This computer only': 'Solo esta computadora',
  'No other computer has written to the shared folder yet.':
    'Ninguna otra computadora escribió todavía en la carpeta compartida.',
  Published: 'Publicado',
  '{hosts} has not applied {changes} from here yet.':
    '{hosts} todavía no aplicó {changes} de esta computadora.',
  '{hosts} has not applied {changes} from here yet (last heard {time}).':
    '{hosts} todavía no aplicó {changes} de esta computadora (última señal {time}).',
  'In sync': 'Sincronizado',
  '{hosts} applied everything published here; checked {when}.':
    '{hosts} aplicó todo lo publicado acá; comprobado {when}.',
  '{hosts} applied everything published here.':
    '{hosts} aplicó todo lo publicado acá.',
  'just now': 'recién',
  '{minutes} min ago': 'hace {minutes} min',
  '{hours} h ago': 'hace {hours} h',
  '{days} d ago': 'hace {days} d',
  // ---- featc ----
  Library: 'Biblioteca',
  Imported: 'Importada',
  Discover: 'Descubrir',
  Composites: 'Composites',
  Account: 'Cuenta',
  'Not imported': 'No importada',
  'Source changed': 'El origen cambió',
  'Read only': 'Solo lectura',
  Tool: 'Herramienta',
  File: 'Archivo',
  'declared, not checked offline': 'declarada, sin verificar sin conexión',
  present: 'presente',
  unknown: 'desconocida',
  'A hook runs code. Arsenal lists it and never copies or runs it.':
    'Un hook ejecuta código. Arsenal lo lista y nunca lo copia ni lo ejecuta.',
  'An MCP definition can hold credentials. Arsenal lists it and never copies it.':
    'Una definición MCP puede tener credenciales. Arsenal la lista y nunca la copia.',
  'A plugin brings code and hooks. Arsenal lists it; importing plugins is not available yet.':
    'Un plugin trae código y hooks. Arsenal lo lista; importar plugins todavía no está disponible.',
  'GSD Core payload': 'Contenido de GSD Core',
  'Claude Code plugin': 'Plugin de Claude Code',
  'Codex plugin': 'Plugin de Codex',
  'Claude user skills': 'Skills de usuario de Claude',
  'Codex user skills': 'Skills de usuario de Codex',
  'Codex home skills': 'Skills de la carpeta de Codex',
  'Codex system skills': 'Skills del sistema de Codex',
  'Claude project skills': 'Skills de proyecto de Claude',
  'Codex project skills': 'Skills de proyecto de Codex',
  'Claude user agents': 'Agentes de usuario de Claude',
  'Codex user agents': 'Agentes de usuario de Codex',
  'Claude project agents': 'Agentes de proyecto de Claude',
  'Codex project agents': 'Agentes de proyecto de Codex',
  'Claude user rules': 'Reglas de usuario de Claude',
  'Codex user rules': 'Reglas de usuario de Codex',
  'Claude project rules': 'Reglas de proyecto de Claude',
  'Codex project rules': 'Reglas de proyecto de Codex',
  'Credential file, not copied': 'Archivo de credenciales, no se copia',
  'Hidden, not copied': 'Oculto, no se copia',
  'Link, not followed': 'Enlace, no se sigue',
  'Binary, not copied': 'Binario, no se copia',
  'May hold a secret': 'Puede tener un secreto',
  'Special file, not copied': 'Archivo especial, no se copia',
  'Nested too deep, not copied': 'Anidado demasiado profundo, no se copia',
  'Name is not UTF-8, not copied': 'El nombre no es UTF-8, no se copia',
  read: 'leída',
  'not present': 'no está',
  'could not be read': 'no se pudo leer',
  'Importing…': 'Importando…',
  'Already imported': 'Ya importada',
  'Import as new revision': 'Importar como revisión nueva',
  'Installed does not mean imported. A selection reaches a terminal only when you start one with it from Workspace.':
    'Instalada no quiere decir importada. Un preset llega a una terminal solo cuando la iniciás con él desde Workspace.',
  'Arsenal sections': 'Secciones de Arsenal',
  'Reading the Arsenal library…': 'Leyendo la biblioteca de Arsenal…',
  'The Arsenal library could not be opened. Refresh after the Wyss data folder is writable.':
    'No se pudo abrir la biblioteca de Arsenal. Actualizá cuando la carpeta de datos de Wyss se pueda escribir.',
  'The library did not load completely. Try Refresh.':
    'La biblioteca no se cargó completa. Probá Actualizar.',
  'Library sections': 'Secciones de la biblioteca',
  Search: 'Buscar',
  'Name, description or origin': 'Nombre, descripción u origen',
  'Nothing is imported yet. Open Discover to import a capability you already have.':
    'Todavía no hay nada importado. Abrí Descubrir para importar una capacidad que ya tenés.',
  'No capabilities match these filters.':
    'Ninguna capacidad coincide con estos filtros.',
  '{count} imported': '{count} importadas',
  '{shown} of {total} imported': '{shown} de {total} importadas',
  'Imported capabilities': 'Capacidades importadas',
  'Revision {revision}': 'Revisión {revision}',
  'Capability details': 'Detalle de la capacidad',
  'Revision {current} of {total}': 'Revisión {current} de {total}',
  '{files} files · {bytes} B': '{files} archivos · {bytes} B',
  Revisions: 'Revisiones',
  Current: 'Actual',
  'Restoring…': 'Restaurando…',
  'Restore revision {revision}': 'Restaurar la revisión {revision}',
  'Show files of revision {revision}':
    'Ver los archivos de la revisión {revision}',
  'Imported from': 'Importada desde',
  Content: 'Contenido',
  'Use in a session': 'Uso en una sesión',
  'Only through a terminal plan: Workspace shows, per terminal, whether this revision is installed and whether it can be applied.':
    'Solo a través del plan de una terminal: Workspace muestra, por terminal, si esta revisión está instalada y si se puede aplicar.',
  'Its files declare and point at nothing Arsenal can check.':
    'Sus archivos no declaran nada que Arsenal pueda verificar.',
  'Files in revision {revision}': 'Archivos de la revisión {revision}',
  'Account and project': 'Cuenta y proyecto',
  'Scan again': 'Escanear de nuevo',
  'Importing {done} of {total}…': 'Importando {done} de {total}…',
  'Import {count} eligible': 'Importar {count} elegibles',
  'Bulk import progress': 'Progreso de la importación',
  'Reading installed capabilities…': 'Leyendo las capacidades instaladas…',
  'No project selected. Project capabilities are not listed; select a project in Configuration.':
    'No hay proyecto elegido. Las capacidades de proyecto no se listan; elegí un proyecto en Configuración.',
  'Capability folders': 'Carpetas de capacidades',
  'The folders have more entries than the scan shows. Some are not listed.':
    'Las carpetas tienen más entradas de las que muestra el escaneo. Algunas no se listan.',
  '{count} composite collection(s) installed.':
    '{count} colección(es) compuesta(s) instalada(s).',
  'Open Composites': 'Abrir Composites',
  'No capabilities found in your Claude, Codex or project folders.':
    'No se encontraron capacidades en tus carpetas de Claude, Codex o de proyecto.',
  'Discovered capabilities': 'Capacidades encontradas',
  'Duplicate content': 'Contenido duplicado',
  'Name collision': 'Nombre repetido',
  'Capability to import': 'Capacidad para importar',
  'Read from': 'Leída desde',
  'Listed only. Arsenal does not copy it.':
    'Solo listada. Arsenal no la copia.',
  'Contains scripts. Arsenal copies them and never runs them.':
    'Tiene scripts. Arsenal los copia y nunca los ejecuta.',
  'Same content as {names}.': 'Mismo contenido que {names}.',
  'Another capability here has the same name. Both can be imported; they stay separate.':
    'Otra capacidad de acá tiene el mismo nombre. Se pueden importar las dos; quedan separadas.',
  'Files that will be copied': 'Archivos que se van a copiar',
  'Files in this capability': 'Archivos de esta capacidad',
  'Not copied': 'No se copia',
  'Review before importing': 'Revisar antes de importar',
  'These files use a credential word. They are copied; check that none holds a real value.':
    'Estos archivos usan una palabra de credencial. Se copian; revisá que ninguno tenga un valor real.',
  'Mentions a credential word': 'Menciona una palabra de credencial',
  'This is a link into {composite} {version}. It is read only: GSD Core installs it, so Arsenal does not copy it.':
    'Es un enlace a {composite} {version}. Es solo lectura: lo instala GSD Core, así que Arsenal no lo copia.',
  'A composite is installed by its own tool: GSD Core by its installer, a plugin by Claude Code or Codex. Arsenal describes it and never copies it.':
    'Un composite lo instala su propia herramienta: GSD Core con su instalador, un plugin con Claude Code o Codex. Arsenal lo describe y nunca lo copia.',
  'Reading installed composites…': 'Leyendo los composites instalados…',
  'No composite collection is installed in your Claude or Codex folders.':
    'No hay ninguna colección composite instalada en tus carpetas de Claude o Codex.',
  'Enabled in your settings': 'Habilitado en tu configuración',
  'Disabled in your settings': 'Deshabilitado en tu configuración',
  Methodology: 'Metodología',
  'Not importable': 'No importable',
  Members: 'Miembros',
  '{skills} skills · {agents} agents': '{skills} skills · {agents} agentes',
  '{count} commands': '{count} comandos',
  '{count} artifacts in its manifest': '{count} artefactos en su manifiesto',
  'Runs code': 'Ejecuta código',
  'Yes: it registers hooks.': 'Sí: registra hooks.',
  'Its hooks and engine belong to the GSD Core install.':
    'Sus hooks y su motor pertenecen a la instalación de GSD Core.',
  'No hooks declared.': 'No declara hooks.',
  'It declares MCP servers.': 'Declara servidores MCP.',
  Manifest: 'Manifiesto',
  Limits: 'Límites',
  'Skills ({count})': 'Skills ({count})',
  'Agents ({count})': 'Agentes ({count})',
  "What each terminal started with, recorded right after its start from the host's own session record. Applied means the host launched it with that exact exclusion; whether the provider then used each skill is not observed.":
    'Con qué arrancó cada terminal, anotado justo después de su inicio desde el registro de sesión del propio host. Aplicado quiere decir que el host la lanzó con esa exclusión exacta; no se observa si el provider después usó cada skill.',
  'Terminal configurations': 'Configuraciones de terminal',
  APPLIED: 'APLICADO',
  'NOT APPLIED': 'NO APLICADO',
  'Use not observed': 'Uso no observado',
  '{prepared} prepared · {excluded} installed skills switched off · {kept} kept':
    '{prepared} preparadas · {excluded} skills instaladas apagadas · {kept} conservadas',
  '{prepared} prepared · {excluded} installed skills would have been switched off · {kept} kept':
    '{prepared} preparadas · {excluded} skills instaladas que se habrían apagado · {kept} conservadas',
  'No terminal has started with a selection yet. Choose one in Workspace when starting Claude Code or Codex.':
    'Ninguna terminal arrancó todavía con un preset. Elegí uno en Workspace al iniciar Claude Code o Codex.',
  'The Arsenal library could not be opened. Check that the Wyss data folder is writable, then Refresh.':
    'No se pudo abrir la biblioteca de Arsenal. Revisá que la carpeta de datos de Wyss se pueda escribir y después actualizá.',
  'The Arsenal library is damaged, so nothing was changed. Keep the file and report it.':
    'La biblioteca de Arsenal está dañada, así que no se cambió nada. Guardá el archivo y avisalo.',
  'Another change is in progress. Try again in a moment.':
    'Hay otro cambio en curso. Probá de nuevo en un momento.',
  'This library was written by a newer version of Wyss Console.':
    'Esta biblioteca la escribió una versión más nueva de Wyss Console.',
  'Your home folder is not known, so skills cannot be read. Refresh to try again.':
    'No se conoce tu carpeta personal, así que no se pueden leer las skills. Actualizá para probar de nuevo.',
  'That item is no longer in the library or in your skill folders. Refresh and try again.':
    'Ese elemento ya no está en la biblioteca ni en tus carpetas de skills. Actualizá y probá de nuevo.',
  'The request was not valid. Check the fields and try again.':
    'El pedido no era válido. Revisá los campos y probá de nuevo.',
  'This kind is listed only. Arsenal does not copy it.':
    'Este tipo solo se lista. Arsenal no lo copia.',
  'This file is too large to show here.':
    'Este archivo es demasiado grande para mostrarlo acá.',
  'This file is not text, so it cannot be shown here.':
    'Este archivo no es texto, así que no se puede mostrar acá.',
  'Arsenal returned something unexpected. Refresh and try again.':
    'Arsenal devolvió algo inesperado. Actualizá y probá de nuevo.',
  'A file holds something that looks like a secret. Remove it from the skill to import it.':
    'Un archivo tiene algo que parece un secreto. Quitalo de la skill para importarla.',
  'This folder has no SKILL.md, so it is not a skill.':
    'Esta carpeta no tiene SKILL.md, así que no es una skill.',
  'This skill is a symbolic link. Arsenal does not follow links out of a skill folder.':
    'Esta skill es un enlace simbólico. Arsenal no sigue enlaces que salgan de una carpeta de skill.',
  'This skill has more files than the import limit.':
    'Esta skill tiene más archivos que el límite de importación.',
  'This skill is larger than the import limit.':
    'Esta skill supera el límite de importación.',
  'One file in this skill is larger than the import limit.':
    'Un archivo de esta skill supera el límite de importación.',
  'This skill nests folders deeper than the import limit.':
    'Esta skill anida carpetas más profundo que el límite de importación.',
  'A file of this skill could not be read.':
    'No se pudo leer un archivo de esta skill.',
  'This skill changed while it was being read. Scan again.':
    'Esta skill cambió mientras se leía. Escaneá de nuevo.',
  'Codex installs and replaces this skill itself. Arsenal lists it and does not copy it.':
    'Codex instala y reemplaza esta skill por sí mismo. Arsenal la lista y no la copia.',
  'This project is in a folder another account can write. Arsenal lists it as read only and does not copy it.':
    'Este proyecto está en una carpeta que otra cuenta puede escribir. Arsenal lo lista como solo lectura y no lo copia.',
  'This skill cannot be imported.': 'Esta skill no se puede importar.',
  // Workspace: a launch's distributions
  'Update Flatpak apps': 'Actualizar apps Flatpak',
  'No confirmation (--noconfirm)': 'Sin confirmar (--noconfirm)',
  'Include AUR (paru)': 'Incluir AUR (paru)',
  'Skip AUR review (--skipreview)': 'Saltar revisión AUR (--skipreview)',
  'Clean the package cache (paccache -rk2)':
    'Limpiar caché de paquetes (paccache -rk2)',
  'No confirmation (-y)': 'Sin confirmar (-y)',
  'Remove unused packages (autoremove)': 'Quitar paquetes sin uso (autoremove)',
  'This launch has no commands for this distribution. Add one in Workspace.':
    'Este lanzamiento no tiene comandos para esta distribución. Agregala en Workspace.',
  Distributions: 'Distribuciones',
  'Detected on this computer: {name} ({id})':
    'Detectado en esta PC: {name} ({id})',
  'This computer’s distribution could not be read (/etc/os-release).':
    'No se pudo leer la distribución de esta PC (/etc/os-release).',
  'No distribution here matches this computer: the file’s own commands run.':
    'Ninguna distribución coincide con esta PC: corren los comandos propios del archivo.',
  'No distribution here matches this computer: add {id} to start it here.':
    'Ninguna distribución coincide con esta PC: agregá {id} para lanzarlo acá.',
  'This computer’s distribution: it cannot be deleted.':
    'Es la distribución de esta PC: no se puede borrar.',
  active: 'activa',
  'os-release ID, e.g. void': 'ID de os-release, p. ej. void',
  'Distribution ID': 'ID de la distribución',
  'Add distribution': 'Agregar distribución',
  'runs on this computer': 'corre en esta PC',
  Options: 'Opciones',
  'The script was written by hand, so the options are off.':
    'El script se editó a mano, así que las opciones quedan apagadas.',
  'Back to options': 'Volver a las opciones',
  'Script it runs': 'Script que se lanza',
  'One command per line, typed in a new terminal in {folder}.':
    'Un comando por línea, escrito en una terminal nueva en {folder}.',
  Discard: 'Descartar',
  'No distributions yet.': 'Todavía no hay distribuciones.',
  'The file’s own commands, for every distribution. Add one to give it its own.':
    'Los comandos propios del archivo, para cualquier distribución. Agregá una para darle los suyos.',
  'Adds “flatpak update”: also updates the apps installed from Flathub, which the package manager does not touch.':
    'Agrega «flatpak update»: actualiza también las apps instaladas desde Flathub, que el gestor de paquetes no toca.',
  'Adds -y: answers yes to every question, so the update runs to the end without stopping. Without it, it asks before installing.':
    'Agrega -y: responde que sí a todo, así la actualización corre hasta el final sin frenar. Sin esto, pregunta antes de instalar.',
  'Adds a line that removes packages nothing needs any more (left behind by earlier updates).':
    'Agrega una línea que borra paquetes que ya nada usa (los que dejaron actualizaciones anteriores).',
  'Adds --noconfirm to pacman and paru: they answer yes on their own and do not stop to ask. Without it, they show what changes and wait for you.':
    'Agrega --noconfirm a pacman y paru: responden que sí solos y no frenan a preguntar. Sin esto, te muestran qué cambia y esperan tu OK.',
  'Adds “paru -Sua”: after the official packages, updates the ones installed from the AUR (built by the community). Needs paru installed.':
    'Agrega «paru -Sua»: después de los paquetes oficiales, actualiza los instalados desde el AUR (los arma la comunidad). Necesita paru instalado.',
  'Adds --skipreview to paru: it does not show each AUR package’s build script before building it. Faster, but you do not see what it runs.':
    'Agrega --skipreview a paru: no te muestra el script de armado de cada paquete del AUR antes de compilarlo. Es más rápido, pero no ves qué ejecuta.',
  'Adds a line that deletes old downloaded packages and keeps the last 2 versions of each, to free disk space. Needs pacman-contrib.':
    'Agrega una línea que borra paquetes viejos descargados y deja las 2 últimas versiones de cada uno, para liberar disco. Necesita pacman-contrib.',
  'For CachyOS. Same commands as Arch (pacman, and paru for the AUR), and pacman also updates CachyOS’s own optimized repositories. AUR comes switched on, since CachyOS ships paru. Only here: finishing with cachy-update.':
    'Para CachyOS. Los mismos comandos que Arch (pacman, y paru para el AUR); pacman además actualiza los repositorios optimizados propios de CachyOS. AUR viene prendido porque CachyOS trae paru. Solo acá: terminar con cachy-update.',
  'For Arch and the distributions based on it without their own variant (Manjaro, EndeavourOS…). Same commands as CachyOS; AUR comes off, since plain Arch has no paru.':
    'Para Arch y las distros basadas en Arch que no tienen variante propia (Manjaro, EndeavourOS…). Los mismos comandos que CachyOS; AUR viene apagado porque Arch pelado no trae paru.',
  'For Debian, Ubuntu, Linux Mint, Pop!_OS and the rest based on Debian. apt update reads the lists of new versions; full-upgrade installs them.':
    'Para Debian, Ubuntu, Linux Mint, Pop!_OS y las demás basadas en Debian. apt update lee la lista de versiones nuevas; full-upgrade las instala.',
  'For Fedora. dnf upgrade --refresh reads the repositories again and installs every update.':
    'Para Fedora. dnf upgrade --refresh vuelve a leer los repositorios e instala todas las actualizaciones.',
  'For openSUSE Tumbleweed and Leap. zypper refresh reads the repositories; zypper dup brings the whole system to their versions.':
    'Para openSUSE Tumbleweed y Leap. zypper refresh lee los repositorios; zypper dup lleva todo el sistema a sus versiones.',
  'A distribution added by hand: it runs on computers whose os-release ID is {id}.':
    'Distribución agregada a mano: corre en las PC cuyo ID de os-release es {id}.',
  'Include AUR -git packages (--devel)':
    'Incluir paquetes -git del AUR (--devel)',
  'Adds --devel to paru: also rebuilds AUR packages that follow a repository (-git, -svn…), which a plain update leaves as they are.':
    'Agrega --devel a paru: también recompila los paquetes del AUR que siguen un repositorio (-git, -svn…), que una actualización común deja como están.',
  'Finish with cachy-update': 'Terminar con cachy-update',
  'Adds “cachy-update” at the end: CachyOS’s own updater. It updates whatever is still pending and then offers to clean orphans and old cache, review .pacnew files and restart the services that need it. It asks before each step.':
    'Agrega «cachy-update» al final: el actualizador propio de CachyOS. Actualiza lo que haya quedado pendiente y después ofrece limpiar huérfanos y caché vieja, revisar archivos .pacnew y reiniciar los servicios que lo necesitan. Pregunta antes de cada paso.',
  'Only for ordering this list: launches are grouped by role. It does not change what the agent does.':
    'Solo para ordenar esta lista: los lanzamientos se agrupan por rol. No cambia lo que hace el agente.',
  'Native: the agent runs as its own program in a terminal of the Console, as when you type claude or codex. The other mode, Managed (the Console drives the session), starts from Sessions, not from a launch; that is why it is fixed here.':
    'Native: el agente corre como su propio programa en una terminal de la Consola, igual que si escribieras claude o codex. El otro modo, Managed (la Consola maneja la sesión), se arranca desde Sesiones, no desde un lanzamiento; por eso acá está fijo.',
  'Where the agent works: it reads and edits the files of this folder, and its project settings are this folder’s.':
    'Dónde trabaja el agente: lee y edita los archivos de esta carpeta, y usa la configuración de proyecto de esta carpeta.',
  'About how much context the agent loads before you write anything, from what is switched on below. The bar compares it with everything switched on. MCP servers are not counted.':
    'Cuánto contexto carga el agente, más o menos, antes de que escribas nada, según lo que esté prendido abajo. La barra lo compara con todo prendido. Los servidores MCP no se cuentan.',
  'CLAUDE.md and the rules files Claude Code reads when it starts: what you told it to always follow. Switching one off saves context, and the agent no longer follows it.':
    'CLAUDE.md y los archivos de reglas que Claude Code lee al arrancar: lo que le pediste que siga siempre. Apagar uno ahorra contexto, y el agente deja de seguirlo.',
  'Know-how the agent loads when a task needs it. At start only each one’s short description takes context.':
    'Conocimientos que el agente carga cuando una tarea los necesita. Al arrancar solo ocupa contexto la descripción corta de cada uno.',
  'Outside tools the agent can call (browser, docs, Notion…). How much context they take is not measured.':
    'Herramientas externas que el agente puede usar (navegador, documentación, Notion…). No se mide cuánto contexto ocupan.',
  'Helpers the agent can hand part of a task to, each with its own instructions.':
    'Ayudantes a los que el agente puede pasarles parte de una tarea, cada uno con sus propias instrucciones.',
  'The skills of your Claude account (claude.ai), on top of the ones installed on this computer.':
    'Las skills de tu cuenta de Claude (claude.ai), además de las instaladas en esta PC.',
  'Scripts that run on their own at fixed moments (before a command, when a turn ends…). The script takes no context, but what some of them print (at start, before each message) enters the conversation. Not measured.':
    'Scripts que corren solos en momentos fijos (antes de un comando, al terminar un turno…). El script no ocupa contexto, pero lo que imprimen algunos (al arrancar, antes de cada mensaje) entra en la conversación. No se mide.',
  Personalization: 'Personalización',
  'Skills, agents, MCP servers and presets: what a session can load.':
    'Skills, agentes, servidores MCP y presets: lo que una sesión puede cargar.',
  'The API keys each distributor needs, kept sealed.':
    'Las claves de API que necesita cada distribuidor, guardadas selladas.',
  // Distributors: added by the owner
  'The added distributors did not load.':
    'No se pudieron leer los distribuidores agregados.',
  'It could not be deleted.': 'No se pudo borrar.',
  'The launch could not be made.': 'No se pudo crear el lanzamiento.',
  'Types “{command}” in a new terminal of the Console, where you see it run.':
    'La Consola escribe «{command}» en una terminal nueva para que puedas ver cómo se ejecuta.',
  'Add a tool': 'Agregar herramienta',
  'Confirm delete': 'Confirmar borrado',
  'Comes with the Console: it cannot be edited or deleted.':
    'Viene con la Consola: no se puede editar ni borrar.',
  'It has no update command yet: set one in Edit.':
    'Todavía no tiene un comando para actualizar: definilo en Editar.',
  'It was added, but its launch could not be made: {why}':
    'Se agregó, pero no se pudo crear su lanzamiento: {why}',
  'Add a tool the Console does not know: by its name and the commands that open and update it.':
    'Agregá una herramienta que la Consola no conoce con su nombre y los comandos para abrirla y actualizarla.',
  'Edit distributor': 'Editar distribuidor',
  'Add distributor': 'Agregar distribuidor',
  'Suggestions:': 'Sugerencias:',
  'Made by': 'Desarrollador',
  'Typed in a new terminal to open it. Its first word is the command looked for to say whether it is installed.':
    'Comando que se escribe en una terminal nueva para abrir la herramienta. Su primera palabra se busca para determinar si está instalada.',
  'Command to open': 'Comando para abrir',
  'Command to update': 'Comando para actualizar',
  optional: 'opcional',
  Note: 'Nota',
  'Found at {path}.': 'Se encontró en {path}.',
  'Types “{command}” in a new terminal of the Console.':
    'La Consola escribe «{command}» en una terminal nueva.',
  'Makes a launch in Workspace that opens it, so it starts from + Launch like the others.':
    'Crea en Workspace un lanzamiento que la abre, así arranca desde + Lanzar como los demás.',
  'Make launch': 'Crear lanzamiento',
  'Change its name or its commands.': 'Cambiar su nombre o sus comandos.',
  Edit: 'Editar',
  'This permission cannot be applied to that agent.':
    'Este permiso no se puede aplicar a ese agente.',
  'What this session was started with no longer exists, so it cannot start that way. Start a new one from Workspace.':
    'Eso con lo que arrancó esta sesión ya no existe, así que no puede arrancar igual. Iniciá una nueva desde Workspace.',
  'The start was not checked first. Choose the permission again and start.':
    'El inicio no se comprobó antes. Elegí el permiso de nuevo e iniciá.',
  'What the start would do changed after it was checked. Check it again and start.':
    'Lo que haría el inicio cambió después de comprobarlo. Comprobalo de nuevo e iniciá.',
  'This exact provider build is not verified for permission flags, so nothing was launched with them. Choose “As configured” or use a qualified build.':
    'Esta versión exacta del proveedor no está verificada para los flags de permisos, así que no se lanzó nada con ellos. Elegí “Como está configurado” o usá una versión calificada.',
  'The terminal host is older than this window and cannot start with this option. Update it before using it; existing sessions are unchanged.':
    'El host de terminales es más viejo que esta ventana y no puede iniciar con esta opción. Actualizalo antes de usarla; las sesiones existentes no cambian.',
  'Accept edits': 'Aceptar ediciones',
  'What the agent may do without asking you. “As configured” passes nothing: the agent starts with the permissions of its own settings. The model and the effort are chosen inside the agent.':
    'Qué puede hacer el agente sin preguntarte. “Como está configurado” no pasa nada: el agente arranca con los permisos de su propia configuración. El modelo y el esfuerzo se eligen dentro del agente.',
  'Profile {name}': 'Perfil {name}',
  'Which agent the launch starts: Claude Code (Anthropic) or Codex (OpenAI). Changing it starts the preset and the environment over, and a permission the other agent does not have.':
    'Qué agente arranca el lanzamiento: Claude Code (Anthropic) o Codex (OpenAI). Si lo cambiás, el preset y el entorno vuelven a cero, y también un permiso que el otro agente no tiene.',
  'The agent asks before every change.':
    'El agente pregunta antes de cada cambio.',
  'The agent reads and plans; it changes nothing.':
    'El agente lee y planifica; no cambia nada.',
  'The agent edits files without asking; it still asks before running commands. Claude Code only.':
    'El agente edita archivos sin preguntar; igual pregunta antes de ejecutar comandos. Solo Claude Code.',
  'Claude account': 'Cuenta de Claude',
  'Included with Codex': 'Incluidas en Codex',
  'Git repos': 'Repos git',
  Personal: 'Personales',
  'Codex asks you to trust a new or changed hook the next time it starts. Deleting one moves the hooks after it in its event, and Codex asks to trust those again.':
    'Codex te pide confiar en un hook nuevo o cambiado la próxima vez que arranca. Borrar uno corre los que vienen después en su evento, y Codex vuelve a pedir confianza para esos.',
  'No hook is kept aside.': 'No hay ningún hook guardado aparte.',
  'Kept aside': 'Guardados aparte',
  'When it runs': 'Cuándo corre',
  'When a session opens': 'Al abrir una sesión',
  'When a session ends': 'Al cerrar una sesión',
  'When you send a message': 'Al mandar un mensaje',
  'Before a tool runs': 'Antes de usar una herramienta',
  'After a tool runs': 'Después de usar una herramienta',
  'On a notification': 'Al recibir un aviso',
  'When the answer ends': 'Al terminar la respuesta',
  'When a subagent ends': 'Al terminar un subagente',
  'Before the context is compacted': 'Antes de compactar el contexto',
  'For which tools (empty = all)': 'Para qué herramientas (vacío = todas)',
  'Write the command…': 'Escribir el comando…',
  'Every tool': 'Todas las herramientas',
  'What it runs': 'Qué ejecuta',
  'Stops after {n} s.': 'Se corta a los {n} s.',
  Actions: 'Acciones',
  'It is kept aside and can be brought back.':
    'Se guarda aparte y se puede recuperar.',
  'This hook cannot be changed here.':
    'Este hook no se puede cambiar desde acá.',
  'See translation': 'Ver traducción',
  'See original': 'Ver original',
  'Original text: what the tool reads.':
    'Texto original: lo que lee la herramienta.',
  'Translated text; the tool reads the original.':
    'Texto traducido; la herramienta lee el original.',
  Location: 'Ubicación',
  'Code ({n} lines)': 'Código ({n} líneas)',
  'Hide the tree': 'Ocultar el árbol',
  'Show the tree': 'Mostrar el árbol',
  'Choose a category in the tree.': 'Elegí una categoría en el árbol.',
  Sets: 'Conjuntos',
  'GSD Core': 'GSD Core',
  'Search skills and agents': 'Buscar skills y agentes',
  '{n} found for “{q}”': '{n} encontradas para “{q}”',
  'Git repo': 'Repo git',
  'its link leads out of the agents’ folders':
    'su enlace lleva fuera de las carpetas de los agentes',
  'its link leads nowhere': 'su enlace no lleva a ningún lado',
  'it has no SKILL.md': 'no tiene SKILL.md',
  'the file cannot be read': 'el archivo no se puede leer',
  Claude: 'Claude',
  Codex: 'Codex',
  'Both · global': 'Ambas · global',
  'Only Claude Code sees it.': 'Solo la ve Claude Code.',
  'Only Codex sees it.': 'Solo la ve Codex.',
  'It is in the folders both tools read, so it loads in every session of each.':
    'Está en las carpetas que leen las dos, así que se carga en toda sesión de cada una.',
  'Its text could not be read.': 'No se pudo leer su texto.',
  'Its file has no description.': 'Su archivo no trae descripción.',
  'The skills on disk could not be read.':
    'No se pudieron leer las skills del disco.',
  'A folder holds more than is read: the lists are incomplete.':
    'Una carpeta tiene más de lo que se lee: las listas están incompletas.',
  Back: 'Volver',
  'Its text could not be read ({reason}).':
    'No se pudo leer su texto ({reason}).',
  'Use it when': 'Usala cuando',
  'Do not use it when': 'No la uses cuando',
  State: 'Estado',
  'Switched on': 'Prendida',
  'Switched off': 'Apagada',
  'Switch on': 'Prender',
  'Switch off': 'Apagar',
  'The file could not be read.': 'No se pudo leer el archivo.',
  'Only the first 256 KB are shown.': 'Se muestran solo los primeros 256 KB.',
  'Files ({n})': 'Archivos ({n})',
  'and {n} more': 'y {n} más',
  Scope: 'Alcance',
  'Codex’s copy is different.': 'La copia de Codex es distinta.',
  'The description is longer: only its beginning is shown.':
    'La descripción es más larga: se muestra solo el comienzo.',
  'The folder holds more files than are counted here.':
    'La carpeta tiene más archivos de los que se cuentan acá.',
  "Load the project's": 'Cargar las del proyecto',
  "Without the project's": 'Sin las del proyecto',
  'Own role': 'Rol propio',
  'Without project instructions, the agent does not read the project instructions or rules. Your global instructions follow their switch.':
    'Sin las instrucciones del proyecto, el agente no lee sus instrucciones ni reglas. Tus instrucciones globales siguen su interruptor.',
  'The text applies at start. Another open terminal of this launch may see it change; resuming a conversation keeps what it already had.':
    'El texto se aplica al arrancar. Otra terminal abierta de este lanzamiento puede verlo cambiar; al reanudar una conversación se conserva lo que ya tenía.',
  'The launch instructions file cannot be read. It was not modified.':
    'No se puede leer el archivo de instrucciones de lanzamiento. No se modificó.',
  'The preset “{name}” changes the project instructions, and it cannot be applied now: {reason} Nothing was started.':
    'El preset “{name}” cambia las instrucciones del proyecto y ahora no se puede aplicar: {reason} No se inició nada.',
  'The launch instructions file (role-instructions.json) cannot be read. Launches with custom instructions do not start. The file was not changed.':
    'No se puede leer el archivo de instrucciones de lanzamiento (role-instructions.json). Los lanzamientos con instrucciones propias no arrancan. El archivo no se modificó.',
  'The launch instructions file would be too large, so it was not saved.':
    'El archivo de instrucciones de lanzamiento sería demasiado grande; no se guardó.',
  'The project path contains characters that cannot be used for instruction exclusions. Nothing was started.':
    'La ruta del proyecto contiene caracteres que no se pueden usar para excluir instrucciones. No se inició nada.',
  'The combined global instructions and role are too long for Codex. Nothing was started.':
    'Las instrucciones globales y el rol juntos son demasiado largos para Codex. No se inició nada.',
  'Loads the project instructions.': 'Carga las instrucciones del proyecto.',
  'The launch plan could not be read. Check the folder and try again.':
    'No se pudo leer el plan del lanzamiento. Revisá la carpeta y volvé a intentarlo.',
  'The preset “{name}” cannot be applied because these items are missing or rejected: {items}, and {count} more. Uncheck them or restore them in Arsenal. Nothing was started.':
    'El preset «{name}» no se puede aplicar porque estos ítems faltan o fueron rechazados: {items}, y {count} más. Destildalos o restauralos en el Arsenal. No se inició nada.',
  'The preset “{name}” cannot be applied because these items are missing or rejected: {items}. Uncheck them or restore them in Arsenal. Nothing was started.':
    'El preset «{name}» no se puede aplicar porque estos ítems faltan o fueron rechazados: {items}. Destildalos o restauralos en el Arsenal. No se inició nada.',
  'The launch was deleted, but its instructions or role could not be cleared.':
    'Se borró el lanzamiento, pero no se pudieron borrar sus instrucciones o su rol de la lista.',
  'Which agents are installed and their version, and how to open and update them.':
    'Qué agentes están instalados y su versión, y cómo abrirlos y actualizarlos.',
  '“{command}” was not found, or is not an executable file.':
    'No se encontró «{command}» o no es un archivo ejecutable.',
  'Removes its card and the launch made from it, unless you changed that launch by hand. The tool itself stays installed.':
    'Se quitan la tarjeta y el lanzamiento creado a partir de ella, salvo que ese lanzamiento se haya modificado manualmente. La herramienta sigue instalada.',
  'Fills in its name, maker and the command that opens it. Its update command depends on how you installed it.':
    'Completa el nombre, el desarrollador y el comando para abrirla. El comando para actualizarla depende de cómo se instaló la herramienta.',
  'Who makes it.': 'Quién desarrolla la herramienta.',
  'Typed in a new terminal by Update. It depends on how you installed the tool.':
    'Se escribe en una terminal nueva al elegir «Actualizar herramienta»; el comando depende de cómo se instaló la herramienta.',
  'Anything to remember about it.':
    'Algo que convenga recordar sobre esta herramienta.',
  ...ES_ARSENAL,
  ...ES_NATIVE,
  ...ES_CONFIGURATION,
  ...ES_SCREENS,
};
