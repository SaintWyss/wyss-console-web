# 4a — medición: texto propio por lanzamiento (15/11)

Medido con frases centinela en carpetas aisladas del scratchpad; nada tocó `~/.claude` ni `~/.codex`.

## Codex 0.169.0 (`codex debug prompt-input`, sin llamada al modelo)

`CODEX_HOME` falso con `AGENTS.md` = `CENTINELA_GLOBAL_KIWI`; proyecto con `AGENTS.md` (MANGO) y
`sub/AGENTS.md` (PAPAYA); cwd = `proj/sub`.

| Args                         | Ve                    |
| ---------------------------- | --------------------- |
| ninguno                      | GLOBAL, PROYECTO, SUB |
| `-c project_doc_max_bytes=0` | GLOBAL                |

`project_doc_max_bytes=0` saca todo lo del proyecto (raíz y subcarpeta) y conserva el `AGENTS.md`
de `CODEX_HOME`. El rol entra componiendo ese archivo: global + rol.

## Claude Code (`claude -p`, Haiku, 4 llamadas)

`CLAUDE_CONFIG_DIR` falso: `CLAUDE.md` = `@global.md` + `@ROL.md` (KIWI, UVA). Proyecto:
`CLAUDE.md` (MANGO), `.claude/CLAUDE.md` (PERA), `CLAUDE.local.md` (LIMA), `.claude/rules/r.md`
(COCO), `sub/CLAUDE.md` (PAPAYA, se carga al leer un archivo de `sub/`).
Exclusión pasada por arranque: `--settings '{"claudeMdExcludes":["<proyecto absoluto>/**"]}'`.

| Caso                                   | Ve                                 |
| -------------------------------------- | ---------------------------------- |
| A sin exclusión                        | KIWI, UVA, MANGO, PERA, LIMA, COCO |
| B exclusión                            | KIWI, UVA                          |
| C0 sin exclusión + leer `sub/dato.txt` | los 6 + PAPAYA                     |
| C exclusión + leer `sub/dato.txt`      | KIWI, UVA                          |

- `@imports` del `CLAUDE.md` del home funcionan: el global se conserva como import y el rol es otro
  archivo del home. No hace falta componer un archivo único ni romper el enlace al global.
- `claudeMdExcludes` por `--settings` en el exec saca raíz, `.claude/CLAUDE.md`, `CLAUDE.local.md`,
  `.claude/rules/` y subcarpetas cargadas tarde. Al ir por exec, el mismo lanzamiento en dos repos
  usa dos listas distintas sin tocar el home.
- Trampa del harness de medición: `--allowedTools` es variádico y se come el prompt; pasarlo por stdin.

Script: `run.sh` (lee el token del llavero sin imprimirlo, `secret-tool lookup service wyss-console
kind claude-oauth-token`).
