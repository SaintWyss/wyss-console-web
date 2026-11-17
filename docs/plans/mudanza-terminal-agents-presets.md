# Mudanza antes de borrar Terminal agents y Arsenal presets — diseño (Fable, 2026-11-16), APROBADO por el dueño el 2026-11-16: D1-D9 como recomienda Fable (presets = lista en Arsenal, alta/edición en Workspace; se pierden OpenCode/Hermes y el arranque sin lanzamiento, handoff, delegación, categorías y sync now)

Ruta: SHAPE/decidir · R0 · ui · diseño de la mudanza, solo lectura, sin cambios

# Mudanza antes de borrar Terminal agents y Arsenal presets: diseño para aprobar

No edité el repo. `/home/saintwyss/Github_repos/wyss-console-ux`, HEAD `a905375`.

## Tres hechos que cambian el diseño

1. **Los presets ya se crean y editan en Workspace.** `src/lib/features/workspace/LaunchEditor.svelte:683` guarda el preset junto con el lanzamiento. Borrada Terminal agents, un preset solo sirve si un lanzamiento lo nombra. Sin otra pantalla quedan: borrar un preset, importar skills, categorías y sync.
2. **Cerrar la pestaña (×) ya para al agente** (`src-tauri/src/native/service.rs:1747-1752`). "Parar" aparte sirve porque deja la pestaña con la salida a la vista (`terminal/controller.ts:462-472`).
3. **`start0()` solo lo llama `WorkspaceView.svelte:257`**, que hoy está siempre montada (`App.svelte:476`). La mudanza lo pasa a `App.svelte`; si no, el registro de agentes y `native.launcher` no cargan nunca.

Rastro de uso en esta PC (la Acer no la medí; el registro es una foto, no un historial):

- **Registro nativo:** 7 registros (5 parados, 2 perdidos), ninguno con delegación, reinicio, OpenCode ni Hermes.
- **Presets:** 7 en total. Cuatro son de la migración del 01/11; los otros son "Estudio", "test" y "Lanzamiento nuevo". Solo el último lo usa un lanzamiento.
- **Categorías:** 1 skill movida de grupo a mano; no vi categorías propias en `groups.json`.

## A. Consola

### A1. Parar, Reiniciar y Olvidar en la barra del panel del agente

Van en `terminal/TerminalPanel.svelte`, a la derecha de la `.terminal-toolbar` que ya dice "Native · Claude Code · Running". Es por panel, así que anda con splits. Solo aparece si el panel tiene `session.native`.

```
● Native · Claude Code · edits · Running           [Parar] [Reiniciar]
● Native · Claude Code · edits · Terminal closed   [Volver a iniciar] [Olvidar]
```

- **Qué botones se ven:** lo decide el registro (`native.sessions`, por `session.native.sessionId`), no el texto de la pestaña. `forget` rechaza con `still_running` hasta que el registro anota el final. Si el registro ya no existe, no hay botones.
- **Parar:** `NativeController.stop(id)`. La pestaña queda cerrada con su salida.
- **Reiniciar / Volver a iniciar:** `NativeController.restart(id)`. Abre una pestaña nueva por el callback `onstarted` de `App.svelte:140-150` y la vieja queda cerrada. Se deshabilita con `native.starting` o `native.m9Blocked`, como hoy.
- **Olvidar:** `NativeController.forget(id)` y después `manager.closeTab`.
- **Fallos:** `native.failure` sale en la línea `role="alert"` (`workspace-error`) que `TerminalView` ya tiene, con `failureText`. Incluye `STOP_UNRECORDED`.
- **Cableado:** `App.svelte` pasa `native` y `nativeController` a `TerminalView`, y este pasa tres callbacks a `TerminalPanel`. Usa los botones `.action` existentes.

### A2. Registros sin pestaña, en el pie de `+ Launch`

Los botones de A1 no alcanzan a los registros sin pestaña (los 7 de hoy). Va una línea en `.launch-foot` de `TerminalView.svelte`, solo si hay registros terminados:

```
│ Estudiar            Claude Code   ~12k                        │
│───────────────────────────────────────────────────────────────│
│ 7 agentes terminados en el registro (2 perdidos)              │
│                  [Volver a abrir los 2] [Limpiar el registro] │
│ Archivos en ~/.config/wyss-console/launch                     │
```

- **Volver a abrir:** `restoreLost()`. La cuenta sale de `restorable()` en `native/present.ts`.
- **Limpiar el registro:** `forgetFinished()`. Olvida todo lo que no corre, perdidos incluidos, y por eso el rótulo no dice "sin pestaña".
- Al abrir el menú se llama `refreshSessions()`.

## B. Arsenal

### B1. Nodo "Presets" en el árbol, bajo cada herramienta

`arsenal/map.ts` suma un nodo por herramienta, con el mismo trato que "Hooks › Kept aside": se elige y muestra un panel al costado. `LibraryView.svelte` lo dibuja con un componente nuevo, `arsenal/PresetsPanel.svelte`. Los presets del boceto son los reales; N y M son cuentas que no medí.

```
▾ Anthropic · Claude Code     Presets · Claude Code                       4
   ▸ Skills                   Biblioteca: N importadas · M nuevas en disco
     Presets          4                                 [Importar las M]
   ▸ Hooks                    Estudio          6 · sin lanzamiento
     MCP                               [Crear lanzamiento con él] [Borrar]
     Configuration            frontend-design  1 · sin lanzamiento [Borrar]
                              test             2 · sin lanzamiento [Borrar]
```

- **Lista:** `arsenalClient.selections()` más `listLaunches()` para saber qué lanzamiento usa cada uno.
- **Borrar:** `arsenalClient.deleteSelection(id)`, con confirmación en la fila. La confirmación dice dos cosas: qué lanzamiento de esta PC lo usa (deja de arrancar, `terminal/launch.ts:153`) y que el borrado viaja por sync a la otra PC, cuyos lanzamientos no se ven desde acá.
- **Duplicados:** se marcan los presets con el mismo nombre, que hoy bloquean el arranque (`launch.ts:158`).
- **Editar** (si un lanzamiento lo usa): abre ese lanzamiento en Workspace con `launchToOpen = id; go('launches')`, el salto que ya usa Distribuidores (`App.svelte:540-543`).
- **Crear lanzamiento con él** (si ninguno lo usa): es lo único nuevo. Hoy Workspace no puede adoptar un preset existente (`LaunchEditor.svelte:266,419`). Son unas 40 líneas: un borrador nuevo con ese preset ya puesto.

### B2. Importar skills, primera línea del panel de Presets

- **Cuenta:** `arsenalClient.discover()`, candidatos importables en estado `not_imported` o `source_changed`.
- **Importar:** `arsenalClient.importSkill()` por cada uno, con progreso "12 de M…" y lista de fallos. El bucle es `importEligible` (`arsenal/controller.ts:393`); se saca a `arsenal/import.ts` antes de borrar el controller.
- Es en bloque, y la línea solo aparece si hay algo nuevo. El import de a una pediría casar cada fila del árbol con su candidato, y ese cruce no lo verifiqué.

### B3. Sync: línea de estado solo si hay un problema, sin botón

El sync corre solo: al arrancar, tras cada cambio local, cuando Syncthing trae un archivo y cada 10 minutos (`src-tauri/src/arsenal/sync.rs:1915-1918`). "Sync now" no aporta, pero la línea es el único lugar donde se ven conflictos y rechazos.

```
⚠ Sincronización: 1 conflicto (se guardaron las dos versiones)  ▸ detalle
```

- Se conserva `SyncLine.svelte` sin el botón, con `arsenalClient.syncStatus()` y `sync-present.ts`.
- Va arriba del panel de Presets y solo se dibuja si el tono no es ok.

## C. Qué recomiendo perder

| Función                                                                                | Por qué                                                                                                                                    |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Brief de handoff (`HandoffPanel`)                                                      | Sin rastro de uso; el brief se le pide al agente en su terminal.                                                                           |
| Ver, cancelar y prender delegación                                                     | Ningún registro con delegación. Un lanzamiento guardado no puede pedirla (`launch-deps.ts:33-41`); si vuelve, es un campo del lanzamiento. |
| "Sync now"                                                                             | El sync automático ya cubre los cuatro disparadores.                                                                                       |
| Mover grupos y categorías propias                                                      | El árbol que queda agrupa solo con `groupFor` y no lee lo movido a mano. Solo ordenaban el selector de `PresetsTab`.                       |
| Editor de presets suelto y duplicar                                                    | Lo cubre Workspace.                                                                                                                        |
| De `ArsenalView`: Composites, pestaña Terminals, restaurar revisiones, import de a uno | No tienen otro camino. Por lectura de código la pantalla abre en blanco desde `5a25f1c` (14/11); no lo verifiqué en la app.                |

Con Terminal agents también se van cosas que no estaban en tu lista:

- **Arrancar un agente sin lanzamiento guardado, y OpenCode/Hermes.** Los lanzamientos solo aceptan Claude Code y Codex (`desktop/launch-client.ts:23`).
- **"Update agent".** Distribuidores ya tiene su comando de actualización.
- **Datos de la fila de sesión:** modelo y esfuerzo, CPU y RAM, aviso de dos agentes en la misma carpeta.
- **"Save as launch…".**

Hay dos textos a corregir en la mudanza: `terminal/launch.ts:153` ("Create it in Arsenal") y `:295` ("start it from Agents"). Los dos pasan a apuntar a Workspace.

## D. Decisiones para vos

1. **Botones en la barra del panel (A1), no en un menú de la pestaña.** Recomiendo sí: se ven siempre y hoy no existe menú contextual.
2. **Parar sin confirmación,** igual que la ×. Recomiendo sí.
3. **Línea de registro en el pie de `+ Launch` (A2).** Recomiendo sí. La alternativa es perderla y dejar que el registro se recorte solo a 200 (`registry.rs:9`).
4. **Presets en Arsenal como lista, borrar e importar; alta y edición quedan en Workspace.** Esto contradice lo escrito en `docs/plans/limpieza.md` ("alta, edición, borrado e importación pasan a Arsenal"). Lo recomiendo igual, porque Workspace ya es ese editor y sería tener dos.
   - La variante "como se decidió" abre el editor de `PresetsTab` como tarjeta al elegir una fila:
     ```
     Presets › Estudio                          [Guardar] [Borrar] [Volver]
     Nombre [Estudio      ]   6 elegidas
     ▾ Diseño 2/9   ☑ frontend-design  ☑ taste  ☐ minimalist-ui …
     ▸ Entorno de lanzamiento
     ```
   - Cuesta conservar `PresetsTab`, `EnvironmentPanel` y media `controller.ts`: unas 2.300 líneas que no se borran, y ahí sí se quedan las categorías.
5. **Importar todas las nuevas de una (B2).** Recomiendo sí.
6. **Sync sin botón, línea solo con problema (B3).** Recomiendo sí.
7. **Perder handoff y delegación.** Recomiendo sí.
8. **Perder OpenCode/Hermes y el arranque sin lanzamiento.** Recomiendo sí, pero es la pérdida más grande y conviene que la confirmes explícita.
9. **Perder categorías y mover grupos.** Recomiendo sí; va atada a la 4.

Los 4 presets de la migración y "test" no los toca la mudanza: los borrás vos con el botón nuevo.

## E. Tamaño estimado (variante recomendada)

| Parte                                                                                                                                                 | Archivos                       | Líneas       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------ |
| Consola: `TerminalPanel`, `TerminalView`, `App.svelte`                                                                                                | 3 editados                     | +140         |
| Arsenal: `PresetsPanel.svelte` e `import.ts` nuevos; `map.ts`, `ArsenalBrowser`, `LibraryView`, `SyncLine`, `LaunchEditor`, `App.svelte`              | 2 nuevos, 6 editados           | +470         |
| `app.css`, textos de `launch.ts`, catálogo es                                                                                                         | 3 editados                     | +80          |
| Tests nuevos: acciones en Consola, panel de presets, import                                                                                           | 3 nuevos                       | +650         |
| **Mudanza**                                                                                                                                           | **5 nuevos, unos 11 editados** | **≈ +1.350** |
| Después se borra (U6 + U7 del inventario, menos `SyncLine` y `sync-present.ts`)                                                                       | 10 fuentes y 12 tests          | ≈ −11.200    |
| Segunda pasada en `NativeController` (`startAgent`, `startWithArsenal`, `handoff`, `saveBrief`, `setDelegation`, `hasTab`, `showTerminal`, `preview`) | 1                              | ≈ −150       |

Con la variante "como se decidió" del punto 4, la mudanza sube a unas +1.700 y se borran unas 2.300 menos.

**Estado: `LISTO CON RESERVAS`.** Auto-rating 8/10. Los huecos:

- El cruce disco↔candidato quedó sin verificar; el diseño lo evita con el import en bloque.
- La pantalla en blanco de Arsenal presets y el uso en la Acer quedaron sin medir.
- Los tamaños son estimados, no salen de un prototipo.
- No hubo crítico externo.

No hay nada que reiniciar. El borrador previo a estas correcciones quedó en `/tmp/claude-1000/-home-saintwyss/5371837e-b489-4d25-8d18-5ed3ed9562e9/scratchpad/mudanza/diseno.md`; vale este mensaje.

Próxima acción: contestar D1–D9. Alcanza con "todo como recomendás" o con los números que cambian; la 4 y la 8 son las que más mueven el plan.
