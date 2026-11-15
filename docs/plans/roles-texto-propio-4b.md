# 4b — contrato congelado: instrucciones del proyecto y rol propio por lanzamiento

Constructor: Codex (gpt-6.1-terra high). Revisión: Codex Sol Medium, una pasada. El constructor no
cambia este contrato: lo que sea imposible o contradiga el código se reporta como BLOQUEO.
Medición de base: `docs/research/roles-texto-propio-4a.md` (leerla, incluida la sección «4a bis»).

## Resultado visible

En Workspace (`src/lib/features/workspace/LaunchEditor.svelte`), en un lanzamiento de Claude o Codex
con preset, un grupo **Instrucciones del proyecto** con tres opciones:

| Valor (`project`) | Rótulo EN / ES                               | Qué carga el agente                         |
| ----------------- | -------------------------------------------- | ------------------------------------------- |
| `load` (default)  | Load the project's / Cargar las del proyecto | igual que hoy                               |
| `exclude`         | Without the project's / Sin las del proyecto | sin nada del proyecto                       |
| `role`            | Own role / Rol propio                        | sin nada del proyecto + el texto del cuadro |

Con `role` aparece un cuadro de texto (máximo 64 KiB UTF-8, sin `\0`). El eje que ya existe
(`HomeSpec.instructions` / `CodexHomeSpec.instructions`: cargar tus instrucciones globales) no se
toca y es independiente. No tocar otras pantallas (EnvironmentPanel del Arsenal queda como está).

## Almacén

- Archivo nuevo `role-instructions.json` en `arsenal::environment::directory()` (mismo directorio
  que `environment.json`), forma `{"schema_version":1,"presets":{"<selection>":{"project":"exclude"|"role","role":"<texto>"}}}`
  con `deny_unknown_fields`. `load` no se guarda (archivo solo con cambios). `role` sin texto o
  texto vacío = inválido al guardar.
- **No** agregar campos a `HomeSpec` ni a `CodexHomeSpec` (`deny_unknown_fields`; una versión vieja
  en otra PC lee `environment.json` por Syncthing y rechazaría la clave).
- Lectura **estricta**, igual que `environment.rs` (reusar su `read`/`write` genérico si encaja):
  ausente = vacío; presente e ilegible, enlace, no regular, > 1 MiB, otro esquema, id inválido o
  entrada inválida = error `role_unreadable`; nunca se sobrescribe un archivo ilegible; escritura
  temp + rename (`store::write_atomic`); > 1 MiB al escribir = `role_too_large`, no se escribe.
- Comandos Tauri nuevos en `src-tauri/src/arsenal/commands.rs`: `arsenal_launch_instructions` (get, devuelve
  `{project:"load"}` si no hay) y `arsenal_launch_instructions_write`. Agregarlos a `COMMANDS` (hay un test que
  lo exige) y al cliente `src/lib/desktop/arsenal-client.ts` con su parser estricto.

## Arranque

1. `plan_now` (`src-tauri/src/arsenal/commands.rs:~1298`): lee la entrada del preset (error →
   `role_unreadable`, mapeado en `launch_for` a `arsenal_role_unreadable`). Si `project != load`,
   entra en el plan y en `config_hash` junto con el modo y el texto del rol (no los bytes del global:
   el home se rearma en cada arranque).
   - `role` **fuerza un home** aunque el entorno del preset sea el default (`get_spec` devuelve
     `None` para un spec sin cambios): Claude usa `HomeSpec` default (`instructions: true, memory:
true`), con lo que eso implica hoy (token del llavero obligatorio → `arsenal_token_missing`;
     carpeta ≠ HOME → `arsenal_home_cwd_is_home`); Codex usa `CodexHomeSpec::default()`.
   - `exclude` **no** fuerza home: solo el overlay (Claude) o el `-c` (Codex).
   - En Workspace, elegir `role` en Claude sin token guardado (`options.token_stored == false`)
     muestra el aviso que ya existe en el panel del Arsenal (`EnvironmentPanel.svelte:~414`).
2. El plan viaja al host por los campos existentes de `ArsenalLaunch`
   (`src-tauri/src/native/arsenal.rs`): agregar un campo opcional con `serde(default,
skip_serializing_if)` y aceptar que un host viejo lo desconozca (falla cerrado: si el host no
   anuncia la capacidad, un lanzamiento con `project != load` se niega con `host_outdated`; seguir
   el patrón de `native_arsenal_v1` / `has_feature`).
3. **Claude** (`launch_home.rs::build`, `service.rs:~963`):
   - `project = exclude|role`: `claudeMdExcludes` se agrega **en el arranque** (`service.rs:~1027`,
     donde se escribe `settings.json` del overlay por sesión), no en la vista previa: `native_preview`
     no conoce la carpeta. El plan solo lleva el modo (que sí entra en `plan_token`/`config_hash`);
     la lista sale de la carpeta del arranque. Si no hay overlay, se crea uno con `--settings`.
     Nunca un segundo `--settings`. Lista (medido en 4a bis), con `C` = carpeta del arranque canónica:
     - `"<C>/**"`;
     - por cada carpeta ancestro `A` de `C` hasta `/`: `"<A>/CLAUDE.md"`, `"<A>/CLAUDE.local.md"`,
       `"<A>/.claude/CLAUDE.md"`, `"<A>/.claude/rules/**"`;
     - **se omite** todo patrón que coincida con una ruta dentro de la carpeta `.claude` del dueño
       o del home del lanzamiento (comparar canónico; p. ej. con `A` = HOME se omiten
       `<HOME>/.claude/CLAUDE.md` y `<HOME>/.claude/rules/**`). Medido: un patrón que coincide con el
       destino del enlace global saca el global **y** el rol.
     - una ruta con `*`, `?`, `[`, `]`, `{`, `}` o `\` → no arranca, código nuevo
       `arsenal_project_glob` (texto propio).
   - `project = role`: en el home, `CLAUDE.md` deja de ser el enlace y pasa a ser un archivo
     generado: `@global.md\n@ROL.md\n` si `spec.instructions` y el dueño tiene `CLAUDE.md`, o solo
     `@ROL.md\n` si no. `global.md` = enlace al `CLAUDE.md` del dueño (con `place`). `ROL.md` =
     archivo con el texto (0600). `AGENTS.md` del home sigue como hoy.
   - `project = load|exclude`: el home queda como hoy (enlace) y se borran `ROL.md`/`global.md`
     que hayan quedado de un modo anterior.
4. **Codex** (`launch_home_codex.rs::build`, `service.rs:~989`):
   - `project = exclude|role`: agregar `-c project_doc_max_bytes=0` a las palabras del exec.
   - `project = role`: `AGENTS.md` del home pasa a ser un archivo generado = bytes del `AGENTS.md`
     del dueño (si `spec.instructions` y existe) + `\n\n` + texto del rol; si no, solo el rol.
     Si el resultado supera 128 KiB → no arranca, código nuevo `arsenal_role_too_long` (texto propio:
     Codex corta el principio de un AGENTS.md de ~200 KB, medido en 4a bis).
   - `project = load|exclude`: el enlace de hoy.
5. **Nunca escribir a través de un enlace**: antes de generar, el enlace del home se borra (`place`
   ya lo hace); el archivo se escribe con `store::write_atomic`. Test obligatorio: tras construir
   un home `role`, el `CLAUDE.md`/`AGENTS.md` del dueño (fixture) queda idéntico byte por byte y
   sigue siendo archivo regular.

## Guardado

Workspace guarda el entorno por `plan.environment` / `plan.codexEnvironment` en
`LaunchEditor.svelte:~606` (`writeEnvironment` sobre la selección `target`). El rol se guarda por el
mismo camino y con el mismo `target` (la selección propia del lanzamiento que ese plan ya crea o
reusa); si el lanzamiento no tiene selección, `role`/`exclude` no se pueden elegir (controles
deshabilitados con su motivo). Leer el plan de guardado (`workspace/plan.ts` o donde se arme) y
seguirlo; si no encaja, BLOQUEO.

## Textos (inglés + `src/lib/i18n/es.ts`, sin «Something went wrong»)

- `arsenal_role_unreadable` (FAILURE_TEXT en `src/lib/features/native/present.ts` y `CODE_TEXT`
  en `src/lib/features/arsenal/messages.ts`): el archivo de instrucciones de lanzamiento
  (`role-instructions.json`) no se puede leer; no arranca ningún lanzamiento con modo propio; no se
  modificó.
- `role_too_large`.
- Ayuda del grupo: con `exclude`/`role` el agente no lee el `CLAUDE.md`/`AGENTS.md` del proyecto
  ni sus reglas; tus instrucciones globales siguen según su interruptor.
- Límites que el texto dice: el texto se aplica al arrancar; una terminal ya abierta del mismo
  lanzamiento puede verlo cambiar; reanudar una conversación conserva lo que ya tenía.
- La frase «Always loaded: the project's instructions…» del panel solo es cierta con `load`: en
  Workspace, con `exclude`/`role`, no mostrarla o decir lo contrario.

## Tests (en el mismo cambio; cada uno debe fallar sin el cambio)

- Rust: almacén estricto (ilegible/enlace/enorme/esquema/clave desconocida → error, bytes
  intactos; ausente → vacío; `role` vacío → inválido); hash cambia con modo y texto del rol (no con los bytes del global);
  home Claude `role` produce `CLAUDE.md` = `@global.md\n@ROL.md\n` y `ROL.md`, y vuelve al enlace
  con `load`; home Codex `role` = global + rol; global del dueño intacto; overlay lleva
  `claudeMdExcludes` con la ruta canónica del proyecto y se combina con `skillOverrides`; Codex
  lleva `-c project_doc_max_bytes=0` solo con `exclude|role`; host sin la capacidad → `host_outdated`.
- Vitest: el editor muestra el cuadro solo con `role`; guardar escribe `arsenal_launch_instructions_write`;
  archivo ilegible = aviso y sin guardar encima (patrón de `claudeFailed`/`unreadableFor`).

## Cadena de verificación (correr y pegar la salida real)

```
cd src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings
npm run rust:test
npm test
npm run lint
npm run typecheck
npx prettier --check src tests docs
```

`f8::acceptance::concurrency::start_stop_cycles_*` y `authority::tests::a_skipped_sequence_*`
fallan a veces bajo carga y pasan solos: si fallan, correrlos solos y pegar ambas salidas.

## Fuera de alcance / prohibido

- No tocar `~/.claude`, `~/.codex`, `auth.json`, el llavero, ni el `environment.json` real; los
  tests usan `FakeOwnerEnv`/fixtures. No instalar, no empaquetar, no commitear (commitea el
  orquestador). No `git stash`. No tocar `~/Github_repos/wyss-console`.
- No cambiar la exclusión de skills, permisos ni hooks existentes.

## Entrega (BUILD_RESULT)

Qué cambió (`archivo:línea`), decisiones de cómo tomadas, salida real de la cadena, qué no se pudo
verificar, y BLOQUEOS con evidencia si los hubo.

## 4a bis (medido 15/11, scratchpad)

- Claude: `CLAUDE.md` del home = `@global.md\n@ROL.md\n` con `global.md` → enlace a un `CLAUDE.md`
  que a su vez es enlace relativo a `AGENTS.md` (la forma real del dueño): carga global y rol.
- Claude: con cwd = `padre/proy`, `"<proy>/**"` NO saca `padre/CLAUDE.md` (se carga); agregando
  `"<padre>/CLAUDE.md"` sí. Un patrón con el destino del enlace global saca global y rol.
- Codex 0.169.0: un `AGENTS.md` de CODEX_HOME de 49 KB, 96, 128 y 160 KiB llega entero (centinela
  al inicio y al final); a ~200 KB se pierde el inicio.
