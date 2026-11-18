//! A terminal widget: `alacritty_terminal` keeps the screen state, GTK's scene graph (GSK) draws it
//! on the GPU. No WebView, no DOM.

use std::cell::{Cell as StdCell, RefCell};
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use alacritty_terminal::event::{Event, EventListener, WindowSize};
use alacritty_terminal::event_loop::{EventLoop, EventLoopSender, Msg};
use alacritty_terminal::grid::Dimensions;
use alacritty_terminal::sync::FairMutex;
use alacritty_terminal::term::cell::Flags;
use alacritty_terminal::term::test::TermSize;
use alacritty_terminal::term::{Config, Term, TermMode};
use alacritty_terminal::tty;
use alacritty_terminal::vte::ansi::{Color, NamedColor, Rgb};
use gtk::prelude::*;
use gtk::{gdk, glib, graphene, pango};

use crate::keys;
use crate::view::TermView;

const FONT: &str = "Monospace 11";
const PAD: f32 = 4.0;

thread_local! {
    /// Widgets by id, reachable from the PTY thread through `MainContext::invoke`.
    static VIEWS: RefCell<HashMap<u64, glib::WeakRef<TermView>>> = RefCell::new(HashMap::new());
    static ON_EXIT: RefCell<HashMap<u64, Box<dyn Fn()>>> = RefCell::new(HashMap::new());
}

#[derive(Clone)]
struct Listener {
    id: u64,
    pending: Arc<AtomicBool>,
}

impl EventListener for Listener {
    fn send_event(&self, event: Event) {
        let id = self.id;
        match event {
            Event::Wakeup => {
                // Coalesce: one redraw request per frame no matter how much output arrived.
                if !self.pending.swap(true, Ordering::AcqRel) {
                    let pending = self.pending.clone();
                    glib::MainContext::default().invoke(move || {
                        pending.store(false, Ordering::Release);
                        VIEWS.with(|v| {
                            if let Some(w) = v.borrow().get(&id).and_then(|w| w.upgrade()) {
                                w.queue_draw();
                            }
                        });
                    });
                }
            }
            Event::Exit | Event::ChildExit(_) => {
                glib::MainContext::default().invoke(move || {
                    ON_EXIT.with(|m| {
                        if let Some(f) = m.borrow_mut().remove(&id) {
                            f();
                        }
                    });
                });
            }
            _ => {}
        }
    }
}

pub struct Terminal {
    pub widget: TermView,
}

struct State {
    term: Arc<FairMutex<Term<Listener>>>,
    sender: EventLoopSender,
    cell_w: StdCell<f64>,
    cell_h: StdCell<f64>,
    ascent: StdCell<f64>,
    size: StdCell<(usize, usize)>,
    pango: RefCell<Option<pango::Context>>,
}

impl State {
    fn write(&self, bytes: Vec<u8>) {
        let _ = self.sender.send(Msg::Input(bytes.into()));
    }
}

impl Terminal {
    pub fn new(id: u64, on_exit: impl Fn() + 'static) -> Terminal {
        let listener = Listener { id, pending: Arc::new(AtomicBool::new(false)) };
        let (cols, lines) = (80usize, 24usize);
        let term = Arc::new(FairMutex::new(Term::new(
            Config::default(),
            &TermSize::new(cols, lines),
            listener.clone(),
        )));
        let ws = WindowSize { num_lines: lines as u16, num_cols: cols as u16, cell_width: 8, cell_height: 16 };
        // GTKTERM_CMD runs one command instead of the login shell (used by the benchmarks).
        let mut opts = tty::Options::default();
        if let Ok(cmd) = std::env::var("GTKTERM_CMD") {
            opts.shell = Some(tty::Shell::new("/bin/sh".into(), vec!["-c".into(), cmd]));
        }
        let pty = tty::new(&opts, ws, id).expect("spawn shell");
        let event_loop = EventLoop::new(term.clone(), listener, pty, false, false).expect("pty loop");
        let sender = event_loop.channel();
        event_loop.spawn();

        let state = Rc::new(State {
            term,
            sender,
            cell_w: StdCell::new(8.0),
            cell_h: StdCell::new(16.0),
            ascent: StdCell::new(12.0),
            size: StdCell::new((cols, lines)),
            pango: RefCell::new(None),
        });

        let area = {
            let (d, r) = (state.clone(), state.clone());
            TermView::new(
                Box::new(move |snap, w, h| draw(snap, &d, w, h)),
                Box::new(move |w, h| resize(&r, w, h)),
            )
        };
        measure_font(&area, &state);
        *state.pango.borrow_mut() = Some(area.pango_context());

        VIEWS.with(|v| v.borrow_mut().insert(id, area.downgrade()));
        ON_EXIT.with(|m| m.borrow_mut().insert(id, Box::new(on_exit)));

        // Input: IM context first (dead keys, IBus), then control/navigation keys.
        let im = gtk::IMMulticontext::new();
        im.set_client_widget(Some(&area));
        {
            let state = state.clone();
            im.connect_commit(move |_, text| state.write(text.as_bytes().to_vec()));
        }
        let keyc = gtk::EventControllerKey::new();
        keyc.set_im_context(Some(&im));
        {
            let state = state.clone();
            keyc.connect_key_pressed(move |_, key, _, mods| {
                let app_cursor = state.term.lock().mode().contains(TermMode::APP_CURSOR);
                if let Some(bytes) = keys::encode(key, mods, app_cursor) {
                    state.write(bytes);
                    return glib::Propagation::Stop;
                }
                glib::Propagation::Proceed
            });
        }
        area.add_controller(keyc);
        let focus = gtk::EventControllerFocus::new();
        {
            let im = im.clone();
            focus.connect_enter(move |_| im.focus_in());
        }
        focus.connect_leave(move |_| im.focus_out());
        area.add_controller(focus);
        let click = gtk::GestureClick::new();
        click.connect_pressed(|g, _, _, _| {
            if let Some(w) = g.widget() {
                w.grab_focus();
            }
        });
        area.add_controller(click);

        // Paste with Ctrl+Shift+V.
        let paste = gtk::ShortcutController::new();
        {
            let state = state.clone();
            let area_w = area.downgrade();
            paste.add_shortcut(gtk::Shortcut::new(
                gtk::ShortcutTrigger::parse_string("<Control><Shift>v"),
                Some(gtk::CallbackAction::new(move |_, _| {
                    if let Some(a) = area_w.upgrade() {
                        let state = state.clone();
                        a.clipboard().read_text_async(None::<&gtk::gio::Cancellable>, move |r| {
                            if let Ok(Some(t)) = r {
                                state.write(t.as_bytes().to_vec());
                            }
                        });
                    }
                    glib::Propagation::Stop
                })),
            ));
        }
        area.add_controller(paste);

        Terminal { widget: area }
    }
}

fn font_desc() -> pango::FontDescription {
    pango::FontDescription::from_string(FONT)
}

fn measure_font(area: &TermView, state: &State) {
    let ctx = area.pango_context();
    let metrics = ctx.metrics(Some(&font_desc()), None);
    let scale = pango::SCALE as f64;
    state.cell_w.set(metrics.approximate_digit_width() as f64 / scale);
    state.cell_h.set(((metrics.ascent() + metrics.descent()) as f64 / scale).ceil());
    state.ascent.set(metrics.ascent() as f64 / scale);
}

fn resize(state: &State, w: i32, h: i32) {
    let cols = (((w as f64) - 2.0 * PAD as f64) / state.cell_w.get()).floor().max(2.0) as usize;
    let lines = (((h as f64) - 2.0 * PAD as f64) / state.cell_h.get()).floor().max(1.0) as usize;
    if state.size.get() == (cols, lines) {
        return;
    }
    state.size.set((cols, lines));
    state.term.lock().resize(TermSize::new(cols, lines));
    let ws = WindowSize {
        num_lines: lines as u16,
        num_cols: cols as u16,
        cell_width: state.cell_w.get() as u16,
        cell_height: state.cell_h.get() as u16,
    };
    let _ = state.sender.send(Msg::Resize(ws));
}

fn rgb(c: Rgb) -> gdk::RGBA {
    gdk::RGBA::new(c.r as f32 / 255.0, c.g as f32 / 255.0, c.b as f32 / 255.0, 1.0)
}

fn palette(i: usize) -> Rgb {
    const BASE: [(u8, u8, u8); 16] = [
        (0x1d, 0x1f, 0x21), (0xcc, 0x66, 0x66), (0xb5, 0xbd, 0x68), (0xf0, 0xc6, 0x74),
        (0x81, 0xa2, 0xbe), (0xb2, 0x94, 0xbb), (0x8a, 0xbe, 0xb7), (0xc5, 0xc8, 0xc6),
        (0x66, 0x66, 0x66), (0xd5, 0x4e, 0x53), (0xb9, 0xca, 0x4a), (0xe7, 0xc5, 0x47),
        (0x7a, 0xa6, 0xda), (0xc3, 0x97, 0xd8), (0x70, 0xc0, 0xb1), (0xea, 0xea, 0xea),
    ];
    if i < 16 {
        let (r, g, b) = BASE[i];
        return Rgb { r, g, b };
    }
    if i < 232 {
        let i = i - 16;
        let v = |x: usize| if x == 0 { 0 } else { (x * 40 + 55) as u8 };
        return Rgb { r: v(i / 36), g: v((i / 6) % 6), b: v(i % 6) };
    }
    let g = (8 + (i - 232) * 10) as u8;
    Rgb { r: g, g, b: g }
}

const FG: Rgb = Rgb { r: 0xc5, g: 0xc8, b: 0xc6 };
const BG: Rgb = Rgb { r: 0x16, g: 0x18, b: 0x1a };

fn resolve(c: Color, colors: &alacritty_terminal::term::color::Colors, fg: bool) -> Rgb {
    match c {
        Color::Spec(rgb) => rgb,
        Color::Indexed(i) => colors[i as usize].unwrap_or_else(|| palette(i as usize)),
        Color::Named(n) => {
            let i = n as usize;
            if let Some(c) = colors[i] {
                return c;
            }
            match n {
                NamedColor::Foreground | NamedColor::BrightForeground | NamedColor::DimForeground => FG,
                NamedColor::Background => BG,
                NamedColor::Cursor => FG,
                _ if i < 16 => palette(i),
                _ if i >= NamedColor::DimBlack as usize => palette(i - NamedColor::DimBlack as usize),
                _ => if fg { FG } else { BG },
            }
        }
    }
}

fn draw(snap: &gtk::Snapshot, state: &State, w: f32, h: f32) {
    snap.append_color(&rgb(BG), &graphene::Rect::new(0.0, 0.0, w, h));
    let cw = state.cell_w.get() as f32;
    let ch = state.cell_h.get() as f32;
    let term = state.term.lock();
    let content = term.renderable_content();
    let colors = content.colors;
    let cursor = content.cursor.point;
    let offset = content.display_offset as i32;
    let cols = term.columns();

    let font = font_desc();
    let mut line_text = String::with_capacity(cols * 2);
    let mut attrs = pango::AttrList::new();
    let mut current_line: i32 = i32::MIN;
    let mut ctx: Option<pango::Context> = state.pango.borrow().clone();

    let flush = |snap: &gtk::Snapshot, line: i32, text: &mut String, attrs: &mut pango::AttrList, ctx: &mut Option<pango::Context>| {
        if line == i32::MIN || text.is_empty() {
            return;
        }
        let Some(c) = ctx.as_ref() else { return };
        let layout = pango::Layout::new(c);
        layout.set_font_description(Some(&font));
        layout.set_text(text);
        layout.set_attributes(Some(attrs));
        snap.save();
        snap.translate(&graphene::Point::new(PAD, PAD + (line + offset) as f32 * ch));
        snap.append_layout(&layout, &rgb(FG));
        snap.restore();
        text.clear();
        *attrs = pango::AttrList::new();
    };

    for cell in content.display_iter {
        let line = cell.point.line.0;
        if line != current_line {
            flush(snap, current_line, &mut line_text, &mut attrs, &mut ctx);
            current_line = line;
        }
        let mut fg = resolve(cell.fg, colors, true);
        let mut bg = resolve(cell.bg, colors, false);
        if cell.flags.contains(Flags::INVERSE) {
            std::mem::swap(&mut fg, &mut bg);
        }
        let x = PAD + cell.point.column.0 as f32 * cw;
        let y = PAD + (line + offset) as f32 * ch;
        if bg != BG {
            snap.append_color(&rgb(bg), &graphene::Rect::new(x, y, cw, ch));
        }
        if cell.flags.intersects(Flags::WIDE_CHAR_SPACER | Flags::LEADING_WIDE_CHAR_SPACER) {
            continue;
        }
        // Pad skipped columns so text stays on the grid.
        let start = line_text.len() as u32;
        let ch_ = if cell.c == '\0' { ' ' } else { cell.c };
        line_text.push(ch_);
        let end = line_text.len() as u32;
        if fg != FG {
            let mut a = pango::AttrColor::new_foreground(fg.r as u16 * 257, fg.g as u16 * 257, fg.b as u16 * 257);
            a.set_start_index(start);
            a.set_end_index(end);
            attrs.insert(a);
        }
        if cell.flags.contains(Flags::BOLD) {
            let mut a = pango::AttrInt::new_weight(pango::Weight::Bold);
            a.set_start_index(start);
            a.set_end_index(end);
            attrs.insert(a);
        }
    }
    flush(snap, current_line, &mut line_text, &mut attrs, &mut ctx);

    // Block cursor.
    let x = PAD + cursor.column.0 as f32 * cw;
    let y = PAD + (cursor.line.0 + offset) as f32 * ch;
    snap.append_color(&gdk::RGBA::new(0.77, 0.78, 0.78, 0.55), &graphene::Rect::new(x, y, cw, ch));
}

