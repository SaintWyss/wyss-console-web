#!/usr/bin/env bash
# kbtest.sh <run-dir> <bin> <out> <im: simple|ibus>
set -u
unset WAYLAND_DISPLAY  # nunca tocar el IBus de la sesión real
R=$1; B=$2; OUT=$3; IM=$4
rm -f "$OUT"
export DISPLAY=:77 GDK_BACKEND=x11 NO_AT_BRIDGE=1 XDG_RUNTIME_DIR=$R/app
mkdir -p "$R/app"; chmod 700 "$R/app"
if [ "$IM" = ibus ]; then export GTK_IM_MODULE=ibus; else export GTK_IM_MODULE=gtk-im-context-simple; fi
cat > "$R/run.sh" <<EOS
#!/bin/sh
if [ "$IM" = ibus ]; then ibus-daemon -dx >/dev/null 2>&1; sleep 2; fi
GTKTERM_CMD="stty raw -echo; head -c 25 > $OUT" exec $B 1
EOS
chmod +x "$R/run.sh"
setsid dbus-run-session -- "$R/run.sh" >"$R/app.log" 2>&1 &
for i in $(seq 40); do W=$(timeout 2 xdotool search --name '^gtk-term$' 2>/dev/null | head -1); [ -n "$W" ] && break; sleep 0.25; done
[ -z "${W:-}" ] && { echo "sin ventana"; cat "$R/app.log"; exit 1; }
[ "$IM" = ibus ] && sleep 2
timeout 3 xdotool windowfocus --sync $W; sleep 0.5
timeout 3 xdotool type --delay 70 "fg ab cd uno dos tres eh "
for i in $(seq 20); do [ -s "$OUT" ] && [ $(stat -c %s "$OUT") -ge 25 ] && break; sleep 0.25; done
od -c "$OUT" | head -3
