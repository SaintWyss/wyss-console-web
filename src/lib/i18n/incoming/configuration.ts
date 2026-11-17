/**
 * Spanish for text the desktop (Rust) sends to the window, area: configuration. The key is the English
 * sentence exactly as the desktop writes it; a part the desktop fills in is written `{name}`
 * and matches any text there (the same name must appear in the Spanish). Read by `tIncoming`.
 */
export const INCOMING: Readonly<Record<string, string>> = {
  'add hook · {event} · {matcher}': 'Agregar hook · {event} · {matcher}',
  'edit hook · {event}': 'Editar hook · {event}',
  'add MCP server · {name}': 'Agregar servidor MCP · {name}',
  'edit MCP server · {name}': 'Editar servidor MCP · {name}',
  'plugin · {name}': 'Complemento · {name}',
  'MCP server · {name}': 'Servidor MCP · {name}',
  'All hooks': 'Todos los hooks',
  'take back an authored change': 'Revertir un cambio creado desde la Consola',
  '(too deep to show)': '(hay demasiados niveles para mostrar)',
  'the file goes back to exactly what it was':
    'El archivo vuelve exactamente a su estado anterior.',
  'enabled: (the line is removed)': 'enabled: (se elimina la línea)',
  "open must start with the tool's command name (like kimi) or its absolute path":
    'El comando para abrir debe empezar con el nombre de la herramienta (como kimi) o con su ruta absoluta.',
  '{path} is a link: nothing is written through it':
    'La ruta {path} es un enlace: no se escribe a través de ella.',
  'folder: {e}': 'Carpeta: {e}',
  '{path} is not a folder': 'La ruta {path} no es una carpeta.',
  'a file with that name exists': 'Ya existe un archivo con ese nombre.',
  'it could not be written: {e}': 'No se pudo escribir: {e}',
  '{what} must be at most {most} characters on one line':
    'El campo {what} debe tener como máximo {most} caracteres en una sola línea.',
  'not a distributor file: {detail}':
    'No es un archivo de distribuidor válido: {detail}',
  'name must be 1–{MAX_TEXT} characters on one line':
    'El nombre debe tener entre 1 y {MAX_TEXT} caracteres en una sola línea.',
  'open must be one command on one line':
    'El comando para abrir debe ser uno solo y estar en una línea.',
  'update must be one command on one line':
    'El comando para actualizar debe ser uno solo y estar en una línea.',
  'only the first {MAX_FILES} files are read':
    'Solo se leen los primeros {MAX_FILES} archivos.',
  'file name must be lowercase letters, digits, - or _':
    'El nombre del archivo solo puede tener letras minúsculas, números, guiones y guiones bajos.',
  'unknown distributor': 'No se encontró el distribuidor.',
  'name needs at least one letter or digit':
    'El nombre debe incluir al menos una letra o un número.',
  'too long': 'El archivo supera el tamaño permitido.',
  'at most {MAX_FILES} distributors':
    'Se pueden guardar hasta {MAX_FILES} distribuidores.',
  'a distributor with that name exists':
    'Ya existe un distribuidor con ese nombre.',
  'the distributor could not be written: {e}':
    'No se pudo escribir el distribuidor: {e}',
  'its launch could not be written: {e}':
    'No se pudo escribir su lanzamiento: {e}',
  'the distributor could not be deleted': 'No se pudo borrar el distribuidor.',
  'a launch with that name exists': 'Ya existe un lanzamiento con ese nombre.',
  unreadable: 'No se pudo leer.',
  'not a plain file': 'No es un archivo común.',
  'larger than {size} KiB': 'Supera el límite de {size} KiB.',
  'not UTF-8': 'No tiene una codificación UTF-8 válida.',
  'no preset named “{preset}” for this agent':
    'no hay un preset llamado «{preset}» para este agente',
  'the launch could not be written: {e}':
    'no se pudo escribir el lanzamiento: {e}',
  'directory not found': 'no se encontró la carpeta',
  'directory is not a folder': 'la ruta no es una carpeta',
  'directory must be ~, ~/… or an absolute path':
    'la carpeta debe ser ~, ~/… o una ruta absoluta',
  'a launch with that file name is not a plain file':
    'el lanzamiento con ese nombre de archivo no es un archivo común',
  "preset must be a preset's name": 'preset debe ser el nombre de un preset',
  "preset must be a preset's name, 1–{n} characters on one line":
    'preset debe ser el nombre de un preset, de 1 a {n} caracteres en una sola línea',
  'agent must be claude_code or codex': 'agent debe ser claude_code o codex',
  'session agent must be claude_code or codex':
    'el agente de la sesión debe ser claude_code o codex',
  'only a launch saved from Workspace can be deleted here; edit the others in their file':
    'acá solo se puede borrar un lanzamiento guardado desde Workspace; editá los demás en su archivo',
  'the launch could not be deleted': 'no se pudo borrar el lanzamiento',
  'unknown launch': 'lanzamiento desconocido',
  'launch folder: {e}': 'carpeta de lanzamientos: {e}',
  'only a commands launch has distributions':
    'solo un lanzamiento de comandos tiene distribuciones',
  'not a launch file': 'no es un archivo de lanzamiento',
  'not a launch file: {message}': 'no es un archivo de lanzamiento: {message}',
  "distro.{id} is this computer's distribution and stays":
    'distro.{id} es la distribución de esta computadora y se conserva',
  'options are short lowercase names':
    'las opciones son nombres cortos en minúscula',
  'each distribution once': 'cada distribución debe aparecer una sola vez',
  'a launch needs commands or at least one distribution':
    'un lanzamiento necesita comandos o al menos una distribución',
  'a distribution is its os-release ID: lowercase letters, digits, - or _':
    'una distribución se identifica por su ID de os-release: letras minúsculas, dígitos, - o _',
  'distro.{id}: an os-release ID is lowercase letters, digits, - or _':
    'distro.{id}: un ID de os-release contiene letras minúsculas, dígitos, - o _',
  'distro.{id} needs at least one command':
    'distro.{id} necesita al menos un comando',
  'distro.{id}: options are short lowercase names':
    'distro.{id}: las opciones son nombres cortos en minúscula',
  'at most {n} commands, each one line of at most {m} characters':
    'como máximo {n} comandos, cada uno en una línea de hasta {m} caracteres',
  'distro and template belong to a commands launch':
    'distro y template pertenecen a un lanzamiento de comandos',
  'a launch has commands or a session, not both':
    'un lanzamiento tiene comandos o una sesión, no ambos',
  'a launch needs commands or a session':
    'un lanzamiento necesita comandos o una sesión',
  'before belongs to a session; put the commands in order instead':
    'before pertenece a una sesión; ordená los comandos en su lugar',
  'at most {n} distributions': 'como máximo {n} distribuciones',
  'at most {n} before commands, each one line of at most {m} characters':
    'como máximo {n} comandos previos, cada uno en una línea de hasta {m} caracteres',
  'distro.{id}: at most {n} commands, each one line of at most {m} characters':
    'distro.{id}: como máximo {n} comandos, cada uno en una línea de hasta {m} caracteres',
  'a session names permission or profile, not both: profiles were removed, keep permission':
    'una sesión indica permission o profile, no ambos: los perfiles se eliminaron, conservá permission',
  'permission must be "ask", "read_only", "edits" or "bypass"':
    'permission debe ser "ask", "read_only", "edits" o "bypass"',
  'permission = "edits" is only for claude_code':
    'permission = "edits" es solo para claude_code',
  'profiles were removed: set permission = "ask", "read_only", "edits" or "bypass" in this launch, or remove the profile line to start as configured':
    'los perfiles se eliminaron: usá permission = "ask", "read_only", "edits" o "bypass" en este lanzamiento, o quitá la línea profile para iniciar según la configuración propia',
};
