# Plan: Arsenal como guía de skills (paso 1: solo vista)

Estado: **APROBADO por el dueño el 2026-11-14**, para construir. Este documento es la consigna completa: quien lo construya no reabre las decisiones de abajo.

Contexto: la pestaña Arsenal → Skills de hoy (commit `9958b79`) muestra la biblioteca importada (43 de 119 skills), con todo plano y sin separación clara. El dueño dijo que entra y se sobrecarga de información. El objetivo es que alguien que no sabe nada entienda qué hay y cómo se usa.

## Decisiones del dueño (no reabrir)

1. **Navegación en árbol al costado**, como un árbol de páginas: el panel grande queda para la lista y la ficha. El menú de Personalización pasa a ser:

   ```
   Distribuidores
   ▾ Arsenal                 (Claude Code | Codex se elige arriba del panel)
       Guía
       Mías            39
       Conjuntos
         GSD Core      72
         <cada plugin> n
         Repos git     n
       Agentes         n
       Hooks           n
       MCP             n
       Global          n
   Credenciales
   ```

2. **Guía** (lo que se ve al entrar): qué es una skill y cómo se activa, en tres renglones simples, por ejemplo:
   - Una skill es una instrucción de cómo hacer algo, guardada en una carpeta con un `SKILL.md`.
   - Al arrancar, Claude lee solo el nombre y la descripción de cada una; si lo que pedís coincide, abre la skill entera y la sigue.
   - Se usa escribiendo `/nombre` o pidiendo lo que dice su "Usala cuando".

   Al entrar no se lee la descripción de ninguna skill: todo está plegado.

3. **Mías** = carpeta real en `~/.claude/skills` que no es enlace ni repo git (calculado del disco, no a mano). Incluye las copiadas de terceros (`the-fool`, `firecrawl-scrape`, `humanizer`…). Se agrupan por las categorías de `src/lib/features/arsenal/groups.ts`, con su cantidad y su frase (`GROUP_HELP`), plegadas.
4. **Conjuntos** = todo lo demás, agrupado por origen: GSD Core (enlaces a `~/.local/share/wyss/gsd-core`), cada plugin, y los repos git (`gstack`, `taste`, `obsidian-second-brain`, `ai-second-brain`). Al entrar a un conjunto se ve "qué es y por dónde empezar". "Empezá por /x-help" aparece solo si el conjunto trae una skill `*-help`. Llevan la nota: "Vienen de afuera y se actualizan solas: no se editan acá".
5. **Fila de una skill:** el nombre y la primera oración de la descripción. Nada más. Una línea separa cada fila, y la cabecera de cada categoría tiene fondo propio.
6. **Ficha** (panel derecho, una sección solo si tiene contenido):
   - **Qué hace** (la primera oración o párrafo de la descripción).
   - **Usala cuando / No la uses cuando**: se parte la descripción con una regla determinista y testeada ("Use when", "Usá/Úsalo cuando", "Do not use / No la uses / SKIP"…). Si no se puede partir, va solo "Qué hace" con la descripción entera.
   - **Cómo se usa**: solo si el `SKILL.md` tiene un título `## Cómo se usa` / `## Usage` / `## How to use` / `## When to Use`.
   - **Instrucciones**: el cuerpo del `SKILL.md`, plegado y con formato básico (títulos, listas, código). **Nunca `{@html}`** con texto de una skill: es contenido de terceros en una ventana con comandos privilegiados. Si no hay un renderizador seguro sin dependencias, se muestra como texto preformateado. No sumar una dependencia de markdown sin preguntar al dueño.
   - **Archivos (n)**: plegado, sin volcar el contenido de golpe.
   - **Alcance** (ver abajo).
7. **Marca de alcance** por skill, calculada de en qué carpetas está:
   - **Claude**: solo la ve Claude Code.
   - **Codex**: solo la ve Codex.
   - **Ambas · global**: está en la carpeta que leen las dos y se carga siempre.
   - **Ambas · por lanzamiento**: existe para las dos pero no va al global; se elige en cada lanzamiento de Workspace.

   **Antes de dibujarla, medir** qué carpetas lee cada herramienta en esta PC (`~/.claude/skills`, `~/.agents/skills`, `~/.codex/skills`, plugins). No suponerlo. Si una regla no se puede probar, esa marca no se muestra.

8. **Arreglar el lector de `description: >`** (escalar plegado de YAML), con test. Hoy `loops` muestra ">". Y también `|`.

## Correcciones tras revisar el plan (2026-11-14, entran en el paso 1)

- **Dos funciones quedaron sin acceso en `9958b79`, y hay que devolverlas:**
  1. **Prender y apagar skills** (lo que hacía Configuración con `kind: skill`): `CONFIG_KINDS` de `LibraryView.svelte` no incluye `skill` y la vista suelta de Configuración ya no se monta. Va en la ficha de cada skill de "Mías" como **Apagada / Prendida**, por el mismo plan, aplicar y deshacer de Configuración. Es además la "baja reversible" que pidió el dueño.
  2. **Configuración de OpenCode:** `TOOLS` solo tiene Claude Code y Codex, y el enlace "Configuración" de la fila de OpenCode en Distribuidores cae en Claude. Agregar OpenCode cuando tenga algo, y que el enlace abra la herramienta de su fila.
- **"Mías" se clasifica por destino resuelto, no por "es enlace":** `humanizer` es un enlace (`../skills-src/humanizer/skills`) y es del dueño. Regla: el destino resuelto queda bajo `~/.local/share/wyss/gsd-core` → GSD Core; tiene `.git` → repo; está en la caché de plugins → plugin; si no, Mías. Los enlaces que no van a gsd-core (`humanizer`, `doctor` y `whatsapp-inbox` en `~/.agents/skills`, y uno en `~/.claude/.agents/skills`) se clasifican por esa regla y se muestran con su origen.
- **Los números de este plan son de la .18.** Se calculan siempre del disco, y `~/.local/share/wyss` no se sincroniza entre las PC.
- **El lado de Codex:** qué carpetas lee cada herramienta ya está medido en `docs/research/arsenal-home-por-lanzamiento.md` (Codex lee `~/.agents/skills`; los symlink de `SKILL.md` no cargan). Partir de ahí para la marca de alcance, y medir solo lo que falte.
- **Agentes también se leen del disco** (`~/.claude/agents`, 35 en la .18). La biblioteca muestra 0.
- **Dónde va la ficha:** dentro del panel, la lista a la izquierda y la ficha a la derecha. En ventana angosta, la ficha reemplaza a la lista y tiene un botón Volver.
- **El contrato `docs/contracts/arsenal-UI-SPEC.md`** (sección "Etapa 4") todavía describe pestañas. Se actualiza en el mismo cambio, con Contenido, Estados y Breakpoints.

## Trampas (costaron tiempo el 2026-11-14)

- `npm run desktop:package` exige el árbol limpio: primero commit. `scripts/install.sh install` exige `--package .artifacts/package/wyss-console-0.2.0-linux-x64`.
- Al tocar la navegación se rompen los tests que enumeran vistas: `tests/app-shell.test.ts`, `tests/ux-structure.test.ts`, `tests/view-visibility.test.ts` y `tests/configuration-app.test.ts`.
- El test f8 `start_stop_cycles…` falla bajo carga y pasa al repetirlo solo.
- Prueba aislada: **enlazar** `~/.claude/skills` (1,5 GB), `agents` y `plugins` al HOME aislado, no copiarlos. **Nunca** copiar `credentials` ni `~/.claude.json`. Los sockets van en `/tmp/claude-1000/wux-XXXXXX` (los paths largos no entran). Matar solo por PID guardado.
- Con el HOME aislado, Claude y Codex salen "No instalado" salvo que el `PATH` de la app incluya `~/.local/bin`.

## Fuera de este paso (no dejar botones muertos)

Editar, alta, baja, abrir en VS Code, cambiar el alcance y reescribir descripciones van en el **paso 2**, con lente +security, porque escriben en `~/.claude/skills`. "Agregar" sale de esta pestaña.

## Paso 2 (después, ya decidido en lo esencial)

- **Alta:** formulario con nombre, descripción e instrucciones; crea `~/.claude/skills/<nombre>/SKILL.md`.
- **Baja:** no borra; mueve la carpeta a una papelera de la app, de donde se puede restaurar.
- **Modificación:** editar la descripción y las instrucciones, con respaldo antes de guardar, y un botón para abrir en VS Code.
- **Alcance:** pasar de solo Claude a ambas, o sacar del global (mover o enlazar archivos).
- **Reescribir las descripciones de las Mías** (39) en español con el formato _"Qué hace. Usala cuando… No la uses cuando…"_, más una sección `## Cómo se usa` (comando, frases que la activan, ejemplo). Se le muestran al dueño **como diff para aprobar** antes de escribir, con respaldo. Se conservan las frases que hoy la activan.

## Cómo se construye

- **Datos reales, no la biblioteca:** la vista lee las skills de disco. Primero revisar qué ya existe:
  - `Composite` en `src/lib/contracts/arsenal.ts` (`DiscoverReply.composites`) puede ser ya el "conjunto" (plugins y metodologías).
  - `arsenal_discover` (`src-tauri/src/arsenal/commands.rs`, `catalogue::scan_process`): comprobar que lista las 119, que sigue enlaces, que incluye plugins, y si viene `truncated`.
  - Para leer el texto de un `SKILL.md` real hace falta un comando de solo lectura nuevo: que reciba el **id del último escaneo**, no una ruta, y con tope de tamaño (`arsenal_file` es solo de la biblioteca).
- **Archivos:**
  - Navegación: `src/lib/shell/nav.ts` (`PERSONALIZATION`) y el layout de Personalización en `App.svelte`. Hoy son pestañas planas; pasan a árbol con subentradas de Arsenal.
  - Vista: `src/lib/features/arsenal/LibraryView.svelte` (hoy herramienta + tipo en pestañas). Global, Hooks y MCP siguen usando `ConfigurationView` embebida (`embedded`, `kinds`).
  - Lógica pura (partir la descripción, clasificar Mías y Conjuntos, alcance) en un `.ts` con tests.
- **Diseño:** tokens de `src/app.css`, sin inventar. Objetivos de ≥ 44 px. Que se entienda dónde termina una cosa y empieza otra, sin abusar de líneas: el dueño rechazó tanto las cajas como las líneas por todos lados. Las cabeceras de categoría con fondo propio y las filas con separador fino.
- **Idioma:** todo texto con `t()` y su entrada en `src/lib/i18n/es.ts` (`tests/i18n.test.ts` lo exige).
- **Verificación:** `npx vitest run`, `npx eslint . --max-warnings 0`, `npm run typecheck`, `npm run test:harness`, `npm run test:claude-bridge`, y `cargo test` + `npm run rust:clippy` si se toca Rust. Después, prueba en pantalla aislada con datos reales (receta en la memoria `reference_display_anidado_kwin`), enlazando `skills`, `agents` y `plugins` al HOME aislado. Capturas de la Guía, una categoría abierta, la ficha de `loops`, GSD Core abierto y un plugin, a 1650 y 900 px. Criterio: al entrar no se lee la descripción de ninguna skill.
- **Entrega:** commit, `npm run desktop:package`, `bash scripts/install.sh install --package .artifacts/package/wyss-console-0.2.0-linux-x64 --keep-host`, y parar para que el dueño lo mire. El dueño autorizó instalar después de cada cambio; **charlar antes de cambiar** cualquier cosa que no esté en este plan.
