# M5.0 — Núcleo sin Tauri (congelado 2026-11-18)

Objetivo medible: la app nativa llama a la lógica Rust de las pantallas (configuración, launch, distribuidores,
Arsenal, credenciales, proyectos, sesiones, ajustes) **en el mismo proceso**, sin enlazar Tauri, WRY ni WebKit,
y la app Tauri sigue idéntica.

## Reglas (no negociables)

1. **Un solo crate, un solo lockfile.** `src-tauri/Cargo.toml` gana una feature `desktop`, activa por defecto,
   que trae `tauri` (y `tauri-build` vía `build.rs` solo si `CARGO_FEATURE_DESKTOP`). La UI nativa se mueve
   al mismo crate como bin `wyss-console-native` con `required-features = ["native-ui"]` (feature propia, sin
   `desktop`), en `src-tauri/src/bin/wyss-console-native/` con sus módulos (los de `prototypes/gtk-term/src`).
   No usar el nombre de módulo `native` (ya existe). `prototypes/gtk-term` queda solo como referencia/bench.
2. **Comandos aislados.** Todo `#[tauri::command]` y todo uso de `tauri::*` (State, AppHandle, Emitter,
   async_runtime, Manager, ventanas, diálogos) vive en módulos `#[cfg(feature = "desktop")]`.
   Archivos de pegamento puro (se gatean enteros): `arsenal/commands.rs`, `credentials/commands.rs`,
   `desktop.rs` y `desktop/*`, `host/commands.rs`, `native/commands.rs`, `native_dialog.rs`,
   `orchestration_commands.rs`, `projects/commands.rs`, `m3/gui.rs`, `m3/fixture/host.rs`.
   Archivos mixtos (se parten: lógica afuera, comandos a un submódulo `commands` gateado):
   `configuration.rs`, `launch.rs`, `distributors.rs`.
3. **Ninguna función de servicio recibe `AppHandle`/`State`.** Lo que hoy sale de ahí (rutas, eventos, estado
   compartido) pasa como argumento explícito calculado en el comando, o como un trait/closure de eventos
   definido en el núcleo. Cero cambio de comportamiento observable.
4. Nada de `create_all`, nada de lógica nueva en la capa de comandos; refactor mecánico.

## Aceptación (salida real, comparada con la línea de base)

- Línea de base en `0a7e43f`+ (antes de tocar): `rust:test`, `rust:clippy`, `npm run check` → idénticos después
  (mismos conteos de tests, cero warnings nuevos). `desktop:package` construye.
- `cargo tree --no-default-features --features native-ui -e normal | grep -Ei 'tauri|wry|webkit|javascriptcore'`
  → vacío.
- `cargo build --release --no-default-features --features native-ui --bin wyss-console-native` → `ldd` sin
  `webkit`/`javascriptcore`; el binario corre el mismo arnés que `prototypes/gtk-term` (ui-tests verdes).
- Un host sin Tauri: `wyss-console --wyss-host` construible sin `desktop` (bin `wyss-host` o equivalente) con
  `ldd` sin webkit — M8 lo necesita.
- RSS de la ventana nativa con 1 terminal sigue ≤ 183 MB tras enlazar el núcleo.
