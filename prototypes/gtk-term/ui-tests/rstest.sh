#!/usr/bin/env bash
set -u
unset WAYLAND_DISPLAY  # nunca tocar el IBus de la sesión real
R=$1; B=$2; S=$3
export DISPLAY=:77 GDK_BACKEND=x11 NO_AT_BRIDGE=1 XDG_RUNTIME_DIR=$R/app
setsid dbus-run-session -- "$R/run3.sh" >"$R/app3.log" 2>&1 &
for i in $(seq 40); do W=$(timeout 2 xdotool search --onlyvisible --name 'gtk-term|Wyss' 2>/dev/null | head -1); [ -n "$W" ] && break; sleep 0.25; done
echo "ventana $W: $(timeout 2 xdotool getwindowgeometry $W | tail -1)"
sleep 1; timeout 3 xdotool windowsize --sync $W 520 300; sleep 1.2
echo "tras achicar: $(timeout 2 xdotool getwindowgeometry $W | tail -1)"
timeout 5 import -window root "$S/ui-4-resize.png"
timeout 3 xdotool windowsize --sync $W 1100 700; sleep 1.2
echo "tras agrandar: $(timeout 2 xdotool getwindowgeometry $W | tail -1)"
timeout 5 import -window root "$S/ui-5-resize.png"
pkill -TERM -f "^$B 1$"
