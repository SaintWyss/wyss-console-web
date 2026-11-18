#!/usr/bin/env bash
# ctrlc.sh <run-dir> <bin> <out>: Ctrl+C never reaches the PTY, Ctrl+Shift+C interrupts, Ctrl+V pastes.
set -u
unset WAYLAND_DISPLAY  # nunca tocar el IBus de la sesión real

R=$1; B=$2; OUT=$3; rm -f "$OUT"
export DISPLAY=:77 GDK_BACKEND=x11 NO_AT_BRIDGE=1 XDG_RUNTIME_DIR=$R/app
printf XY | setsid xclip -selection clipboard >/dev/null 2>&1 & XC=$!
cat > "$R/runc.sh" <<EOS
#!/bin/sh
GTKTERM_CMD="stty raw -echo; head -c 5 > $OUT" exec $B 1
EOS
chmod +x "$R/runc.sh"; setsid dbus-run-session -- "$R/runc.sh" >"$R/c.log" 2>&1 &
for i in $(seq 40); do W=$(timeout 2 xdotool search --onlyvisible --name '^gtk-term$' 2>/dev/null | head -1); [ -n "$W" ] && break; sleep 0.25; done
sleep 1; timeout 3 xdotool windowfocus $W 2>/dev/null; sleep 0.3
timeout 5 xdotool key --delay 150 a ctrl+c ctrl+shift+c ctrl+v; sleep 0.5; timeout 3 xdotool key b
for i in $(seq 20); do [ -s "$OUT" ] && [ $(stat -c %s "$OUT") -ge 5 ] && break; sleep 0.25; done
od -An -c "$OUT"; echo "esperado:   a 003 X Y b"
kill $XC 2>/dev/null; pkill -TERM -f "^$B 1$" 2>/dev/null; true
