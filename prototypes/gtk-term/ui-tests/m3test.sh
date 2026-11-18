#!/usr/bin/env bash
# m3test.sh <nest-run-dir> <bin> <captures-dir>: M3a interactive checks against an ISOLATED host.
set -u
unset WAYLAND_DISPLAY  # nunca tocar el IBus de la sesión real
R=$1; B=$2; S=$3
H=$(mktemp -d /tmp/claude-1000/wh-XXXXXX); chmod 700 "$H"; mkdir -p "$H"/{run,home,state,data,config,cache}; chmod 700 "$H/run"
( export HOME=$H/home XDG_RUNTIME_DIR=$H/run XDG_STATE_HOME=$H/state XDG_DATA_HOME=$H/data XDG_CONFIG_HOME=$H/config XDG_CACHE_HOME=$H/cache; unset DISPLAY
  setsid /home/saintwyss/.local/opt/wyss-console/bin/wyss-console --wyss-host >"$H/host.log" 2>&1 & echo $! > "$H/host.pid" )
SOCK=$H/run/wyss-console/host.sock; for i in $(seq 40); do [ -S "$SOCK" ] && break; sleep 0.2; done
count(){ python3 -I -c '
import json,socket,struct,sys
s=socket.socket(socket.AF_UNIX); s.connect(sys.argv[1]); b=json.dumps({"op":"term_list","params":{}}).encode()
s.sendall(struct.pack(">I",len(b))+b); n=struct.unpack(">I",s.recv(4,socket.MSG_WAITALL))[0]; d=b""
while len(d)<n: d+=s.recv(n-len(d))
print(len(json.loads(d)["ok"]))' "$SOCK"; }
printf '#!/bin/sh\ntouch %s/riel-clic\n' "$H" > "$H/tauri.sh"; chmod +x "$H/tauri.sh"
export DISPLAY=:77 GDK_BACKEND=x11 NO_AT_BRIDGE=1 XDG_RUNTIME_DIR=$R/app GTKTERM_HOST=$SOCK XDG_STATE_HOME=$H/state WYSS_TAURI_BIN=$H/tauri.sh
mkdir -p "$R/app"; chmod 700 "$R/app"
win(){ for i in $(seq 40); do W=$(timeout 2 xdotool search --onlyvisible --name 'gtk-term|Consola|Wyss' 2>/dev/null | head -1); [ -n "$W" ] && break; sleep 0.25; done; }
shot(){ sleep 0.8; timeout 5 import -window root "$S/m3-$1.png"; }
k(){ timeout 10 xdotool type --delay 50 "$1"; timeout 3 xdotool key Return; sleep 0.7; }
setsid dbus-run-session -- "$B" >"$R/m3a.log" 2>&1 & win; sleep 2.5
timeout 3 xdotool windowsize $W 1200 800; timeout 3 xdotool windowfocus $W 2>/dev/null; sleep 0.8
timeout 3 xdotool mousemove --window $W 600 400 click 1; sleep 0.3
k "echo uno"; echo "inicio: $(count)"
timeout 3 xdotool key ctrl+shift+d; sleep 1.5; echo "Ctrl+Shift+D: $(count)"
k "echo panel derecho"
timeout 3 xdotool key ctrl+shift+Left; sleep 0.4; k "echo panel izquierdo"; shot 1-split
timeout 3 xdotool key ctrl+shift+e; sleep 1.5; echo "Ctrl+Shift+E: $(count)"; k "echo abajo"; shot 2-tres
timeout 3 xdotool key ctrl+shift+w; sleep 1.5; echo "Ctrl+Shift+W: $(count)"; shot 3-cerrado
k "cd /tmp"; sleep 3; shot 4-cd
X=$(python3 -c 'print(52+ (1200-52)//2)'); timeout 3 xdotool mousemove --window $W $X 400 mousedown 1 mousemove --window $W $((X-150)) 400 mousemove --window $W $((X-250)) 400 mouseup 1; sleep 1; k "stty size"; shot 5-arrastre
timeout 3 xdotool key ctrl+shift+t; sleep 1.5; echo "Ctrl+Shift+T: $(count)"; k "echo pestaña dos"
timeout 3 xdotool key ctrl+shift+Prior; sleep 0.8; shot 6-pgup
timeout 3 xdotool mousemove --window $W 26 69 click 1; sleep 1; [ -e "$H/riel-clic" ] && echo "riel: abrió la app Tauri (marcador creado)" || echo "riel: NO abrió"
P=$(pgrep -n -f "^$B$"); kill -TERM "$P"; sleep 2; echo "tras cerrar ventana: $(count)"
GTKTERM_SHOT=$S/m3-7-reabierta.png GTKTERM_SHOT_AFTER=3 setsid dbus-run-session -- "$B" >"$R/m3b.log" 2>&1 & sleep 5; echo "tras reabrir: $(count)"
P=$(pgrep -n -f "^$B$"); [ -n "$P" ] && kill -TERM "$P"; sleep 1
kill -TERM "$(cat "$H/host.pid")"; sleep 1.5
for p in $(pgrep -u "$(id -u)"); do tr '\0' '\n' < /proc/$p/environ 2>/dev/null | grep -q "XDG_RUNTIME_DIR=$H/run" && echo "resto: $p"; done 2>/dev/null; echo "host aislado cerrado ($H)"
