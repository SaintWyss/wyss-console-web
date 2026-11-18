# Plan de migración: interfaz Tauri/WebKit → GTK4 nativo

Estado: APROBADO 2026-11-17 (D1–D4 = recomendadas). M4 instalado en las 2 PC el 2026-11-18 (`prototypes/gtk-term/install-native.sh`; la Consola Tauri queda en el menú como "Wyss Console (Tauri)"). M0 hecho; M1 motor `libghostty-vt` construido (Sonnet) y verificado (Opus): 113 MB, `cat` 100 MB 1,0 s (Ghostty 1,2 s). Selección y atajos hechos y probados. M2 conexión al host hecho y probado (persistencia, re-enganche, Ctrl+Shift+T/W); queda abierto el límite de throughput del host bajo flood. Rama: `proto/gtk4-terminal`.

## Objetivo medible

Wyss Console con terminales **más livianas que Warp y más rápidas que Ghostty**, sin WebKit.
Presupuestos (se congelan en `docs/DECISIONS.md` en la fase M0 y no se negocian a la baja):

| Métrica | Hoy (Tauri) | Prototipo | Meta |
|---|---|---|---|
| RAM ventana + 1 terminal (RSS proceso GUI) | ~600 MB | 147 MB | ≤ Ghostty (183 MB) |
| RAM marginal por terminal extra | sin medir | ~0 (no visible) | ≤ 5 MB |
| `cat` 100 MB hasta cerrar | sin medir | 1,9 s | ≤ Ghostty (1,3 s) |
| Latencia tecla→píxel (mediana) | sin medir | sin medir | ≤ Ghostty |
| CPU en reposo con 10 terminales | sin medir | sin medir | < 0,5 % |

Medición: `bench.sh` del prototipo, misma PC (Acer + GTX 1650, Wayland), misma carga.

## Qué cambia y qué no

- **No cambia (Rust, ~todo el producto):** host y `wyss-screen` (terminales persistentes), `TerminalService`,
  proveedores, Workspace/launch, Arsenal, credenciales, aprobaciones/eventos, F8, M3, remoto, Android.
- **Cambia:** la interfaz. 34 componentes Svelte + `src/lib` (~35 mil líneas TS/Svelte) y la capa de
  199 `#[tauri::command]` en 21 archivos. En GTK nativo la interfaz llama a los servicios Rust
  **directo, en el mismo proceso**: esos 199 comandos dejan de ser IPC y pasan a ser llamadas.
- **Se pierde y se rehace:** ~1300 tests vitest de interfaz → tests Rust del modelo de cada pantalla
  (lógica sin GTK) + pruebas visuales en display anidado.

## Estrategia: convivencia, no big-bang

Las dos interfaces conviven sobre el mismo host. La nativa crece pantalla por pantalla; mientras una
pantalla no está portada, el botón abre la app Tauri actual **como proceso aparte y a demanda**, así su
RAM solo se paga mientras está abierta. Cada fase deja algo instalable y usable.

## Fases

| # | Fase | Entrega | Criterio de cierre |
|---|---|---|---|
| M0 | Contrato | Presupuestos de la tabla en `DECISIONS.md`; decisiones D1–D4; congelar features nuevas en Svelte | Documento aprobado por el dueño |
| M1 | Motor de terminal | crate `wyss-term` desde el prototipo: redibujo solo de líneas cambiadas, caracteres anchos, selección + copiar, scrollback con rueda, links, formas de cursor, IBus/teclas muertas | Cumple RAM y `cat` de la meta; el dueño escribe `´a ~n` y Ctrl+C sin error |
| M2 | Conexión al host | La terminal nativa usa `TerminalService` (create/write/resize/read/close) y se re-engancha a sesiones vivas con el snapshot de `screen/repaint.rs` | Cerrar y reabrir la ventana conserva terminales; GUI Tauri y nativa abren la misma sesión |
| M3 | Ventana Consola nativa | Barra lateral, pestañas, paneles divididos (`layout.ts`), barra de sesión, tarjeta de ciclo de vida, RAM por terminal, atajos (`keymap.ts`), tema grafito/claro/alto contraste, ES/EN | Paridad con la Consola actual en una lista de verificación escrita antes; uso diario por el dueño 3 días |
| M4 | Paquete | `install.sh` instala el binario nativo como entrada principal; "Configuración" abre Tauri a demanda; `--keep-host` igual que hoy | Instalado en las 2 PC; rollback probado |
| M5 | Workspace | 8 pestañas (Sistema/Agentes, General, Actualizar sistema, Instrucciones, Skills, MCP, Hooks, Resumen) contra `workspace-rediseno-boceto.html` | Cero diferencias con el boceto, mirado en display anidado |
| M6 | Arsenal + Distribuidores + Credenciales | Pantallas nativas | Paridad + revisión `+security` en Credenciales |
| M7 | Actividad + Sesiones/Agentes + Ajustes | Aprobaciones, eventos, ajustes | Paridad |
| M8 | Retiro de Tauri | Borrar Svelte, Vite, node, WebKitGTK y la capa de comandos; docs al estado actual | `cargo test` verde; sin dependencia de `webkit2gtk`; presupuestos re-medidos |

Cada fase: BUILD con test en el mismo cambio, revisión externa una pasada (`+review`), instalar con
`--keep-host`, push.

## Hallazgo M1 (2026-11-17): el cuello es el intérprete, no el dibujo

`cat` de 100 MB sin dibujar nada tarda 1,52 s con `alacritty_terminal` (con dibujo 1,8 s; Ghostty 1,3 s).
Intérprete solo, mismo archivo, 120×40 (`prototypes/gtk-term/src/bin/parsebench.rs`):

| Motor | Tiempo |
|---|---|
| `alacritty_terminal` 0.26 | 1,39–1,42 s |
| `libghostty-vt` (Ghostty 1.4.0) | 0,23 s |

Con `alacritty_terminal` la meta de velocidad es inalcanzable aunque el dibujo cueste cero.
`libghostty-vt` además trae estado de render con filas sucias (`render.h`). Su API se declara inestable.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Throughput por debajo de Ghostty con GSK | M1 mide primero; plan B: renderer propio en `GtkGLArea` con atlas de glifos (como Ghostty/Alacritty) |
| IBus/teclas muertas en GTK nativo | Se prueba a mano en M1 antes de seguir; GTK4 es el camino maduro en Linux |
| Trabajo de interfaz en Svelte que se tira | M0 congela features nuevas en Svelte; solo arreglos |
| Los constructores (`codex-ux`) están orientados a web | Contrato de UI por pantalla + capturas como referencia; revisar el primer port antes de escalar |
| Accesibilidad (lector de pantalla) | GTK4 expone AT-SPI; checklist por pantalla con Orca |
| Dos interfaces divergen durante la convivencia | Las dos llaman los mismos servicios Rust; ninguna lógica nueva en la capa de interfaz |

## Decisiones abiertas (dueño)

- **D1 Estética:** GTK4 con CSS propio que copia el tema grafito actual (recomendado: se ve igual en
  Plasma) o libadwaita (estilo GNOME, menos trabajo, se ve ajeno en KDE).
- **D2 Convivencia:** abrir pantallas no portadas en la app Tauri a demanda (recomendado) o esperar a
  portar todo antes de instalar.
- **D3 Congelar Svelte:** desde M0 solo arreglos en la interfaz actual (recomendado) o seguir
  sumando pantallas en paralelo.
- **D4 Orden después de M4:** Workspace primero (recomendado: diseño recién cerrado) u otro.
