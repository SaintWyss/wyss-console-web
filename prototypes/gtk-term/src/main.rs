//! Prototype: the Console without WebView (GTK4 + GSK + libghostty-vt): icon rail, tabs, split
//! panes, status bar (`console.rs`). `gtk-term [N]` opens N tabs. Shortcuts: `keymap.rs`.
//! With `GTKTERM_HOST=<socket>` the panes are terminals of a Wyss host: the window re-attaches to
//! the ones running, in the layout saved in `$XDG_STATE_HOME/gtk-term/layout.json` (N new ones if
//! there are none), closing a pane closes its terminal in the host, and closing the window only
//! disconnects. `GTKTERM_EXIT_AFTER=<seconds>` closes the window by itself. The theme (dark, light, high
//! contrast) and the language (English, Spanish) come from the Console's `preferences.json`.
//! `WYSS_TAURI_BIN` is the app the rail icons start; `GTKTERM_LAYOUT_DEMO=split` splits the first
//! tab and opens a second one (for screenshots).

mod console;
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
mod prefs;
mod procinfo;
mod pty;
mod search;
mod selection;
mod term;
mod theme;
mod view;

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
