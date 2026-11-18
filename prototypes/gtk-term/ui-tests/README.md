# Pruebas de interfaz en display aislado

Teclado y mouse reales con `xdotool` sobre un `kwin_wayland --virtual` + Xwayland `:77`, sin tocar la sesión del usuario.

```sh
R=$(./nest-up.sh)                                   # imprime el directorio de la corrida
./kbtest.sh  $R ../target/release/gtk-term /tmp/kb.bin simple   # bytes de hola, á, ñ, Ctrl+C, Enter, flecha
./kbtest.sh  $R ../target/release/gtk-term /tmp/kb.bin ibus     # lo mismo con IBus
./kbspace.sh $R ../target/release/gtk-term /tmp/sp.bin ibus     # palabras con espacios (bug viejo de la Consola)
./uitest.sh  $R ../target/release/gtk-term <dir-capturas>       # bash interactivo, seq, rueda
./rstest.sh  $R ../target/release/gtk-term <dir-capturas>       # resize en vivo (stty size)
```

- Antes de teclear con teclas muertas: `DISPLAY=:77 setxkbmap -layout latam -variant deadtilde`.
- **Nunca `ibus-daemon -r`** y siempre sin `WAYLAND_DISPLAY`: con el de la sesión real, IBus reemplaza
  al del usuario. Si pasó: `kwriteconfig6 --notify --file kwinrc --group Wayland --key InputMethod ""`
  y de nuevo con el valor original; KWin lo relanza.
- Desarmar: primero el `kwin_wayland --socket wl-gt` (relanza IBus), después los procesos con
  `XDG_RUNTIME_DIR` de la corrida.
