//! How an agent is started through the user's shell (AD-09, DN-02, OQ-07).
//!
//! The chosen way: start the user's interactive shell with a command that *replaces* it by the
//! agent (`exec`). The shell reads its start-up files, so the agent gets the environment the
//! user gets when typing the command; and the process the terminal owns becomes the agent, so
//! it is observed as what it is. The arguments travel as separate words after the command text
//! and are never parsed: no word is ever put inside text a shell reads.
//!
//! A shell without a recipe falls back to starting the agent directly, and the session says
//! that the environment is then the Console's own.
use std::path::{Path, PathBuf};

/// The shells with a recipe.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Family {
    /// `sh`, `dash`, `ash`: POSIX.
    Posix,
    Bash,
    Zsh,
    Fish,
}

pub fn family(shell: &Path) -> Option<Family> {
    match shell.file_name()?.to_str()? {
        "sh" | "dash" | "ash" => Some(Family::Posix),
        "bash" => Some(Family::Bash),
        "zsh" => Some(Family::Zsh),
        "fish" => Some(Family::Fish),
        _ => None,
    }
}

/// What the terminal runs: the program, its arguments, and whether the user's shell sits
/// between (so the environment is the user's).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Recipe {
    pub program: PathBuf,
    pub args: Vec<String>,
    pub through_shell: bool,
}

/// `words` is the agent's executable name followed by its arguments. `direct` is the agent's
/// absolute path, used only when the shell has no recipe.
pub fn recipe(shell: &Path, words: &[String], direct: &Path) -> Recipe {
    let strings = |parts: &[&str]| parts.iter().map(|p| (*p).to_owned()).collect::<Vec<_>>();
    let mut args = match family(shell) {
        // `$0` is the label after the text; the words are `$@`.
        Some(Family::Posix | Family::Bash | Family::Zsh) => {
            strings(&["-i", "-c", "exec \"$@\"", "wyss-launch"])
        }
        // fish hands the words after the command to it as `$argv`. `--` keeps a word that
        // looks like an option (`--model`) from being read as fish's own.
        Some(Family::Fish) => strings(&["-i", "-c", "exec $argv", "--"]),
        None => {
            return Recipe {
                program: direct.to_owned(),
                args: words.iter().skip(1).cloned().collect(),
                through_shell: false,
            };
        }
    };
    args.extend(words.iter().cloned());
    Recipe {
        program: shell.to_owned(),
        args,
        through_shell: true,
    }
}

/// Where the pinned variable is set from: an absolute path, so a start-up file that changes
/// `PATH`, or defines a function or an alias named `env`, does not choose what runs.
const ENV: &str = "/usr/bin/env";

const POSIX_GUARD: &str = "resolved=$(command -v \"$1\") || { printf '%s\\n' 'Wyss: provider command could not be resolved; no agent was started.' >&2; exit 127; }; actual=$(\"$resolved\" --version 2>/dev/null) || { printf '%s\\n' 'Wyss: provider version could not be checked; no agent was started.' >&2; exit 125; }; if [ \"$actual\" != \"$2\" ]; then printf '%s\\n' 'Wyss: provider build changed after preview; no profile was applied and no agent was started.' >&2; exit 125; fi; if [ -z \"${WYSS_NATIVE_VERSION_GUARD:-}\" ] || ! printf 'ok\\n' > \"$WYSS_NATIVE_VERSION_GUARD\"; then printf '%s\\n' 'Wyss: provider start could not be verified; no agent was started.' >&2; exit 125; fi; unset WYSS_NATIVE_VERSION_GUARD; ";
const POSIX_EXEC: &str = "shift 2; exec \"$resolved\" \"$@\"";
const POSIX_EXEC_PINNED: &str = "pin=$3; shift 3; exec /usr/bin/env \"$pin\" \"$resolved\" \"$@\"";
const FISH_GUARD: &str = "set -l resolved (command -s -- \"$argv[1]\"); if test -z \"$resolved\"; printf '%s\\n' 'Wyss: provider command could not be resolved; no agent was started.' >&2; exit 127; end; set -l actual (\"$resolved\" --version 2>/dev/null); if test (count $actual) -ne 1; printf '%s\\n' 'Wyss: provider version could not be checked; no agent was started.' >&2; exit 125; end; if test \"$actual\" != \"$argv[2]\"; printf '%s\\n' 'Wyss: provider build changed after preview; no profile was applied and no agent was started.' >&2; exit 125; end; if not set -q WYSS_NATIVE_VERSION_GUARD; or test -z \"$WYSS_NATIVE_VERSION_GUARD\"; printf '%s\\n' 'Wyss: provider start could not be verified; no agent was started.' >&2; exit 125; end; printf 'ok\\n' > \"$WYSS_NATIVE_VERSION_GUARD\"; or begin; printf '%s\\n' 'Wyss: provider start could not be verified; no agent was started.' >&2; exit 125; end; set -e WYSS_NATIVE_VERSION_GUARD; ";
const FISH_EXEC: &str = "set -e argv[1]; set -e argv[1]; exec \"$resolved\" $argv";
const FISH_EXEC_PINNED: &str = "set -l pin $argv[3]; set -e argv[1]; set -e argv[1]; set -e argv[1]; exec /usr/bin/env $pin \"$resolved\" $argv";

/// A profile's provider flags are checked against the build that the window discovered. A
/// shell may change PATH in its startup files, so a profile launch checks the shell-resolved
/// binary with its supported `--version` interface and execs that same resolved path. Values
/// remain argv words; none of the provider or profile data becomes shell command text.
#[cfg(test)]
pub fn recipe_with_version_guard(
    shell: &Path,
    words: &[String],
    direct: &Path,
    expected_version: Option<&str>,
) -> Recipe {
    recipe_pinned(shell, words, direct, expected_version, None)
}

/// [`recipe_with_version_guard`], with one variable the agent must start with whatever the
/// shell's start-up files say: the configuration folder of a launch home (`CODEX_HOME`,
/// `CLAUDE_CONFIG_DIR`). A start-up file that exports the same name would otherwise replace it,
/// and the agent would run with the owner's own folder: with the hooks the launch left out.
///
/// The variable is set after the start-up files ran, in the very `exec` that becomes the agent
/// (`exec /usr/bin/env NAME=value agent …`). `NAME=value` travels as one argv word and is never
/// shell text. Started directly (a shell without a recipe) there is no start-up file between:
/// the caller's process environment is the agent's, so `pin` adds nothing there.
///
/// `pin` is never a secret: argv is readable by other processes of the user.
pub fn recipe_pinned(
    shell: &Path,
    words: &[String],
    direct: &Path,
    expected_version: Option<&str>,
    pin: Option<(&str, &str)>,
) -> Recipe {
    let pin = pin.map(|(name, value)| format!("{name}={value}"));
    let Some(family) = family(shell) else {
        // The service checks the known absolute path immediately before this direct launch.
        return recipe(shell, words, direct);
    };
    let Some(expected_version) = expected_version else {
        let Some(pin) = pin else {
            return recipe(shell, words, direct);
        };
        let mut pinned = vec![ENV.to_owned(), pin];
        pinned.extend(words.iter().cloned());
        return recipe(shell, &pinned, direct);
    };
    let (guard, exec, label) = match (family, pin.is_some()) {
        (Family::Posix | Family::Bash | Family::Zsh, false) => {
            (POSIX_GUARD, POSIX_EXEC, "wyss-checked-launch")
        }
        (Family::Posix | Family::Bash | Family::Zsh, true) => {
            (POSIX_GUARD, POSIX_EXEC_PINNED, "wyss-checked-launch")
        }
        (Family::Fish, false) => (FISH_GUARD, FISH_EXEC, "--"),
        (Family::Fish, true) => (FISH_GUARD, FISH_EXEC_PINNED, "--"),
    };
    let mut args = vec![
        "-i".to_owned(),
        "-c".to_owned(),
        format!("{guard}{exec}"),
        label.to_owned(),
    ];
    args.push(words[0].clone());
    args.push(expected_version.to_owned());
    args.extend(pin);
    args.extend(words.iter().skip(1).cloned());
    Recipe {
        program: shell.to_owned(),
        args,
        through_shell: true,
    }
}
