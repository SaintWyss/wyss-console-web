//! Distributors the owner adds: a tool the Console does not know, by its name and the commands
//! that open and update it, one file each in `$XDG_CONFIG_HOME/wyss-console/distributors/*.toml`.
//!
//! The Console never runs one on its own: "installed" means its executable's name is found where
//! the agents are looked for, and nothing is started to learn a version. Opening and updating
//! type the file's own commands in a new terminal, where they are seen; the window names the
//! file by its id, and the commands are read again from it. The window writes these files: one
//! line per command, no control character, the file re-parsed before it is written.
use crate::host::protocol::HostError;
use crate::launch::{command_ok, display, id_ok, read_one, text_ok, toml_string, write_private};
use serde::{Deserialize, Serialize};
use std::fs;
use std::os::unix::fs::DirBuilderExt;
use std::path::{Path, PathBuf};

pub const MAX_FILES: usize = 32;
pub const MAX_TEXT: usize = 60;
pub const MAX_NOTE: usize = 280;

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Spec {
    name: String,
    #[serde(default)]
    maker: Option<String>,
    open: String,
    #[serde(default)]
    update: Option<String>,
    #[serde(default)]
    note: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Distributor {
    pub id: String,
    pub name: String,
    pub maker: Option<String>,
    /// Typed in a new terminal to open the tool.
    pub open: String,
    pub update: Option<String>,
    pub note: Option<String>,
    /// The name looked for: the first word of `open`.
    pub executable: String,
    /// Where it was found, as the owner writes it; `None` when it was not.
    pub found: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Refused {
    pub id: String,
    pub error: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct List {
    pub folder: String,
    pub distributors: Vec<Distributor>,
    pub refused: Vec<Refused>,
    /// Where Open and Update start: the home folder, absolute.
    pub home: String,
}

pub struct Places {
    pub folder: PathBuf,
    pub launches: PathBuf,
    pub home: PathBuf,
    pub path_var: Option<std::ffi::OsString>,
}

impl Places {
    pub fn from_env() -> Option<Self> {
        let launch = crate::launch::Places::from_env()?;
        Some(Self {
            folder: launch.folder.parent()?.join("distributors"),
            launches: launch.folder,
            home: launch.home,
            path_var: std::env::var_os("PATH"),
        })
    }
}

/// The executable an open command names: its first word, a bare name (looked for as the agents
/// are) or an absolute path.
fn executable_of(open: &str) -> Result<String, String> {
    let first = open.split_whitespace().next().unwrap_or_default();
    let bare = !first.is_empty()
        && first
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.'));
    if bare || (first.starts_with('/') && !first.contains("/../")) {
        Ok(first.to_owned())
    } else {
        Err("open must start with the tool's command name (like kimi) or its absolute path".into())
    }
}

fn found(executable: &str, places: &Places) -> Option<String> {
    let path = if executable.starts_with('/') {
        let p = Path::new(executable);
        p.metadata()
            .ok()
            .filter(|m| {
                use std::os::unix::fs::PermissionsExt;
                m.is_file() && m.permissions().mode() & 0o111 != 0
            })
            .map(|_| p.to_path_buf())
    } else {
        crate::native::catalogue::discover_name(executable, places.path_var.clone(), &places.home)
    }?;
    Some(display(&path, &places.home))
}

fn optional(text: Option<String>, most: usize, what: &str) -> Result<Option<String>, String> {
    match text.map(|t| t.trim().to_owned()).filter(|t| !t.is_empty()) {
        None => Ok(None),
        Some(t) if text_ok(&t, most) => Ok(Some(t)),
        Some(_) => Err(format!(
            "{what} must be at most {most} characters on one line"
        )),
    }
}

fn parse(id: &str, text: &str, places: &Places) -> Result<Distributor, String> {
    let spec: Spec =
        toml::from_str(text).map_err(|e| format!("not a distributor file: {}", e.message()))?;
    if !text_ok(&spec.name, MAX_TEXT) {
        return Err(format!("name must be 1–{MAX_TEXT} characters on one line"));
    }
    let open = spec.open.trim().to_owned();
    if !command_ok(&open) {
        return Err("open must be one command on one line".into());
    }
    let update = spec
        .update
        .map(|u| u.trim().to_owned())
        .filter(|u| !u.is_empty());
    if update.as_deref().is_some_and(|u| !command_ok(u)) {
        return Err("update must be one command on one line".into());
    }
    let executable = executable_of(&open)?;
    Ok(Distributor {
        id: id.to_owned(),
        name: spec.name.trim().to_owned(),
        maker: optional(spec.maker, MAX_TEXT, "maker")?,
        found: found(&executable, places),
        executable,
        open,
        update,
        note: optional(spec.note, MAX_NOTE, "note")?,
    })
}

pub fn list(places: &Places) -> Result<List, String> {
    let mut entries: Vec<(String, PathBuf)> = Vec::new();
    if let Ok(dir) = fs::read_dir(&places.folder) {
        for entry in dir.flatten() {
            let name = entry.file_name().to_string_lossy().into_owned();
            if let Some(stem) = name.strip_suffix(".toml") {
                entries.push((stem.to_owned(), entry.path()));
            }
        }
    }
    entries.sort();
    let mut distributors = Vec::new();
    let mut refused = Vec::new();
    for (count, (id, path)) in entries.into_iter().enumerate() {
        let result = if count >= MAX_FILES {
            Err(format!("only the first {MAX_FILES} files are read"))
        } else if !id_ok(&id) {
            Err("file name must be lowercase letters, digits, - or _".into())
        } else {
            read_one(&path).and_then(|text| parse(&id, &text, places))
        };
        match result {
            Ok(d) => distributors.push(d),
            Err(error) => refused.push(Refused { id, error }),
        }
    }
    distributors.sort_by_key(|d| d.name.to_lowercase());
    Ok(List {
        folder: display(&places.folder, &places.home),
        distributors,
        refused,
        home: places.home.to_string_lossy().into_owned(),
    })
}

/// One distributor, read again from its file: the window's copy is never what runs.
pub fn get(places: &Places, id: &str) -> Result<Distributor, String> {
    if !id_ok(id) {
        return Err("unknown distributor".into());
    }
    let text = read_one(&places.folder.join(format!("{id}.toml")))?;
    parse(id, &text, places)
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SaveRequest {
    /// The file it replaces; `None` for a new one, whose file name its name gives.
    #[serde(default)]
    id: Option<String>,
    name: String,
    #[serde(default)]
    maker: Option<String>,
    open: String,
    #[serde(default)]
    update: Option<String>,
    #[serde(default)]
    note: Option<String>,
}

pub fn save(places: &Places, request: &SaveRequest) -> Result<Distributor, String> {
    let id = match &request.id {
        Some(id) if id_ok(id) => id.clone(),
        Some(_) => return Err("unknown distributor".into()),
        None => {
            let id = crate::launch::slug(&request.name);
            if id.is_empty() {
                return Err("name needs at least one letter or digit".into());
            }
            id
        }
    };
    let mut text = format!(
        "# Added in Personalization › Distributors (Wyss Console).\nname = {}\nopen = {}\n",
        toml_string(request.name.trim()),
        toml_string(request.open.trim()),
    );
    for (key, value) in [
        ("maker", &request.maker),
        ("update", &request.update),
        ("note", &request.note),
    ] {
        if let Some(v) = value.as_deref().map(str::trim).filter(|v| !v.is_empty()) {
            text.push_str(&format!("{key} = {}\n", toml_string(v)));
        }
    }
    if text.len() as u64 > crate::launch::MAX_FILE_BYTES {
        return Err("too long".into());
    }
    // Checked as the reader takes it before anything is written.
    parse(&id, &text, places)?;
    let target = places.folder.join(format!("{id}.toml"));
    if let Ok(meta) = fs::symlink_metadata(&target) {
        if !meta.is_file() {
            return Err("a distributor with that file name is not a plain file".into());
        }
        if request.id.is_none() {
            return Err("a distributor with that name exists".into());
        }
    } else if request.id.is_some() {
        return Err("unknown distributor".into());
    }
    fs::DirBuilder::new()
        .recursive(true)
        .mode(0o700)
        .create(&places.folder)
        .map_err(|e| format!("distributor folder: {e}"))?;
    write_private(&places.folder, &target, &text)
        .map_err(|e| format!("the distributor could not be written: {e}"))?;
    get(places, &id)
}

pub fn delete(places: &Places, id: &str) -> Result<(), String> {
    get(places, id)?;
    fs::remove_file(places.folder.join(format!("{id}.toml")))
        .map_err(|_| "the distributor could not be deleted".to_owned())
}

/// Makes a commands launch that opens this distributor, in the home folder, from its own file:
/// the window sends no command. An existing launch of that name is never replaced.
pub fn make_launch(places: &Places, id: &str) -> Result<String, String> {
    let d = get(places, id)?;
    let launch_id = crate::launch::slug(&d.name);
    if launch_id.is_empty() {
        return Err("name needs at least one letter or digit".into());
    }
    let target = places.launches.join(format!("{launch_id}.toml"));
    if fs::symlink_metadata(&target).is_ok() {
        return Err("a launch with that name exists".into());
    }
    let text = format!(
        "# Made from the distributor {id} (Wyss Console).\nname = {}\ndirectory = \"~\"\ncommands = [{}]\n",
        toml_string(&d.name),
        toml_string(&d.open),
    );
    fs::DirBuilder::new()
        .recursive(true)
        .mode(0o700)
        .create(&places.launches)
        .map_err(|e| format!("launch folder: {e}"))?;
    write_private(&places.launches, &target, &text)
        .map_err(|e| format!("the launch could not be written: {e}"))?;
    Ok(launch_id)
}

// Window commands

fn places() -> Result<Places, HostError> {
    Places::from_env().ok_or_else(|| HostError::new("distributor_unavailable"))
}

fn refused(error: String) -> HostError {
    let mut e = HostError::new("distributor_invalid");
    e.reasons.push(error);
    e
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct IdRequest {
    id: String,
}

macro_rules! blocking {
    ($body:expr) => {
        tauri::async_runtime::spawn_blocking(move || $body)
            .await
            .map_err(|_| HostError::new("internal"))?
    };
}

#[tauri::command]
pub async fn distributor_list() -> Result<List, HostError> {
    blocking!(list(&places()?).map_err(refused))
}

#[tauri::command]
pub async fn distributor_get(request: IdRequest) -> Result<Distributor, HostError> {
    blocking!(get(&places()?, &request.id).map_err(refused))
}

#[tauri::command]
pub async fn distributor_save(request: SaveRequest) -> Result<Distributor, HostError> {
    blocking!(save(&places()?, &request).map_err(refused))
}

#[tauri::command]
pub async fn distributor_delete(request: IdRequest) -> Result<(), HostError> {
    blocking!(delete(&places()?, &request.id).map_err(refused))
}

#[tauri::command]
pub async fn distributor_make_launch(request: IdRequest) -> Result<String, HostError> {
    blocking!(make_launch(&places()?, &request.id).map_err(refused))
}

const COMMANDS: &[&str] = &[
    "distributor_list",
    "distributor_get",
    "distributor_save",
    "distributor_delete",
    "distributor_make_launch",
];

pub fn extension() -> wyss_console::Extension {
    wyss_console::Extension {
        commands: COMMANDS,
        handler: Box::new(tauri::generate_handler![
            distributor_list,
            distributor_get,
            distributor_save,
            distributor_delete,
            distributor_make_launch
        ]),
        install: Box::new(|builder| builder),
        on_exit: None,
    }
}

#[cfg(test)]
#[path = "distributors_tests.rs"]
mod tests;
