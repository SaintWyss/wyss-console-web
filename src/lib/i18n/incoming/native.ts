/**
 * Spanish for text the desktop (Rust) sends to the window, area: native. The key is the English
 * sentence exactly as the desktop writes it; a part the desktop fills in is written `{name}`
 * and matches any text there (the same name must appear in the Spanish). Read by `tIncoming`.
 */
export const INCOMING: Readonly<Record<string, string>> = {
  'This profile was not written for this agent.':
    'Este perfil no se creó para este agente.',
  'Model: {model}.': 'Modelo: {model}.',
  'Hermes profile overrides remain unavailable until this exact installed build can be identified without running provider update checks.':
    'Los perfiles de Hermes todavía no pueden sobrescribir ajustes hasta identificar esta versión instalada sin ejecutar una comprobación de actualizaciones.',
  'Reasoning effort: {effort}.': 'Nivel de razonamiento: {effort}.',
  'Claude Code documents these effort levels: {levels}. {quoted_effort} is not one of them, so it is not passed.':
    'Claude Code documenta estos niveles de razonamiento: {levels}. {quoted_effort} no está entre ellos, así que no se envía.',
  'Reasoning effort: {effort} (this session only; Codex reads it as a configuration override).':
    'Nivel de razonamiento: {effort} (solo para esta sesión; Codex lo interpreta como una opción de configuración).',
  'This provider has no qualified reasoning-effort profile interface.':
    'Este proveedor no tiene una interfaz de perfiles de nivel de razonamiento calificada.',
  'Permissions: skipped (--dangerously-skip-permissions).':
    'Permisos: se omiten (--dangerously-skip-permissions).',
  "Full access: the agent asks nothing and runs every command and{gap}edit without a sandbox, with your account's rights.":
    'Acceso total: el agente no pide confirmación y ejecuta cualquier comando y{gap}cambio sin aislamiento, con los permisos de tu cuenta.',
  'Permission mode: {mode}.': 'Modo de permisos: {mode}.',
  'Codex: no approvals and no sandbox (--dangerously-bypass-approvals-and-sandbox).':
    'Codex: sin aprobaciones ni aislamiento (--dangerously-bypass-approvals-and-sandbox).',
  'Codex: workspace-write sandbox, asks when it decides to.':
    'Codex: aislamiento de escritura en Workspace; pregunta cuando lo decide.',
  'Codex: read-only sandbox, asks when it decides to.':
    'Codex: aislamiento de solo lectura; pregunta cuando lo decide.',
  'Codex has no separate mode that accepts edits without asking.':
    'Codex no tiene un modo separado que acepte cambios sin preguntar.',
  "This provider's permission controls are not managed by Native profiles.":
    'Los perfiles de Native no administran los controles de permisos de este proveedor.',
  'Hooks are off for this session only. Your user settings still load and no{gap}global file is changed.':
    'Los hooks se desactivan solo para esta sesión. Tus ajustes de usuario siguen cargándose y no{gap}se modifica ningún archivo global.',
  'Codex hooks cannot be switched off for one session.':
    'Los hooks de Codex no se pueden desactivar para una sola sesión.',
  "This provider's hooks cannot be changed by a Native profile.":
    'Un perfil de Native no puede cambiar los hooks de este proveedor.',
  '{n} skill(s) switched off.': 'Skills desactivadas: {n}.',
  'Codex skills cannot be switched off for one session.':
    'Las skills de Codex no se pueden desactivar para una sola sesión.',
  "This provider's skills cannot be changed by a Native profile.":
    'Un perfil de Native no puede cambiar las skills de este proveedor.',
  'Skill exclusion is not qualified for this provider build.':
    'La exclusión de skills no está calificada para esta versión del proveedor.',
  'The Native host cannot bind this preview to the start. Update the host before choosing permissions.':
    'El host de Native no puede asociar esta vista previa con el inicio. Actualizá el host antes de elegir los permisos.',
  'This Native host cannot bind an effort-bearing profile to its preview. Update the host before starting it.':
    'Este host de Native no puede asociar un perfil con nivel de razonamiento a su vista previa. Actualizá el host antes de iniciarlo.',
  'Legacy Native host: it cannot bind this profile to the displayed preview revision and may apply the latest saved version at start.':
    'El host de Native no puede asociar este perfil con la versión de vista previa mostrada y podría aplicar la última versión guardada al iniciar.',
  'Permission flags are refused for an unverified provider build.':
    'Se rechazan las opciones de permisos para una versión del proveedor que no está verificada.',

  'The task workspace could not be made.':
    'No se pudo preparar el Workspace de la tarea.',
  '{limit} delegated agents are already running':
    'Ya hay {limit} agentes delegados en ejecución.',
  'Codex did not list its models': 'Codex no informó sus modelos.',
  'Codex does not offer the model {model}':
    'Codex no ofrece el modelo {model}.',
  '{model} supports {efforts}':
    '{model} admite estos niveles de razonamiento: {efforts}.',
  '{model} is not among the Claude Code models the delegation policy allows':
    '{model} no está entre los modelos de Claude Code permitidos por la política de delegación.',
  'Claude Code supports {efforts}':
    'Claude Code admite estos niveles de razonamiento: {efforts}.',
  'The orchestrator session has ended.': 'La sesión del orquestador terminó.',
  'This session may not delegate.': 'Esta sesión no puede delegar.',
  'The delegation policy is unreadable or invalid; no agent was started.':
    'No se puede leer la política de delegación o no es válida; no se inició ningún agente.',
  'The delegation policy does not allow {provider}':
    'La política de delegación no permite {provider}.',
  'The task is empty, too long or not text.':
    'La tarea está vacía, es demasiado larga o no es texto.',
  'At most {minutes} minutes': 'Hasta {minutes} minutos.',
  'Codex cannot turn off {quoted_name} from the command line':
    'Codex no puede desactivar {quoted_name} desde la línea de comandos.',
  'settings not written': 'No se guardaron los ajustes.',
  'bubblewrap is required to isolate worker processes.':
    'Se necesita bubblewrap para aislar los procesos de trabajo.',
  'record not writable': 'No se puede escribir el registro.',
  'The Arsenal library cannot be read.':
    'No se puede leer la biblioteca de Arsenal.',
  presets: 'presets',
  selections: 'selecciones',
  capabilities: 'capacidades',
  'installed skills': 'skills instaladas',
  'at most {count}': 'como máximo {count}',
  '{capability} has conflicting pinned revisions':
    'La capacidad {capability} tiene revisiones fijadas que no coinciden.',
  'unknown token': 'token desconocido',
  'no such delegation': 'no existe esa delegación',
  'The terminal host stopped while this agent ran.':
    'El host de terminales se detuvo mientras se ejecutaba este agente.',
  'The record could not be written.': 'No se pudo escribir el registro.',
  'The worker did not start: {error}': 'No se pudo iniciar el proceso: {error}',
  'The worker did not start with the planned configuration; it was stopped.':
    'El proceso no se inició con la configuración prevista y se detuvo.',
  'The worker ended without a result.':
    'El proceso terminó sin entregar un resultado.',
  "The worker's configuration did not match the plan.":
    'La configuración del proceso no coincidía con el plan.',
  'Stopped after {seconds} second(s).':
    'Se detuvo después de {seconds} segundo(s).',
  'Codex reported an error.': 'Codex informó un error.',
  'Claude Code reported an error.': 'Claude Code informó un error.',
  'Claude Code did not report its configuration':
    'Claude Code no informó su configuración.',
  'model {model} is not {requested_model}':
    'El modelo {model} no coincide con el solicitado: {requested_model}.',
  'skill {name} is exposed': 'La skill {name} quedó expuesta.',
  'skill {name} is missing': 'Falta la skill {name}.',
  'Claude Code did not list its skills': 'Claude Code no informó sus skills.',
  'plugins are loaded': 'Hay plugins cargados.',
  'Claude Code did not list its plugins': 'Claude Code no informó sus plugins.',
  'MCP servers are loaded': 'Hay servidores MCP cargados.',
  'Claude Code did not list its MCP servers':
    'Claude Code no informó sus servidores MCP.',
  '{file} is exposed': '{file} quedó expuesto.',
  '{file} is missing': 'Falta {file}.',
  'Codex did not report its runtime model and effort':
    'Codex no informó el modelo ni el nivel de razonamiento del runtime.',
  'effort {observed} is not {requested}':
    'El nivel de razonamiento {observed} no coincide con el solicitado: {requested}.',
  'Codex did not report its session': 'Codex no informó su sesión.',
  "Codex's session record was not found":
    'No se encontró el registro de sesión de Codex.',
  "Codex's session record could not be read":
    'No se pudo leer el registro de sesión de Codex.',
  "Codex's session record lists no skills":
    'El registro de sesión de Codex no incluye skills.',
};
