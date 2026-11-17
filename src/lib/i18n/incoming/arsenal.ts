/** Spanish for text the desktop (Rust) sends to the window, area: arsenal. A part the desktop
 * fills in is written `{name}` and matches any text there (the same name must appear in Spanish).
 * `incomingMessage` normalizes Rust-escaped quotes around two format values before lookup.
 * Read by `tIncoming`.
 */
export const INCOMING: Readonly<Record<string, string>> = {
  'Arsenal does not hold this kind.': 'Arsenal no admite este tipo.',
  'A {owner} skill. {target} reads the same SKILL.md format, but using it there needs a qualified way to add it to a session.':
    'Una skill de {owner}. {target} lee el mismo formato SKILL.md, pero para usarla allí hace falta una forma validada de incorporarla a una sesión.',
  'A {owner} {kind} file. {target} uses a different format for this.':
    'Un archivo de tipo {kind} de {owner}. {target} usa otro formato.',
  'It refers to {kind} "{name}", which is not there.':
    'Hace referencia a {kind} «{name}», que no está disponible.',
  '{target} reads this {kind} format, but it holds scripts whose own requirements are not checked. Wyss never runs them.':
    '{target} lee este formato de {kind}, pero contiene scripts cuyos requisitos no se verifican. Wyss nunca los ejecuta.',
  "{target}'s own {kind} format, read from its own folder.":
    'Formato propio de {kind} de {target}, leído desde su carpeta.',
  'The library no longer holds this capability or revision.':
    'La biblioteca ya no tiene esta capacidad ni esta revisión.',
  'Another capability of this selection has the same name.':
    'Otra capacidad de esta selección tiene el mismo nombre.',
  'The library no longer holds this capability or its pinned revision.':
    'La biblioteca ya no tiene esta capacidad ni la revisión fijada.',
  'Built for {owner}; this terminal runs {target}.':
    'Preparado para {owner}; esta terminal usa {target}.',
  'A {kind} is not switched per session. The provider loads its installed ones as usual.':
    'El proveedor carga los elementos instalados de este tipo como siempre; no se pueden activar ni desactivar por sesión (tipo: {kind}).',
  'Not installed for this provider. Adding stored content to one session needs a qualified session plugin, which is not available.':
    'Esta habilidad no está instalada para este proveedor. Para agregar contenido guardado a una sesión hace falta un plugin de sesión verificado, que no está disponible.',
  'The installed copy is exactly revision {revision}. It stays exposed.':
    'La copia instalada corresponde exactamente a la revisión {revision}. Sigue disponible.',
  'Installed as a link, so its content cannot be compared with this revision.':
    'Está instalada como enlace, por eso no se puede comparar su contenido con esta revisión.',
  'The installed copy differs from revision {revision}. Restore or import so they match; Arsenal does not expose a revision that is not installed.':
    'La copia instalada no coincide con la revisión {revision}. Restaurala o volvé a importarla para que coincida; Arsenal no muestra revisiones que no estén instaladas.',
  'The selection keeps {key}, which is not installed for this provider.':
    'La selección conserva «{key}», que no está instalado para este proveedor.',
  '{count} kept skill(s) are switched off in your own {provider} configuration and stay off: {names}.':
    'Estas skills conservadas siguen desactivadas en tu configuración de {provider}: {names} ({count}).',
  'Hooks, permissions and MCP servers: as your settings say.':
    'Hooks, permisos y servidores MCP: según tus ajustes.',
  "The provider's built-in skills.": 'Las skills incluidas en el proveedor.',
  "Codex's own system skills (~/.codex/skills/.system) and the skills your config.toml already switches.":
    'Las skills de sistema de Codex (~/.codex/skills/.system) y las que tu config.toml ya desactiva.',
  'Plugin {plugin} keeps its {count} skill(s): plugin skills are not switched off by skill overrides.':
    'El plugin {plugin} conserva sus skills ({count}): las anulaciones no desactivan las skills de los plugins.',
  '{name}: missing {kind} "{dependency}".':
    '{name}: falta {kind} «{dependency}».',
  'Some installed skills could not be read, so the exclusion would be incomplete. Nothing is applied.':
    'No se pudieron leer algunas habilidades instaladas; la exclusión quedaría incompleta y no se aplicaría ningún cambio.',
  'More than {count} installed skills would be switched off.':
    'Se desactivarían más de {count} habilidades instaladas.',
  'The installed provider build could not be identified. Nothing is applied.':
    'No se pudo identificar la versión instalada del proveedor. No se aplica.',
  'Skill exclusion is qualified for {version}. Start applies it to this terminal only.':
    'La opción para desactivar habilidades está verificada para la versión {version}. Al iniciar, se aplica solo a esta terminal.',
  '{provider} has no qualified per-session skill switch: the session layer of [[skills.config]] and the shared app-server daemon are not proven. The selection can be recorded, not applied.':
    'No hay una opción verificada para desactivar habilidades por sesión en {provider}: no se comprobó la capa de sesión de [[skills.config]] ni el servidor app-server compartido. La selección se puede guardar, pero no aplicar.',
  'Skill exclusion is not qualified for Claude Code {version}. The selection can be recorded, not applied.':
    'La opción para desactivar habilidades no está verificada para Claude Code {version}. La selección se puede guardar, pero no aplicar.',
  'Started with this exact exclusion. Whether the provider used it is not observed.':
    'Se inició con esta exclusión exacta. No se observó si el proveedor la usó.',
  'Started without applying the selection.':
    'Se inició sin aplicar la selección.',
  'The configuration changed between the preview and this record.':
    'La configuración cambió entre la vista previa y este registro.',
  'The Arsenal selection is not well formed.':
    'La selección de Arsenal no tiene un formato válido.',
  'This launch environment was chosen for Claude Code. Codex takes its own: instructions and hooks.':
    'Este entorno de lanzamiento se eligió para Claude Code. Codex usa el suyo: instrucciones y hooks.',
  'Arsenal can switch skills off for one session only in Claude Code and Codex.':
    'Arsenal solo puede desactivar skills para una sesión en Claude Code y Codex.',
  'The session settings could not be combined.':
    'No se pudieron combinar los ajustes de la sesión.',
  'An Arsenal selection does not launch with hooks off. Choose a profile that keeps hooks.':
    'Una selección de Arsenal no puede iniciar con los hooks desactivados. Elige un perfil que los conserve.',
  'The Arsenal selection names skills but not their files.':
    'La selección de Arsenal indica skills, pero no sus archivos.',
  'A skill the Arsenal selection switches off is no longer installed. Check the plan again.':
    'Una skill que la selección de Arsenal desactiva ya no está instalada. Revisa el plan de nuevo.',
  'Arsenal selection {selection}: {count} installed skill(s) switched off for this session.':
    'Selección de Arsenal «{selection}»: se desactivan las skills instaladas en esta sesión ({count}).',
  'Arsenal selection {selection}: {count} installed skill(s) switched off for this session, which runs without the shared Codex server.':
    'Selección de Arsenal «{selection}»: esta sesión se inicia sin el servidor compartido de Codex y desactiva las skills instaladas ({count}).',
  'without CLAUDE.md and rules': 'sin CLAUDE.md ni archivos de reglas',
  '{count} rule file(s) left out': 'Archivos de reglas omitidos: {count}',
  '{count} hook(s) left out': 'Hooks omitidos: {count}',
  'only {count} MCP server(s)': 'Servidores MCP conservados: {count}',
  '{count} plugin(s) off': 'Plugins desactivados: {count}',
  'auto memory off': 'memoria automática desactivada',
  'without your agents': 'sin tus agentes',
  '{count} account skill(s) off': 'Skills de la cuenta desactivadas: {count}',
  'Own launch folder, signed in with the stored long-lived token: {changes}.':
    'Carpeta de lanzamiento propia, con inicio de sesión mediante el token de larga duración guardado: {changes}.',
  'without AGENTS.md': 'sin AGENTS.md',
  'Own Codex folder, signed in with your own Codex sign-in: {changes}. Codex asks to trust the hooks the first time in each new folder.':
    'Carpeta propia de Codex, con tu sesión de Codex: {changes}. Codex pide que se confíe en los hooks la primera vez que se usan en cada carpeta nueva.',
  'model via --model': 'modelo mediante --model',
  'reasoning effort via --effort': 'nivel de razonamiento mediante --effort',
  'permission mode via --permission-mode':
    'modo de permisos mediante --permission-mode',
  'session JSON overlay via --settings':
    'superposición JSON de sesión mediante --settings',
  'skillOverrides=off and disableAllHooks behavior tested on Claude Code 2.1.303':
    'comportamiento de skillOverrides=off y disableAllHooks probado en Claude Code 2.1.303',
  'full access via --dangerously-skip-permissions':
    'acceso completo mediante --dangerously-skip-permissions',
  'full access via --dangerously-skip-permissions (--help, 2026-11-07)':
    'acceso completo mediante --dangerously-skip-permissions (--help, 2026-11-07)',
  'reasoning effort via --effort (low, medium, high, xhigh, max)':
    'nivel de razonamiento mediante --effort (low, medium, high, xhigh, max)',
  'reasoning effort via -c model_reasoning_effort=...':
    'nivel de razonamiento mediante -c model_reasoning_effort=...',
  'sandbox via -s': 'sandbox mediante -s',
  'approval mode via -a': 'modo de aprobación mediante -a',
  '--model, --effort, --permission-mode and --settings':
    '--model, --effort, --permission-mode y --settings',
  '--model, --effort, --permission-mode, --dangerously-skip-permissions and --settings':
    '--model, --effort, --permission-mode, --dangerously-skip-permissions y --settings',
  '-m, -c KEY=VALUE, -s, -a and --dangerously-bypass-approvals-and-sandbox':
    '-m, -c KEY=VALUE, -s, -a y --dangerously-bypass-approvals-and-sandbox',
  'argv flags plus a JSON settings overlay':
    'flags de argv más una superposición JSON de ajustes',
  'argv flags plus -c KEY=VALUE parsed as a TOML value':
    'flags de argv más -c KEY=VALUE interpretado como un valor TOML',
  'one Native child process; Wyss does not write global or project settings':
    'un proceso hijo de Native; Wyss no escribe los ajustes globales ni los del proyecto',
  'No Native overlay hot-reload acceptance; effective use is unverified':
    'No se verificó la recarga en caliente de la superposición de Native; el uso efectivo no está verificado',
  '2.1.309 --version/--help; F3 and F1/F2a real overlay checks on 2.1.303':
    '2.1.309 --version/--help; verificaciones reales de superposición F3 y F1/F2a en 2.1.303',
  'Exact 2.1.309 Native provider-resolved/effective values and account entitlement are not observed':
    'No se observaron los valores efectivos resueltos por el proveedor ni la habilitación de cuenta para Native 2.1.309',
  '2.1.316 --version/--help on saint-acer and Santiago-PC':
    '2.1.316 --version/--help en saint-acer y Santiago-PC',
  'Syntax only: effective values, overlay behavior on this build and account entitlement are not observed':
    'Solo se verificó la sintaxis: no se observaron los valores efectivos, el comportamiento de la superposición en esta versión ni la habilitación de cuenta',
  '2.1.319 --version/--help on Santiago-PC':
    '2.1.319 --version/--help en Santiago-PC',
  'Syntax only: effective values, the full-access effect and account entitlement are not observed':
    'Solo se verificó la sintaxis: no se observaron los valores efectivos, el efecto del acceso completo ni la habilitación de cuenta',
  'one Native child process; ~/.codex/config.toml is not written':
    'un proceso hijo de Native; no se modifica ~/.codex/config.toml',
  'No Native turn or session reload was tested; -c is a launch override':
    'No se probó un turno de Native ni la recarga de sesión; -c es una opción del lanzamiento',
  '0.159.0 --version/--help; F6 read-only config/read (no Native turn)':
    '0.159.0 --version/--help; lectura de solo consulta config/read con F6 (sin turno de Native)',
  'override resolution is not proof that a Native turn used the requested value or was entitled to it':
    'Resolver una opción no demuestra que un turno de Native haya usado el valor solicitado ni que tuviera permiso para hacerlo',
  'project scope through the current working directory':
    'alcance de proyecto mediante el directorio de trabajo actual',
  'native TUI by default': 'TUI nativa de forma predeterminada',
  'OpenCode v1 CLI argument parser':
    'analizador de argumentos CLI de OpenCode v1',
  'one Native child process; the selected project is its working directory':
    'un proceso hijo de Native; el proyecto seleccionado es su directorio de trabajo',
  'launch-time only; effective model/provider resolution is unobserved':
    'solo al iniciar; no se observó la resolución efectiva del modelo o proveedor',
  'the exact source accepts --model; Wyss does not attest provider resolution or model use':
    'El código fuente exacto acepta --model; Wyss no verifica la resolución del proveedor ni el uso del modelo',
  'Native full-account CLI/TUI; no Wyss mediation or confinement':
    'CLI/TUI de cuenta completa de Native; Wyss no intermedia ni limita su ejecución',
  'the pinned upstream has an interactive CLI/TUI, but `hermes --version` performs an update check; no exact installed build is observed and no profile override is applied':
    'El proyecto upstream fijado tiene una CLI/TUI interactiva, pero `hermes --version` busca actualizaciones; no se observó la versión instalada exacta ni se aplica una opción de perfil',
  'this exact CLI build has no M2 profile-override evidence':
    'no hay evidencia de opciones de perfil para esta versión exacta de la CLI',
  'plugin and built-in skills are not switched off; concurrent sessions and provider use of each skill are not observed':
    'no se desactivan las skills de plugins ni las integradas; no se observaron sesiones simultáneas ni el uso de cada skill por parte del proveedor',
  'plugin and built-in skills are not switched off; provider use of each skill is not observed':
    'no se desactivan las skills de plugins ni las integradas; no se observó el uso de cada skill por parte del proveedor',
  'plugin and system skills are not switched off; a folder path is ignored by Codex, so only SKILL.md paths are used; concurrent interactive sessions and the shared-server separation were not observed again on this build; provider use of each skill is not observed':
    'no se desactivan las skills de plugins ni las del sistema; Codex ignora las rutas de carpetas, por eso solo se usan rutas a SKILL.md; en esta versión no se volvieron a observar sesiones interactivas simultáneas ni la separación del servidor compartido; no se observó el uso de cada skill por parte del proveedor',
  'plugin and system skills are not switched off; a folder path is ignored by Codex, so only SKILL.md paths are used; the session does not join the shared Codex server; provider use of each skill is not observed':
    'no se desactivan las skills de plugins ni las del sistema; Codex ignora las rutas de carpetas, por eso solo se usan rutas a SKILL.md; la sesión no se conecta al servidor compartido de Codex; no se observó el uso de cada skill por parte del proveedor',
  'not a real build': 'no es una versión real',
  'this build was not checked; plugin and built-in skills are not switched off; provider use of each skill is not observed':
    'esta versión no se verificó; no se desactivan las skills de plugins ni las integradas; no se observó el uso de cada skill por parte del proveedor',
};
