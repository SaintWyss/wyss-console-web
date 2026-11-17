# Limpieza del repo y revisión por áreas

Lo pidió el dueño el 2026-11-16. Mientras dure, la traducción por pantalla queda pausada en el tag `pre-limpieza-20261116`.

Los inventarios están en `docs/research/limpieza/`. Son de solo lectura y los armó Fable.

## Decisiones del dueño (2026-11-16)

- **Basura:**
  - código muerto;
  - pantallas viejas de Más;
  - docs y planes ya cumplidos;
  - archivos sueltos (en lo versionado no apareció ninguno).
- **Actualizar:**
  - arreglar lo que encuentre la revisión; lo que cambie comportamiento se le pregunta al dueño;
  - dependencias;
  - docs al día.
- **Código muerto:** se borra entero, incluido el comando Rust `managed_model_catalogue`. `docs/contracts/interface.md` se actualiza en el mismo commit.
- **Pantallas de Más que se borran:**
  - Remote, Providers, Pipelines, Runtimes y Projects. Projects se va junto con su interruptor en Ajustes y la ventana `#workspace`.
  - Terminal agents y Arsenal presets, recién después de mudar lo esencial:
    - parar, reiniciar y olvidar un agente pasan a la pestaña de la Consola;
    - los presets (alta, edición, borrado e importación) pasan a Arsenal.
    - El diseño de la mudanza se le muestra al dueño antes de construirlo.
- **Pantallas de Más que quedan:** Sessions y Agents, para que Actividad siga teniendo contenido. Por eso el menú Más sigue existiendo con ellas.
- **"Open on":** si quedara apuntando a una pantalla borrada, se migra a `console` sin perder las otras preferencias. Hoy no hace falta, porque `sessions` y `agents` quedan.
- **Backend** (Rust `f8`, `m3`, `projects`, `orchestration`, `remote`): no se toca en esta pasada. Queda anotado.

## Orden

1. **Código muerto:** un commit por unidad, con la cadena completa y `rust:test` después de cada uno.
2. **Pantallas hoja:** U1 Remote, U2 Providers, U3 Pipelines, U4 Runtimes, U5 Projects.
3. **Mudanza y borrado:** diseño para el dueño, después la mudanza, después U6 Arsenal presets y U7 Terminal agents.
4. **Cierre de la limpieza:** shell, CSS y una segunda pasada de exports.
5. **Dependencias (hecho el 2026-11-17):** npm, menores y parches; Tauri 2.12.5 en el front y en el back; `cargo update`; jsdom 31. TypeScript 7 queda **pendiente**: `svelte-check` 4.7.8 y `typescript-eslint` 8.73 todavía exigen TS menor que 6.1, así que el typecheck y el lint se rompen. Se reintenta cuando lo soporten.
6. **App real:** recorrido de todas las pantallas en el display aislado :78.
7. **Revisión por áreas (hecho el 2026-11-17):** Shell, Consola, Workspace y Distribuidores, Arsenal y Configuración, y Ajustes y Credenciales los corrigió Codex Sol Medium y los revisó Claude Opus; Actividad, Sessions y Agents los hizo Claude Opus por pedido del dueño, porque Codex no tenía cuota (commits `233e268`..`bed2db7`). Las propuestas para el dueño están en `propuestas-revision.md`.
8. **Docs (hecho el 2026-11-17):** `STATUS.md` (sección Desktop screens), `ARCHITECTURE.md`, `contracts/interface.md` (barra, Más, títulos) y `contracts/acceptance.md` (enlaces a tests borrados) describen la ventana actual. `PRODUCT.md`, `REQUIREMENTS.md` y `ROADMAP.md` llevan una nota de las pantallas retiradas: su alcance es decisión del dueño.
9. **Traducción:** se retoma.
