#!/usr/bin/env bash
# hosttest.sh <nest-run-dir> <bin> <captures-dir>: M2 against an ISOLATED host (never the real one).
set -u
unset WAYLAND_DISPLAY  # nunca tocar el IBus de la sesión real
R=$1; B=$2; S=$3
H=$(mktemp -d /tmp/claude-1000/wh-XXXXXX); chmod 700 "$H"; mkdir -p "$H"/{run,home,state,data,config,cache}; chmod 700 "$H/run"
( export HOME=$H/home XDG_RUNTIME_DIR=$H/run XDG_STATE_HOME=$H/state XDG_DATA_HOME=$H/data XDG_CONFIG_HOME=$H/config XDG_CACHE_HOME=$H/cache; unset DISPLAY
  setsid /home/saintwyss/.local/opt/wyss-console/bin/wyss-console --wyss-host >"$H/host.log" 2>&1 & echo $! > "$H/host.pid" )
SOCK=$H/run/wyss-console/host.sock
for i in $(seq 40); do [ -S "$SOCK" ] && break; sleep 0.2; done
count(){ python3 -I -c '
import json,socket,struct,sys
s=socket.socket(socket.AF_UNIX); s.connect(sys.argv[1]); b=json.dumps({"op":"term_list","params":{}}).encode()
s.sendall(struct.pack(">I",len(b))+b); n=struct.unpack(">I",s.recv(4,socket.MSG_WAITALL))[0]; d=b""
while len(d)<n: d+=s.recv(n-len(d))
print(len(json.loads(d)["ok"]))' "$SOCK"; }
export DISPLAY=:77 GDK_BACKEND=x11 NO_AT_BRIDGE=1 XDG_RUNTIME_DIR=$R/app GTKTERM_HOST=$SOCK
mkdir -p "$R/app"; chmod 700 "$R/app"
win(){ for i in $(seq 40); do W=$(timeout 2 xdotool search --onlyvisible --name '^gtk-term$' 2>/dev/null | head -1); [ -n "$W" ] && break; sleep 0.25; done; }
setsid dbus-run-session -- "$B" 1 >"$R/h1.log" 2>&1 & win; sleep 2
timeout 3 xdotool windowfocus $W 2>/dev/null; sleep 0.3
timeout 10 xdotool type --delay 60 "echo tecla ok"; timeout 3 xdotool key Return; sleep 1
echo "terminales tras abrir: $(count)"
timeout 3 xdotool key ctrl+shift+t; sleep 1.5; echo "tras Ctrl+Shift+T: $(count)"
timeout 3 xdotool key ctrl+shift+w; sleep 1.5; echo "tras Ctrl+Shift+W: $(count)"
P=$(pgrep -n -f "^$B 1$"); kill -TERM "$P"; sleep 1.5; echo "tras cerrar la ventana: $(count)"
GTKTERM_SHOT=$S/m2-reabierta.png setsid dbus-run-session -- "$B" 1 >"$R/h2.log" 2>&1 & win; sleep 3
grep -h 'shot:' "$R/h2.log"; echo "tras reabrir: $(count)"
P=$(pgrep -n -f "^$B 1$"); [ -n "$P" ] && kill -TERM "$P"; sleep 1
kill -TERM "$(cat "$H/host.pid")"; sleep 1.5
for p in $(pgrep -u "$(id -u)"); do tr '\0' '\n' < /proc/$p/environ 2>/dev/null | grep -q "XDG_RUNTIME_DIR=$H/run" && echo "resto del host aislado: $p"; done 2>/dev/null; echo "host aislado cerrado"
