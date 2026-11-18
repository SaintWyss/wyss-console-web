# M6–M7 — Resto de las pantallas nativas (congelado 2026-11-18)

Referencia de comportamiento, textos y orden: las pantallas Svelte instaladas y sus `controller.ts`/`present.ts`.
Mismo estilo que M3/M5: un CSS por área con tokens de `app.css`, tres temas, español/inglés con `es.ts`, lógica
pura con tests, la UI llama a las funciones del núcleo sin IPC y sin lógica nueva. Al terminar cada pantalla, su
ícono/entrada del riel o de "Más" abre la vista nativa en vez de Tauri.

## M6 — Personalización

| # | Pantalla | Referencia | Núcleo |
|---|---|---|---|
| P1 | Distribuidores | `features/distributors/*` | `distributors.rs` |
| P2 | Arsenal (biblioteca, presets, sincronización) | `features/arsenal/*` | `arsenal/` |
| P3 | Credenciales | `features/credentials/*` | `credentials/core.rs` (`CredentialStore`: list/add/replace/rename/delete/verify) |

**Credenciales (`+security`, no negociable):**

- El secreto se pide en un diálogo GTK propio con entrada de contraseña (como `native_dialog::secret_entry`): nunca
  en un campo de la ventana principal, nunca en logs, nunca en el portapapeles, nunca persistido fuera del store.
- Se maneja como `Zeroizing<String>` desde que se lee del campo hasta que se entrega al store; se borra del campo al
  cerrar el diálogo.
- Borrar pide confirmación escribiendo el nombre (como `confirm_text`).
- La lista muestra solo metadatos (`Meta`) y huella, jamás el secreto.
- Tests con el `MemoryStore` del núcleo; contraseña de prueba `1`. Prohibido abrir el store/vault real.

## M7 — Actividad, Sesiones/Agentes, Ajustes

| # | Pantalla | Referencia | Núcleo |
|---|---|---|---|
| A1 | Actividad: Aprobaciones sobre Eventos | `features/approvals/*`, `features/events/*` | `events/`, aprobaciones del host |
| A2 | Sesiones y Agentes (en "Más") | `features/sessions/*`, `features/agent/*` | `sessions/`, `native/` |
| A3 | Ajustes (incluye idioma, tema, terminal) | `features/settings/*` | `settings/` (escribe el mismo `preferences.json`) |

Al cerrar M7 ningún ícono del riel ni entrada de "Más" lanza la app Tauri.

## Prohibido en pruebas

Escribir el `~/.claude`, `~/.codex`, `~/.config/wyss-console`, el vault o el llavero reales; conectarse al host real.
Todo con `HOME`/`XDG_*` temporales bajo `~/.cache/wyss-build/`.
