#!/usr/bin/env bash
# Fails if the installed libghostty-vt headers disagree with the constants/sizes in src/ghostty.rs.
# Run after any ghostty package change (it is pinned with IgnorePkg for this reason).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; out="$(mktemp -d)"; trap 'rm -r "$out"' EXIT
cc -o "$out/abi" "$here/abi.c"
"$out/abi" | tr ' ' '\n' | grep = | sort > "$out/c.txt"
{ grep -oE '^const [A-Z_0-9]+: [a-z0-9_]+ = [0-9]+' "$here/../src/ghostty.rs" | awk '{print $2 $5}' | sed 's/:/=/'
  echo "style=72"; echo "cursor=24"; echo "scroll=24"; echo "mode=4"; echo "rgb=3"; } | grep -vE '^(SUCCESS|MAX_TEXT)=' | sort > "$out/rs.txt"
if diff <(cut -d= -f1 "$out/rs.txt" | xargs -I{} grep "^{}=" "$out/c.txt") "$out/rs.txt"; then echo "abi OK ($(wc -l < "$out/rs.txt") valores)"; else echo "ABI DISTINTA: actualizar src/ghostty.rs" >&2; exit 1; fi
