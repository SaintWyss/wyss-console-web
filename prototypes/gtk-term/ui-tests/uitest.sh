#!/usr/bin/env bash
set -u
unset WAYLAND_DISPLAY  # nunca tocar el IBus de la sesión real
R=$1; B=$2; S=$3
export DISPLAY=:77 GDK_BACKEND=x11 NO_AT_BRIDGE=1 XDG_RUNTIME_DIR=$R/app GTK_IM_MODULE=ibus
cat > "$R/run2.sh" <<EOS
#!/bin/sh
ibus-daemon -dx >/dev/null 2>&1; sleep 2
HISTFILE=/dev/null PS1='$ ' GTKTERM_CMD="bash --norc --noprofile -i" exec $B 1
EOS
chmod +x "$R/run2.sh"; setsid dbus-run-session -- "$R/run2.sh" >"$R/app2.log" 2>&1 &
for i in $(seq 40); do W=$(timeout 2 xdotool search --name '^gtk-term$' 2>/dev/null | head -1); [ -n "$W" ] && break; sleep 0.25; done
sleep 2; timeout 3 xdotool windowsize $W 900 560; timeout 3 xdotool windowfocus $W 2>/dev/null; sleep 0.5
k(){ timeout 10 xdotool type --delay 60 "$1"; timeout 3 xdotool key Return; sleep 0.6; }
k "echo uno dos tres cuatro"; k "seq 1 300"
timeout 5 import -window root "$S/ui-1.png"
timeout 3 xdotool mousemove --window $W 400 300; for i in 1 2 3 4 5 6 7 8; do timeout 3 xdotool click 4; done; sleep 0.5
timeout 5 import -window root "$S/ui-2-rueda.png"
timeout 3 xdotool key Return; sleep 0.3
timeout 3 xdotool windowsize $W 520 300; sleep 1; k "stty size"
timeout 5 import -window root "$S/ui-3-chica.png"
k "exit"; sleep 1; pgrep -f "^$B 1$" >/dev/null && echo "sigue abierta" || echo "cerró al salir el shell"
