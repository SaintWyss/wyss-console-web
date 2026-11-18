#!/usr/bin/env bash
# seltest.sh <run-dir> <bin> <captures-dir>: drag, double/triple click, Ctrl+Shift+C, PRIMARY.
set -u
unset WAYLAND_DISPLAY  # nunca tocar el IBus de la sesión real

R=$1; B=$2; S=$3
export DISPLAY=:77 GDK_BACKEND=x11 NO_AT_BRIDGE=1 XDG_RUNTIME_DIR=$R/app
mkdir -p "$R/app"; chmod 700 "$R/app"
cat > "$R/runsel.sh" <<EOS
#!/bin/sh
GTKTERM_CMD='printf "hola mundo\r\nsegunda línea  \r\ntercera fila final\r\n"; sleep 60' exec $B 1
EOS
chmod +x "$R/runsel.sh"; setsid dbus-run-session -- "$R/runsel.sh" >"$R/sel.log" 2>&1 &
for i in $(seq 40); do W=$(timeout 2 xdotool search --onlyvisible --name '^gtk-term$' 2>/dev/null | head -1); [ -n "$W" ] && break; sleep 0.25; done
sleep 1.5; timeout 3 xdotool windowfocus $W 2>/dev/null
# celda: x = 4 + col*cw + cw/2 ; y = 4 + row*ch + ch/2 (relativo al área de la terminal, que arranca bajo la barra de pestañas)
TOP=$(timeout 2 xdotool getwindowgeometry $W | awk '/Position/{split($2,a,",");print a[2]}')
cell(){ echo "$((4 + $2*CW + CW/2)) $((OFF + 4 + $1*CH + CH/2))"; }
CW=${CW:-8}; CH=${CH:-20}; OFF=${OFF:-38}
clip(){ timeout 2 xclip -o -selection "$1" 2>/dev/null | od -c | head -3; }
# 1) arrastre de (0,5) a (1,6)
read x1 y1 <<<"$(cell 0 5)"; read x2 y2 <<<"$(cell 1 6)"
timeout 3 xdotool mousemove --window $W $x1 $y1 mousedown 1 mousemove --window $W $((x1+20)) $y1 mousemove --window $W $x2 $y2 mouseup 1; sleep 0.4
timeout 5 import -window root "$S/sel-1-arrastre.png"
echo "PRIMARY tras arrastre:"; clip primary
timeout 3 xdotool key ctrl+c; sleep 0.3; echo "CLIPBOARD tras Ctrl+C:"; clip clipboard
# 2) doble clic en 'segunda'
read x y <<<"$(cell 1 2)"; timeout 3 xdotool mousemove --window $W $x $y click --repeat 2 --delay 80 1; sleep 0.4
echo "PRIMARY doble clic:"; clip primary
# 3) triple clic en fila 2
read x y <<<"$(cell 2 3)"; timeout 3 xdotool mousemove --window $W $x $y click --repeat 3 --delay 80 1; sleep 0.4
echo "PRIMARY triple clic:"; clip primary
timeout 5 import -window root "$S/sel-2-triple.png"
pkill -TERM -f "^$B 1$"
