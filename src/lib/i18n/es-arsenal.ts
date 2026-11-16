/** Spanish for the window’s own text, area: arsenal. Same rules as `es.ts`; merged into `ES`. */
export const ES_AREA: Readonly<Record<string, string>> = {
  '(Syncthing carries it)': '(Syncthing lo transporta)',
  '{agent} starts with {on} capabilities from this preset. The other {off} installed skills are switched off in that terminal.':
    '{agent} arranca con {on} capacidades de este preset. Las otras {off} skills instaladas quedan apagadas en esa terminal.',
  '{changes} waiting for files still on their way.':
    '{changes} en espera de archivos que todavía vienen en camino.',
  '{conflicts} kept both versions':
    '{conflicts}: se conservaron ambas versiones',
  '{count} already off in your settings':
    '{count} ya desactivada(s) en tu configuración',
  '{count} artifacts in its manifest': '{count} artefactos en su manifiesto',
  '{count} change': '{count} cambio',
  '{count} changes': '{count} cambios',
  '{count} commands': '{count} comandos',
  '{count} composite collection(s) installed.':
    '{count} colección(es) compuesta(s) instalada(s).',
  '{count} conflict': '{count} conflicto',
  '{count} conflicts': '{count} conflictos',
  '{count} already in the library, unchanged':
    '{count} sin cambios en la biblioteca',
  '{count} failed': '{count} con error',
  '{count} imported': '{count} importadas',
  '{count} installed skill(s) stay':
    '{count} skill(s) instalada(s) se mantienen',
  '{count} updated to a new revision': '{count} con una revisión nueva',
  '{count} item': '{count} elemento',
  '{count} items': '{count} elementos',
  '{count} not carried': '{count} no incluida(s)',
  '{count} prepared': '{count} preparada(s)',
  '{count} rejected': '{count} rechazada(s)',
  '{count} would be switched off': '{count} se desactivarían',
  '{days} d ago': 'hace {days} d',
  '{files} files · {bytes} B': '{files} archivos · {bytes} B',
  '{first}, {rest}': '{first}, {rest}',
  '{first}; {rest}': '{first}; {rest}',
  '{host} · {count} change(s) published':
    '{host} · {count} cambio(s) publicado(s)',
  '{hosts} applied everything published here; checked {when}.':
    '{hosts} aplicó todo lo publicado acá; comprobado {when}.',
  '{hosts} applied everything published here.':
    '{hosts} aplicó todo lo publicado acá.',
  '{hosts} has not applied {changes} from here yet (last heard {time}).':
    '{hosts} todavía no aplicó {changes} de esta computadora (última señal {time}).',
  '{hosts} has not applied {changes} from here yet.':
    '{hosts} todavía no aplicó {changes} de esta computadora.',
  '{hours} h ago': 'hace {hours} h',
  '{items} deleted on another computer, a copy kept here':
    '{items} borrado(s) en otra computadora, con una copia guardada acá',
  '{items} refused': '{items} rechazado(s)',
  '{minutes} min ago': 'hace {minutes} min',
  '{n} found for “{q}”': '{n} encontradas para “{q}”',
  '{on} of {all}': '{on} de {all}',
  '{on} on · {off} off': '{on} activas · {off} apagadas',
  '{parts}. See the details.': '{parts}. Mirá los detalles.',
  '{prepared} prepared · {excluded} installed skills switched off · {kept} kept':
    '{prepared} preparadas · {excluded} skills instaladas apagadas · {kept} conservadas',
  '{prepared} prepared · {excluded} installed skills would have been switched off · {kept} kept':
    '{prepared} preparadas · {excluded} skills instaladas que se habrían apagado · {kept} conservadas',
  '{shown} of {total} imported': '{shown} de {total} importadas',
  '{skills} skills · {agents} agents': '{skills} skills · {agents} agentes',
  '{what} Saved so far: {done}. Nothing else changed.':
    '{what} Se guardó: {done}. Nada más cambió.',
  'A command is a /name you type to run a saved prompt. Here only your own command files are listed; most /commands are skills.':
    'Un comando es un /nombre que escribís para correr un prompt guardado. Acá se listan solo tus archivos de comandos; la mayoría de los /comandos son skills.',
  'A composite is installed by its own tool: GSD Core by its installer, a plugin by Claude Code or Codex. Arsenal describes it and never copies it.':
    'Un composite lo instala su propia herramienta: GSD Core con su instalador, un plugin con Claude Code o Codex. Arsenal lo describe y nunca lo copia.',
  'A distribution added by hand: it runs on computers whose os-release ID is {id}.':
    'Distribución agregada a mano: corre en las PC cuyo ID de os-release es {id}.',
  'A file holds something that looks like a secret. Remove it from the skill to import it.':
    'Un archivo tiene algo que parece un secreto. Quitalo de la skill para importarla.',
  'A file of launch environments (environment.json for Claude, environment-codex.json for Codex) cannot be read, so what a preset leaves out is not known. Launches with a preset of that tool do not start until the file is fixed or removed. It was not changed.':
    'Un archivo de entornos de lanzamiento (environment.json de Claude o environment-codex.json de Codex) no se puede leer, así que no se sabe qué deja afuera cada preset. Los lanzamientos con un preset de esa herramienta no arrancan hasta que el archivo se arregle o se borre. No se modificó.',
  'A file of launch environments would be too long with this change, so it was not saved. Leave fewer things out, or delete presets you no longer use.':
    'Con este cambio, un archivo de entornos de lanzamiento quedaría demasiado largo, así que no se guardó. Dejá menos cosas afuera o borrá presets que ya no uses.',
  'A file of this skill could not be read.':
    'No se pudo leer un archivo de esta skill.',
  'A folder holds more than is read: the lists are incomplete.':
    'Una carpeta tiene más de lo que se lee: las listas están incompletas.',
  'A hook is a script that runs by itself at a moment of the session, such as before a command or when it starts. It can stop a command or add context, without being asked.':
    'Un hook es un script que corre solo en un momento de la sesión, como antes de un comando o al arrancar. Puede frenar un comando o sumar contexto sin que se lo pidas.',
  'A hook runs code. Arsenal lists it and never copies or runs it.':
    'Un hook ejecuta código. Arsenal lo lista y nunca lo copia ni lo ejecuta.',
  'A hook this preset leaves out is no longer in hooks.json: it was edited or removed. Nothing was started. Check the preset’s hooks and save it.':
    'Un hook que este preset deja afuera ya no está en hooks.json: se editó o se borró. No se inició nada. Revisá los hooks del preset y guardalo.',
  'A hook this preset left out is no longer in hooks.json: it was edited or removed. A launch with this preset does not start until you check the hooks and save.':
    'Un hook que este preset dejaba afuera ya no está en hooks.json: se editó o se borró. Un lanzamiento con este preset no arranca hasta que revises los hooks y guardes.',
  'A launch that leaves a hook or AGENTS.md out runs in its own Codex folder, with your own Codex sign-in. Codex asks you to approve the hooks the first time in each new folder.':
    'Un lanzamiento que deja afuera un hook o el AGENTS.md corre en su propia carpeta de Codex, con tu propio inicio de sesión de Codex. Codex pedirá aprobar los hooks la primera vez en cada carpeta nueva.',
  'A launch with that name exists.': 'Ya hay un lanzamiento con ese nombre.',
  'A plugin brings code and hooks. Arsenal lists it; importing plugins is not available yet.':
    'Un plugin trae código y hooks. Arsenal lo lista; importar plugins todavía no está disponible.',
  'A plugin is a package that brings several pieces together (skills, agents, hooks, MCP servers) and is switched on or off as a whole.':
    'Un plugin es un paquete que trae varias piezas juntas (skills, agentes, hooks, servidores MCP) y se prende o apaga entero.',
  'A rule is a file of permanent instructions, such as invariantes.md. The agent reads it when every session starts and follows it the whole time. It does not run anything.':
    'Una regla es un archivo de instrucciones permanentes, como invariantes.md. El agente lo lee al arrancar cada sesión y lo cumple todo el tiempo. No ejecuta nada.',
  'A skill is a how-to manual for one kind of task, such as designing a screen or finding a bug. The agent opens it only when the task you give it needs it.':
    'Una skill es un manual de cómo hacer un tipo de tarea, como diseñar una pantalla o encontrar un error. El agente la abre solo cuando la tarea que le das la necesita.',
  'About how much context the agent loads before you write anything, from what is switched on below. The bar compares it with everything switched on. MCP servers are not counted.':
    'Cuánto contexto carga el agente, más o menos, antes de que escribas nada, según lo que esté prendido abajo. La barra lo compara con todo prendido. Los servidores MCP no se cuentan.',
  Account: 'Cuenta',
  'Account and project': 'Cuenta y proyecto',
  'Account skills': 'Skills de la cuenta',
  Actions: 'Acciones',
  active: 'activa',
  Activity: 'Actividad',
  Add: 'Agregar',
  'Add a hook': 'Agregar un hook',
  'Add distribution': 'Agregar distribución',
  'Adds --devel to paru: also rebuilds AUR packages that follow a repository (-git, -svn…), which a plain update leaves as they are.':
    'Agrega --devel a paru: también recompila los paquetes del AUR que siguen un repositorio (-git, -svn…), que una actualización común deja como están.',
  'Adds --noconfirm to pacman and paru: they answer yes on their own and do not stop to ask. Without it, they show what changes and wait for you.':
    'Agrega --noconfirm a pacman y paru: responden que sí solos y no frenan a preguntar. Sin esto, te muestran qué cambia y esperan tu OK.',
  'Adds --skipreview to paru: it does not show each AUR package’s build script before building it. Faster, but you do not see what it runs.':
    'Agrega --skipreview a paru: no te muestra el script de armado de cada paquete del AUR antes de compilarlo. Es más rápido, pero no ves qué ejecuta.',
  'Adds -y: answers yes to every question, so the update runs to the end without stopping. Without it, it asks before installing.':
    'Agrega -y: responde que sí a todo, así la actualización corre hasta el final sin frenar. Sin esto, pregunta antes de instalar.',
  'Adds “cachy-update” at the end: CachyOS’s own updater. It updates whatever is still pending and then offers to clean orphans and old cache, review .pacnew files and restart the services that need it. It asks before each step.':
    'Agrega «cachy-update» al final: el actualizador propio de CachyOS. Actualiza lo que haya quedado pendiente y después ofrece limpiar huérfanos y caché vieja, revisar archivos .pacnew y reiniciar los servicios que lo necesitan. Pregunta antes de cada paso.',
  'Adds “flatpak update”: also updates the apps installed from Flathub, which the package manager does not touch.':
    'Agrega «flatpak update»: actualiza también las apps instaladas desde Flathub, que el gestor de paquetes no toca.',
  'Adds “paru -Sua”: after the official packages, updates the ones installed from the AUR (built by the community). Needs paru installed.':
    'Agrega «paru -Sua»: después de los paquetes oficiales, actualiza los instalados desde el AUR (los arma la comunidad). Necesita paru instalado.',
  'Adds a line that deletes old downloaded packages and keeps the last 2 versions of each, to free disk space. Needs pacman-contrib.':
    'Agrega una línea que borra paquetes viejos descargados y deja las 2 últimas versiones de cada uno, para liberar disco. Necesita pacman-contrib.',
  'Adds a line that removes packages nothing needs any more (left behind by earlier updates).':
    'Agrega una línea que borra paquetes que ya nada usa (los que dejaron actualizaciones anteriores).',
  After: 'Después',
  'After a tool runs': 'Después de usar una herramienta',
  Agent: 'Agente',
  Agents: 'Agentes',
  'Agents ({count})': 'Agentes ({count})',
  'Agents and account skills': 'Agentes y skills de la cuenta',
  'AGENTS.md of your Codex folder: what you told Codex to always follow. Switched off, this launch starts without it.':
    'El AGENTS.md de tu carpeta de Codex: lo que le dijiste a Codex que siga siempre. Apagado, este lanzamiento arranca sin él.',
  All: 'Todos',
  'All servers, plugins and claude.ai connectors included':
    'Todos los servidores, incluidos los de plugins y conectores de claude.ai',
  'Already imported': 'Ya importada',
  "Always loaded: the project's instructions (CLAUDE.md, CLAUDE.local.md, .claude/rules and the CLAUDE.md of each folder it reads in), its skills and hooks, and Claude Code's built-in plugins.":
    'Siempre carga: las instrucciones del proyecto (CLAUDE.md, CLAUDE.local.md, .claude/rules y el CLAUDE.md de cada carpeta donde lee), sus skills y hooks, y los plugins incluidos en Claude Code.',
  'An agent is a helper with a job of its own, such as reviewing code. The main agent hands it part of the work; it does it on its own and returns the result.':
    'Un agente es un ayudante con un trabajo propio, como revisar código. El agente principal le pasa una parte del trabajo; él la hace por su cuenta y devuelve el resultado.',
  'An MCP definition can hold credentials. Arsenal lists it and never copies it.':
    'Una definición MCP puede tener credenciales. Arsenal la lista y nunca la copia.',
  'An MCP server connects the agent to an outside tool, such as Notion, a browser or library docs, and gives it new actions to use.':
    'Un servidor MCP conecta al agente con una herramienta de afuera, como Notion, un navegador o la documentación de una librería, y le da acciones nuevas para usar.',
  'and {n} more': 'y {n} más',
  'Animation and video': 'Animación y video',
  'Animation, 3D and video.': 'Animación, 3D y video.',
  'Another capability here has the same name. Both can be imported; they stay separate.':
    'Otra capacidad de acá tiene el mismo nombre. Se pueden importar las dos; quedan separadas.',
  'Another change is in progress. Try again in a moment.':
    'Hay otro cambio en curso. Probá de nuevo en un momento.',
  APPLIED: 'APLICADO',
  'applied {applied} of {published} change(s) from here':
    'aplicó {applied} de {published} cambio(s) de esta computadora',
  'Apply to this terminal (restart required to change it later)':
    'Aplicar a esta terminal (hace falta reiniciar para cambiarlo después)',
  Arsenal: 'Arsenal',
  'Arsenal for this terminal': 'Arsenal para esta terminal',
  'Arsenal returned something unexpected. Refresh and try again.':
    'Arsenal devolvió algo inesperado. Actualizá y probá de nuevo.',
  'Arsenal sections': 'Secciones de Arsenal',
  'Arsenal selection': 'Selección de Arsenal',
  'Arsenal selections are for Claude Code and Codex. This agent starts as configured.':
    'Las selecciones de Arsenal son para Claude Code y Codex. Este agente arranca como está configurado.',
  'Auto memory': 'Memoria automática',
  Automations: 'Automatizaciones',
  Back: 'Volver',
  'Back to automatic group': 'Volver al grupo automático',
  'Back to options': 'Volver a las opciones',
  basic: 'básico',
  'Before a tool runs': 'Antes de usar una herramienta',
  'Before building': 'Antes de construir',
  'Before the context is compacted': 'Antes de compactar el contexto',
  'Binary, not copied': 'Binario, no se copia',
  Blocked: 'Bloqueado',
  'Both · global': 'Ambas · global',
  'Browse…': 'Examinar…',
  'Build not identified': 'Build no identificada',
  Building: 'Construcción',
  'Building the terminal plan…': 'Armando el plan de la terminal…',
  'Bulk import progress': 'Progreso de la importación',
  'Can be applied': 'Se puede aplicar',
  Cancel: 'Cancelar',
  'Capability details': 'Detalle de la capacidad',
  'Capability folders': 'Carpetas de capacidades',
  'Capability to import': 'Capacidad para importar',
  'Category name': 'Nombre de la categoría',
  'Check now': 'Comprobar ahora',
  'Checking the launch preview…': 'Revisando la vista previa del arranque…',
  'Checking work: code review, tests, verification and quality checks.':
    'Revisar trabajo: revisión de código, tests, verificación y controles de calidad.',
  'Checking…': 'Verificando…',
  'Checks for security problems: audits, threat reviews and guards against dangerous commands.':
    'Controles de seguridad: auditorías, revisión de amenazas y frenos ante comandos peligrosos.',
  Choose: 'Elegir',
  'Choose a category in the tree.': 'Elegí una categoría en el árbol.',
  'Choose an agent first.': 'Elegí un agente primero.',
  'Choose it with Browse… or from the known folders.':
    'Elegila con Examinar… o entre las carpetas conocidas.',
  Claude: 'Claude',
  'Claude account': 'Cuenta de Claude',
  'Claude Code plugin': 'Plugin de Claude Code',
  'Claude project agents': 'Agentes de proyecto de Claude',
  'Claude project rules': 'Reglas de proyecto de Claude',
  'Claude project skills': 'Skills de proyecto de Claude',
  'Claude user agents': 'Agentes de usuario de Claude',
  'Claude user rules': 'Reglas de usuario de Claude',
  'Claude user skills': 'Skills de usuario de Claude',
  'CLAUDE.md and the rules files Claude Code reads when it starts: what you told it to always follow. Switching one off saves context, and the agent no longer follows it.':
    'CLAUDE.md y los archivos de reglas que Claude Code lee al arrancar: lo que le pediste que siga siempre. Apagar uno ahorra contexto, y el agente deja de seguirlo.',
  'Clean the package cache (paccache -rk2)':
    'Limpiar caché de paquetes (paccache -rk2)',
  'Code ({n} lines)': 'Código ({n} líneas)',
  Codex: 'Codex',
  'Codex asks you to approve the hooks the first time in each new folder.':
    'Codex pedirá aprobar los hooks la primera vez en cada carpeta nueva.',
  'Codex asks you to trust a new or changed hook the next time it starts. Deleting one moves the hooks after it in its event, and Codex asks to trust those again.':
    'Codex te pide confiar en un hook nuevo o cambiado la próxima vez que arranca. Borrar uno corre los que vienen después en su evento, y Codex vuelve a pedir confianza para esos.',
  'Codex home skills': 'Skills de la carpeta de Codex',
  'Codex installs and replaces this skill itself. Arsenal lists it and does not copy it.':
    'Codex instala y reemplaza esta skill por sí mismo. Arsenal la lista y no la copia.',
  'Codex plugin': 'Plugin de Codex',
  'Codex project agents': 'Agentes de proyecto de Codex',
  'Codex project rules': 'Reglas de proyecto de Codex',
  'Codex project skills': 'Skills de proyecto de Codex',
  'Codex system skills': 'Skills del sistema de Codex',
  'Codex user agents': 'Agentes de usuario de Codex',
  'Codex user rules': 'Reglas de usuario de Codex',
  'Codex user skills': 'Skills de usuario de Codex',
  'Codex’s copy is different.': 'La copia de Codex es distinta.',
  Command: 'Comando',
  Commands: 'Comandos',
  Compatibility: 'Compatibilidad',
  Composites: 'Composites',
  Configuration: 'Configuración',
  Conflicting: 'En conflicto',
  'Conflicts kept both versions': 'Conflictos: se conservaron ambas versiones',
  'Contains scripts. Arsenal copies them and never runs them.':
    'Tiene scripts. Arsenal los copia y nunca los ejecuta.',
  Content: 'Contenido',
  'Content and SEO': 'Contenido y SEO',
  'Copy of {name}': 'Copia de {name}',
  'Could not be checked.': 'No se pudo verificar.',
  'could not be read': 'no se pudo leer',
  'Could not be saved. Nothing changed.': 'No se pudo guardar. No cambió nada.',
  'Credential file, not copied': 'Archivo de credenciales, no se copia',
  Current: 'Actual',
  Decisions: 'Decisiones',
  'Declared in config.toml: these run in every launch and cannot be switched off here.':
    'Declarados en config.toml: corren en todos los lanzamientos y no se pueden apagar por lanzamiento.',
  'declared, not checked offline': 'declarada, sin verificar sin conexión',
  Delete: 'Borrar',
  'Delete {name}?': '¿Borrar {name}?',
  'Delete {name}? Its {n} capabilities go back to their default category.':
    '¿Borrar {name}? Sus {n} capacidades vuelven a su categoría automática.',
  'Delete launch': 'Borrar lanzamiento',
  'Delete role {name}': 'Borrar el rol {name}',
  'Deleted on another computer': 'Borrados en otra computadora',
  'Deleting…': 'Borrando…',
  Dependencies: 'Dependencias',
  'Design and interface': 'Diseño e interfaz',
  'Designing screens: visual direction, components, accessibility and turning a mockup into code.':
    'Diseñar pantallas: dirección visual, componentes, accesibilidad y pasar un mockup a código.',
  'Detected on this computer: {name} ({id})':
    'Detectado en esta PC: {name} ({id})',
  'Disabled in your settings': 'Deshabilitado en tu configuración',
  Discard: 'Descartar',
  'Discard changes': 'Descartar cambios',
  Discover: 'Descubrir',
  'Discovered capabilities': 'Capacidades encontradas',
  'Distribution ID': 'ID de la distribución',
  Distributions: 'Distribuciones',
  Distributor: 'Distribuidor',
  'Do not use it when': 'No la uses cuando',
  'Docs and writing': 'Documentación y escritura',
  Duplicate: 'Duplicar',
  'Duplicate content': 'Contenido duplicado',
  Edit: 'Editar',
  'Enabled in your settings': 'Habilitado en tu configuración',
  environment: 'entorno',
  Environment: 'Entorno',
  'Every tool': 'Todas las herramientas',
  Family: 'Familia',
  File: 'Archivo',
  'Files ({n})': 'Archivos ({n})',
  'Files in revision {revision}': 'Archivos de la revisión {revision}',
  'Files in this capability': 'Archivos de esta capacidad',
  'Files that will be copied': 'Archivos que se van a copiar',
  'Finding why something fails: method to chase a bug down to its cause.':
    'Encontrar por qué algo falla: método para rastrear un error hasta su causa.',
  'Finish with cachy-update': 'Terminar con cachy-update',
  'Fixing bugs': 'Depuración',
  Folder: 'Carpeta',
  'For Arch and the distributions based on it without their own variant (Manjaro, EndeavourOS…). Same commands as CachyOS; AUR comes off, since plain Arch has no paru.':
    'Para Arch y las distros basadas en Arch que no tienen variante propia (Manjaro, EndeavourOS…). Los mismos comandos que CachyOS; AUR viene apagado porque Arch pelado no trae paru.',
  'For CachyOS. Same commands as Arch (pacman, and paru for the AUR), and pacman also updates CachyOS’s own optimized repositories. AUR comes switched on, since CachyOS ships paru. Only here: finishing with cachy-update.':
    'Para CachyOS. Los mismos comandos que Arch (pacman, y paru para el AUR); pacman además actualiza los repositorios optimizados propios de CachyOS. AUR viene prendido porque CachyOS trae paru. Solo acá: terminar con cachy-update.',
  'For Codex a launch chooses skills, agents, AGENTS.md and the hooks of hooks.json. MCP servers and account skills are Claude Code only.':
    'En Codex un lanzamiento elige skills, agentes, el AGENTS.md y los hooks de hooks.json. Los servidores MCP y las skills de la cuenta son solo de Claude Code.',
  'For Debian, Ubuntu, Linux Mint, Pop!_OS and the rest based on Debian. apt update reads the lists of new versions; full-upgrade installs them.':
    'Para Debian, Ubuntu, Linux Mint, Pop!_OS y las demás basadas en Debian. apt update lee la lista de versiones nuevas; full-upgrade las instala.',
  'For Fedora. dnf upgrade --refresh reads the repositories again and installs every update.':
    'Para Fedora. dnf upgrade --refresh vuelve a leer los repositorios e instala todas las actualizaciones.',
  'For openSUSE Tumbleweed and Leap. zypper refresh reads the repositories; zypper dup brings the whole system to their versions.':
    'Para openSUSE Tumbleweed y Leap. zypper refresh lee los repositorios; zypper dup lleva todo el sistema a sus versiones.',
  'For which tools (empty = all)': 'Para qué herramientas (vacío = todas)',
  'Git repos': 'Repos git',
  'GSD Core payload': 'Contenido de GSD Core',
  'Helpers the agent can hand part of a task to, each with its own instructions.':
    'Ayudantes a los que el agente puede pasarles parte de una tarea, cada uno con sus propias instrucciones.',
  'Hidden, not copied': 'Oculto, no se copia',
  'Hide the tree': 'Ocultar el árbol',
  Hook: 'Hook',
  Hooks: 'Hooks',
  'Hooks of config.toml': 'Hooks de config.toml',
  'Hooks that run by themselves at moments of the session and are not about security.':
    'Hooks que corren solos en momentos de la sesión y no son de seguridad.',
  'How it is put together': 'Cómo está armado',
  'How it starts': 'Cómo arranca',
  'How it works': 'Cómo trabaja',
  Import: 'Importar',
  'Import {count} eligible': 'Importar {count} elegibles',
  'Import as new revision': 'Importar como revisión nueva',
  Imported: 'Importada',
  'Imported capabilities': 'Capacidades importadas',
  'Imported from': 'Importada desde',
  'Importing {done} of {total}…': 'Importando {done} de {total}…',
  'Importing…': 'Importando…',
  'In sync': 'Sincronizado',
  'Include AUR -git packages (--devel)':
    'Incluir paquetes -git del AUR (--devel)',
  'Include AUR (paru)': 'Incluir AUR (paru)',
  'Included with Codex': 'Incluidas en Codex',
  'Installed does not mean imported. A selection reaches a terminal only when you start one with it from Workspace.':
    'Instalada no quiere decir importada. Un preset llega a una terminal solo cuando la iniciás con él desde Workspace.',
  'Installed in account and project': 'Instalada en la cuenta y en el proyecto',
  'Installed skills not fully read': 'Skills instaladas no leídas por completo',
  Instructions: 'Instrucciones',
  Integrations: 'Integraciones',
  'It could not be saved.': 'No se pudo guardar.',
  'It declares MCP servers.': 'Declara servidores MCP.',
  'it has no SKILL.md': 'no tiene SKILL.md',
  'It is in the folders both tools read, so it loads in every session of each.':
    'Está en las carpetas que leen las dos, así que se carga en toda sesión de cada una.',
  'It is kept aside and can be brought back.':
    'Se guarda aparte y se puede recuperar.',
  'Items ({count})': 'Ítems ({count})',
  'Its file has no description.': 'Su archivo no trae descripción.',
  'Its files declare and point at nothing Arsenal can check.':
    'Sus archivos no declaran nada que Arsenal pueda verificar.',
  'Its hooks and engine belong to the GSD Core install.':
    'Sus hooks y su motor pertenecen a la instalación de GSD Core.',
  'its link leads nowhere': 'su enlace no lleva a ningún lado',
  'its link leads out of the agents’ folders':
    'su enlace lleva fuera de las carpetas de los agentes',
  'Its text could not be read ({reason}).':
    'No se pudo leer su texto ({reason}).',
  'Its text could not be read.': 'No se pudo leer su texto.',
  'just now': 'recién',
  'Keep {name} ({count} skills)': 'Mantener {name} ({count} skills)',
  'Keep editing': 'Seguir editando',
  'Kept aside': 'Guardados aparte',
  Kind: 'Tipo',
  'Know-how the agent loads when a task needs it. At start only each one’s short description takes context.':
    'Conocimientos que el agente carga cuando una tarea los necesita. Al arrancar solo ocupa contexto la descripción corta de cada uno.',
  'Last check': 'Última comprobación',
  'last heard {time}': 'última señal {time}',
  launch: 'lanzamiento',
  'Launch name': 'Nombre del lanzamiento',
  Launches: 'Lanzamientos',
  'Launches of a deleted role become Worker.':
    'Los lanzamientos de un rol borrado pasan a Trabajador.',
  'Learning and notes: tutors, quizzes, second brain and saved links.':
    'Estudio y notas: tutores, cuestionarios, segundo cerebro y links guardados.',
  Library: 'Biblioteca',
  'Library sections': 'Secciones de la biblioteca',
  Limits: 'Límites',
  'Link, not followed': 'Enlace, no se sigue',
  "Load the project's": 'Cargar las del proyecto',
  'Loading…': 'Cargando…',
  Location: 'Ubicación',
  'Looking things up: documentation, the web and mapping a codebase.':
    'Investigar: documentación, la web y mapear un código.',
  'Making a decision: arguing against an idea before you commit to it.':
    'Tomar decisiones: atacar una idea antes de comprometerte con ella.',
  Manifest: 'Manifiesto',
  'May hold a secret': 'Puede tener un secreto',
  MCP: 'MCP',
  'MCP server': 'Servidor MCP',
  'MCP servers': 'Servidores MCP',
  'MCP servers: connections to outside tools such as Notion, a browser or library docs.':
    'Servidores MCP: conexiones a herramientas de afuera como Notion, un navegador o la documentación de una librería.',
  Members: 'Miembros',
  'Mentions a credential word': 'Menciona una palabra de credencial',
  Methodology: 'Metodología',
  missing: 'faltante',
  'Missing capability': 'Capacidad faltante',
  'Missing dependency': 'Falta una dependencia',
  Mode: 'Modo',
  'Model profiles (astra, luna, sol) that choose which model and effort a task runs with.':
    'Perfiles de modelo (astra, luna, sol) que eligen con qué modelo y esfuerzo corre una tarea.',
  Models: 'Modelos',
  'Move to group…': 'Mover a grupo…',
  Name: 'Nombre',
  'Name collision': 'Nombre repetido',
  'Name is not UTF-8, not copied': 'El nombre no es UTF-8, no se copia',
  'Name the preset': 'Poné un nombre al preset',
  'Name, description or origin': 'Nombre, descripción u origen',
  'Native: the agent runs as its own program in a terminal of the Console, as when you type claude or codex. The other mode, Managed (the Console drives the session), starts from Sessions, not from a launch; that is why it is fixed here.':
    'Native: el agente corre como su propio programa en una terminal de la Console, igual que si escribieras claude o codex. El otro modo, Managed (la Console maneja la sesión), se arranca desde Sesiones, no desde un lanzamiento; por eso acá está fijo.',
  'Needs a look': 'Hay que revisar',
  'Needs provider qualification': 'Necesita calificación del provider',
  'Nested too deep, not copied': 'Anidado demasiado profundo, no se copia',
  New: 'Nuevo',
  'New category': 'Nueva categoría',
  'New launch': 'Lanzamiento nuevo',
  'New preset': 'Nuevo preset',
  'New role name': 'Nombre del rol nuevo',
  'New role…': 'Rol nuevo…',
  'No capabilities found in your Claude, Codex or project folders.':
    'No se encontraron capacidades en tus carpetas de Claude, Codex o de proyecto.',
  'No capabilities match these filters.':
    'Ninguna capacidad coincide con estos filtros.',
  'No capabilities match.': 'Ninguna capacidad coincide.',
  'No composite collection is installed in your Claude or Codex folders.':
    'No hay ninguna colección composite instalada en tus carpetas de Claude o Codex.',
  'No confirmation (--noconfirm)': 'Sin confirmar (--noconfirm)',
  'No confirmation (-y)': 'Sin confirmar (-y)',
  'No custom commands. Your /commands are skills here.':
    'No tenés comandos propios. Acá tus /comandos son skills.',
  'No description in its file': 'Su archivo no trae descripción',
  'No distribution here matches this computer: add {id} to start it here.':
    'Ninguna distribución coincide con esta PC: agregá {id} para lanzarlo acá.',
  'No distribution here matches this computer: the file’s own commands run.':
    'Ninguna distribución coincide con esta PC: corren los comandos propios del archivo.',
  'No distributions yet.': 'Todavía no hay distribuciones.',
  'No estimate for Codex yet.': 'Todavía no hay estimación para Codex.',
  'No hook is kept aside.': 'No hay ningún hook guardado aparte.',
  'No hooks declared.': 'No declara hooks.',
  'No hooks in hooks.json.': 'No hay hooks en hooks.json.',
  'No hooks in your settings.': 'No hay hooks en tu configuración.',
  'No long-lived token is stored, so this terminal will not start. Run claude setup-token in your own terminal and store it with: secret-tool store --label "Claude Code token (Wyss Console)" service wyss-console kind claude-oauth-token':
    'No hay un token de larga duración guardado, así que esta terminal no va a arrancar. Corré claude setup-token en tu propia terminal y guardalo con: secret-tool store --label "Claude Code token (Wyss Console)" service wyss-console kind claude-oauth-token',
  'No other computer has written to the shared folder yet.':
    'Ninguna otra computadora escribió todavía en la carpeta compartida.',
  'No plugins enabled.': 'No hay plugins activados.',
  'No presets for {provider} yet.': 'Todavía no hay presets para {provider}.',
  'no project': 'sin proyecto',
  'No project selected. Project capabilities are not listed; select a project in Configuration.':
    'No hay proyecto elegido. Las capacidades de proyecto no se listan; elegí un proyecto en Configuración.',
  'No saved launches yet.': 'Todavía no hay lanzamientos guardados.',
  'No saved selection for this provider. Make one in Arsenal › Selections.':
    'No hay una selección guardada para este proveedor. Creá una en Arsenal › Selecciones.',
  'No terminal has started with a selection yet. Choose one in Workspace when starting Claude Code or Codex.':
    'Ninguna terminal arrancó todavía con un preset. Elegí uno en Workspace al iniciar Claude Code o Codex.',
  'None — skills as installed': 'Ninguna: skills como están instaladas',
  'NOT APPLIED': 'NO APLICADO',
  'NOT APPLIED: this terminal will start with every installed skill.':
    'NO APLICADO: esta terminal arrancará con todas las skills instaladas.',
  'not carried': 'no incluida',
  'Not changed': 'Sin cambios',
  'Not copied': 'No se copia',
  'Not importable': 'No importable',
  'Not imported': 'No importada',
  'Not installed': 'No instalada',
  'not measured': 'sin medir',
  'not present': 'no está',
  'Not qualified for this build': 'Build no calificada',
  'Not selectable yet': 'Todavía no se elige',
  'not yet': 'todavía no',
  'Nothing chosen yet. Tick a group or a capability.':
    'Todavía no elegiste nada. Marcá un grupo o una capacidad.',
  'Nothing here yet.': 'Todavía no hay nada acá.',
  'Nothing is imported yet. Open Discover to import a capability you already have.':
    'Todavía no hay nada importado. Abrí Descubrir para importar una capacidad que ya tenés.',
  'Nothing of this kind.': 'No hay nada de este tipo.',
  'Nothing.': 'Nada.',
  'of {total} · estimated, MCP not measured':
    'de {total} · estimado, MCP sin medir',
  'On a notification': 'Al recibir un aviso',
  'One command per line, typed in a new terminal in {folder}.':
    'Un comando por línea, escrito en una terminal nueva en {folder}.',
  'One file in this skill is larger than the import limit.':
    'Un archivo de esta skill supera el límite de importación.',
  'Only changes where it is listed on this screen, not what it does. Saved on this computer.':
    'Solo cambia dónde aparece en esta pantalla, no lo que hace. Se guarda en esta computadora.',
  'Only Claude Code sees it.': 'Solo la ve Claude Code.',
  'Only Codex sees it.': 'Solo la ve Codex.',
  'Only for ordering this list: launches are grouped by role. It does not change what the agent does.':
    'Solo para ordenar esta lista: los lanzamientos se agrupan por rol. No cambia lo que hace el agente.',
  'Only the first 256 KB are shown.': 'Se muestran solo los primeros 256 KB.',
  'Only through a terminal plan: Workspace shows, per terminal, whether this revision is installed and whether it can be applied.':
    'Solo a través del plan de una terminal: Workspace muestra, por terminal, si esta revisión está instalada y si se puede aplicar.',
  'Open Composites': 'Abrir Composites',
  Options: 'Opciones',
  Orchestrator: 'Orquestador',
  'Original text: what the tool reads.':
    'Texto original: lo que lee la herramienta.',
  'os-release ID, e.g. void': 'ID de os-release, p. ej. void',
  Other: 'Otro',
  'Outside tools the agent can call (browser, docs, Notion…). How much context they take is not measured.':
    'Herramientas externas que el agente puede usar (navegador, documentación, Notion…). No se mide cuánto contexto ocupan.',
  'Own role': 'Rol propio',
  'Part of {name}': 'Parte de {name}',
  Permissions: 'Permisos',
  Personal: 'Personales',
  pinned: 'fijada',
  'Plan blocked': 'Plan bloqueado',
  'Plan partial': 'Plan parcial',
  'Plan ready': 'Plan listo',
  'Planning and method': 'Planificación y método',
  'Planning the work: specs, roadmaps, plans and the method that orders them.':
    'Planificar el trabajo: specs, roadmaps, planes y el método que los ordena.',
  Plugin: 'Plugin',
  Plugins: 'Plugins',
  prepared: 'preparada',
  present: 'presente',
  'preset “{name}”': 'preset “{name}”',
  'preset “{name}” (a copy: the other launches keep theirs)':
    'preset “{name}” (una copia: los otros lanzamientos conservan el suyo)',
  'Preset saved': 'Preset guardado',
  Presets: 'Presets',
  Project: 'Proyecto',
  'Project instructions': 'Instrucciones del proyecto',
  'Project: {project}': 'Proyecto: {project}',
  Provider: 'Proveedor',
  Published: 'Publicado',
  'Put back': 'Restaurar',
  read: 'leída',
  'Read from': 'Leída desde',
  'Read only': 'Solo lectura',
  'Reading installed capabilities…': 'Leyendo las capacidades instaladas…',
  'Reading installed composites…': 'Leyendo los composites instalados…',
  'Reading launches…': 'Leyendo lanzamientos…',
  'Reading presets…': 'Leyendo presets…',
  'Reading the Arsenal library…': 'Leyendo la biblioteca de Arsenal…',
  'Reading…': 'Leyendo…',
  Receiving: 'Recibiendo',
  'Recently used': 'Usadas hace poco',
  Refresh: 'Actualizar',
  Refused: 'Rechazado',
  rejected: 'rechazado',
  Reload: 'Recargar',
  'Remove unused packages (autoremove)': 'Quitar paquetes sin uso (autoremove)',
  Rename: 'Renombrar',
  Research: 'Investigación',
  Researcher: 'Investigador',
  'Restore revision {revision}': 'Restaurar la revisión {revision}',
  'Restoring…': 'Restaurando…',
  'Review and testing': 'Revisión y pruebas',
  'Review before importing': 'Revisar antes de importar',
  Reviewer: 'Revisor',
  'Revision {current} of {total}': 'Revisión {current} de {total}',
  'revision {rev}': 'revisión {rev}',
  'Revision {revision}': 'Revisión {revision}',
  Revisions: 'Revisiones',
  role: 'rol',
  Role: 'Rol',
  Roles: 'Roles',
  'roles.json could not be read. Roles are shown as the basic ones and are not saved until the file is fixed or removed.':
    'No se pudo leer roles.json. Se muestran los roles básicos y no se guardan hasta que el archivo se arregle o se borre.',
  Rule: 'Regla',
  Rules: 'Reglas',
  'Rules the agent always follows: standing instructions read when every session starts.':
    'Reglas que el agente cumple siempre: instrucciones fijas que lee al arrancar cada sesión.',
  'Runs code': 'Ejecuta código',
  'runs on this computer': 'corre en esta PC',
  'Same content': 'Mismo contenido',
  'Same content as {names}.': 'Mismo contenido que {names}.',
  'Same content twice': 'Mismo contenido dos veces',
  'Same name': 'Mismo nombre',
  'Same name twice': 'Mismo nombre dos veces',
  Save: 'Guardar',
  'Save and try': 'Guardar y probar',
  'Save environment': 'Guardar entorno',
  'Save preset': 'Guardar preset',
  Saved: 'Guardadas',
  'Saved and recent folders': 'Carpetas guardadas y recientes',
  'Saved as “{name}”. The file under the old name could not be deleted: it is still listed.':
    'Se guardó como “{name}”. No se pudo borrar el archivo con el nombre anterior: sigue en la lista.',
  'Saved.': 'Guardado.',
  'Saving…': 'Guardando…',
  'Scan again': 'Escanear de nuevo',
  'Script it runs': 'Script que se lanza',
  'Scripts that run on their own at fixed moments (before a command, when a turn ends…). The script takes no context, but what some of them print (at start, before each message) enters the conversation. Not measured.':
    'Scripts que corren solos en momentos fijos (antes de un comando, al terminar un turno…). El script no ocupa contexto, pero lo que imprimen algunos (al arrancar, antes de cada mensaje) entra en la conversación. No se mide.',
  Search: 'Buscar',
  'Search capabilities': 'Buscar capacidades',
  'Search launches': 'Buscar lanzamientos',
  'Search skills and agents': 'Buscar skills y agentes',
  'Search…': 'Buscar…',
  Security: 'Seguridad',
  'See original': 'Ver original',
  'See translation': 'Ver traducción',
  session: 'sesión',
  'Session flag it would add (with --no-daemon)':
    'Flag de sesión que agregaría (con --no-daemon)',
  'Session settings it would write': 'Configuración de sesión que escribiría',
  Sets: 'Conjuntos',
  'Several rules': 'Varias reglas',
  'Shared folder': 'Carpeta compartida',
  'Show files of revision {revision}':
    'Ver los archivos de la revisión {revision}',
  'Show the tree': 'Mostrar el árbol',
  'Shows everything at once, of every type.':
    'Muestra todo junto, de todos los tipos.',
  Skill: 'Skill',
  Skills: 'Skills',
  'Skills ({count})': 'Skills ({count})',
  'Skip AUR review (--skipreview)': 'Saltar revisión AUR (--skipreview)',
  Source: 'Origen',
  'Source changed': 'El origen cambió',
  'Special file, not copied': 'Archivo especial, no se copia',
  'Start without applying it, and record the selection with the terminal':
    'Arrancar sin aplicarlo, y registrar la selección con la terminal',
  State: 'Estado',
  Status: 'Estado',
  'Stops after {n} s.': 'Se corta a los {n} s.',
  'Study and knowledge': 'Estudio y conocimiento',
  Supported: 'Compatible',
  'Switch off': 'Apagar',
  'Switch on': 'Prender',
  'Switched off': 'Apagada',
  'Switched off ({count})': 'Desactivadas ({count})',
  'Switched on': 'Prendida',
  'Sync error': 'Error de sincronización',
  Synchronization: 'Sincronización',
  'Synchronization details': 'Detalles de la sincronización',
  'System and setup': 'Sistema y entorno',
  'Terminal configurations': 'Configuraciones de terminal',
  'Terminal environment': 'Entorno de la terminal',
  'That item is no longer in the library or in your skill folders. Refresh and try again.':
    'Ese elemento ya no está en la biblioteca ni en tus carpetas de skills. Actualizá y probá de nuevo.',
  'That name cannot be used: it is empty, longer than 40 characters, or already in this section.':
    'Ese nombre no sirve: está vacío, tiene más de 40 caracteres o ya existe en esta sección.',
  'The agent asks before every change.':
    'El agente pregunta antes de cada cambio.',
  'The agent edits files without asking; it still asks before running commands. Claude Code only.':
    'El agente edita archivos sin preguntar; igual pregunta antes de ejecutar comandos. Solo Claude Code.',
  'The agent reads and plans; it changes nothing.':
    'El agente lee y planifica; no cambia nada.',
  'The Arsenal library could not be opened. Check that the Wyss data folder is writable, then Refresh.':
    'No se pudo abrir la biblioteca de Arsenal. Revisá que la carpeta de datos de Wyss se pueda escribir y después actualizá.',
  'The Arsenal library could not be opened. Refresh after the Wyss data folder is writable.':
    'No se pudo abrir la biblioteca de Arsenal. Actualizá cuando la carpeta de datos de Wyss se pueda escribir.',
  'The Arsenal library is damaged, so nothing was changed. Keep the file and report it.':
    'La biblioteca de Arsenal está dañada, así que no se cambió nada. Guardá el archivo y avisalo.',
  'The category could not be deleted. Try again.':
    'No se pudo borrar la categoría. Probá de nuevo.',
  'The description is longer: only its beginning is shown.':
    'La descripción es más larga: se muestra solo el comienzo.',
  'the file cannot be read': 'el archivo no se puede leer',
  'The file could not be read.': 'No se pudo leer el archivo.',
  'The file’s own commands, for every distribution. Add one to give it its own.':
    'Los comandos propios del archivo, para cualquier distribución. Agregá una para darle los suyos.',
  'The folder holds more files than are counted here.':
    'La carpeta tiene más archivos de los que se cuentan acá.',
  'The folders have more entries than the scan shows. Some are not listed.':
    'Las carpetas tienen más entradas de las que muestra el escaneo. Algunas no se listan.',
  'The last run failed: {error}.': 'La última corrida falló: {error}.',
  'The launch instructions file (role-instructions.json) cannot be read. Launches with custom instructions do not start. The file was not changed.':
    'No se puede leer el archivo de instrucciones de lanzamiento (role-instructions.json). Los lanzamientos con instrucciones propias no arrancan. El archivo no se modificó.',
  'The launch instructions file cannot be read. It was not modified.':
    'No se puede leer el archivo de instrucciones de lanzamiento. No se modificó.',
  'The launch instructions file would be too large, so it was not saved.':
    'El archivo de instrucciones de lanzamiento sería demasiado grande; no se guardó.',
  'The launch plan could not be read. Check the folder and try again.':
    'No se pudo leer el plan del lanzamiento. Revisá la carpeta y volvé a intentarlo.',
  'The launch preview failed.': 'La vista previa del lanzamiento falló.',
  'The launch preview refuses this combination:':
    'La vista previa del arranque rechaza esta combinación:',
  'The library did not load completely. Try Refresh.':
    'La biblioteca no se cargó completa. Probá Actualizar.',
  'The request was not valid. Check the fields and try again.':
    'El pedido no era válido. Revisá los campos y probá de nuevo.',
  'The role could not be deleted.': 'No se pudo borrar el rol.',
  'The role could not be saved.': 'No se pudo guardar el rol.',
  'The script was written by hand, so the options are off.':
    'El script se editó a mano, así que las opciones quedan apagadas.',
  'The skills of your Claude account (claude.ai), on top of the ones installed on this computer.':
    'Las skills de tu cuenta de Claude (claude.ai), además de las instaladas en esta PC.',
  'The skills on disk could not be read.':
    'No se pudieron leer las skills del disco.',
  'The text applies at start. Another open terminal of this launch may see it change; resuming a conversation keeps what it already had.':
    'El texto se aplica al arrancar. Otra terminal abierta de este lanzamiento puede verlo cambiar; al reanudar una conversación se conserva lo que ya tenía.',
  'These files use a credential word. They are copied; check that none holds a real value.':
    'Estos archivos usan una palabra de credencial. Se copian; revisá que ninguno tenga un valor real.',
  'This computer': 'Esta computadora',
  'This computer and the tools themselves: setup, health checks and upgrades.':
    'Esta computadora y las propias herramientas: configuración, chequeos de salud y actualizaciones.',
  'This computer only': 'Solo esta computadora',
  'This computer’s distribution could not be read (/etc/os-release).':
    'No se pudo leer la distribución de esta PC (/etc/os-release).',
  'This computer’s distribution: it cannot be deleted.':
    'Es la distribución de esta PC: no se puede borrar.',
  'This file is not text, so it cannot be shown here.':
    'Este archivo no es texto, así que no se puede mostrar acá.',
  'This file is too large to show here.':
    'Este archivo es demasiado grande para mostrarlo acá.',
  'This folder has no SKILL.md, so it is not a skill.':
    'Esta carpeta no tiene SKILL.md, así que no es una skill.',
  'This hook cannot be changed here.':
    'Este hook no se puede cambiar desde acá.',
  'This is a link into {composite} {version}. It is read only: GSD Core installs it, so Arsenal does not copy it.':
    'Es un enlace a {composite} {version}. Es solo lectura: lo instala GSD Core, así que Arsenal no lo copia.',
  'This kind is listed only. Arsenal does not copy it.':
    'Este tipo solo se lista. Arsenal no lo copia.',
  'This launch is saved as {file}.toml. Saving writes {next}.toml and removes {file}.toml.':
    'Este lanzamiento está guardado como {file}.toml. Al guardar se escribe {next}.toml y se borra {file}.toml.',
  'This launch runs commands from its file. It opens from here; edit it in its file.':
    'Este lanzamiento corre comandos de su archivo. Se abre desde acá; editalo en su archivo.',
  'This library was written by a newer version of Wyss Console.':
    'Esta biblioteca la escribió una versión más nueva de Wyss Console.',
  'This preset leaves a Codex hook or AGENTS.md out, so the terminal starts only with it applied: started without it, they would load again. It cannot be applied now, so it cannot start.':
    'Este preset deja afuera un hook de Codex o el AGENTS.md, así que la terminal solo arranca con el preset aplicado: sin aplicarlo volverían a cargarse. Ahora no se puede aplicar, así que no puede arrancar.',
  'This project is in a folder another account can write. Arsenal lists it as read only and does not copy it.':
    'Este proyecto está en una carpeta que otra cuenta puede escribir. Arsenal lo lista como solo lectura y no lo copia.',
  'This skill cannot be imported.': 'Esta skill no se puede importar.',
  'This skill changed while it was being read. Scan again.':
    'Esta skill cambió mientras se leía. Escaneá de nuevo.',
  'This skill has more files than the import limit.':
    'Esta skill tiene más archivos que el límite de importación.',
  'This skill is a symbolic link. Arsenal does not follow links out of a skill folder.':
    'Esta skill es un enlace simbólico. Arsenal no sigue enlaces que salgan de una carpeta de skill.',
  'This skill is larger than the import limit.':
    'Esta skill supera el límite de importación.',
  'This skill nests folders deeper than the import limit.':
    'Esta skill anida carpetas más profundo que el límite de importación.',
  'This terminal gets its own Codex folder and signs in with your own Codex sign-in. Your own hooks.json and config.toml are not changed.':
    'Esta terminal tiene su propia carpeta de Codex e inicia sesión con tu propio inicio de sesión de Codex. Tu hooks.json y tu config.toml no cambian.',
  'This terminal gets its own launch folder and signs in with your stored long-lived token. Your own ~/.claude is not changed.':
    'Esta terminal arranca con su propia carpeta y entra con tu token de larga duración guardado. Tu ~/.claude no se toca.',
  'This terminal uses your own Codex configuration as it is.':
    'Esta terminal usa tu configuración de Codex tal como está.',
  'This terminal uses your own configuration as it is.':
    'Esta terminal usa tu configuración tal como está.',
  Tool: 'Herramienta',
  'Translated text; the tool reads the original.':
    'Texto traducido; la herramienta lee el original.',
  Try: 'Probar',
  'Try again': 'Reintentar',
  'Two methodologies': 'Dos metodologías',
  'Two methodologies kept': 'Dos metodologías conservadas',
  'Two rules for one provider': 'Dos reglas para un mismo provider',
  Undo: 'Deshacer',
  'unidentified build': 'build sin identificar',
  unknown: 'desconocida',
  'Unsaved changes': 'Cambios sin guardar',
  Unsupported: 'No compatible',
  Unverified: 'Sin verificar',
  'Update Flatpak apps': 'Actualizar apps Flatpak',
  'Use in a session': 'Uso en una sesión',
  'Use it when': 'Usala cuando',
  'Use not observed': 'Uso no observado',
  'Version {version}': 'Versión {version}',
  Waiting: 'En espera',
  "What each terminal started with, recorded right after its start from the host's own session record. Applied means the host launched it with that exact exclusion; whether the provider then used each skill is not observed.":
    'Con qué arrancó cada terminal, anotado justo después de su inicio desde el registro de sesión del propio host. Aplicado quiere decir que el host la lanzó con esa exclusión exacta; no se observa si el provider después usó cada skill.',
  'What it runs': 'Qué ejecuta',
  'What no rule placed. Use Move to group… to put it where it belongs.':
    'Lo que ninguna regla ubicó. Usá Mover a grupo… para ponerlo donde va.',
  'What the agent may do without asking you. “As configured” passes nothing: the agent starts with the permissions of its own settings. The model and the effort are chosen inside the agent.':
    'Qué puede hacer el agente sin preguntarte. “Como está configurado” no pasa nada: el agente arranca con los permisos de su propia configuración. El modelo y el esfuerzo se eligen dentro del agente.',
  'What this preset loads besides its skills. Anything unticked is not loaded in that terminal, and costs no context.':
    'Lo que este preset carga además de sus skills. Lo que destildes no se carga en esa terminal y no gasta contexto.',
  'What this preset loads besides its skills. Anything unticked is not loaded in that terminal.':
    'Lo que carga este preset además de sus skills. Lo desmarcado no se carga en esa terminal.',
  'When a session ends': 'Al cerrar una sesión',
  'When a session opens': 'Al abrir una sesión',
  'When a subagent ends': 'Al terminar un subagente',
  'When it runs': 'Cuándo corre',
  'When the answer ends': 'Al terminar la respuesta',
  'When you send a message': 'Al mandar un mensaje',
  Where: 'Dónde',
  'Where the agent works: it reads and edits the files of this folder, and its project settings are this folder’s.':
    'Dónde trabaja el agente: lee y edita los archivos de esta carpeta, y usa la configuración de proyecto de esta carpeta.',
  'Which agent the launch starts: Claude Code (Anthropic) or Codex (OpenAI). Changing it starts the preset and the environment over, and a permission the other agent does not have.':
    'Qué agente arranca el lanzamiento: Claude Code (Anthropic) o Codex (OpenAI). Si lo cambiás, el preset y el entorno vuelven a cero, y también un permiso que el otro agente no tiene.',
  "Without the project's": 'Sin las del proyecto',
  Worker: 'Trabajador',
  'Workspace could not be read.': 'No se pudo leer el Workspace.',
  'Write the command…': 'Escribir el comando…',
  'Writing and converting documents: docs, reports, prompts and PDFs.':
    'Escribir y convertir documentos: docs, informes, prompts y PDF.',
  'Writing for the web and social media, and search ranking (SEO).':
    'Escribir para la web y redes, y posicionamiento en buscadores (SEO).',
  'Writing the code: executing plans, fixing findings and shipping.':
    'Escribir el código: ejecutar planes, aplicar arreglos y publicar.',
  'Yes: it registers hooks.': 'Sí: registra hooks.',
  'Your agents (~/.claude/agents, GSD included)':
    'Tus agentes (~/.claude/agents, incluido GSD)',
  'Your home folder is not known, so skills cannot be read. Refresh to try again.':
    'No se conoce tu carpeta personal, así que no se pueden leer las skills. Actualizá para probar de nuevo.',
  'Bulk import: {parts}.': 'Importación en lote: {parts}.',
  'Imported {name} as revision {revision}.':
    'Se importó {name} como revisión {revision}.',
  'Imported {name} as revision {revision}. The source had changed.':
    'Se importó {name} como revisión {revision}. El origen había cambiado.',
  '{name} is already imported at revision {revision}. Nothing changed.':
    '{name} ya está importada en la revisión {revision}. No hubo cambios.',
  'Nothing to import: every eligible skill is already in the library.':
    'No hay nada para importar: todas las skills aptas ya están en la biblioteca.',
  'Preset deleted.': 'Se eliminó el preset.',
  'Revision {revision} is current again. No new revision was made.':
    'La revisión {revision} vuelve a ser la actual. No se creó una revisión nueva.',
  'Saved preset {name}.': 'Se guardó el preset {name}.',
  'Selection deleted.': 'Se eliminó la selección.',
  '{summary} Stopped: {reason}': '{summary} Se detuvo: {reason}',
};
