#!/usr/bin/env bash
# nest-down.sh <run-dir>: stops the nested kwin (it relaunches IBus) and everything of that run.
set -u; R=$1
for p in $(pgrep -x kwin_wayland); do ps -o args= -p "$p" | grep -q -- '--socket wl-gt' && kill -TERM "$p"; done; sleep 1.5
for p in $(pgrep -u "$(id -u)"); do tr '\0' '\n' < /proc/$p/environ 2>/dev/null | grep -q "XDG_RUNTIME_DIR=$R" && kill -TERM "$p"; done; sleep 1
left=$(for p in $(pgrep -u "$(id -u)"); do tr '\0' '\n' < /proc/$p/environ 2>/dev/null | grep -q "XDG_RUNTIME_DIR=$R" && echo "$p"; done)
echo "restos: ${left:-ninguno}"
