//! What each preset chose for the launch environment (instructions, hooks, MCP, plugins, memory),
//! kept in `environment.json` beside the library, by selection id. A small private file rather
//! than a table, so the database schema stays the one older builds open. A damaged file loads as
//! empty (every preset then launches as the owner's own configuration), and loading never writes.
//!
//! What a Codex preset chose (instructions, hooks left out) is kept the same way in a file of its
//! own, `environment-codex.json` ([`codex`]): `environment.json` keeps the exact shape an older
//! build reads, which refuses a key it does not know.

use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};

use crate::native::launch_home::HomeSpec;
use crate::native::launch_home_codex::CodexHomeSpec;
use crate::native::store;

const FILE: &str = "environment.json";
const CODEX_FILE: &str = "environment-codex.json";
const VERSION: u32 = 1;
const MAX_FILE_BYTES: u64 = 1024 * 1024;
pub const MAX_PRESETS: usize = 512;

/// One provider's launch environment, as its file keeps it.
trait Spec: Serialize + DeserializeOwned + Clone {
    const FILE: &'static str;
    fn valid(&self) -> bool;
    fn unchanged(&self) -> bool;
    fn hooks_off(&mut self) -> &mut Vec<String>;
}

impl Spec for HomeSpec {
    const FILE: &'static str = FILE;
    fn valid(&self) -> bool {
        self.validate().is_ok()
    }
    fn unchanged(&self) -> bool {
        self.is_default()
    }
    fn hooks_off(&mut self) -> &mut Vec<String> {
        &mut self.hooks_off
    }
}

impl Spec for CodexHomeSpec {
    const FILE: &'static str = CODEX_FILE;
    fn valid(&self) -> bool {
        self.validate().is_ok()
    }
    fn unchanged(&self) -> bool {
        self.is_default()
    }
    fn hooks_off(&mut self) -> &mut Vec<String> {
        &mut self.hooks_off
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct State<S> {
    schema_version: u32,
    presets: BTreeMap<String, S>,
}

/// `wyss-console/arsenal` under `XDG_DATA_HOME` (or `~/.local/share`): the library's own folder.
pub fn directory() -> Option<PathBuf> {
    std::env::var_os("XDG_DATA_HOME")
        .map(PathBuf::from)
        .filter(|path| path.is_absolute())
        .or_else(|| {
            std::env::var_os("HOME")
                .map(PathBuf::from)
                .filter(|home| home.is_absolute())
                .map(|home| home.join(".local/share"))
        })
        .map(|data| data.join("wyss-console").join("arsenal"))
}

fn id_ok(id: &str) -> bool {
    (1..=64).contains(&id.len()) && id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
}

fn load<S: Spec>(directory: &Path) -> State<S> {
    let read = || -> Option<State<S>> {
        let meta = fs::symlink_metadata(directory.join(S::FILE)).ok()?;
        if !meta.is_file() {
            return None;
        }
        let bytes = store::read_bounded(&directory.join(S::FILE), MAX_FILE_BYTES)?;
        let state: State<S> = serde_json::from_slice(&bytes).ok()?;
        let valid = state.schema_version == VERSION
            && state.presets.len() <= MAX_PRESETS
            && state
                .presets
                .iter()
                .all(|(id, spec)| id_ok(id) && spec.valid());
        valid.then_some(state)
    };
    read().unwrap_or(State {
        schema_version: VERSION,
        presets: BTreeMap::new(),
    })
}

fn write<S: Spec>(directory: &Path, state: &mut State<S>) -> io::Result<()> {
    state.schema_version = VERSION;
    let bytes = serde_json::to_vec(state).map_err(io::Error::other)?;
    store::write_atomic(&directory.join(S::FILE), &bytes)
}

fn get_spec<S: Spec>(directory: &Path, selection: &str) -> Option<S> {
    load::<S>(directory)
        .presets
        .remove(selection)
        .filter(|spec| !spec.unchanged())
}

fn set_spec<S: Spec>(directory: &Path, selection: &str, spec: &S) -> io::Result<()> {
    if !id_ok(selection) || !spec.valid() {
        return Err(io::Error::other("invalid"));
    }
    let mut state = load::<S>(directory);
    if spec.unchanged() {
        state.presets.remove(selection);
    } else {
        if state.presets.len() >= MAX_PRESETS && !state.presets.contains_key(selection) {
            return Err(io::Error::other("too many"));
        }
        state.presets.insert(selection.to_owned(), spec.clone());
    }
    write(directory, &mut state)
}

fn rename_key<S: Spec>(directory: &Path, old: &str, new: &str) -> io::Result<usize> {
    let mut state = load::<S>(directory);
    let mut changed = 0;
    for spec in state.presets.values_mut() {
        let hooks_off = spec.hooks_off();
        if hooks_off.iter().any(|k| k == old) {
            // Already left out under the new key: the old one goes, never twice the same key.
            if hooks_off.iter().any(|k| k == new) {
                hooks_off.retain(|k| k != old);
            } else if let Some(slot) = hooks_off.iter_mut().find(|k| k.as_str() == old) {
                *slot = new.to_owned();
            }
            changed += 1;
        }
    }
    if changed > 0 {
        if state.presets.values().any(|spec| !spec.valid()) {
            return Err(io::Error::other("invalid"));
        }
        write(directory, &mut state)?;
    }
    Ok(changed)
}

/// The environment a preset chose; `None` when it keeps the owner's own.
pub fn get(directory: &Path, selection: &str) -> Option<HomeSpec> {
    get_spec(directory, selection)
}

/// Records a preset's environment. A default one is removed, so the file only holds changes.
pub fn set(directory: &Path, selection: &str, spec: &HomeSpec) -> io::Result<()> {
    set_spec(directory, selection, spec)
}

/// A hook was edited: every preset that left out the old one leaves out the new one. Returns how
/// many presets changed; nothing is written when none did.
pub fn rename_hook_key(directory: &Path, old: &str, new: &str) -> io::Result<usize> {
    rename_key::<HomeSpec>(directory, old, new)
}

/// The same three for a Codex preset, over `environment-codex.json`. A hook of Claude Code and one
/// of Codex with the same event, matcher and command have the same key: each file follows only
/// the edits of its own provider's hooks.
pub mod codex {
    use super::*;

    /// The environment a Codex preset chose; `None` when it keeps the owner's own.
    pub fn get(directory: &Path, selection: &str) -> Option<CodexHomeSpec> {
        get_spec(directory, selection)
    }

    /// Records a Codex preset's environment. A default one is removed.
    pub fn set(directory: &Path, selection: &str, spec: &CodexHomeSpec) -> io::Result<()> {
        set_spec(directory, selection, spec)
    }

    /// A hook of `~/.codex/hooks.json` was edited: the presets that left the old one out leave
    /// the new one out.
    pub fn rename_hook_key(directory: &Path, old: &str, new: &str) -> io::Result<usize> {
        rename_key::<CodexHomeSpec>(directory, old, new)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scratch(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "arsenal-env-{tag}-{}",
            uuid::Uuid::new_v4().simple()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn a_chosen_environment_round_trips_and_a_default_one_is_not_kept() {
        let dir = scratch("round");
        let spec = HomeSpec {
            instructions: false,
            memory: true,
            mcp: Some(vec!["context7".into()]),
            ..HomeSpec::default()
        };
        assert_eq!(get(&dir, "abc-1"), None);
        set(&dir, "abc-1", &spec).unwrap();
        assert_eq!(get(&dir, "abc-1"), Some(spec));
        let default = HomeSpec {
            instructions: true,
            memory: true,
            ..HomeSpec::default()
        };
        set(&dir, "abc-1", &default).unwrap();
        assert_eq!(get(&dir, "abc-1"), None);
        assert!(set(&dir, "../x", &default).is_err());
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn a_damaged_file_loads_as_empty() {
        let dir = scratch("damaged");
        fs::write(dir.join(FILE), "{not json").unwrap();
        assert_eq!(get(&dir, "abc"), None);
        fs::write(
            dir.join(FILE),
            r#"{"schema_version":1,"presets":{"abc":{"rules_off":["../x"]}}}"#,
        )
        .unwrap();
        assert_eq!(get(&dir, "abc"), None);
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn an_edited_hook_stays_left_out_where_it_was() {
        let dir = scratch("rename");
        let spec = HomeSpec {
            hooks_off: vec!["0123456789abcdef".to_owned()],
            ..HomeSpec::default()
        };
        set(&dir, "p1", &spec).unwrap();
        assert_eq!(
            rename_hook_key(&dir, "0123456789abcdef", "fedcba9876543210").unwrap(),
            1
        );
        assert_eq!(
            get(&dir, "p1").unwrap().hooks_off,
            vec!["fedcba9876543210".to_owned()]
        );
        // Both keys already left out: one is kept, never twice the same key.
        let both = HomeSpec {
            hooks_off: vec!["1111111111111111".to_owned(), "2222222222222222".to_owned()],
            ..HomeSpec::default()
        };
        set(&dir, "p2", &both).unwrap();
        rename_hook_key(&dir, "1111111111111111", "2222222222222222").unwrap();
        assert_eq!(
            get(&dir, "p2").unwrap().hooks_off,
            vec!["2222222222222222".to_owned()]
        );
        // A key no preset holds writes nothing.
        assert_eq!(
            rename_hook_key(&dir, "aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb").unwrap(),
            0
        );
    }

    fn codex_spec(keys: &[&str], instructions: bool) -> CodexHomeSpec {
        CodexHomeSpec {
            instructions,
            hooks_off: keys.iter().map(|k| (*k).to_owned()).collect(),
        }
    }

    #[test]
    fn a_codex_environment_round_trips_and_a_default_one_is_removed() {
        let dir = scratch("codex-round");
        let spec = codex_spec(&["0123456789abcdef"], false);
        assert_eq!(codex::get(&dir, "abc-1"), None);
        codex::set(&dir, "abc-1", &spec).unwrap();
        assert_eq!(codex::get(&dir, "abc-1"), Some(spec));
        assert!(dir.join(CODEX_FILE).is_file());
        codex::set(&dir, "abc-1", &CodexHomeSpec::default()).unwrap();
        assert_eq!(codex::get(&dir, "abc-1"), None);
        assert!(codex::set(&dir, "../x", &codex_spec(&[], false)).is_err());
        assert!(codex::set(&dir, "abc-1", &codex_spec(&["not-a-key"], true)).is_err());
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn a_damaged_codex_file_loads_as_empty() {
        let dir = scratch("codex-damaged");
        fs::write(dir.join(CODEX_FILE), "{not json").unwrap();
        assert_eq!(codex::get(&dir, "abc"), None);
        fs::write(
            dir.join(CODEX_FILE),
            r#"{"schema_version":1,"presets":{"abc":{"hooks_off":["not-a-key"]}}}"#,
        )
        .unwrap();
        assert_eq!(codex::get(&dir, "abc"), None);
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn writing_the_codex_environment_leaves_environment_json_byte_for_byte() {
        let dir = scratch("codex-intact");
        let claude = HomeSpec {
            instructions: false,
            hooks_off: vec!["0123456789abcdef".to_owned()],
            ..HomeSpec::default()
        };
        set(&dir, "p1", &claude).unwrap();
        let before = fs::read(dir.join(FILE)).unwrap();
        codex::set(&dir, "p1", &codex_spec(&["fedcba9876543210"], false)).unwrap();
        codex::rename_hook_key(&dir, "fedcba9876543210", "1111111111111111").unwrap();
        codex::set(&dir, "p1", &CodexHomeSpec::default()).unwrap();
        assert_eq!(fs::read(dir.join(FILE)).unwrap(), before);
        assert_eq!(get(&dir, "p1"), Some(claude));
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn renaming_a_hook_key_touches_only_the_file_of_its_provider() {
        let dir = scratch("codex-rename");
        let key = "0123456789abcdef";
        let claude = HomeSpec {
            hooks_off: vec![key.to_owned()],
            ..HomeSpec::default()
        };
        set(&dir, "p1", &claude).unwrap();
        codex::set(&dir, "p1", &codex_spec(&[key], true)).unwrap();
        let claude_bytes = fs::read(dir.join(FILE)).unwrap();
        assert_eq!(
            codex::rename_hook_key(&dir, key, "fedcba9876543210").unwrap(),
            1
        );
        assert_eq!(
            codex::get(&dir, "p1").unwrap().hooks_off,
            vec!["fedcba9876543210".to_owned()]
        );
        assert_eq!(fs::read(dir.join(FILE)).unwrap(), claude_bytes);
        // And the other way round: the Claude rename leaves the Codex file alone.
        let codex_bytes = fs::read(dir.join(CODEX_FILE)).unwrap();
        assert_eq!(rename_hook_key(&dir, key, "2222222222222222").unwrap(), 1);
        assert_eq!(fs::read(dir.join(CODEX_FILE)).unwrap(), codex_bytes);
        assert_eq!(
            codex::rename_hook_key(&dir, "aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb").unwrap(),
            0
        );
        fs::remove_dir_all(dir).unwrap();
    }
}
