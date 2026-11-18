# Contrato de construcción: rediseño de Workspace

Rol del ejecutor: CONSTRUCTOR. Ejecutá este contrato tal cual. No corras model-preflight ni execution-resolve. No hagas commit (el sandbox no escribe `.git`); dejá la lista de archivos tocados en `/tmp/wyss-workspace/manifest.txt`. Lo que sea imposible, ambiguo o contradiga este contrato: reportalo como bloqueo, no improvises.

Repo: `/home/saintwyss/Github_repos/wyss-console-ux` (Svelte 5 + Tauri 2 + TypeScript; Rust en `src-tauri/`).
Referencia visual congelada (aprobada por el dueño, pestaña por pestaña): `docs/plans/workspace-rediseno-boceto.html`. Copiá su estructura, medidas, textos y orden. Decisiones: `docs/plans/workspace-rediseno.md`.
Los datos del boceto son de muestra: en la app todo sale de los datos reales.

## Reglas generales

- Tokens: solo variables de `src/app.css` (`--surface`, `--surface-hover`, `--line`, `--text`, `--muted`, `--faint`, `--accent`, `--accent-soft`, `--warn`, `--warn-soft`, `--error`, `--focus`, `--radius-md`, `--text-xs/sm/md/lg`, `--control-h`, `--font-sans`, `--font-mono`). Nada de colores sueltos. Tres temas: light, dark, high_contrast.
- Capas 0-3 de `~/.claude/rules/ux.md` omitidas: la app ya tiene estilo y el dueño aprobó la referencia. Sin motion nueva salvo el giro del chevron (120-200ms, respetar movimiento reducido).
- Grilla única: filas etiqueta+ayuda (260px) | control a todo el ancho. Controles y botones 40px de alto. Botones al costado de un control: 140px. Sin "…" en ningún botón. Selects con chevron SVG propio (regla global en `src/app.css` para todo `select`).
- Textos: inglés con `t()/msg()` y traducción en `src/lib/i18n/screens/workspace.ts` o `es.ts` (donde viva hoy cada cadena del área). Glosario: `docs/plans/traduccion-por-pantalla.md` § Glosario.
- No cambiar comportamiento fuera de lo listado. No tocar Rust salvo lo que §6 permite.

## 1. Lista (columna izquierda)

- Grupos fijos: **Sistema** (lanzamientos `kind === 'commands'`) arriba, **Agentes** debajo. Sin encabezados de rol.
- Sin botón de Roles en la barra de búsqueda. Placeholder "Search".
- "+ Nuevo" crea un agente (`pick(null)`), sin menú. (Crear lanzamientos de comandos desde la ventana no existe a propósito: `SaveLaunchInput` no tiene comandos, `src/lib/desktop/launch-client.ts:46`.)

## 2. Actualizar sistema (`DistroVariants.svelte`)

- Título de solo lectura (como hoy). Sin "Detectada en esta computadora…" ni etiquetas "corre en esta PC"/"activa".
- Fila **Distribución**: select con las distros (la detectada preseleccionada). "Agregar distribución" se conserva con el mecanismo que ya funciona (opción del select o botón de 140px al lado).
- Fila **Opciones**: caja con borde, alto máx. ≈ 8 filas y scroll interno (mismo tratamiento de scrollbar que el resto de la app en `src/app.css`); adentro casillas en dos columnas, texto normal y la bandera en `<code>` gris. Separar etiqueta y bandera: agregar `flag?: string` a `Switch` en `workspace/distros.ts` y dejar `label` sin el paréntesis (actualizar `es.ts`). Opciones NO editables.
- Fila **Comandos**: textarea editable (ya existe la marca `manual`, `DistroVariants.svelte:112-114`). Con `manual`, aviso `--warn-soft`: "Commands edited by hand: the options no longer change them." + enlace "Rebuild from the options" (reaplica `compose`).
- Pie: "Eliminar lanzamiento" (texto `--error`, sin borde) a la izquierda con la confirmación actual; Probar y Guardar a la derecha.

## 3. Editor de agente: cabecera, pestañas y pie

- Nombre editable en el título (input sin borde; borde al foco; mantiene el aviso de renombre actual).
- A la derecha: "Initial context estimated <N>k" + barra fina; Codex: "Initial context: no estimate for Codex".
- Pestañas: **General · Instructions · Skills · MCP · Hooks · Summary**. MCP no existe en Codex. Contador mono al lado (habilitados/total).
- Una sola franja de avisos debajo de las pestañas (los `notice` actuales).
- Pie fijo como en §2. Se elimina el ícono de papelera de la cabecera.

### 3.1 General

Filas: **Application** (select Claude Code / Codex) · **Working directory** (UN select con la carpeta actual y `optgroup` Saved / Recent de `saved` y `used` + botón "Select" = `browse()`; sin estrella) · **Role** (select + botón "Roles" que abre el administrador actual `rolesOpen` debajo) · **Permissions** (select con `AS_CONFIGURED` + `agentPermissions`; "edits" solo Claude; debajo la descripción de la opción elegida de `PERMISSION_HINT`, con `bypass` en `--warn`; reemplaza la franja `BYPASS_WARNING`).
Se elimina el campo **Mode** (siempre deshabilitado). Se elimina el grupo informativo **Agents** (`informational: true`).

### 3.2 Instructions

- Arriba, "From the project": fila con select corto (Load / Skip / Custom text; valores `load/exclude/role`) y al lado la explicación larga de la opción elegida. Con "role", fila "Custom text" con el textarea. Mantener avisos actuales (token faltante, archivo ilegible).
- Abajo, "Global": una fila por archivo (Claude: `CLAUDE.md` + cada `rules/*.md`; Codex: `AGENTS.md`). Fila: título = primer `# ` del archivo · nombre de archivo en mono gris · descripción = campo `description:` del frontmatter si existe (si no, nada) · `rules/ux.md` y cualquier regla con `paths:` en su frontmatter agrega "Only loads when touching matching files." · tamaño estimado a la derecha · interruptor. "Show content" despliega el Markdown RENDERIZADO con el parser de Arsenal (`blocks`/`outline` de `src/lib/features/arsenal/guide.ts`, como `LibraryView.svelte`), alto máx. 360px con scroll.
- Fuente del texto: `readConfigurationInventory()` (`src/lib/desktop/configuration-client.ts:45`); ítems `kind === 'rule_file'` traen el texto redactado en la `Projection` `{kind:'text'}` (`src/lib/contracts/configuration.ts:170-178`). Si un archivo no está en el inventario: "Content not available". SIN comandos Rust nuevos.

### 3.3 Skills

- Barra: filtro · contador "N of M · ~Xk tokens" (mono) · "Read again" (recarga `load()`).
- Bloques en orden de general a concreto según `SECTION_OF` de `src/lib/features/arsenal/groups.ts`: how+before+after → "General"; build → "By type of work"; env (system, integrations, automations) → "Environment"; study + other → "Own topics". Categoría de cada skill: `groupFor` (`groups.ts:259`) + `GROUP_LABEL`. Ítems en `data.library` (`workspace/data.ts:16`). Skills de cuenta (solo Claude) como categoría "Claude account".
- Categoría: fila 48px, chevron SVG que gira, nombre, contador, interruptor de toda la categoría. Skill: fila 40px, nombre, interruptor (switch, no checkbox). No disponible: gris, sin interruptor, motivo corto en la columna del medio (el texto que hoy va al párrafo `leftOut`). Sin columna de estado, sin "Enable all/Disable all", sin párrafo largo de excluidos. Una sola línea entre categorías.

### 3.4 MCP (solo Claude)

- Barra: "To add one, ask Claude." · contador · "Read again".
- Bloques: "Your servers" (de `~/.claude.json`, agrupados en "Local command" y "npx package" según el `command` sea `npx` o no) · "Your claude.ai account": UNA fila "Account connectors" con un solo interruptor y los nombres debajo · "Plugins": por plugin. Sin descripción por servidor.
- Hoy la vía real es `--strict-mcp-config` (`launch_home.rs`, `HomeSpec.mcp`): apagar cualquier servidor deja afuera conectores y plugins. Si la ventana no tiene hoy datos de conectores/plugins, mostrá solo "Your servers" + el interruptor de conectores en estado coherente con lo que el backend hace, y reportalo como bloqueo parcial. No inventes datos.

### 3.5 Hooks

- Barra: "No context at start. To add one, ask Claude." · contador · "Read again".
- Bloques por momento, en orden: "When the session starts" (SessionStart) · "Before using a tool" (PreToolUse) · "After using a tool" (PostToolUse) · resto de eventos al final con su nombre traducido.
- Fila = script (no la entrada de settings): nombre del script en mono (el último `*.py|*.sh|*.js|*.mjs` del comando; si no hay, el comando), disparador en palabras (matcher traducido: Bash→Commands, Write/Edit/MultiEdit→Writing/editing, Read→Reading files, Agent/Task→Agents, vacío→Always), interruptor, "Show content" con el código del script. Un mismo script registrado varias veces = una fila (el interruptor actúa sobre todas sus entradas). Codex: hooks fijos de `config.toml` como filas sin interruptor con la nota actual. Si no hay forma de leer el contenido del script sin Rust nuevo, omití "Show content" en Hooks y reportalo.

### 3.6 Summary (solo lectura, desde el borrador, sin llamadas nuevas)

- Aviso `--accent-soft` si el lanzamiento no cambia nada (`isDefault(spec)` en Claude; `CodexHomeSpec` por defecto en Codex): "This launch changes nothing: it uses your full ~/.claude (~/.codex)".
- Filas etiqueta/valor: Start (application, directory, permissions, estimated context) · Reads first (instrucciones activas en orden + qué pasa con las del proyecto) · Skills por bloque · MCP (solo Claude) · Hooks por momento · Left out (apagados + no disponibles con motivo).

## 4. Fuera de este contrato

MCP nuevo entra prendido (cambia `HomeSpec` persistido) · elegir conectores de a uno · crear lanzamientos de comandos · reducir el historial git.

## 5. Limpieza, arquitectura y peso (mismo cambio)

- Partir `LaunchEditor.svelte` (1541 líneas): `LaunchList.svelte`, `LaunchEditor.svelte` (cabecera, pestañas, pie, avisos), `tabs/General.svelte`, `tabs/Instructions.svelte`, `tabs/Skills.svelte`, `tabs/Mcp.svelte`, `tabs/Hooks.svelte`, `tabs/Summary.svelte`, y componentes chicos reutilizables del área (`ToggleRow`, `Section`, `CategoryGroup`). Lógica pura (agrupar skills, agrupar hooks por momento y script, armar el resumen) en `.ts` con tests unitarios.
- Borrar código muerto que deje el rediseño (Modo, estrella, grupo Agents, párrafo `leftOut`, checkboxes, estilos `.le-*` sin uso, cadenas i18n huérfanas del área). Verificá con grep que nada borrado se use en otro archivo.
- Sin dependencias nuevas. Sin duplicar lógica que ya existe en `features/arsenal`.
- Objetivo medible: menos líneas totales en `src/lib/features/workspace/` que hoy (2788) sin perder casos de test de comportamiento; reportá antes/después.

## 6. Rust

No se toca Rust. Excepción única: si el inventario de configuración no trae el texto de los `rule_file`, reportalo como bloqueo (no agregues comandos).

## Estados (comprobables)

Pestaña activa subrayada `--accent`; hover `--surface-hover`; foco visible `--focus` en todo control; mientras `busy` nada habilitado; vacío "No saved launches yet."; categoría vacía no se muestra; interruptor deshabilitado con opacidad reducida y sin cursor de mano; errores en la franja de avisos con `role="alert"`.

## Breakpoints

< 1024px: la columna de etiquetas pasa arriba del control. Texto al 200% sin cortar controles.

## Verificación que corre el constructor (filtrada)

`npx vitest run tests/launch-editor.svelte.test.ts tests/workspace- tests/i18n.test.ts tests/appearance.test.ts` + los tests nuevos · `npm run typecheck` · `npm run lint`. Pegá la salida real. Tests nuevos: lista Sistema/Agentes; MCP ausente en Codex; "edits" ausente en Codex; skills por bloque y categoría con no disponibles sin interruptor; hooks agrupados por momento y por script; Summary con aviso de configuración global; aviso de comandos manuales y "Rebuild".

## Resultado

BUILD_RESULT: qué cambió (archivo:línea), líneas antes/después del área, comandos con salida real, qué no se pudo y por qué, riesgos.
