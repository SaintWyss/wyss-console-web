//! Prototype: GPU-drawn terminal tabs (GTK4 + GSK + alacritty_terminal), no WebView.
//! `gtk-term [N]` opens N tabs. Ctrl+Shift+T opens another, Ctrl+Shift+W closes the current one.

mod keys;
mod term;
mod view;

use std::cell::Cell;
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
    app.connect_activate(move |app| build(app, tabs));
    app.run()
}

fn build(app: &gtk::Application, tabs: usize) {
    let win = gtk::ApplicationWindow::builder().application(app).title("gtk-term").default_width(900).default_height(560).build();
    let book = gtk::Notebook::new();
    book.set_scrollable(true);
    win.set_child(Some(&book));
    let next = Rc::new(Cell::new(1u64));

    let open = {
        let book = book.clone();
        let next = next.clone();
        let win = win.downgrade();
        Rc::new(move || {
            let id = next.get();
            next.set(id + 1);
            let book_w = book.downgrade();
            let win_w = win.clone();
            let t = term::Terminal::new(id, move || {
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
    for _ in 0..tabs {
        open();
    }

    let sc = gtk::ShortcutController::new();
    sc.set_scope(gtk::ShortcutScope::Global);
    {
        let open = open.clone();
        sc.add_shortcut(gtk::Shortcut::new(
            gtk::ShortcutTrigger::parse_string("<Control><Shift>t"),
            Some(gtk::CallbackAction::new(move |_, _| { open(); glib::Propagation::Stop })),
        ));
    }
    {
        let book = book.clone();
        let win = win.downgrade();
        sc.add_shortcut(gtk::Shortcut::new(
            gtk::ShortcutTrigger::parse_string("<Control><Shift>w"),
            Some(gtk::CallbackAction::new(move |_, _| {
                book.remove_page(book.current_page());
                if book.n_pages() == 0 { if let Some(w) = win.upgrade() { w.close(); } }
                glib::Propagation::Stop
            })),
        ));
    }
    book.connect_switch_page(|_, page, _| { let p = page.clone(); glib::idle_add_local_once(move || { p.grab_focus(); }); });
    win.add_controller(sc);
    win.present();

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
