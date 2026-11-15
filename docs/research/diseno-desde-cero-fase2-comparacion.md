# Wyss Console — Fase 2: lo que existe contra el diseño de fase 1

Base: worktree `wyss-console-ux`, HEAD `c1d582f`, con 10 archivos sin commitear (el rechazo de carpeta personal vive solo ahí; las líneas citadas son del árbol de trabajo). Solo lectura: no corrí tests, builds ni la app. "Probado" quiere decir test no ignorado o calificación registrada en el repo, no re-corrido por mí. Lo del host sin reiniciar y la Acer atrasada es según memoria del 15/11.

**El hallazgo central.** Lo construido es "tu configuración global menos lo que apagás". El caso principal pide "configuración propia de la terminal". No es un matiz: `instructions` es un sí/no sobre el CLAUDE.md o AGENTS.md del dueño (`launch_home.rs:54`, `launch_home_codex.rs:56`), las carpetas se enlazan enteras (`LINKED`, `launch_home.rs:25`, `launch_home_codex.rs:45`) y un lanzamiento nuevo nace con todo prendido (`LaunchEditor.svelte:226`). No existe dónde escribir el texto de "Investigación".

## 1. Pantallas reales hoy frente a las 3 del diseño

Fuente: `src/lib/shell/nav.ts` (`RAIL_ITEMS`, `PERSONALIZATION`, `moreItems`).

| Pantalla real                                                      | Para qué                                                        | Clics | Equivale a   |
| ------------------------------------------------------------------ | --------------------------------------------------------------- | ----- | ------------ |
| Consola                                                            | terminales, pestañas, divisiones, Lanzar                        | 0     | Terminales   |
| Workspace (editor de lanzamientos)                                 | qué carga cada lanzamiento, por rol                             | 1     | Perfiles     |
| Personalización → Distribuidores                                   | agentes instalados, versión, actualizar                         | 1     | panel Estado |
| Personalización → Arsenal                                          | skills, agentes, hooks, MCP, global                             | 2     | Biblioteca   |
| Personalización → Credenciales                                     | claves de API selladas                                          | 2     | no está      |
| Actividad (Aprobaciones + Eventos)                                 | lo que registró la autoridad                                    | 1     | no está      |
| Ajustes                                                            | tema, idioma, fuente, autoridad P1                              | 1     | panel Estado |
| Más → Agentes en terminales                                        | el Workspace anterior                                           | 2     | duplicado    |
| Más → Sesiones, Agentes, Pipelines, PC remotas, Presets de Arsenal | administradas, handoff, remoto sin transporte, Arsenal anterior | 2     | no están     |
| Más → Aprobaciones, Eventos, Ajustes                               | repetidas                                                       | 2     | duplicado    |

Son 13 vistas distintas siempre visibles, más 3 condicionales (Runtimes, Proveedores, Proyectos), contra 3. El núcleo coincide con mi diseño: Consola, Workspace y Arsenal son mis tres pantallas con otro nombre. El resto es de otro producto (sesiones administradas, autoridad, remoto).

Donde cede mi diseño, por decisión previa del dueño: divisiones de la Consola, roles básicos, Distribuidores como vista, permisos por lanzamiento.

## 2. Tabla función por función

| Función (fase 1)                              | Estado                   | Evidencia                                                                                                                                                              |
| --------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 Carpeta de configuración propia, Claude    | HECHO SIN PROBAR A OJO   | `launch_home.rs:301`, `service.rs:962-984`. Test con agente real ignorado (`launch_home.rs:992`). Además hoy no arranca: ver 5.1                                       |
| P0 Carpeta propia, Codex                      | HECHO SIN PROBAR A OJO   | `launch_home_codex.rs`, calificación 0.169.0 (`capabilities.rs:243`). Tests reales ignorados (`:1642`, `:1686`); falta E2E por Workspace                               |
| P0 Global y login intactos                    | PARCIAL                  | Claude: token del llavero, nunca `.credentials.json` (`launch_home.rs:5-8`). Codex: `auth.json` enlazado. Sin prueba de huella antes/después automatizada              |
| P0 Texto del perfil reemplaza al del proyecto | FALTA                    | No hay texto propio ni exclusión del proyecto. La app declara lo contrario: "Siempre carga: el CLAUDE.md, las skills y los hooks del proyecto" (`es.ts:2505`)          |
| P0 Falla cerrada                              | PARCIAL                  | Codex estricto (`launch.ts:222-230`, `environment_unreadable`, `environment_stale`). Claude: `environment.json` dañado se lee como vacío (`arsenal/environment.rs:14`) |
| P0 Varias terminales Claude + Codex           | HECHO SIN PROBAR A OJO   | Home por preset; dos homes de Codex probados a mano (`c1d582f`). Dos terminales del mismo preset comparten carpeta (`service.rs:969`)                                  |
| P0 Sobreviven a cerrar la ventana             | HECHO Y PROBADO          | Host dueño de los PTY (`session-manager.ts:583`, `docs/STATUS.md`)                                                                                                     |
| P0 Editor de perfil                           | PARCIAL                  | `LaunchEditor.svelte`: casillas sí, texto no; hooks solo para apagar los globales                                                                                      |
| P0 Manifiesto por terminal                    | PARCIAL                  | El panel de entorno lo muestra en Arsenal; la barra de sesión solo dice carpeta, git y agente (`session-bar.ts`)                                                       |
| P1 "Probar ahora" con costo medido            | FALTA                    | "Probar" solo abre el lanzamiento (`LaunchEditor.svelte:671-679`)                                                                                                      |
| P1 Costo estimado etiquetado                  | PARCIAL                  | `estimate.ts`: Claude sí, etiquetado; MCP "sin medir"; Codex "todavía no" (`LaunchEditor.svelte:824`)                                                                  |
| P1 Retomar sesiones cerradas                  | PARCIAL                  | Reinicio de sesión nativa (`service.rs:1325`); tras reiniciar el host quedan "perdidas" (`registry.rs:3`). No hay retomar la conversación                              |
| P1 Biblioteca con importación                 | PARCIAL                  | Arsenal lee la global en sitio y escribe ahí con planes; no es copia                                                                                                   |
| P1 MCP y agentes en perfiles                  | PARCIAL                  | Claude sí (`--strict-mcp-config`, `service.rs:972`); Codex no                                                                                                          |
| P1 Deshacer versión de perfil                 | FALTA                    | Guardar pisa; borrar confirma pero no deja copia (`LaunchEditor.svelte:680-695`)                                                                                       |
| P1 Panel de Estado                            | SOBRA en su forma actual | `StatusList.svelte:32-62`: "Autoridad P1 / P2". No dice login ni versión calificada                                                                                    |
| P2 Perfiles entre las dos PC                  | PARCIAL                  | `~/.config/wyss-console` va por Syncthing (memoria); la Acer vieja rechaza campos nuevos                                                                               |
| P2 Costo acumulado                            | FALTA                    | La barra muestra CPU y memoria, no tokens                                                                                                                              |
| P2 Tercer agente                              | PARCIAL                  | Distribuidores agrega lanzamientos de comandos, sin aislamiento (`DECISIONS.md`, "Tools beyond…")                                                                      |
| P2 Paneles partidos                           | HECHO Y PROBADO          | `terminal/layout.ts`; decisión del dueño                                                                                                                               |

## 3. Lo que sobra o confunde

1. **Dos "Workspace".** El riel abre el editor; Más abre "Agentes en terminales" (`nav.ts:41`). Recomendación: fusionar su lista de sesiones en la Consola y borrar la entrada.
2. **"Presets de Arsenal"**, descrita como "la pantalla anterior" (`nav.ts:92`). Quitar.
3. **Tres palabras para lo mismo**: lanzamiento, preset y entorno (tres archivos). El dueño ya los fusionó en pantalla, pero los errores todavía dicen "preset" y "selección" (`launch.ts:226`, `es.ts:2878`). Unificar el texto en "lanzamiento".
4. **Sesiones, Agentes, Pipelines, PC remotas, Runtimes, Proveedores**: producto de sesiones administradas, con gates cerrados. "PC remotas" se describe "transporte no elegido" (`nav.ts:68`): es decorativo. Esconder todo detrás de un interruptor de Ajustes, apagado.
5. **Barra de estado con "Autoridad P1/P2"**: jerga interna en la primera fila de la app. Reemplazar por lo que importa para lanzar: host vivo, Claude y Codex con sesión, versión calificada.
6. **Actividad y Credenciales**: no sirven al caso principal. Bajarlas a Más.
7. **"Iniciar sin aplicar"** (`es.ts:3352`): un tercer estado entre arrancar y no arrancar. Es explícito y queda registrado, pero contradice la regla. Quitarlo de los lanzamientos con carpeta propia.

## 4. Brechas del caso principal, en orden

1. **Hoy un lanzamiento de Claude con carpeta propia no arranca.** Detalle en 5.1. Sin esto no hay nada que mostrar.
2. **Texto propio por lanzamiento.** Falta el campo, dónde se guarda y que el home lo escriba como su CLAUDE.md o AGENTS.md en vez de enlazar el global.
3. **Reemplazo del texto del proyecto.** La investigación lo da por "siempre carga (correcto)" (`docs/research/arsenal-home-por-lanzamiento.md`, tabla de Claude). Es una decisión que el caso principal revierte. Hay que calificar por versión, con frase trampa, si cada agente permite excluirlo; si no, la terminal no arranca o la pantalla dice "el texto del proyecto se suma".
4. **Hooks y skills propios, no solo "los globales menos algunos".** Las skills se excluyen por `skillOverrides` sobre la carpeta entera; funciona, pero "Mínimo" obliga a destildar todo a mano. Falta "arrancar vacío y sumar".
5. **Costo medido.** No existe. La investigación midió una corrida a mano; la app solo estima, y solo Claude.
6. **Codex a la par**: sin estimación, sin MCP, y el E2E por Workspace sin hacer.
7. **Carpeta por lanzamiento, no por preset**, para que dos terminales del mismo perfil no compartan estado ni se reconstruyan una sobre otra.

## 5. Lo construido que no cumple los principios

1. **Falla, y no dice qué hacer.** `ARSENAL_HOME_CLAUDE` admite solo `2.1.323` (`capabilities.rs:297`); en esta PC `claude --version` da `2.1.325`. El host responde `arsenal_home_unqualified` (`service.rs:912`) y ese código no tiene texto en `src/` (no aparece en `FAILURE_TEXT`, `native/present.ts`). Cada actualización de Claude rompe los lanzamientos hasta recompilar. Lo deduzco del código y de la versión instalada; no lo vi fallar en la app.
2. **Falla en silencio.** `environment.json` dañado se lee como vacío (`arsenal/environment.rs:14`): el lanzamiento de Claude arranca con todo lo que el dueño había apagado. Pendiente reconocido en `docs/plans/hooks-codex-h4.md`.
3. **Número que engaña.** Hooks figura con 0 tokens y el texto "No ocupan contexto" (`LaunchEditor.svelte:118`, `:503`, `:518`; `estimate.ts:86`). Vale para el arranque; la propia investigación midió 11.528 caracteres de hooks en una tarea de 3 comandos. Debe decir "0 al arrancar · por comando: sin medir".
4. **Botón con nombre de más.** "Probar" no prueba nada: abre (`LaunchEditor.svelte:671`).
5. **Estimación sin contraste.** El control anotado es 40,4k estimados contra 68,1k medidos (`arsenal-UI-SPEC.md:263`): un 40 % de error por MCP. La barra de la cabecera compara contra otra estimación, no contra una medición.
6. **Login con arreglo a mano.** Sin token, la app pide correr `claude setup-token` y `secret-tool store …` (`es.ts:2506`, `EnvironmentPanel.svelte:410`). Falla en voz alta, sin botón. Es además un segundo login que el dueño tiene que mantener.
7. **No reversible.** Guardar y borrar un lanzamiento no dejan versión anterior.
8. **Documentación que contradice al código.** La investigación dice login por enlace a `.credentials.json` y skills por enlace individual; el código hace token y `skillOverrides`. `docs/STATUS.md` está reconciliado al 02/11.
9. **Navegación**: 13 vistas, con duplicados y una sin función.

## 6. Plan recomendado

| #   | Paso                                                                                                                                                                                   | Prueba de que es real                                                                                                    | Esta semana                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| 1   | Calificar Claude 2.1.325 y darle texto y botón al error de versión; en Distribuidores, mostrar "versión no calificada" antes de lanzar                                                 | Con la versión instalada, un lanzamiento con carpeta propia arranca; con una no calificada, el mensaje nombra la versión | Sí                                          |
| 2   | `environment.json` estricto, igual que el de Codex                                                                                                                                     | Archivo roto a propósito: no arranca y lo dice                                                                           | Sí                                          |
| 3   | Decir la verdad en lo que ya hay: hooks "por comando: sin medir", "Probar" pasa a "Abrir", errores en palabras de lanzamiento                                                          | Lectura de pantalla: ningún número sin etiqueta                                                                          | Sí                                          |
| 4   | Podar la navegación: quitar "Presets de Arsenal" y el segundo Workspace; administradas, remoto y pipelines detrás de un interruptor apagado; barra de estado con host, login y versión | Conteo de vistas visibles: 5 o menos                                                                                     | Sí                                          |
| 5   | Texto propio por lanzamiento para Claude y Codex, escrito en el home                                                                                                                   | Dos lanzamientos con textos distintos sobre la misma carpeta: cada agente repite solo el suyo                            | Sí, si 1 y 2 están                          |
| 6   | Calificar el reemplazo del texto del proyecto, por agente y versión; si no se puede, no arranca o la pantalla dice "se suma"                                                           | Proyecto con frase trampa: el agente no la conoce                                                                        | No: es investigación más decisión del dueño |
| 7   | "Medir": sesión mínima sin interacción que devuelve tokens reales por lanzamiento, guardado con fecha y versión, junto al estimado; también Codex                                      | El número coincide con el que reporta el agente; perfil mínimo y global lado a lado                                      | No                                          |
| 8   | Lanzamiento vacío por defecto ("Mínimo" precargado), carpeta por lanzamiento y copia anterior al guardar                                                                               | Lanzamiento nuevo: el agente lista 0 skills propias; deshacer en una acción                                              | No                                          |

Antes de cualquiera: reiniciar el host viejo y hacer el E2E pendiente por Workspace (según memoria), porque hoy nada de H4 está visto a ojo en la app instalada.
