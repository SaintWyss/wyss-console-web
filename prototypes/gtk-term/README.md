# gtk-term — prototipo de terminal sin WebKit

Terminal GTK4 que dibuja con la GPU (GSK/Vulkan) y usa `libghostty-vt` (Ghostty 1.4.0, fijado con
IgnorePkg) como intérprete y estado. Todo el FFI está en `src/ghostty.rs`; `abi/check-abi.sh` compara sus
constantes y tamaños con los headers instalados y falla si Ghostty cambió la API.

Sin variables, abre su propia PTY con tu shell. Con `GTKTERM_HOST=<socket>` se conecta al host de la
Consola (M2): se re-engancha a las terminales vivas (repaint + lectura desde `at`), Ctrl+Shift+T crea una
en el host, Ctrl+Shift+W la cierra, y cerrar la ventana solo desconecta. Nunca busca el host real solo.

```sh
cargo build --release
target/release/gtk-term 3        # 3 pestañas; Ctrl+Shift+T nueva, Ctrl+Shift+W cerrar
cargo test --release             # traducción de teclas
```

Variables de medición: `GTKTERM_CMD` corre un comando en vez del shell; `GTKTERM_SHOT=archivo.png`
guarda una captura renderizada por GSK a los 2 s.

## Medición 2026-11-17 (Acer, i5 + GTX 1650, Plasma Wayland, GskVulkanRenderer)

| | gtk-term M1 (libghostty-vt) | gtk-term v0 (alacritty_terminal) | Ghostty 1.4.0 | Wyss Console (Tauri+WebKit) |
|---|---|---|---|---|
| RAM proceso, 1 terminal (RSS / propia) | **113 / 25 MB** | 147 / 57 MB | 183 / 60 MB | ~600 / ~255 MB |
| RAM con 10 pestañas (RSS / propia) | **114 / 26 MB** | 120 / 35 MB | — | — |
| `cat` de 100 MB hasta cerrar | **0,99–1,00 s** | 1,8–1,9 s | 1,17–1,25 s | sin medir |
| Intérprete solo, 100 MB (`parsebench`) | 0,22 s | 1,40 s | — | — |
| CPU en reposo, 10 pestañas, 10 s | 0 ticks | — | — | — |

## Atajos (decisión del dueño, 2026-11-18)

| Atajo | Hace |
|---|---|
| Ctrl+C | Copia la selección. **Nunca interrumpe** (sin selección no hace nada) |
| Ctrl+V, Ctrl+Shift+V | Pegan el portapapeles |
| Ctrl+Shift+C | Interrumpe (manda 0x03 al programa) |
| Arrastrar / doble clic / triple clic | Selecciona celdas / palabra / línea; la selección queda en PRIMARY |
| Clic del medio | Pega PRIMARY |

## Límite del host (M2, 2026-11-18)

Con un flood (`cat` de 100 MB) el cliente recibe ~1 MB y se re-sincroniza por `term_screen` (29 veces):
el ring del host es de 512 KiB, cada `term_read` entrega ≤ 16 KiB y el host no frena al programa
(`src-tauri/src/host/ring.rs:8`, `core.rs:36`). Pasa igual con la Consola Tauri actual. El formato de
bytes como array JSON cuesta ~3,4 bytes por byte, pero no es el cuello. Arreglarlo es un cambio del host.

## Huecos conocidos (M1)

- La selección se borra cuando cambia el texto de sus filas o se desplaza la pantalla (no lo acompaña). Sin shift+clic ni autoscroll al arrastrar.
- Con apps que piden reporte de mouse (vim, htop) la rueda mueve el scrollback en vez de mandarles eventos.
- PTY sin IUTF8: en modo canónico (sin readline) borrar un carácter multibyte borra un byte.
- La escritura a la PTY corre en el hilo GTK: un pegado enorme a un programa que no lee puede trabar la ventana.
- Sin probar a mano: escritura con IBus/teclas muertas, rueda, resize en vivo, cursor barra/subrayado.
