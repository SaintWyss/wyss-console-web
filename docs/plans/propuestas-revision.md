# Propuestas de la revisión por áreas (para el dueño)

Aplicadas el 2026-11-17: 1, 2, 3, 6, 7, 8, 11, 12, 13, 15, 16, 17, 18. Quedan: 14 (va con la traducción); 4, 5, 9, 10 se dejan como están por decisión del dueño.

## Shell

- **Settings:** recomiendo quitarlo de Más y conservarlo en el riel. Requiere cambiar la decisión explícita de `nav.ts`.
- **Ayudas del riel:** recomiendo describir qué abre Workspace, Personalization y Activity.
- **“Authority P1”:** recomiendo evaluar una etiqueta simple “Authority”, coordinada con Ajustes y sus referencias al protocolo.
- **“Terminal error”:** mejora opcional de precisión; recomiendo conservar la prioridad del error del workspace.

## Consola

- **Simplificar las marcas Native** entre pestaña, pill y pie: recomiendo conservarlas hasta decidir el diseño.
- **Validar el permiso antes de ejecutar `before`**: evitaría esos comandos cuando el inicio será rechazado. Recomiendo evaluar ese cambio de orden por separado.

## Workspace

PROPUESTAS para el dueño

1. Agentes: recomiendo presentarlos como información de lo que el proveedor carga, evitando prometer selección individual. Cambiar controles o retirar la sección requiere decidir la experiencia; no se hizo.
2. Tooltips de filas/permiso: recomiendo conservar el motivo accesible en cada control y reducir solo las copias que no aporten contexto. No eliminados por gusto.
3. active en la lista y runs on this computer en el detalle: recomiendo conservar ambos por ahora: orientan en dos posiciones distintas.
4. Distributor/Distributions: recomiendo Linux distributions si el dueño quiere desambiguar términos. No renombrado.

## Límites de verificación

- El límite real de 512 ítems por preset sigue siendo del backend. El arreglo elimina el límite accidental de la biblioteca al consultar disponibilidad; no amplía el tamaño permitido de un preset.
- La API de preview_items no acepta composites: un borrador con ítems modificados usa su preview de ítems; un preset sin cambios usa el plan guardado con composites. El arranque conserva la validación autoritativa del host.
- No se probaron IPC real, versión instalada del proveedor ni UI en display; se usaron fixtures y DOM Svelte.
- recibo.py rechazó el worktree con «no es un repo git». Se ejecutaron las verificaciones directamente, sin modificar .git ni el wrapper.

## Comandos y salidas reales

### npm run typecheck

Exit 0.

```text
npm notice run wyss-console@0.2.0 typecheck
npm notice run svelte-check --tsconfig ./tsconfig.json && tsc --project tsconfig.tools.json
1794879505973 START "/home/saintwyss/Github_repos/wyss-console-ux"
1794879505975 COMPLETED 480 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```

### npm run lint

Exit 0.

```text
npm notice run wyss-console@0.2.0 lint
npm notice run eslint . --max-warnings 0
```

### npx vitest run tests/i18n.test.ts tests/launch-editor.svelte.test.ts tests/launch.test.ts tests/workspace-incoming.test.ts tests/workspace-distros.test.ts tests/workspace-plan.test.ts tests/workspace-environment-unreadable.test.ts

Exit 0.

```text
npm notice run wyss-console@0.2.0 npx
npm notice run 'vitest' run tests/i18n.test.ts tests/launch-editor.svelte.test.ts tests/launch.test.ts tests/workspace-incoming.test.ts tests/workspace-distros.test.ts tests/workspace-plan.test.ts tests/workspace-environment-unreadable.test.ts

 RUN  v5.1.0 /home/saintwyss/Github_repos/wyss-console-ux


 Test Files  7 passed (7)
      Tests  155 passed (155)
   Start at  22:38:19
   Duration  3.49s (environment 50%, tests 26%, transform 14%, import 8%, setup 1%, worker 1%)

```

### npx prettier --check <los 13 archivos tocados; lista exacta en la salida>

Exit 0.

```text
npm notice run wyss-console@0.2.0 npx
npm notice run 'prettier' --check src/lib/features/workspace/LaunchEditor.svelte src/lib/features/workspace/DistroVariants.svelte src/lib/features/workspace/data.ts src/lib/features/workspace/distros.ts src/lib/features/workspace/messages.ts src/lib/features/workspace
```

## Arsenal

- Retirar el nodo vacío Hooks de OpenCode (OpenCode no lee hooks).
- Un solo acceso para agregar hooks (hoy hay dos: la lista del evento y la pestaña Hooks).
- Mostrar una sola vez por página el aviso de confianza de hooks de Codex.

## Ajustes y Credenciales

- Traducir en Rust los diálogos GTK de credenciales (New API key, Replace API key, Delete this API key?, Cancel, Keep…): hoy quedan en inglés con la app en español.

## Sessions + Agents (revisión 17/11)

- **Agent: estado de conexión dos veces.** La línea de estado sobre el transcript y la pista del compositor dicen las dos «Connecting to the authority…». Recomendación: dejar solo la línea de estado.
- **Agent: «Cancelling…» dos veces.** Aparece en el turno y en el botón. Recomendación: dejarlo solo en el botón.
- **Sessions: «Ready: attached to the running agent.»** Repite el detalle del enlace que ya está en los datos de la sesión. Recomendación: no mostrar esa pista para una sesión lista.
- **Eventos (pendiente técnico):** la consulta de una aprobación desde un evento puede mostrar una respuesta vieja después de reconectar. Arreglarla con un test de vista.
