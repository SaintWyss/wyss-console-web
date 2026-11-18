# M5 — Workspace nativo (congelado 2026-11-18)

Referencia, en este orden: (1) el boceto aprobado `docs/plans/workspace-rediseno-boceto.html` (es el contrato
visual: estructura, textos, clases `.row/.lbl/.hint/.sksec/.skcat/.skrow/.hkrow/.rsrow/.sw/.foot`);
(2) las decisiones `docs/plans/workspace-rediseno.md`; (3) el Workspace Svelte instalado
(`src/lib/features/workspace/**`, `LaunchEditor.svelte`, `tabs/*.svelte`, `model.ts`, `plan.ts`, `data.ts`) para
comportamiento y llamadas al backend. `workspace-rediseno-contrato.md` está desactualizado: no usarlo.

## Ítems

| #   | Ítem                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| W1  | Pantalla Workspace en la ventana nativa: el ícono del riel deja de abrir Tauri y abre esta vista                                                                                                                                     |
| W2  | Lista Sistema / Agentes (como el boceto) con los lanzamientos de `launch/*.toml` y los agentes                                                                                                                                       |
| W3  | Pestañas del editor: General, Actualizar sistema (comandos por distro), Instrucciones, Skills, MCP, Hooks, Resumen — mismas secciones, textos y opciones que el boceto                                                               |
| W4  | Guardar llama a las MISMAS funciones Rust que hoy usan los comandos Tauri (`launch.rs` list/get/save/save_variants/before, `distributors.rs`, `configuration.rs`, `arsenal`) en el mismo proceso, sin IPC; sin lógica nueva en la UI |
| W5  | Un solo archivo CSS para el área (como `workspace.css`), tokens de `app.css`, temas oscuro/claro/alto contraste, español/inglés con la tabla de `es.ts`                                                                              |
| W6  | Tests: modelo de cada pestaña (lógica pura sin GTK) con tests; un test de ida y vuelta guardar → releer un `.toml` en un `XDG_CONFIG_HOME` temporal                                                                                  |

## FAIL explícitos (rechazos del dueño al intento anterior)

- El pie de botones tapa la lista de comandos u otro contenido.
- Título doble (el nombre del agente repetido arriba y en la pestaña).
- Interruptor con "✓", "On"/"Off" escrito: el interruptor es solo el control `.sw` del boceto.
- CSS desparramado en varios archivos o estilos en línea.
- "Seleccionado ✓" o marcas que el boceto no tiene.
- Cualquier control decorativo que no haga lo que dice.

## Prohibido en pruebas

Escribir en el `~/.claude`, `~/.codex`, `~/.config/wyss-console` o llavero reales. Todo test con
`HOME`/`XDG_*` temporales bajo `~/.cache/wyss-build/` y archivos de ejemplo propios.
