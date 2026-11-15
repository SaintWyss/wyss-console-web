//! What each preset chose for the launch environment (instructions, hooks, MCP, plugins, memory),
//! kept in `environment.json` beside the library, by selection id. A small private file rather
//! than a table, so the database schema stays the one older builds open. Loading never writes.
//!
//! What a Codex preset chose (instructions, hooks left out) is kept the same way in a file of its
//! own, `environment-codex.json` ([`codex`]): `environment.json` keeps the exact shape an older
//! build reads, which refuses a key it does not know.
//!
//! Both files are read strictly: a file that is not there is an empty one, but one that is
//! there and cannot be used (unreadable, not a regular file, too long, not this schema, an
//! invalid entry) is an error, [`UNREADABLE`]. A preset whose choice cannot be read must not
//! launch as if it had chosen nothing: the hooks it left out would run. Such a file is never
//! written over.
//! Neither file is written when its text would be longer than the reader accepts.

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
    /// Whether a file that is there but cannot be used is an error (never an empty one).
    const STRICT: bool;
    fn valid(&self) -> bool;
    fn unchanged(&self) -> bool;
    fn hooks_off(&mut self) -> &mut Vec<String>;
}

impl Spec for HomeSpec {
    const FILE: &'static str = FILE;
    const STRICT: bool = true;
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
    const STRICT: bool = true;
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

/// The error of a file that is there and cannot be used.
pub const UNREADABLE: &str = "environment_unreadable";
/// The error of a file that would be longer than the reader accepts: nothing is written.
pub const TOO_LARGE: &str = "environment_too_large";

/// Whether `error` says the file is there and cannot be used.
pub fn is_unreadable(error: &io::Error) -> bool {
    error.to_string() == UNREADABLE
}

fn empty<S>() -> State<S> {
    State {
        schema_version: VERSION,
        presets: BTreeMap::new(),
    }
}

/// The file as it is: empty when there is none, an error when there is one that cannot be used.
fn read<S: Spec>(directory: &Path) -> io::Result<State<S>> {
    let unreadable = || io::Error::other(UNREADABLE);
    let path = directory.join(S::FILE);
    match fs::symlink_metadata(&path) {
        Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(empty()),
        Ok(meta) if meta.is_file() => {}
        _ => return Err(unreadable()),
    }
    let bytes = store::read_bounded(&path, MAX_FILE_BYTES).ok_or_else(unreadable)?;
    let state: State<S> = serde_json::from_slice(&bytes).map_err(|_| unreadable())?;
    let valid = state.schema_version == VERSION
        && state.presets.len() <= MAX_PRESETS
        && state
            .presets
            .iter()
            .all(|(id, spec)| id_ok(id) && spec.valid());
    if valid { Ok(state) } else { Err(unreadable()) }
}

fn load<S: Spec>(directory: &Path) -> io::Result<State<S>> {
    match read::<S>(directory) {
        Err(_) if !S::STRICT => Ok(empty()),
        other => other,
    }
}

fn write<S: Spec>(directory: &Path, state: &mut State<S>) -> io::Result<()> {
    state.schema_version = VERSION;
    let bytes = serde_json::to_vec(state).map_err(io::Error::other)?;
    // Checked before writing: a file the reader would refuse is never left on disk.
    if bytes.len() as u64 > MAX_FILE_BYTES {
        return Err(io::Error::other(TOO_LARGE));
    }
    store::write_atomic(&directory.join(S::FILE), &bytes)
}

fn get_spec<S: Spec>(directory: &Path, selection: &str) -> io::Result<Option<S>> {
    Ok(load::<S>(directory)?
        .presets
        .remove(selection)
        .filter(|spec| !spec.unchanged()))
}

fn set_spec<S: Spec>(directory: &Path, selection: &str, spec: &S) -> io::Result<()> {
    if !id_ok(selection) || !spec.valid() {
        return Err(io::Error::other("invalid"));
    }
    let mut state = load::<S>(directory)?;
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

fn rename_key<S: Spec>(
    directory: &Path,
    old: &str,
    new: &str,
    old_remains: bool,
) -> io::Result<usize> {
    let mut state = load::<S>(directory)?;
    let mut changed = 0;
    for spec in state.presets.values_mut() {
        let hooks_off = spec.hooks_off();
        if !hooks_off.iter().any(|k| k == old) {
            continue;
        }
        let has_new = hooks_off.iter().any(|k| k == new);
        if old_remains {
            // Another hook still has the old identity: it stays left out, and so does the
            // edited one under its new key.
            if has_new {
                continue;
            }
            hooks_off.push(new.to_owned());
        } else if has_new {
            // Already left out under the new key: the old one goes, never twice the same key.
            hooks_off.retain(|k| k != old);
        } else if let Some(slot) = hooks_off.iter_mut().find(|k| k.as_str() == old) {
            *slot = new.to_owned();
        }
        changed += 1;
    }
    if changed > 0 {
        if state.presets.values().any(|spec| !spec.valid()) {
            return Err(io::Error::other("invalid"));
        }
        write(directory, &mut state)?;
    }
    Ok(changed)
}

/// The environment a preset chose; `None` when it keeps the owner's own. An error
/// ([`UNREADABLE`]) when the file is there and cannot be used: the caller must not go on as if the
/// preset had chosen nothing.
pub fn get(directory: &Path, selection: &str) -> io::Result<Option<HomeSpec>> {
    get_spec(directory, selection)
}

/// Records a preset's environment. A default one is removed, so the file only holds changes. A
/// file that is there and cannot be used is left as it is ([`UNREADABLE`]), and so is one the new
/// text would make too long ([`TOO_LARGE`]).
pub fn set(directory: &Path, selection: &str, spec: &HomeSpec) -> io::Result<()> {
    set_spec(directory, selection, spec)
}

/// A hook was edited: every preset that left out the old one leaves out the new one. With
/// `old_remains` (another hook of the file still has the old event, matcher and command, so the
/// old key still names a hook) the old key is kept and the new one is added. Returns how many
/// presets changed; nothing is written when none did.
pub fn rename_hook_key(
    directory: &Path,
    old: &str,
    new: &str,
    old_remains: bool,
) -> io::Result<usize> {
    rename_key::<HomeSpec>(directory, old, new, old_remains)
}

/// The same three for a Codex preset, over `environment-codex.json`. A hook of Claude Code and one
/// of Codex with the same event, matcher and command have the same key: each file follows only
/// the edits of its own provider's hooks.
pub mod codex {
    use super::*;

    /// The environment a Codex preset chose; `None` when it keeps the owner's own. An error
    /// ([`UNREADABLE`]) when the file is there and cannot be used: the caller must not go on as
    /// if the preset had chosen nothing.
    pub fn get(directory: &Path, selection: &str) -> io::Result<Option<CodexHomeSpec>> {
        get_spec(directory, selection)
    }

    /// Records a Codex preset's environment. A default one is removed. A file that is there and
    /// cannot be used is left as it is ([`UNREADABLE`]), and so is one the new text would make
    /// too long ([`TOO_LARGE`]).
    pub fn set(directory: &Path, selection: &str, spec: &CodexHomeSpec) -> io::Result<()> {
        set_spec(directory, selection, spec)
    }

    /// A hook of `~/.codex/hooks.json` was edited: the presets that left the old one out leave
    /// the new one out; see [`super::rename_hook_key`] for `old_remains`.
    pub fn rename_hook_key(
        directory: &Path,
        old: &str,
        new: &str,
        old_remains: bool,
    ) -> io::Result<usize> {
        rename_key::<CodexHomeSpec>(directory, old, new, old_remains)
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
        assert_eq!(get(&dir, "abc-1").unwrap(), None);
        set(&dir, "abc-1", &spec).unwrap();
        assert_eq!(get(&dir, "abc-1").unwrap(), Some(spec));
        let default = HomeSpec {
            instructions: true,
            memory: true,
            ..HomeSpec::default()
        };
        set(&dir, "abc-1", &default).unwrap();
        assert_eq!(get(&dir, "abc-1").unwrap(), None);
        assert!(set(&dir, "../x", &default).is_err());
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn a_damaged_file_is_an_error() {
        let dir = scratch("damaged");
        fs::write(dir.join(FILE), "{not json").unwrap();
        assert!(get(&dir, "abc").is_err_and(|e| is_unreadable(&e)));
        fs::write(
            dir.join(FILE),
            r#"{"schema_version":1,"presets":{"abc":{"rules_off":["../x"]}}}"#,
        )
        .unwrap();
        assert!(get(&dir, "abc").is_err_and(|e| is_unreadable(&e)));
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
            rename_hook_key(&dir, "0123456789abcdef", "fedcba9876543210", false).unwrap(),
            1
        );
        assert_eq!(
            get(&dir, "p1").unwrap().unwrap().hooks_off,
            vec!["fedcba9876543210".to_owned()]
        );
        // Both keys already left out: one is kept, never twice the same key.
        let both = HomeSpec {
            hooks_off: vec!["1111111111111111".to_owned(), "2222222222222222".to_owned()],
            ..HomeSpec::default()
        };
        set(&dir, "p2", &both).unwrap();
        rename_hook_key(&dir, "1111111111111111", "2222222222222222", false).unwrap();
        assert_eq!(
            get(&dir, "p2").unwrap().unwrap().hooks_off,
            vec!["2222222222222222".to_owned()]
        );
        // A key no preset holds writes nothing.
        assert_eq!(
            rename_hook_key(&dir, "aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb", false).unwrap(),
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
        assert_eq!(codex::get(&dir, "abc-1").unwrap(), None);
        codex::set(&dir, "abc-1", &spec).unwrap();
        assert_eq!(codex::get(&dir, "abc-1").unwrap(), Some(spec));
        assert!(dir.join(CODEX_FILE).is_file());
        codex::set(&dir, "abc-1", &CodexHomeSpec::default()).unwrap();
        assert_eq!(codex::get(&dir, "abc-1").unwrap(), None);
        assert!(codex::set(&dir, "../x", &codex_spec(&[], false)).is_err());
        assert!(codex::set(&dir, "abc-1", &codex_spec(&["not-a-key"], true)).is_err());
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn a_damaged_codex_file_is_an_error_and_is_never_written_over() {
        let dir = scratch("codex-damaged");
        fs::write(dir.join(CODEX_FILE), "{not json").unwrap();
        assert!(codex::get(&dir, "abc").is_err_and(|e| is_unreadable(&e)));
        // Neither a save nor a rename replaces what cannot be read.
        assert!(codex::set(&dir, "abc", &codex_spec(&["0123456789abcdef"], true)).is_err());
        assert!(
            codex::rename_hook_key(&dir, "0123456789abcdef", "fedcba9876543210", false).is_err()
        );
        assert_eq!(fs::read(dir.join(CODEX_FILE)).unwrap(), b"{not json");
        fs::write(
            dir.join(CODEX_FILE),
            r#"{"schema_version":1,"presets":{"abc":{"hooks_off":["not-a-key"]}}}"#,
        )
        .unwrap();
        assert!(codex::get(&dir, "abc").is_err_and(|e| is_unreadable(&e)));
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
        codex::rename_hook_key(&dir, "fedcba9876543210", "1111111111111111", false).unwrap();
        codex::set(&dir, "p1", &CodexHomeSpec::default()).unwrap();
        assert_eq!(fs::read(dir.join(FILE)).unwrap(), before);
        assert_eq!(get(&dir, "p1").unwrap(), Some(claude));
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
            codex::rename_hook_key(&dir, key, "fedcba9876543210", false).unwrap(),
            1
        );
        assert_eq!(
            codex::get(&dir, "p1").unwrap().unwrap().hooks_off,
            vec!["fedcba9876543210".to_owned()]
        );
        assert_eq!(fs::read(dir.join(FILE)).unwrap(), claude_bytes);
        // And the other way round: the Claude rename leaves the Codex file alone.
        let codex_bytes = fs::read(dir.join(CODEX_FILE)).unwrap();
        assert_eq!(
            rename_hook_key(&dir, key, "2222222222222222", false).unwrap(),
            1
        );
        assert_eq!(fs::read(dir.join(CODEX_FILE)).unwrap(), codex_bytes);
        assert_eq!(
            codex::rename_hook_key(&dir, "aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb", false).unwrap(),
            0
        );
        fs::remove_dir_all(dir).unwrap();
    }

    const KEY_A: &str = "0123456789abcdef";
    const KEY_B: &str = "fedcba9876543210";

    /// Each way a Codex file can be there and not be usable, as a function that makes it.
    /// Returns what its bytes are afterwards, to compare with.
    type Break = (&'static str, fn(&Path) -> Vec<u8>);

    fn breaks() -> Vec<Break> {
        use std::os::unix::fs::PermissionsExt;
        vec![
            ("symlink", |dir| {
                let target = dir.join("real.json");
                let bytes = br#"{"schema_version":1,"presets":{}}"#.to_vec();
                fs::write(&target, &bytes).unwrap();
                std::os::unix::fs::symlink(&target, dir.join(CODEX_FILE)).unwrap();
                bytes
            }),
            ("directory", |dir| {
                fs::create_dir(dir.join(CODEX_FILE)).unwrap();
                Vec::new()
            }),
            ("no permissions", |dir| {
                let bytes = br#"{"schema_version":1,"presets":{}}"#.to_vec();
                fs::write(dir.join(CODEX_FILE), &bytes).unwrap();
                fs::set_permissions(dir.join(CODEX_FILE), fs::Permissions::from_mode(0o000))
                    .unwrap();
                bytes
            }),
            ("over 1 MiB", |dir| {
                let bytes = vec![b' '; MAX_FILE_BYTES as usize + 1];
                fs::write(dir.join(CODEX_FILE), &bytes).unwrap();
                bytes
            }),
            ("another schema", |dir| {
                let bytes = br#"{"schema_version":2,"presets":{}}"#.to_vec();
                fs::write(dir.join(CODEX_FILE), &bytes).unwrap();
                bytes
            }),
            ("invalid entry", |dir| {
                let bytes =
                    br#"{"schema_version":1,"presets":{"abc":{"hooks_off":["not-a-key"]}}}"#
                        .to_vec();
                fs::write(dir.join(CODEX_FILE), &bytes).unwrap();
                bytes
            }),
            ("invalid preset id", |dir| {
                let bytes = br#"{"schema_version":1,"presets":{"../x":{"hooks_off":[]}}}"#.to_vec();
                fs::write(dir.join(CODEX_FILE), &bytes).unwrap();
                bytes
            }),
        ]
    }

    #[test]
    fn a_codex_file_that_cannot_be_used_is_unreadable_and_is_left_byte_for_byte() {
        use std::os::unix::fs::PermissionsExt;
        let root_user = std::process::Command::new("id")
            .arg("-u")
            .output()
            .map(|o| o.stdout == b"0\n")
            .unwrap_or(false);
        for (name, make) in breaks() {
            if name == "no permissions" && root_user {
                eprintln!("skipped: root reads files without permissions");
                continue;
            }
            let dir = scratch("codex-unreadable");
            let bytes = make(&dir);
            let path = dir.join(CODEX_FILE);
            let unreadable = |e: io::Error| is_unreadable(&e);
            assert!(
                codex::get(&dir, "abc").is_err_and(unreadable),
                "{name}: get"
            );
            assert!(
                codex::set(&dir, "abc", &codex_spec(&[KEY_A], false)).is_err_and(unreadable),
                "{name}: set"
            );
            assert!(
                codex::rename_hook_key(&dir, KEY_A, KEY_B, false).is_err_and(unreadable),
                "{name}: rename"
            );
            assert!(
                codex::rename_hook_key(&dir, KEY_A, KEY_B, true).is_err_and(unreadable),
                "{name}: rename with old_remains"
            );
            // Unchanged: same kind of entry, same bytes.
            let meta = fs::symlink_metadata(&path).unwrap();
            match name {
                "symlink" => {
                    assert!(meta.file_type().is_symlink(), "{name}");
                    assert_eq!(fs::read(&path).unwrap(), bytes, "{name}");
                }
                "directory" => assert!(meta.is_dir(), "{name}"),
                "no permissions" => {
                    fs::set_permissions(&path, fs::Permissions::from_mode(0o600)).unwrap();
                    assert_eq!(fs::read(&path).unwrap(), bytes, "{name}");
                }
                _ => assert_eq!(fs::read(&path).unwrap(), bytes, "{name}"),
            }
            if name == "no permissions" {
                fs::set_permissions(&path, fs::Permissions::from_mode(0o600)).unwrap();
            }
            fs::remove_dir_all(dir).unwrap();
        }
    }

    #[test]
    fn a_missing_codex_file_is_an_empty_one_not_an_error() {
        let dir = scratch("codex-missing");
        assert_eq!(codex::get(&dir, "abc").unwrap(), None);
        assert_eq!(
            codex::rename_hook_key(&dir, KEY_A, KEY_B, false).unwrap(),
            0
        );
        assert!(!dir.join(CODEX_FILE).exists(), "a rename writes nothing");
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn saving_what_the_reader_would_refuse_fails_and_writes_nothing() {
        let dir = scratch("codex-too-large");
        let key = |i: usize, j: usize| format!("{:016x}", i * 1000 + j);
        // Each preset holds the most keys it may; 108 of them are longer than 1 MiB.
        let full = |i: usize| CodexHomeSpec {
            instructions: true,
            hooks_off: (0..crate::native::launch_home::MAX_NAMES)
                .map(|j| key(i, j))
                .collect(),
        };
        let mut state: State<CodexHomeSpec> = empty();
        for i in 0..108 {
            state.presets.insert(format!("p{i}"), full(i));
        }
        let error = write(&dir, &mut state).unwrap_err();
        assert_eq!(error.to_string(), TOO_LARGE);
        assert!(!dir.join(CODEX_FILE).exists(), "nothing written");
        // Through the public door: 107 fit (the same file as the reader accepts), the 108th
        // fails with `environment_too_large` and the file stays as the 107th left it.
        for i in 0..107 {
            codex::set(&dir, &format!("p{i}"), &full(i)).unwrap();
        }
        let before = fs::read(dir.join(CODEX_FILE)).unwrap();
        assert!(before.len() as u64 <= MAX_FILE_BYTES);
        assert_eq!(codex::get(&dir, "p106").unwrap(), Some(full(106)));
        let error = codex::set(&dir, "p107", &full(107)).unwrap_err();
        assert_eq!(error.to_string(), TOO_LARGE);
        assert!(!is_unreadable(&error));
        assert_eq!(fs::read(dir.join(CODEX_FILE)).unwrap(), before);
        // The Claude file keeps the same limit.
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn a_damaged_claude_file_is_an_error_and_is_never_written_over() {
        use std::os::unix::fs::symlink;
        let spec = HomeSpec {
            instructions: false,
            ..HomeSpec::default()
        };
        let huge = vec![b' '; (MAX_FILE_BYTES + 1) as usize];
        for (name, make) in [
            (
                "json",
                (|dir: &Path| fs::write(dir.join(FILE), "{not json").unwrap()) as fn(&Path),
            ),
            ("dir", |dir: &Path| fs::create_dir(dir.join(FILE)).unwrap()),
            ("link", |dir: &Path| {
                symlink("/nonexistent", dir.join(FILE)).unwrap()
            }),
            ("schema", |dir: &Path| {
                fs::write(dir.join(FILE), br#"{"schema_version":9,"presets":{}}"#).unwrap();
            }),
            ("unknown key", |dir: &Path| {
                fs::write(
                    dir.join(FILE),
                    br#"{"schema_version":1,"presets":{},"x":1}"#,
                )
                .unwrap();
            }),
        ] {
            let case = scratch("claude-damaged-case");
            make(&case);
            let before = fs::symlink_metadata(case.join(FILE)).map(|m| m.is_file());
            let bytes = fs::read(case.join(FILE)).ok();
            assert!(
                get(&case, "abc").is_err_and(|e| is_unreadable(&e)),
                "{name}"
            );
            assert!(
                set(&case, "abc", &spec).is_err_and(|e| is_unreadable(&e)),
                "{name}"
            );
            assert!(
                rename_hook_key(&case, KEY_A, KEY_B, false).is_err(),
                "{name}"
            );
            assert_eq!(
                fs::symlink_metadata(case.join(FILE))
                    .map(|m| m.is_file())
                    .ok(),
                before.ok(),
                "{name}"
            );
            assert_eq!(fs::read(case.join(FILE)).ok(), bytes, "{name}");
            let _ = fs::remove_dir_all(case);
        }
        // Too long to read: also an error, bytes intact.
        let case = scratch("claude-huge");
        fs::write(case.join(FILE), &huge).unwrap();
        assert!(get(&case, "abc").is_err_and(|e| is_unreadable(&e)));
        assert!(set(&case, "abc", &spec).is_err());
        assert_eq!(fs::read(case.join(FILE)).unwrap(), huge);
        let _ = fs::remove_dir_all(case);
        // No file at all is an empty one, not an error.
        let case = scratch("claude-missing");
        assert!(get(&case, "abc").unwrap().is_none());
        set(&case, "abc", &spec).unwrap();
        assert_eq!(get(&case, "abc").unwrap(), Some(spec));
        let _ = fs::remove_dir_all(case);
    }

    #[test]
    fn an_edited_hook_whose_old_one_remains_adds_the_new_key_and_keeps_the_old() {
        let dir = scratch("old-remains");
        let spec = HomeSpec {
            hooks_off: vec![KEY_A.to_owned()],
            ..HomeSpec::default()
        };
        set(&dir, "p1", &spec).unwrap();
        assert_eq!(rename_hook_key(&dir, KEY_A, KEY_B, true).unwrap(), 1);
        assert_eq!(
            get(&dir, "p1").unwrap().unwrap().hooks_off,
            vec![KEY_A.to_owned(), KEY_B.to_owned()]
        );
        // Both already there: nothing changes and nothing is written.
        let bytes = fs::read(dir.join(FILE)).unwrap();
        assert_eq!(rename_hook_key(&dir, KEY_A, KEY_B, true).unwrap(), 0);
        assert_eq!(fs::read(dir.join(FILE)).unwrap(), bytes);
        // The same old key, without old_remains and with both there: the old one goes.
        assert_eq!(rename_hook_key(&dir, KEY_A, KEY_B, false).unwrap(), 1);
        assert_eq!(
            get(&dir, "p1").unwrap().unwrap().hooks_off,
            vec![KEY_B.to_owned()]
        );
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn the_codex_rename_with_old_remains_adds_keeps_and_propagates_errors() {
        let dir = scratch("codex-old-remains");
        codex::set(&dir, "p1", &codex_spec(&[KEY_A], false)).unwrap();
        codex::set(&dir, "p2", &codex_spec(&[], false)).unwrap();
        assert_eq!(codex::rename_hook_key(&dir, KEY_A, KEY_B, true).unwrap(), 1);
        assert_eq!(
            codex::get(&dir, "p1").unwrap().unwrap().hooks_off,
            vec![KEY_A.to_owned(), KEY_B.to_owned()]
        );
        let bytes = fs::read(dir.join(CODEX_FILE)).unwrap();
        assert_eq!(codex::rename_hook_key(&dir, KEY_A, KEY_B, true).unwrap(), 0);
        assert_eq!(fs::read(dir.join(CODEX_FILE)).unwrap(), bytes);
        // A file that cannot be read: the error comes out, never a count.
        fs::write(dir.join(CODEX_FILE), "{broken").unwrap();
        assert!(codex::rename_hook_key(&dir, KEY_A, KEY_B, true).is_err_and(|e| is_unreadable(&e)));
        assert_eq!(fs::read(dir.join(CODEX_FILE)).unwrap(), b"{broken");
        fs::remove_dir_all(dir).unwrap();
    }
}
