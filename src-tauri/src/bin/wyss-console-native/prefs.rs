//! The two preferences the window follows, read from the same file as the Console:
//! `$XDG_CONFIG_HOME/wyss-console/preferences.json` (`interface.theme`, `interface.language`).
//! Read once when the window starts. A file that is missing, damaged or from a Wyss Console that
//! this window does not know gives the defaults (dark, English), as the Console does.

use std::path::PathBuf;

use crate::i18n::Lang;
use crate::theme::Theme;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Prefs {
    pub theme: Theme,
    pub language: Lang,
}

pub const DEFAULT: Prefs = Prefs { theme: Theme::Dark, language: Lang::En };

pub fn parse(text: &str) -> Prefs {
    let Ok(v) = serde_json::from_str::<serde_json::Value>(text) else { return DEFAULT };
    let word = |k: &str| v["interface"][k].as_str().map(str::to_owned);
    Prefs {
        theme: word("theme").and_then(|w| Theme::from_word(&w)).unwrap_or(DEFAULT.theme),
        language: word("language").and_then(|w| Lang::from_word(&w)).unwrap_or(DEFAULT.language),
    }
}

/// `$XDG_CONFIG_HOME` (or `~/.config`) `/wyss-console/preferences.json`.
pub fn path() -> Option<PathBuf> {
    path_from(std::env::var_os("XDG_CONFIG_HOME"), std::env::var_os("HOME"))
}

pub fn path_from(xdg_config_home: Option<std::ffi::OsString>, home: Option<std::ffi::OsString>) -> Option<PathBuf> {
    let abs = |v: Option<std::ffi::OsString>| v.map(PathBuf::from).filter(|p| p.is_absolute());
    let config = abs(xdg_config_home).or_else(|| abs(home).map(|h| h.join(".config")))?;
    Some(config.join("wyss-console/preferences.json"))
}

/// The file is a few hundred bytes (the Console refuses more than 4096).
pub fn load() -> Prefs {
    let Some(path) = path() else { return DEFAULT };
    match std::fs::read(&path) {
        Ok(bytes) if bytes.len() <= 4096 => std::str::from_utf8(&bytes).map(parse).unwrap_or(DEFAULT),
        _ => DEFAULT,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const FULL: &str = r#"{"schema_version":3,"interface":{"landing_page":"console","theme":"light","language":"es"},"terminal":{"font_size":16,"scrollback":5000,"cursor_style":"block","cursor_blink":false},"events":{"time_format":"system","default_filter":"all"}}"#;

    #[test]
    fn reads_theme_and_language_from_the_consoles_file() {
        assert_eq!(parse(FULL), Prefs { theme: Theme::Light, language: Lang::Es });
        let hc = FULL.replace("\"light\"", "\"high_contrast\"").replace("\"es\"", "\"en\"");
        assert_eq!(parse(&hc), Prefs { theme: Theme::HighContrast, language: Lang::En });
    }

    #[test]
    fn missing_damaged_or_older_files_give_the_defaults() {
        assert_eq!(parse(""), DEFAULT);
        assert_eq!(parse("{ not json"), DEFAULT);
        assert_eq!(parse("[]"), DEFAULT);
        assert_eq!(parse(r#"{"interface":{}}"#), DEFAULT);
        // Schema 2 had no language: the theme still counts.
        assert_eq!(parse(r#"{"schema_version":2,"interface":{"landing_page":"events","theme":"light"}}"#), Prefs { theme: Theme::Light, language: Lang::En });
        // An unknown word is not guessed.
        assert_eq!(parse(r#"{"interface":{"theme":"sepia","language":"fr"}}"#), DEFAULT);
    }

    #[test]
    fn the_file_is_found_under_xdg_config_home_or_dot_config() {
        let p = |x: Option<&str>, h: Option<&str>| path_from(x.map(Into::into), h.map(Into::into));
        assert_eq!(p(Some("/tmp/x/config"), Some("/home/a")), Some(PathBuf::from("/tmp/x/config/wyss-console/preferences.json")));
        assert_eq!(p(None, Some("/home/a")), Some(PathBuf::from("/home/a/.config/wyss-console/preferences.json")));
        assert_eq!(p(Some("relative"), Some("/home/a")), Some(PathBuf::from("/home/a/.config/wyss-console/preferences.json")), "a relative XDG path is ignored");
        assert_eq!(p(None, None), None);
    }

    #[test]
    fn load_reads_the_file_it_finds() {
        let dir = std::env::temp_dir().join(format!("gtkterm-prefs-{}", std::process::id()));
        std::fs::create_dir_all(dir.join("wyss-console")).unwrap();
        std::fs::write(dir.join("wyss-console/preferences.json"), FULL).unwrap();
        let file = path_from(Some(dir.clone().into()), None).unwrap();
        assert_eq!(parse(&std::fs::read_to_string(file).unwrap()), Prefs { theme: Theme::Light, language: Lang::Es });
        let _ = std::fs::remove_dir_all(dir);
    }
}
