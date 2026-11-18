#!/usr/bin/env bash
# Installs the native (GTK4) Wyss Console beside the Tauri one, per user, no sudo.
#
#   install-native.sh install  [--bin PATH] [--prefix DIR]   copy the binary, menu entry, launcher
#   install-native.sh rollback [--prefix DIR]                bring back the previous binary
#   install-native.sh uninstall [--prefix DIR]               remove what install wrote
#   install-native.sh status   [--prefix DIR]
#
# The Tauri Console (~/.local/opt/wyss-console, its menu entry and its host) is never touched: it
# stays as the fallback, and its host is the one this window connects to. The previous native
# binary is kept as <prefix>.previous.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
home="${HOME:?HOME is not set}"
cmd="${1:-status}"; [ $# -gt 0 ] && shift
bin="$here/target/release/gtk-term"
prefix="$home/.local/opt/wyss-console-native"
while [ $# -gt 0 ]; do
  case "$1" in
    --bin) bin="${2:?}"; shift 2 ;;
    --prefix) prefix="${2:?}"; shift 2 ;;
    *) echo "install-native: unknown option $1" >&2; exit 2 ;;
  esac
done
apps="${WYSS_INSTALL_APPS:-$home/.local/share/applications}"
bindir="${WYSS_INSTALL_BIN:-$home/.local/bin}"
desktop="$apps/wyss-console-native.desktop"
link="$bindir/wyss-console-native"
previous="$prefix.previous"
tauri_bin="$home/.local/opt/wyss-console/bin/wyss-console"
say() { printf 'install-native: %s\n' "$*"; }

write_launcher() {
  # The socket is the Tauri host's own (host/server.rs socket_path); the window never starts a host.
  cat > "$prefix/bin/wyss-console-native" <<EOF
#!/bin/sh
export GTKTERM_HOST="\${XDG_RUNTIME_DIR:-/run/user/\$(id -u)}/wyss-console/host.sock"
export WYSS_TAURI_BIN="$tauri_bin"
# No host yet (the Tauri app was never opened in this session): start the same host it would.
if [ ! -S "\$GTKTERM_HOST" ] && [ -x "$tauri_bin" ]; then
  setsid "$tauri_bin" --wyss-host >/dev/null 2>&1 < /dev/null &
  i=0; while [ ! -S "\$GTKTERM_HOST" ] && [ \$i -lt 50 ]; do sleep 0.1; i=\$((i + 1)); done
fi
exec "$prefix/libexec/gtk-term" "\$@"
EOF
  chmod 755 "$prefix/bin/wyss-console-native"
}

case "$cmd" in
  install)
    [ -x "$bin" ] || { say "no binary at $bin (cargo build --release)"; exit 1; }
    ldd "$bin" | grep -q 'libghostty-vt' || { say "binary does not link libghostty-vt"; exit 1; }
    staging="$prefix.new"; rm -rf "$staging"; mkdir -p "$staging/bin" "$staging/libexec"
    install -m 755 "$bin" "$staging/libexec/gtk-term"
    sha256sum "$staging/libexec/gtk-term" | cut -d' ' -f1 > "$staging/SHA256"
    git -C "$here" rev-parse HEAD > "$staging/REVISION" 2>/dev/null || echo unknown > "$staging/REVISION"
    if [ -d "$prefix" ]; then rm -rf "$previous"; mv "$prefix" "$previous"; fi
    mv "$staging" "$prefix"; write_launcher
    mkdir -p "$apps" "$bindir"
    cat > "$desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Wyss Console
GenericName=Terminal
Comment=Native Wyss Console (GTK4). The Tauri app stays as the fallback.
Exec=$prefix/bin/wyss-console-native
Icon=utilities-terminal
Terminal=false
Categories=System;TerminalEmulator;
Keywords=wyss;consola;console;terminal;nativa;native;
StartupWMClass=dev.wyss.ProtoTerm
EOF
    ln -sfn "$prefix/bin/wyss-console-native" "$link"
    command -v update-desktop-database >/dev/null && update-desktop-database "$apps" 2>/dev/null || true
    # Plasma (KRunner, menu) only sees new entries after its service cache is rebuilt.
    command -v kbuildsycoca6 >/dev/null && kbuildsycoca6 >/dev/null 2>&1 || true
    say "installed $(cat "$prefix/REVISION" | cut -c1-12) in $prefix"
    if [ -d "$previous" ]; then say "previous kept in $previous (install-native.sh rollback)"; fi
    ;;
  rollback)
    [ -d "$previous" ] || { say "nothing to roll back to"; exit 1; }
    tmp="$prefix.rollback"; rm -rf "$tmp"; mv "$prefix" "$tmp"; mv "$previous" "$prefix"; mv "$tmp" "$previous"
    write_launcher; say "rolled back to $(cat "$prefix/REVISION" | cut -c1-12)"
    ;;
  uninstall)
    rm -f "$desktop" "$link"; rm -rf "$prefix" "$previous" "$prefix.new"; say "removed"
    ;;
  status)
    if [ -d "$prefix" ]; then
      say "installed $(cut -c1-12 "$prefix/REVISION") sha256 $(cut -c1-16 "$prefix/SHA256") in $prefix"
      if [ -d "$previous" ]; then say "previous $(cut -c1-12 "$previous/REVISION")"; fi
      if [ -f "$desktop" ]; then say "menu entry $desktop"; fi
    else say "not installed"; fi
    ;;
  *) echo "usage: install-native.sh install|rollback|uninstall|status" >&2; exit 2 ;;
esac
