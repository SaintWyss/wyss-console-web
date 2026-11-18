# gtk-term — prototipo de terminal sin WebKit

Pregunta que responde: ¿una terminal GTK4 que dibuja con la GPU (GSK/Vulkan) y usa
`alacritty_terminal` para el estado puede reemplazar a xterm.js dentro de WebKit?

No está conectada al host ni a `wyss-screen`: abre su propia PTY con tu shell.

```sh
cargo build --release
target/release/gtk-term 3        # 3 pestañas; Ctrl+Shift+T nueva, Ctrl+Shift+W cerrar, Ctrl+Shift+V pegar
cargo test --release             # traducción de teclas
```

Variables de medición: `GTKTERM_CMD` corre un comando en vez del shell; `GTKTERM_SHOT=archivo.png`
guarda una captura renderizada por GSK a los 2 s.

## Medición 2026-11-17 (Acer, i5 + GTX 1650, Plasma Wayland, renderer GskVulkanRenderer)

| | gtk-term | Ghostty 1.4.0 | Wyss Console (Tauri+WebKit) |
|---|---|---|---|
| RAM proceso, 1 terminal (RSS / propia) | 147 / 57 MB | 183 / 60 MB | ~600 / ~255 MB (app + WebKit) |
| RAM con 10 pestañas (RSS / propia) | 120 / 35 MB | — | — |
| `cat` de 100 MB hasta cerrar | 1,9 s | 1,3 s | sin medir |
| Arranque vacío hasta cerrar | 0,22 s | 0,33 s | — |

## Huecos conocidos

- Caracteres anchos (CJK, emoji) se dibujan con el ancho del glifo, no de 2 celdas: puede correr el resto de la línea.
- Sin selección con mouse, scrollback con rueda, URLs, cursor parpadeante ni formas de cursor.
- Escritura con teclado/IBus/teclas muertas: implementada con `IMMulticontext`, sin probar a mano.
- Cada línea se re-arma completa en cada cuadro; ahí está la diferencia de throughput con Ghostty.
