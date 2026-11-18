//! Launch configurations (ADR 0059): the owner's own files, one per launch, in
//! `$XDG_CONFIG_HOME/wyss-console/launch/*.toml`, read by the desktop and named by the window.
//!
//! A launch either opens a terminal in a folder and types its commands there, as if the owner
//! typed them, or starts a Native session with an agent and the permission it names, after
//! running its `before` commands. To start, the window names a file by its stem, and every
//! command comes from that file. The window writes commands in two places, both one line each
//! with no control character: a commands launch's distribution variants (`save_variants`, never
//! a session's `before`), and the distributors the owner adds (`distributors.rs`). The folder sits in the synchronized home, as
//! the shell's own start-up files do, so both computers get the same launches.
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{Read, Write};
use std::os::unix::fs::{DirBuilderExt, OpenOptionsExt};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

pub const MAX_FILES: usize = 64;
pub const MAX_FILE_BYTES: u64 = 64 * 1024;
pub const MAX_NAME: usize = 60;
pub const MAX_COMMANDS: usize = 16;
pub const MAX_BEFORE: usize = 8;
pub const MAX_COMMAND: usize = 4096;
/// How long one `before` command may run; past it, it is stopped and the start goes on.
pub const BEFORE_TIMEOUT: Duration = Duration::from_secs(30);

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Spec {
    name: String,
    #[serde(default)]
    directory: Option<String>,
    #[serde(default)]
    commands: Vec<String>,
    #[serde(default)]
    before: Vec<String>,
    #[serde(default)]
    session: Option<SessionSpec>,
    /// What builds the variants' scripts in the window (`system-update`); the desktop only keeps it.
    #[serde(default)]
    template: Option<String>,
    /// One variant per distribution, by its os-release `ID`.
    #[serde(default)]
    distro: std::collections::BTreeMap<String, VariantSpec>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
struct VariantSpec {
    #[serde(default)]
    commands: Vec<String>,
    #[serde(default)]
    options: Vec<String>,
    #[serde(default)]
    manual: bool,
}

/// One distribution's commands for a launch, with the options the window composed them from.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Variant {
    pub distro: String,
    pub commands: Vec<String>,
    #[serde(default)]
    pub options: Vec<String>,
    /// Written by hand: the options no longer make its commands.
    #[serde(default)]
    pub manual: bool,
}

/// The distribution this computer runs, from os-release.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Default)]
pub struct System {
    pub id: String,
    pub like: Vec<String>,
    pub name: String,
}

impl System {
    pub fn read(path: &Path) -> Self {
        let text = fs::read_to_string(path).unwrap_or_default();
        let mut out = System::default();
        for line in text.lines() {
            let Some((key, value)) = line.split_once('=') else {
                continue;
            };
            let value = value.trim().trim_matches('"').trim_matches('\'').to_owned();
            match key.trim() {
                "ID" => out.id = value.to_lowercase(),
                "ID_LIKE" => out.like = value.split_whitespace().map(str::to_lowercase).collect(),
                "PRETTY_NAME" => out.name = value,
                _ => {}
            }
        }
        out
    }

    /// The ids a variant may be saved under for this computer, the most specific first.
    fn chain(&self) -> Vec<&str> {
        std::iter::once(self.id.as_str())
            .chain(self.like.iter().map(String::as_str))
            .filter(|id| !id.is_empty())
            .collect()
    }
}

pub const MAX_VARIANTS: usize = 24;
pub const MAX_OPTIONS: usize = 16;

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct SessionSpec {
    agent: String,
    /// What the agent may do without asking: one of `PERMISSIONS`. Absent, it starts as it is
    /// configured.
    #[serde(default)]
    permission: Option<String>,
    /// Read only from a file written before profiles were removed, and only for the names of
    /// the templates that shipped; `permission` is what is written.
    #[serde(default)]
    profile: Option<String>,
    /// An Arsenal preset's name, for this agent's provider (ADR 0059 / arsenal-UI-SPEC).
    #[serde(default)]
    preset: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Kind {
    /// A new terminal in `directory` with these commands typed, each followed by Enter: the
    /// variant of this computer's distribution when there is one, else the file's own commands.
    Commands {
        commands: Vec<String>,
        variants: Vec<Variant>,
        /// The variant `commands` came from; it cannot be removed from here.
        active: Option<String>,
        template: Option<String>,
    },
    /// A Native session; `before` runs first, without a terminal.
    Session {
        agent: String,
        /// One of `PERMISSIONS`; none when the agent starts as it is configured.
        permission: Option<String>,
        before: Vec<String>,
        preset: Option<String>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Launch {
    /// The file's stem: what the window names.
    pub id: String,
    pub name: String,
    /// Absolute; the home folder when the file names none.
    pub directory: String,
    #[serde(flatten)]
    pub kind: Kind,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Refused {
    pub id: String,
    pub error: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct List {
    /// Where the files are, as the owner writes it (`~/…`).
    pub folder: String,
    pub launches: Vec<Launch>,
    pub refused: Vec<Refused>,
    pub system: System,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Outcome {
    pub command: String,
    /// `ok`, `exit <code>`, `signal`, `timeout` or `not_started`.
    pub result: String,
}

pub struct Places {
    pub folder: PathBuf,
    pub home: PathBuf,
    pub os_release: PathBuf,
}

impl Places {
    pub fn from_env() -> Option<Self> {
        let home = std::env::var_os("HOME")
            .map(PathBuf::from)
            .filter(|h| h.is_absolute())?;
        let config = std::env::var_os("XDG_CONFIG_HOME")
            .map(PathBuf::from)
            .filter(|p| p.is_absolute())
            .unwrap_or_else(|| home.join(".config"));
        Some(Self {
            folder: config.join("wyss-console/launch"),
            home,
            os_release: PathBuf::from("/etc/os-release"),
        })
    }

    pub fn system(&self) -> System {
        System::read(&self.os_release)
    }
}

/// The launches that ship, written once when the folder does not exist yet. The owner edits or
/// deletes them; a folder that exists is never written again.
pub const DEFAULTS: [(&str, &str); 3] = [
    ("actualizar-sistema.toml", SYSTEM_UPDATE),
    (
        "claude-code.toml",
        r#"# Starts Claude Code as a Native session with the permission named here:
# "ask", "read_only", "edits" (Claude Code only) or "bypass"; without it, as it is configured.
# `before` runs first in /bin/sh, without a terminal; a failure is reported and the start goes on.
name = "Claude Code"
directory = "~"
before = [
  "STKEY=$(grep -oP '(?<=<apikey>)[^<]+' ~/.local/state/syncthing/config.xml) && curl -s -X POST -H \"X-API-Key: $STKEY\" 'http://127.0.0.1:8384/rest/db/scan?folder=home-saintwyss' && curl -s -X POST -H \"X-API-Key: $STKEY\" 'http://127.0.0.1:8384/rest/db/scan?folder=mnt-hdd-data'",
]

[session]
agent = "claude_code"
permission = "bypass"
"#,
    ),
    (
        "codex.toml",
        r#"# Starts Codex as a Native session with the permission named here:
# "ask", "read_only" or "bypass"; without it, as it is configured.
# `before` runs first in /bin/sh, without a terminal; a failure is reported and the start goes on.
name = "Codex"
directory = "~"
before = [
  "STKEY=$(grep -oP '(?<=<apikey>)[^<]+' ~/.local/state/syncthing/config.xml) && curl -s -X POST -H \"X-API-Key: $STKEY\" 'http://127.0.0.1:8384/rest/db/scan?folder=home-saintwyss' && curl -s -X POST -H \"X-API-Key: $STKEY\" 'http://127.0.0.1:8384/rest/db/scan?folder=mnt-hdd-data'",
]

[session]
agent = "codex"
permission = "bypass"
"#,
    ),
];

/// The shipped system update: one variant per distribution, edited in Workspace.
pub const SYSTEM_UPDATE: &str = r#"# Opens a new terminal in `directory` and types the commands of this computer's distribution.
# Each [distro.<os-release ID>] is edited in Workspace; `options` are the switches it was built from.
name = "Actualizar sistema"
directory = "~"
template = "system-update"

[distro.cachyos]
options = ["aur"]
commands = ["sudo pacman -Syu", "paru -Sua"]

[distro.arch]
commands = ["sudo pacman -Syu"]

[distro.debian]
commands = ["sudo apt update", "sudo apt full-upgrade"]

[distro.fedora]
commands = ["sudo dnf upgrade --refresh"]

[distro.opensuse]
commands = ["sudo zypper refresh", "sudo zypper dup"]
"#;

pub(crate) fn text_ok(text: &str, most: usize) -> bool {
    !text.trim().is_empty() && text.chars().count() <= most && !text.chars().any(char::is_control)
}

/// A command is one line: no control character (a newline or an escape would type more than
/// the file says).
pub(crate) fn command_ok(command: &str) -> bool {
    text_ok(command, MAX_COMMAND)
}

pub(crate) fn id_ok(id: &str) -> bool {
    (1..=64).contains(&id.len())
        && id
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || matches!(b, b'-' | b'_'))
}

pub(crate) fn display(path: &Path, home: &Path) -> String {
    match path.strip_prefix(home) {
        Ok(rest) => format!("~/{}", rest.display()),
        Err(_) => path.display().to_string(),
    }
}

fn directory(spec: Option<&str>, home: &Path) -> Result<PathBuf, &'static str> {
    let path = match spec {
        None | Some("~") => home.to_path_buf(),
        Some(text) if text.starts_with("~/") => home.join(&text[2..]),
        Some(text) if Path::new(text).is_absolute() => PathBuf::from(text),
        Some(_) => return Err("directory must be ~, ~/… or an absolute path"),
    };
    let path = fs::canonicalize(&path).map_err(|_| "directory not found")?;
    if !path.is_dir() {
        return Err("directory is not a folder");
    }
    Ok(path)
}

fn commands_ok(commands: &[String]) -> Result<(), String> {
    if commands.len() > MAX_COMMANDS || !commands.iter().all(|c| command_ok(c)) {
        return Err(format!(
            "at most {MAX_COMMANDS} commands, each one line of at most {MAX_COMMAND} characters"
        ));
    }
    Ok(())
}

/// What a session may do without asking, as a launch file names it. `edits` is Claude Code's.
pub const PERMISSIONS: [&str; 4] = ["ask", "read_only", "edits", "bypass"];

/// The permission of a session launch. `profile` is the key a file written before profiles
/// were removed carries: the templates that shipped are read as the permission each one was,
/// and any other name is refused with what to write instead. The file is never rewritten here.
fn session_permission(
    agent: &str,
    permission: Option<&str>,
    profile: Option<&str>,
) -> Result<Option<String>, String> {
    let permission = match (permission, profile) {
        (Some(_), Some(_)) => {
            return Err(
                "a session names permission or profile, not both: profiles were removed, keep permission"
                    .into(),
            );
        }
        (Some(word), None) => {
            if !PERMISSIONS.contains(&word) {
                return Err(
                    "permission must be \"ask\", \"read_only\", \"edits\" or \"bypass\"".into(),
                );
            }
            Some(word)
        }
        (None, Some("Full access (bypass)")) => Some("bypass"),
        (None, Some("Review, read only")) => Some("read_only"),
        (None, Some("Strict")) => Some("ask"),
        (None, Some("As configured")) | (None, None) => None,
        (None, Some(_)) => {
            return Err(
                "profiles were removed: set permission = \"ask\", \"read_only\", \"edits\" or \"bypass\" in this launch, or remove the profile line to start as configured"
                    .into(),
            );
        }
    };
    if permission == Some("edits") && agent != "claude_code" {
        return Err("permission = \"edits\" is only for claude_code".into());
    }
    Ok(permission.map(str::to_owned))
}

fn variants_of(
    distro: std::collections::BTreeMap<String, VariantSpec>,
) -> Result<Vec<Variant>, String> {
    if distro.len() > MAX_VARIANTS {
        return Err(format!("at most {MAX_VARIANTS} distributions"));
    }
    distro
        .into_iter()
        .map(|(id, v)| {
            if !id_ok(&id) {
                return Err(format!(
                    "distro.{id}: an os-release ID is lowercase letters, digits, - or _"
                ));
            }
            if v.commands.is_empty() {
                return Err(format!("distro.{id} needs at least one command"));
            }
            commands_ok(&v.commands).map_err(|e| format!("distro.{id}: {e}"))?;
            if v.options.len() > MAX_OPTIONS || !v.options.iter().all(|o| id_ok(o)) {
                return Err(format!("distro.{id}: options are short lowercase names"));
            }
            Ok(Variant {
                distro: id,
                commands: v.commands,
                options: v.options,
                manual: v.manual,
            })
        })
        .collect()
}

fn parse(id: &str, text: &str, home: &Path, system: &System) -> Result<Launch, String> {
    let spec: Spec = toml::from_str(text).map_err(|e| {
        let message = e.message().to_owned();
        format!("not a launch file: {message}")
    })?;
    if !text_ok(&spec.name, MAX_NAME) {
        return Err(format!("name must be 1–{MAX_NAME} characters on one line"));
    }
    let folder = directory(spec.directory.as_deref(), home)?;
    let runs = !spec.commands.is_empty() || !spec.distro.is_empty();
    if spec.session.is_some() && (!spec.distro.is_empty() || spec.template.is_some()) {
        return Err("distro and template belong to a commands launch".into());
    }
    if spec.template.as_deref().is_some_and(|t| !id_ok(t)) {
        return Err("template must be a short lowercase name".into());
    }
    let kind = match (spec.session, runs) {
        (Some(_), true) => return Err("a launch has commands or a session, not both".into()),
        (None, false) => return Err("a launch needs commands or a session".into()),
        (None, true) => {
            if !spec.before.is_empty() {
                return Err(
                    "before belongs to a session; put the commands in order instead".into(),
                );
            }
            commands_ok(&spec.commands)?;
            let variants = variants_of(spec.distro)?;
            let matched = system
                .chain()
                .into_iter()
                .find_map(|id| variants.iter().find(|v| v.distro == id));
            Kind::Commands {
                commands: matched.map(|v| v.commands.clone()).unwrap_or(spec.commands),
                active: matched.map(|v| v.distro.clone()),
                variants,
                template: spec.template,
            }
        }
        (Some(session), false) => {
            if !matches!(session.agent.as_str(), "claude_code" | "codex") {
                return Err("session agent must be claude_code or codex".into());
            }
            let permission = session_permission(
                &session.agent,
                session.permission.as_deref(),
                session.profile.as_deref(),
            )?;
            if spec.before.len() > MAX_BEFORE || !spec.before.iter().all(|c| command_ok(c)) {
                return Err(format!(
                    "at most {MAX_BEFORE} before commands, each one line of at most {MAX_COMMAND} characters"
                ));
            }
            if session
                .preset
                .as_deref()
                .is_some_and(|p| !text_ok(p, MAX_NAME))
            {
                return Err(format!(
                    "preset must be a preset's name, 1–{MAX_NAME} characters on one line"
                ));
            }
            Kind::Session {
                agent: session.agent,
                permission,
                before: spec.before,
                preset: session.preset,
            }
        }
    };
    Ok(Launch {
        id: id.to_owned(),
        name: spec.name.trim().to_owned(),
        directory: folder.to_string_lossy().into_owned(),
        kind,
    })
}

/// Writes the shipped launches when the folder does not exist yet.
fn seed(folder: &Path) -> std::io::Result<()> {
    if fs::symlink_metadata(folder).is_ok() {
        return Ok(());
    }
    fs::DirBuilder::new()
        .recursive(true)
        .mode(0o700)
        .create(folder)?;
    for (name, text) in DEFAULTS {
        let mut file = fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .mode(0o600)
            .open(folder.join(name))?;
        file.write_all(text.as_bytes())?;
    }
    Ok(())
}

pub(crate) fn read_one(path: &Path) -> Result<String, String> {
    let meta = fs::symlink_metadata(path).map_err(|_| "unreadable".to_owned())?;
    if !meta.is_file() {
        return Err("not a plain file".into());
    }
    let mut bytes = Vec::new();
    fs::File::open(path)
        .and_then(|f| f.take(MAX_FILE_BYTES + 1).read_to_end(&mut bytes))
        .map_err(|_| "unreadable".to_owned())?;
    if bytes.len() as u64 > MAX_FILE_BYTES {
        return Err(format!("larger than {} KiB", MAX_FILE_BYTES / 1024));
    }
    String::from_utf8(bytes).map_err(|_| "not UTF-8".to_owned())
}

/// The system update as it shipped before it had variants. A file still byte-identical to it was
/// never edited, and is replaced by the one with variants.
pub const SYSTEM_UPDATE_BEFORE: &str = r#"# Opens a new terminal in `directory` and types each command, followed by Enter.
name = "Actualizar sistema"
directory = "~"
commands = ["sysupdate"]
"#;

fn upgrade(folder: &Path) {
    let target = folder.join("actualizar-sistema.toml");
    if read_one(&target).is_ok_and(|text| text == SYSTEM_UPDATE_BEFORE) {
        let _ = write_private(folder, &target, SYSTEM_UPDATE);
    }
}

pub fn list(places: &Places) -> Result<List, String> {
    seed(&places.folder).map_err(|e| format!("launch folder: {e}"))?;
    upgrade(&places.folder);
    let system = places.system();
    let mut entries: Vec<(String, PathBuf)> = Vec::new();
    for entry in fs::read_dir(&places.folder).map_err(|e| format!("launch folder: {e}"))? {
        let Ok(entry) = entry else { continue };
        let name = entry.file_name().to_string_lossy().into_owned();
        if let Some(stem) = name.strip_suffix(".toml") {
            entries.push((stem.to_owned(), entry.path()));
        }
    }
    entries.sort();
    let mut launches = Vec::new();
    let mut refused = Vec::new();
    for (count, (id, path)) in entries.into_iter().enumerate() {
        if count >= MAX_FILES {
            refused.push(Refused {
                id,
                error: format!("only the first {MAX_FILES} files are read"),
            });
            continue;
        }
        if !id_ok(&id) {
            refused.push(Refused {
                id,
                error: "file name must be lowercase letters, digits, - or _".into(),
            });
            continue;
        }
        match read_one(&path).and_then(|text| parse(&id, &text, &places.home, &system)) {
            Ok(launch) => launches.push(launch),
            Err(error) => refused.push(Refused { id, error }),
        }
    }
    launches.sort_by_key(|launch| launch.name.to_lowercase());
    Ok(List {
        folder: display(&places.folder, &places.home),
        launches,
        refused,
        system,
    })
}

/// One launch by its id, read again from its file: the window's copy is never trusted.
pub fn get(places: &Places, id: &str) -> Result<Launch, String> {
    if !id_ok(id) {
        return Err("unknown launch".into());
    }
    let text = read_one(&places.folder.join(format!("{id}.toml")))?;
    parse(id, &text, &places.home, &places.system())
}

/// What the window sends to replace a commands launch's distributions. The name, the folder,
/// the template and the file's own commands stay as the file says.
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct VariantsRequest {
    id: String,
    variants: Vec<Variant>,
}

/// Rewrites a commands launch with these distributions. The variant this computer runs cannot
/// be removed: the launch always keeps what this computer starts. The file is read back.
pub fn save_variants(places: &Places, request: &VariantsRequest) -> Result<Launch, String> {
    let launch = get(places, &request.id)?;
    let Kind::Commands {
        active, template, ..
    } = &launch.kind
    else {
        return Err("only a commands launch has distributions".into());
    };
    let text = read_one(&places.folder.join(format!("{}.toml", request.id)))?;
    let spec: Spec = toml::from_str(&text).map_err(|_| "not a launch file".to_owned())?;
    if let Some(active) = active
        && !request.variants.iter().any(|v| &v.distro == active)
    {
        return Err(format!(
            "distro.{active} is this computer's distribution and stays"
        ));
    }
    // Bounded before anything is built from it: the window's request is never trusted.
    if request.variants.len() > MAX_VARIANTS {
        return Err(format!("at most {MAX_VARIANTS} distributions"));
    }
    for v in &request.variants {
        commands_ok(&v.commands)?;
        if v.options.len() > MAX_OPTIONS || !v.options.iter().all(|o| id_ok(o)) {
            return Err("options are short lowercase names".into());
        }
    }
    let mut seen = std::collections::BTreeSet::new();
    if !request
        .variants
        .iter()
        .all(|v| seen.insert(v.distro.as_str()))
    {
        return Err("each distribution once".into());
    }
    if request.variants.is_empty() && spec.commands.is_empty() {
        return Err("a launch needs commands or at least one distribution".into());
    }
    let list = |items: &[String]| {
        format!(
            "[{}]",
            items
                .iter()
                .map(|c| toml_string(c))
                .collect::<Vec<_>>()
                .join(", ")
        )
    };
    let mut out = format!(
        "# Edited in Workspace (Wyss Console). Each [distro.<os-release ID>] runs on that distribution.\nname = {}\ndirectory = {}\n",
        toml_string(&spec.name),
        toml_string(spec.directory.as_deref().unwrap_or("~")),
    );
    if let Some(t) = template {
        out.push_str(&format!("template = {}\n", toml_string(t)));
    }
    if !spec.commands.is_empty() {
        out.push_str(&format!("commands = {}\n", list(&spec.commands)));
    }
    for v in &request.variants {
        if !id_ok(&v.distro) {
            return Err(
                "a distribution is its os-release ID: lowercase letters, digits, - or _".into(),
            );
        }
        out.push_str(&format!("\n[distro.{}]\n", v.distro));
        if !v.options.is_empty() {
            out.push_str(&format!("options = {}\n", list(&v.options)));
        }
        if v.manual {
            out.push_str("manual = true\n");
        }
        out.push_str(&format!("commands = {}\n", list(&v.commands)));
    }
    if out.len() as u64 > MAX_FILE_BYTES {
        return Err(format!("larger than {} KiB", MAX_FILE_BYTES / 1024));
    }
    // Checked as the reader takes it before anything is written.
    parse(&request.id, &out, &places.home, &places.system())?;
    let target = places.folder.join(format!("{}.toml", request.id));
    write_private(&places.folder, &target, &out)
        .map_err(|e| format!("the launch could not be written: {e}"))?;
    get(places, &request.id)
}

/// Runs a session launch's `before` commands in order, in its folder, each in `/bin/sh -c`
/// with no input and its output discarded, bounded in time. Every one runs, whatever the
/// previous one did; what each did is returned.
pub fn run_before(launch: &Launch, timeout: Duration) -> Vec<Outcome> {
    let Kind::Session { before, .. } = &launch.kind else {
        return Vec::new();
    };
    before
        .iter()
        .map(|command| Outcome {
            command: command.clone(),
            result: run_one(command, Path::new(&launch.directory), timeout),
        })
        .collect()
}

fn run_one(command: &str, folder: &Path, timeout: Duration) -> String {
    let mut process = Command::new("/bin/sh");
    process
        .arg("-c")
        .arg(command)
        .current_dir(folder)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    for name in crate::native::service::SESSION_MARKERS {
        process.env_remove(name);
    }
    // Its own process group, so that a timeout stops what it started too.
    std::os::unix::process::CommandExt::process_group(&mut process, 0);
    let Ok(mut child) = process.spawn() else {
        return "not_started".into();
    };
    let started = Instant::now();
    let group = nix::unistd::Pid::from_raw(-(child.id() as i32));
    // Whatever the command left running in its group is stopped with it: a `before` line never
    // outlives its own run, whether it ends or times out.
    let stop = || {
        let _ = nix::sys::signal::kill(group, nix::sys::signal::Signal::SIGKILL);
    };
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                stop();
                return match status.code() {
                    Some(0) => "ok".into(),
                    Some(code) => format!("exit {code}"),
                    None => "signal".into(),
                };
            }
            Ok(None) if started.elapsed() < timeout => {
                std::thread::sleep(Duration::from_millis(50));
            }
            _ => {
                stop();
                let _ = child.wait();
                return "timeout".into();
            }
        }
    }
}

// ---------------------------------------------------------------------------------------------
// Saving and deleting a launch from Workspace (arsenal-UI-SPEC, phase D)

/// What the desktop holds that a launch file names, by agent: its presets (Arsenal selections,
/// by name, for that agent's provider).
pub trait Known {
    fn presets(&self, agent: &str) -> Result<Vec<String>, String>;
}

/// What the window sends to save a launch. There is no field for a command or a `before` line:
/// the file the window writes is always a session launch, or one that types nothing.
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SaveRequest {
    name: String,
    directory: String,
    agent: String,
    #[serde(default)]
    permission: Option<String>,
    #[serde(default)]
    preset: Option<String>,
    #[serde(default)]
    replace: bool,
}

#[derive(Debug, PartialEq, Eq)]
pub enum SaveRefusal {
    /// A launch with that name is already saved, and the window did not ask to replace it.
    Exists,
    Invalid(String),
}

/// The file name a launch's name gives: lowercase ASCII letters, digits and single dashes, at
/// most 40 characters, Latin accents folded. Empty when the name has none of those.
pub fn slug(name: &str) -> String {
    let mut out = String::new();
    for c in name.chars().flat_map(char::to_lowercase) {
        let mapped = match c {
            'á' | 'à' | 'ä' | 'â' => 'a',
            'é' | 'è' | 'ë' | 'ê' => 'e',
            'í' | 'ì' | 'ï' | 'î' => 'i',
            'ó' | 'ò' | 'ö' | 'ô' => 'o',
            'ú' | 'ù' | 'ü' | 'û' => 'u',
            'ñ' => 'n',
            c if c.is_ascii_lowercase() || c.is_ascii_digit() => c,
            _ => '-',
        };
        if mapped == '-' {
            if !out.is_empty() && !out.ends_with('-') {
                out.push('-');
            }
        } else {
            out.push(mapped);
        }
    }
    out.truncate(40);
    while out.ends_with('-') {
        out.pop();
    }
    out
}

/// A TOML basic string: quoted, with the characters that must be escaped written escaped.
pub(crate) fn toml_string(text: &str) -> String {
    let mut out = String::with_capacity(text.len() + 2);
    out.push('"');
    for c in text.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            c if c.is_control() => out.push_str(&format!("\\u{:04X}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// Writes `text` to `target` through a private temporary file and a rename, so a reader sees
/// the old file or the new one, never a part of either. The temporary name does not end in
/// `.toml`, so `list` never reads it.
pub(crate) fn write_private(folder: &Path, target: &Path, text: &str) -> std::io::Result<()> {
    let name = target.file_name().unwrap_or_default().to_string_lossy();
    let temporary = folder.join(format!(".{name}.{}.tmp", std::process::id()));
    let result = write_then_rename(&temporary, target, text);
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result
}

fn write_then_rename(temporary: &Path, target: &Path, text: &str) -> std::io::Result<()> {
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .mode(0o600)
        .open(temporary)?;
    file.write_all(text.as_bytes())?;
    file.sync_all()?;
    fs::rename(temporary, target)
}

/// Saves a session launch: the agent, the folder, the permission and the preset, written as the
/// file the reader already takes. Everything is checked again here, against what the desktop
/// holds, and the file is read back before the answer goes out.
pub fn save(
    places: &Places,
    request: &SaveRequest,
    known: &dyn Known,
) -> Result<Launch, SaveRefusal> {
    let invalid = |why: String| SaveRefusal::Invalid(why);
    if !text_ok(&request.name, MAX_NAME) {
        return Err(invalid(format!(
            "name must be 1–{MAX_NAME} characters on one line"
        )));
    }
    let agent = request.agent.as_str();
    if !matches!(agent, "claude_code" | "codex") {
        return Err(invalid("agent must be claude_code or codex".into()));
    }
    let id = slug(&request.name);
    if id.is_empty() {
        return Err(invalid("name needs at least one letter or digit".into()));
    }
    let folder =
        directory(Some(&request.directory), &places.home).map_err(|why| invalid(why.to_owned()))?;
    let permission =
        session_permission(agent, request.permission.as_deref(), None).map_err(invalid)?;
    if let Some(preset) = request.preset.as_deref() {
        if !text_ok(preset, MAX_NAME) {
            return Err(invalid("preset must be a preset's name".into()));
        }
        let names = known.presets(agent).map_err(invalid)?;
        if !names.iter().any(|n| n == preset) {
            return Err(invalid(format!(
                "no preset named “{preset}” for this agent"
            )));
        }
    }
    seed(&places.folder).map_err(|e| invalid(format!("launch folder: {e}")))?;
    let target = places.folder.join(format!("{id}.toml"));
    if let Ok(meta) = fs::symlink_metadata(&target) {
        if !meta.is_file() {
            return Err(invalid(
                "a launch with that file name is not a plain file".into(),
            ));
        }
        if !request.replace {
            return Err(SaveRefusal::Exists);
        }
    }
    let shown = if folder == places.home {
        "~".to_owned()
    } else {
        display(&folder, &places.home)
    };
    let mut text = format!(
        "# Saved from Workspace (Wyss Console).\nname = {}\ndirectory = {}\n\n[session]\nagent = {}\n",
        toml_string(request.name.trim()),
        toml_string(&shown),
        toml_string(agent),
    );
    if let Some(permission) = &permission {
        text.push_str(&format!("permission = {}\n", toml_string(permission)));
    }
    if let Some(preset) = &request.preset {
        text.push_str(&format!("preset = {}\n", toml_string(preset)));
    }
    parse(&id, &text, &places.home, &places.system()).map_err(invalid)?;
    write_private(&places.folder, &target, &text)
        .map_err(|e| invalid(format!("the launch could not be written: {e}")))?;
    get(places, &id).map_err(invalid)
}

/// Deletes a launch the window saved: one with no `before` line and no commands. The owner's
/// own files, and the shipped ones with a `before` line, are edited by hand and never deleted here.
pub fn delete(places: &Places, id: &str) -> Result<(), String> {
    let launch = get(places, id)?;
    let saved = matches!(&launch.kind, Kind::Session { before, .. } if before.is_empty());
    if !saved {
        return Err(
            "only a launch saved from Workspace can be deleted here; edit the others in their file"
                .into(),
        );
    }
    fs::remove_file(places.folder.join(format!("{id}.toml")))
        .map_err(|_| "the launch could not be deleted".to_owned())
}

#[cfg(feature = "desktop")]
pub mod commands;

#[cfg(test)]
#[path = "launch_tests.rs"]
mod tests;
