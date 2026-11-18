#!/usr/bin/env bash
# Starts an isolated nested Wayland compositor + Xwayland :77. Prints the run dir.
set -u; unset WAYLAND_DISPLAY  # nunca tocar el IBus de la sesión real
R=$(mktemp -d /tmp/claude-1000/gt-XXXXXX); chmod 700 "$R"
XDG_RUNTIME_DIR=$R setsid dbus-run-session -- kwin_wayland --virtual --width 1200 --height 800 --socket wl-gt --no-lockscreen --no-global-shortcuts >"$R/kwin.log" 2>&1 &
for i in $(seq 50); do [ -S "$R/wl-gt" ] && break; python3 -c 'import time;time.sleep(0.2)'; done
XDG_RUNTIME_DIR=$R WAYLAND_DISPLAY=wl-gt setsid Xwayland :77 -geometry 1200x800 -nolisten tcp -ac >"$R/xw.log" 2>&1 &
for i in $(seq 50); do [ -S /tmp/.X11-unix/X77 ] && break; python3 -c 'import time;time.sleep(0.2)'; done
echo "$R"
