# Contrato de construcción: rediseño de Workspace

Rol del ejecutor: CONSTRUCTOR. Ejecutá este contrato tal cual. No corras model-preflight ni execution-resolve: el orquestador ya lo hizo. No hagas commit (el sandbox no escribe `.git`); dejá la lista de archivos tocados en `/tmp/wyss-workspace/manifest.txt`.

Repo: `/home/saintwyss/Github_repos/wyss-console-ux` (Svelte 5 + Tauri 2, TypeScript, Rust en `src-tauri/`).
Referencia visual congelada (aprobada por el dueño): `docs/plans/workspace-rediseno-boceto.html`. Abrila y copiá su estructura, espaciado, textos y comportamiento. Decisiones: `docs/plans/workspace-rediseno.md`.

## Skills / pipeline
Capas 0-3 de `~/.claude/rules/ux.md` omitidas a propósito: la app ya tiene estilo y tokens (`src/app.css`, IBM Plex, temas light/dark/high_contrast) y el dueño aprobó la referencia visual. No inventar tokens: usar solo variables de `src/app.css` (`--surface`, `--line`, `--text`, `--muted`, `--faint`, `--accent`, `--accent-soft`, `--warn`, `--warn-soft`, `--error`, `--radius-md`, `--text-xs/sm/md/lg`, `--control-h`, `--font-sans`, `--font-mono`). Motion: ninguna nueva.

## Archivos
- `src/lib/features/workspace/LaunchEditor.svelte` (1541 líneas: lista + editor de agente)
- `src/lib/features/workspace/DistroVariants.svelte` (405: editor de Actualizar sistema)
- `src/lib/features/workspace/{data,distros,estimate,messages,plan,preview}.ts`
- Textos: `src/lib/i18n/es.ts` (y fragmentos del área si existen). Toda cadena nueva en inglés con `t()/msg()` y su traducción en `es.ts`.
- Tests existentes: `tests/launch-editor.svelte.test.ts`, `tests/workspace-*.test.ts`. Se actualizan a la estructura nueva; no se borran casos de comportamiento.

## 1. Lista (columna izquierda)
- Dos grupos fijos en este orden: **Sistema** (lanzamientos `kind === 'commands'`) y **Agentes** (el resto). Los encabezados de rol desaparecen de la lista.
- Se quita el botón de Roles de la barra de búsqueda (ícono persona+).
- "+ Nuevo" sigue creando un agente (`pick(null)`), sin menú. Crear lanzamientos de comandos desde la ventana no existe a propósito (`SaveLaunchInput` no tiene campo de comandos, `launch-client.ts:46`); queda fuera de este contrato.
- Se elimina el grupo informativo "Agentes" (lista de agentes instalados, `informational: true`, `LaunchEditor.svelte:~699`).
- Placeholder de búsqueda sin "…".

## 2. Editor de agente
Cabecera: el **nombre se edita en el título** (input sin borde que muestra borde al foco; mantiene el aviso de renombre actual). A la derecha: "Contexto inicial estimado <N>k" + barra fina; en Codex: "Contexto inicial: sin estimación para Codex".

Pestañas (subrayado del activo con `--accent`): **General · Instrucciones · Skills · MCP · Hooks · Resumen**. MCP no existe en Codex. Contadores en mono junto al nombre (`38/43`).

### General (filas: etiqueta+ayuda a la izquierda 260px, control a la derecha a todo el ancho)
- Aplicación (select Claude Code / Codex) — hoy "Distribuidor".
- Directorio de trabajo: UN select con la carpeta actual y `optgroup` "Guardadas" y "Recientes" (datos actuales de `saved` y `used`) + botón "Seleccionar" (= `browse()`). Se elimina la estrella.
- Rol: select + botón "Roles" que abre el administrador de roles actual (`rolesOpen`) en un panel debajo.
- Permisos: select (no radios) con las opciones actuales (`AS_CONFIGURED` + `agentPermissions`; "Edición de archivos" solo Claude). Debajo, la descripción de la opción elegida (`PERMISSION_HINT`); con `bypass` en color `--warn` (reemplaza la franja `BYPASS_WARNING` separada).
- Se elimina el campo **Modo** (siempre deshabilitado, sin efecto).

### Instrucciones
- Sección "Globales": tabla archivo · tamaño estimado · interruptor. Claude: `CLAUDE.md` + cada `rules/*.md` (mismas filas que hoy). Codex: `AGENTS.md`. Cada archivo se despliega (▸) y muestra su contenido en solo lectura (bloque mono, alto máx. 220px con scroll). Fuente del texto: `readConfigurationInventory()` (`src/lib/desktop/configuration-client.ts:45`); sus `ConfigItem` con `kind === 'rule_file'` traen el texto ya redactado en la `Projection` `{kind:'text'}` (`src/lib/contracts/configuration.ts:170-178`). Emparejá cada fila con su ítem por nombre de archivo y proveedor. Si un archivo no aparece en el inventario, la fila se despliega con "Contenido no disponible". Sin botón de editar y SIN comandos Rust nuevos.
- Sección "Del proyecto": select Cargar / Omitir / Reemplazar por texto propio (valores actuales `load/exclude/role`); con "role" aparece la fila "Texto propio" con el textarea. Se mantienen los avisos actuales (token faltante, archivo ilegible).

### Skills
- Barra: filtro + "Habilitar todas" + "Deshabilitar todas" + "Volver a leer" (recarga `load()` de datos) + resumen "N habilitadas · M no disponibles · ~Xk tokens".
- Agrupadas por las categorías de Arsenal (`src/lib/features/arsenal/groups.ts`: usá la misma función que asigna categoría a una skill; `GROUP_LABEL`). Cada categoría: encabezado plegable con contador y un interruptor de toda la categoría.
- Fila: nombre · estado · interruptor (switch, no checkbox). No disponibles: en gris, sin interruptor, con el motivo corto en la columna estado (el motivo que hoy va en el párrafo `leftOut`). Se elimina el párrafo largo "Se excluyeron N ítems…".
- Skills de cuenta (solo Claude) como una categoría más al final: "Cuenta de Claude".

### MCP (solo Claude)
- Tabla servidor · origen · interruptor. Línea: "Para agregar un servidor, pedíselo a Claude; aparece acá al volver a leer." Sin formulario de alta.

### Hooks
- Tabla momento (evento traducido) · script (mono) · interruptor. Codex: los hooks fijos de `config.toml` como filas sin interruptor con la nota actual. Línea: "No ocupan contexto al iniciar. Consumo por comando: sin medir."

### Resumen (solo lectura)
Tiene que decir la verdad: si el lanzamiento no cambia nada respecto de tu configuración (`isDefault(spec)` en Claude; `CodexHomeSpec` por defecto en Codex, que entonces corre sin `CODEX_HOME`), el paso "Se arma la configuración propia" se reemplaza por "Usa tu configuración global completa" y las listas muestran todo lo global. Desde el borrador actual, sin llamadas nuevas al backend: Arranque (aplicación, directorio, permisos, contexto estimado) · Lee primero (archivos de instrucciones activos en orden + qué pasa con el del proyecto) · Skills (cantidad + lista plegable) · MCP (solo Claude) · Hooks agrupados por momento · Fuera (apagados + no disponibles con motivo). Arriba una línea de pasos: Lanzamiento guardado → Se verifica → Se arma la configuración propia → Terminal en <directorio>.

### Pie
Fijo abajo: "Eliminar lanzamiento" (texto rojo, sin borde) a la izquierda con la confirmación actual; "Probar" y "Guardar" a la derecha, mismo ancho mínimo. Se elimina el ícono de papelera de la cabecera.

### Avisos
Una sola franja de avisos debajo de las pestañas (los `notice` actuales), no repartidos entre controles.

## 3. Actualizar sistema (`DistroVariants.svelte`)
- Sin la línea "Detectada en esta computadora…" y sin la etiqueta "corre en esta PC"/"activa".
- Fila "Distribución": select con las distros (la detectada preseleccionada) en vez de la columna de botones; "+ Agregar distribución" se conserva como opción final del select o botón al lado (elegí lo que hoy ya funciona).
- Fila "Opciones": caja con alto máximo (≈ 8 filas) y scroll interno, para que entren más opciones a futuro; respetá la regla de la app sobre barras de scroll (buscá en `src/app.css` cómo se ocultan/estilizan hoy y usá lo mismo). Adentro, casillas en dos columnas, texto normal, la bandera en `<code>` gris (separá etiqueta y bandera: hoy vienen juntas en `label`, ej. `'No confirmation (--noconfirm)'`; agregá un campo `flag` en `Switch` de `distros.ts` y dejá `label` sin paréntesis, actualizando `es.ts`).
- Fila "Comandos": textarea editable (ya existe la marca `manual`, `DistroVariants.svelte:112-114`). Con `manual` muestra aviso `--warn-soft`: "Comandos editados manualmente: las opciones ya no los modifican." + enlace "Regenerar desde las opciones" (reaplica `compose`).
- Pie igual que el agente: Eliminar a la izquierda, Probar y Guardar a la derecha.

## 4. Fuera de este contrato
- MCP nuevo entra prendido: cambia datos persistidos (`HomeSpec`, `deny_unknown_fields`) y la Acer vieja lo rechazaría. Va en una unidad aparte, después.
- Crear lanzamientos de comandos desde la ventana.

## 5. Limpieza y optimización (mismo cambio)
- `LaunchEditor.svelte` se parte: lista (`LaunchList.svelte`), cabecera+pestañas+pie (queda en `LaunchEditor.svelte`), una pestaña por archivo (`tabs/General.svelte`, `Instructions.svelte`, `Skills.svelte`, `Mcp.svelte`, `Hooks.svelte`, `Summary.svelte`). Lógica pura a `.ts` con tests.
- Borrar código muerto que quede tras el rediseño (campo Modo, estrella, párrafo `leftOut`, radios, estilos huérfanos `.le-*` sin uso). Verificá con grep que ningún selector borrado se use en otro archivo.
- Sin "…" en ningún botón del área.
- Selects con chevron propio (SVG en `background-image`, color `--faint`) en vez del nativo, como regla global en `src/app.css` para todos los `select`, en los tres temas (light, dark, high_contrast).
- Skills por categoría: `groupFor` de `src/lib/features/arsenal/groups.ts:259` (sin corrección) + `GROUP_LABEL`; los ítems ya están en `data.library` (`workspace/data.ts:16`).
- El título de Actualizar sistema sigue de solo lectura (como hoy).
- Textos nuevos: inglés con `t()/msg()`, traducción en `src/lib/i18n/screens/workspace.ts` o `es.ts` según dónde viva hoy cada cadena del área; seguí el glosario de `docs/plans/traduccion-por-pantalla.md` (sección glosario).
- No cambiar comportamiento fuera de lo listado.

## Estados (comprobables)
- Pestaña activa: subrayado `--accent`; hover en ítems de lista `--surface-hover`; foco visible con `--focus` en todo control.
- Cargando: "Leyendo lanzamientos" en la lista; ningún control habilitado mientras `busy`.
- Vacío: "Todavía no hay lanzamientos guardados."; categoría sin skills no se muestra.
- Error: franja de avisos (`role="alert"`).
- Interruptor deshabilitado: opacidad reducida, sin cursor de mano.

## Breakpoints
Ventana mínima de escritorio. A <1024px de ancho la columna de etiquetas pasa arriba del control (una columna). Texto al 200% sin cortar controles.

## Contenido
Todos los textos salen del boceto. Nombres de skills, hooks, MCP y archivos salen de los datos reales; nada inventado.

## Verificación que corre el constructor (filtrada; la cadena completa la corre el orquestador)
`npx vitest run tests/launch-editor.svelte.test.ts tests/workspace- tests/i18n.test.ts tests/appearance.test.ts` · `npm run typecheck` · `npm run lint` (no se toca Rust). Pegá la salida real. Agregá tests nuevos: agrupación de la lista (Sistema/Agentes), pestaña MCP ausente en Codex, permiso "edits" ausente en Codex, skills agrupadas por categoría con no disponibles sin interruptor, Resumen lista lo activo, aviso de comandos manuales y "Regenerar".

## Resultado esperado
BUILD_RESULT: qué cambió (archivo:línea), comandos corridos con salida, qué no pudiste hacer y por qué, riesgos.
