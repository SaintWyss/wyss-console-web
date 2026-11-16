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
};
