/**
 * Working fragment of screen "distributors" during the per-screen translation (docs/plans/traduccion-por-pantalla.md).
 * Spanish for new sentences and corrections of existing ones; folded into es.ts / incoming/ and emptied at integration.
 */
export const ES_SCREEN: Readonly<Record<string, string>> = {
  'The desktop could not complete the request.':
    'La aplicación no pudo completar la solicitud.',
  'Types “{command}” in a new terminal of the Console.':
    'La Consola escribe «{command}» en una terminal nueva.',
  'Types “{command}” in a new terminal of the Console, where you see it run.':
    'La Consola escribe «{command}» en una terminal nueva para que puedas ver cómo se ejecuta.',
  'Found at {path}.': 'Se encontró en {path}.',
  '“{command}” was not found, or is not an executable file.':
    'No se encontró «{command}» o no es un archivo ejecutable.',
  'Comes with the Console: it cannot be edited or deleted.':
    'Viene con la Consola: no se puede editar ni borrar.',
  'Removes its card and the launch made from it, unless you changed that launch by hand. The tool itself stays installed.':
    'Se quitan la tarjeta y el lanzamiento creado a partir de ella, salvo que ese lanzamiento se haya modificado manualmente. La herramienta sigue instalada.',
  'Add a tool the Console does not know: by its name and the commands that open and update it.':
    'Agregá una herramienta que la Consola no conoce con su nombre y los comandos para abrirla y actualizarla.',
  'Fills in its name, maker and the command that opens it. Its update command depends on how you installed it.':
    'Completa el nombre, el desarrollador y el comando para abrirla. El comando para actualizarla depende de cómo se instaló la herramienta.',
  'How the card is called.': 'Nombre que se muestra en la tarjeta.',
  'Who makes it.': 'Quién desarrolla la herramienta.',
  'Made by': 'Desarrollador',
  'Typed in a new terminal to open it. Its first word is the command looked for to say whether it is installed.':
    'Comando que se escribe en una terminal nueva para abrir la herramienta. Su primera palabra se busca para determinar si está instalada.',
  'Typed in a new terminal by Update. It depends on how you installed the tool.':
    'Se escribe en una terminal nueva al elegir «Actualizar herramienta»; el comando depende de cómo se instaló la herramienta.',
  'Anything to remember about it.':
    'Algo que convenga recordar sobre esta herramienta.',
  'It has no update command yet: set one in Edit.':
    'Todavía no tiene un comando para actualizar: definilo en Editar.',
};
/** Sentences the desktop (Rust) writes, shown on this screen: English exactly as Rust writes it, {name} for parts. */
export const INCOMING_SCREEN: Readonly<Record<string, string>> = {};
