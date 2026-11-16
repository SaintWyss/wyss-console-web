# Arreglos tras la prueba real del 4b (15/11) — contrato congelado

Constructor: Codex gpt-6.1-sol medium. El orquestador corre la cadena completa y la prueba real.
Base: `docs/plans/roles-texto-propio-4b.md` (sigue vigente). Decisiones de cómo ya tomadas acá; lo
imposible o contradictorio se reporta como BLOQUEO.

## Hallazgos y resultado esperado

1. **Negativa con motivo equivocado.** `src/lib/features/terminal/launch.ts:~228-246` usa
   `plan.enforcement.reason` aunque el plan esté `blocked` por ítems. Resultado: si `plan.status ===
'blocked'`, el texto nombra los ítems `missing`/`rejected` (hasta 5 nombres, "y N más") y dice
   que se destilden o se restauren en el Arsenal; si no, el motivo de enforcement. EN + ES, aplica a
   la negativa de instrucciones y a la de Codex. Test vitest con un plan bloqueado por un ítem.
2. **Workspace tilda lo que no puede aplicarse.** En el editor (`LaunchEditor.svelte`), cada skill
   cuyo estado en el plan del lanzamiento sería `missing` o `rejected` (p. ej. skills de proyecto de
   otra carpeta, o una copia instalada que difiere de la biblioteca) se muestra deshabilitada, sin
   tildar, con el motivo en el `title`, y nunca se guarda en el preset. Presets existentes no se
   reescriben solos; al abrirlos, esas skills aparecen destildadas y el guardado las saca. Fuente
   del estado: el plan que ya existe (`arsenal_terminal_plan`) para la carpeta y el proveedor del
   lanzamiento. Test vitest.
3. **Rol sin preset.** Elegir `exclude` o `role` en un lanzamiento sin preset cuenta como cambio: al
   guardar se crea el preset propio del lanzamiento con los ítems tildados (por el mismo camino que
   hoy crea uno al destildar una skill) y se guarda la elección. El aviso «Elegí un preset…»
   desaparece. Test vitest.
4. **Guardar con rol crea una copia.** En la prueba, guardar el rol hizo `copy` («prueba roles 2»)
   sobre el preset propio del lanzamiento. Encontrar la causa en `src/lib/features/workspace/plan.ts`
   y corregirla: el preset propio de ese lanzamiento se reescribe (`write`); `copy` solo si otro
   lanzamiento lo comparte. Test vitest que guarda dos veces seguidas y no crea copia.
5. **Codex >128 ítems.** `src-tauri/src/arsenal/store.rs:16` `MAX_ITEMS = 128` y Codex tiene 102
   skills + otros grupos: guardar falla «pedido no válido». Subir a 512 (archivo y escritura
   acotados siguen igual) con test de Rust en el borde (512 ok, 513 inválido).
6. **Estilo del grupo.** El grupo «Instrucciones del proyecto» usa el mismo patrón visual que los
   otros grupos del editor (encabezado, opciones como en `Permisos`/selects o radios con estilo de la
   app, tokens existentes; sin estilos nuevos inventados), el cuadro de texto a todo el ancho con
   altura de 6 líneas debajo de las opciones, y la ayuda dice solo lo de la opción elegida: `load` =
   «Carga las instrucciones del proyecto.»; `exclude` = la frase actual de sin las del proyecto;
   `role` = esa frase + la del texto que se aplica al arrancar. EN + ES.
7. **Borrar un lanzamiento deja su rol.** Al borrar un lanzamiento cuyo preset es propio (no lo usa
   otro), también se borra su entrada en `role-instructions.json` (por `arsenal_launch_instructions_write`
   con `load`). Test vitest.
8. **Revisar `2fadc3c`** (permisos Tauri de los comandos nuevos): confirmar que no queda ningún
   comando de `COMMANDS` sin permiso y que `capabilities/main.json` y `build.rs` siguen ordenados.
   Solo reportar; no cambiar si está bien.

## Reglas

Tests en el mismo cambio y que fallen sin el arreglo (decí cómo lo comprobaste). No commitear, no
`git stash`, no instalar, no tocar archivos reales del dueño. En tu sandbox NO corras `npm run
rust:test` ni `npm test` completos (se cuelgan): corré `cargo fmt --check`, `cargo clippy
--all-targets -- -D warnings`, los tests tocados con filtro, `npx vitest run <archivos>`, `npm run
lint`, `npm run typecheck`.

## Entrega

BUILD_RESULT en español: cambios con `archivo:línea` por hallazgo, salida real, qué no verificaste,
BLOQUEOS.
