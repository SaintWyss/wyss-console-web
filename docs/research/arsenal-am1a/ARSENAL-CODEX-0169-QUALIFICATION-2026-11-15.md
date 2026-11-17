# Arsenal: per-session skill switch qualification, Codex CLI 0.169.0 (2026-11-15)

Build: `codex-cli 0.169.0` (standalone package `0.169.0-x86_64-unknown-linux-musl`), real account
configuration. Evidence (probe outputs, scratch homes) stayed outside the repository.

Same mechanism as [0.159.0](ARSENAL-CODEX-0159-QUALIFICATION-2026-10-31.md):
`codex --no-daemon -c 'skills.config=[{path = "<…/SKILL.md>", enabled = false}, …]'`. This record
re-measures only what the 0.159.0 probes that need no model call showed, in the real configuration
and inside a launch home (a `CODEX_HOME` that links the owner's `rules`, `skills`, `plugins`,
`memories`, `agents`, `prompts`, `hooks`, `AGENTS.md`, `sessions` and `auth.json`).

## Probes (`codex debug prompt-input`, no inference)

| #   | Probe                                                           | Real `~/.codex`         | Launch home             |
| --- | --------------------------------------------------------------- | ----------------------- | ----------------------- |
| P1  | No override                                                     | 110 skills listed       | 111 listed (same set)   |
| P2  | `SKILL.md` path of `frontend-design`, `enabled = false`         | leaves the list         | leaves the list         |
| P3  | `SKILL.md` paths of `frontend-design` and `gsap-react`          | both leave, others stay | both leave, others stay |
| P4  | The skill **folder** path                                       | ignored, skill stays    | ignored, skill stays    |
| P5  | `codex --help`                                                  | `--no-daemon` present   | n/a                     |
| P6  | `~/.codex/auth.json` size and mtime before and after all probes | unchanged               | unchanged               |

A home without the `skills` link lists 109 skills against 110: the account's skills come from
`~/.agents/skills` and Codex's own system skills, so the link carries only what lives in
`~/.codex/skills`.

## Not re-measured on this build

- Two simultaneous interactive terminals and no connection to the shared daemon sockets
  (0.159.0 cases 12 and 13). `--no-daemon` is still offered; the concurrency behaviour is not
  observed again here.
- Plugin and system skills are not switched off; provider use of each skill is not observed.
- Hook trust through a launch home is covered by the H4.4 end-to-end run, not by this record.
