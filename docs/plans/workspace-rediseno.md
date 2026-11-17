# Workspace: rediseño (decisiones del dueño, 17/11/2026)

Estado (17/11, dueño): CERRADOS en diseño = lista, pestaña General y Actualizar sistema. FALTAN revisar con el dueño: Instrucciones, Skills, MCP, Hooks, Resumen. NO construir hasta revisar todas. Falta inventario de funciones, contrato UI y boceto único con tokens reales.

## Decidido

### Lista
- Dos áreas: **Sistema** arriba de todo (lanzamientos de comandos) y **Agentes** debajo.
- El botón de Roles sale de la lista.
- "+ Nuevo" pregunta: agente o comandos del sistema.

### Actualizar sistema (comandos)
- Selector de distribución arriba; sin etiqueta "esta PC" ni línea "Detectada en…".
- Opciones fijas (NO editables por el usuario), en dos columnas, texto normal con la bandera en gris.
- Comandos editables a mano; al editarlos aparece aviso "editados a mano" + enlace para rearmar desde las opciones.
- Sin menú "⋯"; Borrar abajo a la izquierda.

### Editor de agente (Claude Code, Codex, Estudiar)
- Pestañas por área debajo del nombre.
- Plano: sin tarjetas/cuadros; filas con etiqueta y control.
- Textos profesionales (sin coloquialismos).
- Ítems no disponibles: motivo corto por fila, no párrafo largo.

### Decisiones posteriores (17/11)
- Pestañas: General (rol + permisos) · Instrucciones · Skills · MCP (solo Claude) · Hooks · Resumen.
- Nombre se edita en el título, no en General.
- Instrucciones globales: cada archivo se despliega y muestra su contenido (solo lectura) + abrir en editor.
- Skills agrupadas por las categorías de Arsenal (`arsenal/groups.ts`), interruptor por categoría.
- La consola NO crea MCP/skills/hooks: se crean pidiéndoselo a Claude/Codex; la consola los lee (botón "Volver a leer").
- Lo nuevo entra PRENDIDO en los lanzamientos existentes (MCP hoy entra apagado: cambiar a la misma regla), con marca "Nuevo".
- Resumen: vista de solo lectura de la caja (arranque, lee primero, skills, MCP, hooks por momento, fuera).

### Pestaña Instrucciones (en revisión, 17/11)
- "Del proyecto" arriba: select corto (Cargar / Omitir / Texto propio) + explicación larga al lado; textarea si Texto propio.
- "Globales" abajo: fila = título (primer `#` del archivo) + nombre de archivo en gris + descripción de una línea + tamaño estimado a la derecha + interruptor. `rules/ux.md` aclara "Solo se carga al tocar archivos de interfaz".
- Descripción: opción 1 aprobada = línea `description:` en el frontmatter de cada archivo de instrucciones (la IA la escribe en los nuevos).
- "Ver contenido" muestra el Markdown RENDERIZADO con el mismo parser que Arsenal (`blocks`/`outline` de `src/lib/features/arsenal/guide.ts`, render en `LibraryView.svelte`).
- Pendiente para cerrar la pestaña: limpieza de las instrucciones globales (CLAUDE.md/AGENTS.md + rules/invariantes.md, ~11,3k tokens) — tarea aparte, R2, con respaldo, inventario de reglas y revisión externa.

### Pestaña Skills (cerrada, 17/11)
- Barra: filtro + contador + "Volver a leer". Sin "Habilitar/Deshabilitar todas", sin columna de estado; motivo solo en no disponibles.
- Orden de generales a concretas por las secciones de Arsenal (`SECTION_OF`): Generales · Por tipo de trabajo · Entorno · Temas propios. Categoría por `groupFor` (gsap → Animación y video).
- Filas 40px, categorías 48px, una línea entre categorías, chevron SVG.

### Pestaña MCP (en revisión, 17/11)
- Sin descripción por servidor (no existe en `~/.claude.json`): nombre + interruptor.
- Agrupados por origen como Skills: Tus servidores (Comando local · Paquete npx) · De tu cuenta de claude.ai (conectores: Gmail, Notion, Drive…) · De plugins (por plugin).
- Los conectores de claude.ai y de plugins TIENEN que aparecer con interruptor (el dueño no quiere que todo lanzamiento lea Gmail/Notion).
- A VERIFICAR antes de construir: si Claude Code permite elegir conectores de claude.ai/plugins de a uno por sesión. Hoy `--strict-mcp-config` los saca todos juntos.

## Inventario del editor de agente (LaunchEditor.svelte, leído 17/11)

| Control hoy | Qué hace de verdad | Claude / Codex | Propuesta |
|---|---|---|---|
| Nombre (título editable) | renombra el .toml al guardar (avisa) | ambos | queda |
| Rol | agrupa en la lista | ambos | queda en General; los roles se administran ahí |
| Distribuidor | elige Claude Code o Codex | ambos | General, "Aplicación" |
| Permisos | sin elegir = como está configurado; ask/read_only/edits/bypass | `edits` solo Claude | pestaña propia |
| Modo "Native" | siempre deshabilitado, sin efecto | ambos | SE VA (decorativo) |
| Carpeta + ★ + Examinar | carpeta por diálogo o guardadas/recientes | ambos | General |
| Instrucciones del proyecto (select) | cargar / sin / texto propio (textarea) | ambos | pestaña Instrucciones |
| Grupo Instrucciones (casillas) | Claude: CLAUDE.md + cada rules/*.md; Codex: AGENTS.md | distinto | pestaña Instrucciones, junto al select |
| Skills | casilla por skill; no disponibles salen en párrafo largo | ambos | pestaña Skills, motivo por fila |
| Servidores MCP | casilla por servidor, "sin medir" | solo Claude | pestaña MCP (oculta en Codex) |
| Skills de cuenta | casilla por skill | solo Claude | dentro de Skills como sección |
| Agentes | lista informativa, no se elige nada | ambos | sale de las pestañas; queda como nota informativa o se va |
| Hooks | casilla por hook; Codex además hooks fijos de config.toml | distinto | pestaña Hooks |
| Estimación ~35k + barra | estimado, MCP y hooks sin medir | Codex sin estimación | cabecera, texto profesional |
| Probar / Guardar y probar / Guardar / Borrar (ícono) | abre el lanzamiento / guarda | ambos | pie: Eliminar izq., Probar y Guardar der. |
| Avisos (bypass, token faltante, plan no aplicable, archivo ilegible, renombre) | reales | — | franja única de avisos bajo pestañas |

Sistema: la edición a mano de comandos YA existe (`DistroVariants.svelte:112-114`, marca `manual`). "Un comando por línea, tipeado en una terminal nueva": las líneas se tipean en el shell, así que si una falla la siguiente igual corre (deducido del texto; falta leer el runner en Rust).

## Abierto
- Pestaña "Instrucciones": qué agrupa exactamente (verificar en código) y nombre.
- Comportamiento real cuando un comando de Sistema falla (verificar).
- Diferencias Claude vs Codex (permisos, modo).
