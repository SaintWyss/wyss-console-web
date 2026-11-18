//! Prototype: GPU-drawn terminal tabs (GTK4 + GSK + libghostty-vt), no WebView.
//! `gtk-term [N]` opens N tabs. Ctrl+Shift+T opens another, Ctrl+Shift+W closes the current one.
//! With `GTKTERM_HOST=<socket>` the tabs are terminals of a Wyss host: it re-attaches to the ones
//! already running (N new ones if there are none), Ctrl+Shift+W closes the terminal in the host,
//! and closing the window only disconnects. `GTKTERM_EXIT_AFTER=<seconds>` closes the window by itself.

mod ghostty;
mod host;
mod keys;
mod palette;
mod pty;
mod selection;
mod term;
mod view;

use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::rc::Rc;

use gtk::prelude::*;
use gtk::{gio, glib};

fn main() -> glib::ExitCode {
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
    let win = gtk::ApplicationWindow::builder().application(app).title("gtk-term").default_width(900).default_height(560).build();
    let book = gtk::Notebook::new();
    book.set_scrollable(true);
    win.set_child(Some(&book));
    let next = Rc::new(Cell::new(1u64));
    // Host terminal id of each tab, by tab number.
    let tids: Rc<RefCell<HashMap<u64, String>>> = Rc::new(RefCell::new(HashMap::new()));

    let open = {
        let book = book.clone();
        let next = next.clone();
        let win = win.downgrade();
        let tids = tids.clone();
        Rc::new(move |source: term::Source| {
            let id = next.get();
            if let term::Source::Host { tid, .. } = &source {
                tids.borrow_mut().insert(id, tid.clone());
            }
            next.set(id + 1);
            let book_w = book.downgrade();
            let win_w = win.clone();
            let tids_w = tids.clone();
            let t = term::Terminal::new(id, source, move || {
                tids_w.borrow_mut().remove(&id);
                if let Some(b) = book_w.upgrade() {
                    for i in 0..b.n_pages() {
                        if let Some(p) = b.nth_page(Some(i)) {
                            if p.widget_name() == format!("t{id}") {
                                b.remove_page(Some(i));
                                break;
                            }
                        }
                    }
                    if b.n_pages() == 0 {
                        if let Some(w) = win_w.upgrade() { w.close(); }
                    }
                }
            });
            t.widget.set_widget_name(&format!("t{id}"));
            let idx = book.append_page(&t.widget, Some(&gtk::Label::new(Some(&format!("{id}")))));
            book.set_current_page(Some(idx));
            t.widget.grab_focus();
        })
    };
    // A new tab: a local shell, or a new terminal in the host.
    let new_source = {
        let host = host.clone();
        Rc::new(move || -> Option<term::Source> {
            let Some(host) = &host else { return Some(term::Source::Local) };
            match host.create(24, 80) {
                Ok(tid) => Some(term::Source::Host { host: host.clone(), tid, attach: term::Attach::Fresh }),
                Err(e) => {
                    eprintln!("gtk-term: term_create failed: {e}");
                    None
                }
            }
        })
    };
    let mut reattached = 0;
    if let Some(h) = &host {
        match h.hello().and_then(|_| h.list()) {
            Ok(list) => {
                for e in list.into_iter().filter(|e| e.state == "running") {
                    let attach = match h.screen(&e.id, 500) {
                        Ok(Some(s)) => term::Attach::Screen(s),
                        _ => term::Attach::Replay,
                    };
                    open(term::Source::Host { host: h.clone(), tid: e.id, attach });
                    reattached += 1;
                }
            }
            Err(e) => eprintln!("gtk-term: term_list failed: {e}"),
        }
    }
    if reattached == 0 {
        for _ in 0..tabs {
            if let Some(src) = new_source() {
                open(src);
            }
        }
    }
    if book.n_pages() == 0 {
        eprintln!("gtk-term: no terminal to show");
        win.close();
    }

    let sc = gtk::ShortcutController::new();
    sc.set_scope(gtk::ShortcutScope::Global);
    {
        let open = open.clone();
        sc.add_shortcut(gtk::Shortcut::new(
            gtk::ShortcutTrigger::parse_string("<Control><Shift>t"),
            Some(gtk::CallbackAction::new(move |_, _| {
                if let Some(src) = new_source() { open(src); }
                glib::Propagation::Stop
            })),
        ));
    }
    {
        let book = book.clone();
        let win = win.downgrade();
        let tids = tids.clone();
        let host = host.clone();
        sc.add_shortcut(gtk::Shortcut::new(
            gtk::ShortcutTrigger::parse_string("<Control><Shift>w"),
            Some(gtk::CallbackAction::new(move |_, _| {
                // In host mode this closes the terminal itself, not only its tab.
                let id = book.nth_page(book.current_page()).and_then(|p| p.widget_name().strip_prefix('t').and_then(|n| n.parse::<u64>().ok()));
                if let (Some(h), Some(tid)) = (host.clone(), id.and_then(|i| tids.borrow_mut().remove(&i))) {
                    std::thread::spawn(move || { let _ = h.close(&tid); });
                }
                book.remove_page(book.current_page());
                if book.n_pages() == 0 { if let Some(w) = win.upgrade() { w.close(); } }
                glib::Propagation::Stop
            })),
        ));
    }
    book.connect_switch_page(|_, page, _| { let p = page.clone(); glib::idle_add_local_once(move || { p.grab_focus(); }); });
    win.add_controller(sc);
    win.present();

    if let Some(secs) = std::env::var("GTKTERM_EXIT_AFTER").ok().and_then(|v| v.parse::<u32>().ok()) {
        let win = win.clone();
        glib::timeout_add_seconds_local_once(secs, move || win.close());
    }

    // GTKTERM_SHOT=path.png renders the window through GSK into a PNG after 2 s (visual check).
    if let Ok(path) = std::env::var("GTKTERM_SHOT") {
        let win = win.clone();
        glib::timeout_add_seconds_local_once(2, move || {
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
