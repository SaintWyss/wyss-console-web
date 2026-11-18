//! Prototype: the Console without WebView (GTK4 + GSK + libghostty-vt): icon rail, tabs, split
//! panes, status bar (`console.rs`). `gtk-term [N]` opens N tabs. Shortcuts: `keymap.rs`.
//! With `GTKTERM_HOST=<socket>` the panes are terminals of a Wyss host: the window re-attaches to
//! the ones running, in the layout saved in `$XDG_STATE_HOME/gtk-term/layout.json` (N new ones if
//! there are none), closing a pane closes its terminal in the host, and closing the window only
//! disconnects. `GTKTERM_EXIT_AFTER=<seconds>` closes the window by itself. The theme (dark, light, high
//! contrast) and the language (English, Spanish) come from the Console's `preferences.json`.
//! `WYSS_TAURI_BIN` is the app the rail icons start; `GTKTERM_LAYOUT_DEMO=split` splits the first
//! tab and opens a second one (for screenshots).

mod arsenal;
mod credentials;
mod console;
mod distributors;
mod ghostty;
mod host;
mod i18n;
mod i18n_table;
mod icons;
mod keymap;
mod keys;
mod launches;
mod layout;
mod native;
mod palette;
mod personalization;
mod prefs;
mod procinfo;
mod pty;
mod search;
mod selection;
mod term;
mod theme;
mod view;
mod workspace;

use wyss_console as _;

use gtk::prelude::*;
use gtk::{gio, glib};

fn main() -> glib::ExitCode {
    // The theme and the language are the Console's own preferences, read once when the window starts.
    let prefs = prefs::load();
    theme::set(prefs.theme);
    i18n::set(prefs.language);
    let tabs: usize = std::env::args().nth(1).and_then(|a| a.parse().ok()).unwrap_or(1).max(1);
    let app = gtk::Application::builder()
        .application_id("dev.wyss.ProtoTerm")
        .flags(gio::ApplicationFlags::NON_UNIQUE | gio::ApplicationFlags::HANDLES_COMMAND_LINE)
        .build();
    app.connect_command_line(|app, _| {
        app.activate();
        0.into()
    });
    // The socket is only ever given explicitly: nothing looks for a host on its own.
    let host = std::env::var_os("GTKTERM_HOST").filter(|p| !p.is_empty()).map(host::Host::new);
    app.connect_activate(move |app| build(app, tabs, host.clone()));
    app.run()
}

fn build(app: &gtk::Application, tabs: usize, host: Option<host::Host>) {
    let win = console::build(app, console::Config { host, tabs });

    if let Some(secs) = std::env::var("GTKTERM_EXIT_AFTER").ok().and_then(|v| v.parse::<u32>().ok()) {
        let win = win.clone();
        glib::timeout_add_seconds_local_once(secs, move || win.close());
    }

    // GTKTERM_SHOT=path.png renders the window through GSK into a PNG after 2 s (visual check).
    if let Ok(path) = std::env::var("GTKTERM_SHOT") {
        let win = win.clone();
        let after = std::env::var("GTKTERM_SHOT_AFTER").ok().and_then(|v| v.parse::<u32>().ok()).unwrap_or(2);
        glib::timeout_add_seconds_local_once(after, move || {
            let paint = gtk::WidgetPaintable::new(Some(&win));
            let (w, h) = (win.width() as f32, win.height() as f32);
            let snap = gtk::Snapshot::new();
            paint.snapshot(&snap, w as f64, h as f64);
            if let (Some(node), Some(renderer)) = (snap.to_node(), win.native().and_then(|n| n.renderer())) {
                let tex = renderer.render_texture(&node, None);
                let _ = tex.save_to_png(&path);
                eprintln!("shot: {path} renderer={}", renderer.type_().name());
            }
        });
    }
}


#[cfg(test)]
fn personalization_scratch() -> std::path::PathBuf {
    std::env::var_os("WYSS_TEST_SCRATCH")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|| std::path::PathBuf::from(env!("HOME")).join(".cache/wyss-build"))
}

#[cfg(test)]
fn personalization_round_trip(name: &str, child_test: &str) {
    let path = personalization_scratch().join(format!("native-{name}-{}", uuid::Uuid::new_v4()));
    let fixture = PersonalizationFixture(path);
    std::fs::create_dir_all(fixture.0.join("home")).unwrap();
    let result = std::process::Command::new(std::env::current_exe().unwrap())
        .args(["--exact", child_test, "--nocapture"])
        .env("WYSS_PERSONALIZATION_CHILD", &fixture.0)
        .env("HOME", fixture.0.join("home"))
        .env("XDG_CONFIG_HOME", fixture.0.join("config"))
        .env("XDG_DATA_HOME", fixture.0.join("data"))
        .env("XDG_STATE_HOME", fixture.0.join("state"))
        .env("XDG_CACHE_HOME", fixture.0.join("cache"))
        .env("XDG_RUNTIME_DIR", fixture.0.join("runtime"))
        .env("CODEX_HOME", fixture.0.join("codex"))
        .env_remove("GTKTERM_HOST")
        .env_remove("CLAUDE_CONFIG_DIR")
        .env_remove("WYSS_ARSENAL_SYNC")
        .output().unwrap();
    let stdout = String::from_utf8_lossy(&result.stdout);
    assert!(result.status.success() && stdout.contains("1 passed"), "{stdout}\n{}", String::from_utf8_lossy(&result.stderr));
}

#[cfg(test)]
fn personalization_child_root(name: &str) -> Option<std::path::PathBuf> {
    let root = std::path::PathBuf::from(std::env::var_os("WYSS_PERSONALIZATION_CHILD")?);
    assert_eq!(root.parent(), Some(personalization_scratch().as_path()));
    assert!(root.file_name().and_then(|name| name.to_str())
        .and_then(|file| file.strip_prefix(&format!("native-{name}-")))
        .is_some_and(|id| uuid::Uuid::parse_str(id).is_ok()));
    Some(root)
}

#[cfg(test)]
struct PersonalizationFixture(std::path::PathBuf);

#[cfg(test)]
impl Drop for PersonalizationFixture {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}
