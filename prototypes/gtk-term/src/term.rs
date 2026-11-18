//! A terminal widget: libghostty-vt keeps the screen state, GTK's scene graph (GSK) draws it on the
//! GPU. No WebView, no DOM. Output flows PTY -> reader thread -> `ghostty::Terminal` (behind a fair
//! lock); the GTK thread snapshots it into a `RenderState` and rebuilds only the dirty rows.

use std::cell::{Cell as StdCell, RefCell};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::rc::Rc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};

use gtk::prelude::*;
use gtk::{gdk, glib, graphene, gsk, pango};

use crate::ghostty::{self, Cell, CursorStyle, Dirty, Rgb, Wide};
use crate::palette;
use crate::pty::Pty;
use crate::keys;
use crate::view::TermView;

const FONT: &str = "Monospace 11";
const PAD: f32 = 4.0;
const SCROLLBACK_LINES: usize = 10_000;
const READ_BLOCK: usize = 256 * 1024;
const WHEEL_LINES: f64 = 3.0;

thread_local! {
    /// Widgets by id, reachable from the PTY thread through `MainContext::invoke`.
    static VIEWS: RefCell<HashMap<u64, glib::WeakRef<TermView>>> = RefCell::new(HashMap::new());
    static ON_EXIT: RefCell<HashMap<u64, Box<dyn Fn()>>> = RefCell::new(HashMap::new());
}

/// The terminal shared between the reader thread (writes output) and the GTK thread (snapshots it,
/// scrolls, resizes). `next` makes the lock fair: a waiter queues on `next` first, so the reader
/// cannot starve the draw while output floods in.
struct Shared {
    term: Mutex<ghostty::Terminal>,
    next: Mutex<()>,
    /// A redraw is already requested and not yet painted.
    pending: AtomicBool,
}

impl Shared {
    fn lock(&self) -> MutexGuard<'_, ghostty::Terminal> {
        let queue = self.next.lock().unwrap_or_else(|e| e.into_inner());
        let guard = self.term.lock().unwrap_or_else(|e| e.into_inner());
        drop(queue);
        guard
    }
}

/// Requests one redraw per frame: the flag stays set until `draw` clears it, so a flood of output
/// costs a single main-loop dispatch per painted frame.
fn request_redraw(shared: &Shared, id: u64) {
    if !shared.pending.swap(true, Ordering::AcqRel) {
        glib::MainContext::default().invoke(move || {
            VIEWS.with(|v| {
                if let Some(w) = v.borrow().get(&id).and_then(|w| w.upgrade()) {
                    w.queue_draw();
                }
            });
        });
    }
}

pub struct Terminal {
    pub widget: TermView,
}

/// GTK-thread side of the drawing: the render state and the node cached for each viewport row.
struct Frame {
    rs: ghostty::RenderState,
    rows: Vec<Option<gsk::RenderNode>>,
    size: (u16, u16),
}

struct State {
    shared: Arc<Shared>,
    pty: Pty,
    input: Arc<std::fs::File>,
    cell_w: StdCell<f64>,
    cell_h: StdCell<f64>,
    size: StdCell<(usize, usize)>,
    pango: RefCell<Option<pango::Context>>,
    frame: RefCell<Frame>,
}

impl State {
    /// User input: snaps the view back to the bottom, then goes to the child.
    fn write(&self, bytes: &[u8]) {
        {
            let mut t = self.shared.lock();
            if !t.viewport_active() {
                t.scroll_bottom();
            }
        }
        let _ = (&*self.input).write_all(bytes);
    }
}

impl Terminal {
    pub fn new(id: u64, on_exit: impl Fn() + 'static) -> Terminal {
        let (cols, lines) = (80usize, 24usize);
        // GTKTERM_CMD runs one command instead of the login shell (used by the benchmarks).
        let cmd = std::env::var("GTKTERM_CMD").ok();
        let (pty, reader) = Pty::spawn(cols as u16, lines as u16, 8, 16, cmd.as_deref()).expect("spawn shell");
        let input = pty.writer();

        // What the terminal answers to queries (DA, cursor position, mode reports) goes to the child.
        let reply_to = input.clone();
        let mut term = ghostty::Terminal::new(
            cols as u16,
            lines as u16,
            SCROLLBACK_LINES,
            Box::new(move |bytes| {
                let _ = (&*reply_to).write_all(bytes);
            }),
        );
        term.set_colors(palette::FG, palette::BG, &palette::table());
        let shared = Arc::new(Shared { term: Mutex::new(term), next: Mutex::new(()), pending: AtomicBool::new(false) });

        // Reader thread: big blocks from the PTY straight into the interpreter.
        {
            let shared = shared.clone();
            std::thread::spawn(move || {
                let mut reader = reader;
                let mut buf = vec![0u8; READ_BLOCK];
                loop {
                    match reader.file.read(&mut buf) {
                        Ok(0) => break,
                        Ok(n) => {
                            shared.lock().write(&buf[..n]);
                            request_redraw(&shared, id);
                        }
                        Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
                        Err(_) => break, // EIO: the child closed the slave side
                    }
                }
                reader.reap();
                glib::MainContext::default().invoke(move || {
                    ON_EXIT.with(|m| {
                        if let Some(f) = m.borrow_mut().remove(&id) {
                            f();
                        }
                    });
                });
            });
        }

        let state = Rc::new(State {
            shared: shared.clone(),
            pty,
            input,
            cell_w: StdCell::new(8.0),
            cell_h: StdCell::new(16.0),
            size: StdCell::new((cols, lines)),
            pango: RefCell::new(None),
            frame: RefCell::new(Frame { rs: ghostty::RenderState::new(), rows: Vec::new(), size: (0, 0) }),
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
            im.connect_commit(move |_, text| state.write(text.as_bytes()));
        }
        let keyc = gtk::EventControllerKey::new();
        keyc.set_im_context(Some(&im));
        {
            let state = state.clone();
            keyc.connect_key_pressed(move |_, key, _, mods| {
                let app_cursor = state.shared.lock().app_cursor();
                if let Some(bytes) = keys::encode(key, mods, app_cursor) {
                    state.write(&bytes);
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

        // Mouse wheel scrolls the scrollback.
        let wheel = gtk::EventControllerScroll::new(gtk::EventControllerScrollFlags::VERTICAL);
        {
            let state = state.clone();
            let area_w = area.downgrade();
            wheel.connect_scroll(move |_, _dx, dy| {
                let mut rows = (dy * WHEEL_LINES).round() as isize;
                if rows == 0 && dy != 0.0 {
                    rows = dy.signum() as isize;
                }
                state.shared.lock().scroll_delta(rows);
                if let Some(a) = area_w.upgrade() {
                    a.queue_draw();
                }
                glib::Propagation::Stop
            });
        }
        area.add_controller(wheel);

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
                                state.write(t.as_bytes());
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
}

fn resize(state: &State, w: i32, h: i32) {
    let cols = (((w as f64) - 2.0 * PAD as f64) / state.cell_w.get()).floor().max(2.0) as usize;
    let lines = (((h as f64) - 2.0 * PAD as f64) / state.cell_h.get()).floor().max(1.0) as usize;
    if state.size.get() == (cols, lines) {
        return;
    }
    state.size.set((cols, lines));
    let (cw, ch) = (state.cell_w.get() as u16, state.cell_h.get() as u16);
    state.shared.lock().resize(cols as u16, lines as u16, cw as u32, ch as u32);
    state.pty.resize(cols as u16, lines as u16, cw, ch);
}

fn rgba(c: Rgb) -> gdk::RGBA {
    gdk::RGBA::new(c.r as f32 / 255.0, c.g as f32 / 255.0, c.b as f32 / 255.0, 1.0)
}

fn mix(a: Rgb, b: Rgb) -> Rgb {
    let m = |x: u8, y: u8| ((x as u16 + y as u16) / 2) as u8;
    Rgb { r: m(a.r, b.r), g: m(a.g, b.g), b: m(a.b, b.b) }
}

/// Text accumulated for one pango layout: narrow cells in a row share a run; each wide cell gets its
/// own, so a fallback-font glyph can never push the following cells off the grid.
struct Run {
    col: usize,
    text: String,
    attrs: pango::AttrList,
    ink: bool,
}

impl Run {
    fn new() -> Run {
        Run { col: 0, text: String::new(), attrs: pango::AttrList::new(), ink: false }
    }
}

/// Inserts `attr` into `list`, limited to the byte range `start..end`.
macro_rules! add {
    ($list:expr, $attr:expr, $start:expr, $end:expr) => {{
        let mut a = $attr;
        a.set_start_index($start as u32);
        a.set_end_index($end as u32);
        $list.insert(a);
    }};
}

/// Builds the render node of one viewport row (coordinates relative to the row's top-left corner).
fn build_row(ctx: &pango::Context, font: &pango::FontDescription, cells: &[Cell], cw: f32, ch: f32) -> Option<gsk::RenderNode> {
    let snap = gtk::Snapshot::new();
    let mut run = Run::new();
    let mut bg_run: Option<(usize, Rgb)> = None; // (first column, color)

    let flush_run = |snap: &gtk::Snapshot, run: &mut Run| {
        if run.ink {
            let layout = pango::Layout::new(ctx);
            layout.set_font_description(Some(font));
            layout.set_text(&run.text);
            layout.set_attributes(Some(&run.attrs));
            snap.save();
            snap.translate(&graphene::Point::new(PAD + run.col as f32 * cw, 0.0));
            snap.append_layout(&layout, &rgba(palette::FG));
            snap.restore();
        }
        *run = Run::new();
    };
    let flush_bg = |snap: &gtk::Snapshot, bg: &mut Option<(usize, Rgb)>, end: usize| {
        if let Some((start, c)) = bg.take() {
            snap.append_color(&rgba(c), &graphene::Rect::new(PAD + start as f32 * cw, 0.0, (end - start) as f32 * cw, ch));
        }
    };

    for (col, cell) in cells.iter().enumerate() {
        let mut fg = cell.fg.unwrap_or(palette::FG);
        let mut bg = cell.bg;
        if cell.inverse {
            let f = fg;
            fg = bg.unwrap_or(palette::BG);
            bg = Some(f);
        }
        if cell.faint {
            fg = mix(fg, bg.unwrap_or(palette::BG));
        }
        // Backgrounds: merge neighbours of the same color into one rectangle.
        let bg = bg.filter(|b| *b != palette::BG);
        match (&bg_run, bg) {
            (Some((_, c)), Some(b)) if *c == b => {}
            _ => {
                flush_bg(&snap, &mut bg_run, col);
                if let Some(b) = bg {
                    bg_run = Some((col, b));
                }
            }
        }
        if cell.wide == Wide::Spacer {
            continue;
        }
        let wide = cell.wide == Wide::Wide;
        if wide {
            flush_run(&snap, &mut run);
        }
        if run.text.is_empty() {
            run.col = col;
        }
        let t = if cell.text().is_empty() || cell.invisible { " " } else { cell.text() };
        let start = run.text.len();
        run.text.push_str(t);
        let end = run.text.len();
        let blank = t == " " && !cell.underline && !cell.strike;
        if !blank {
            run.ink = true;
        }
        if fg != palette::FG {
            add!(run.attrs, pango::AttrColor::new_foreground(fg.r as u16 * 257, fg.g as u16 * 257, fg.b as u16 * 257), start, end);
        }
        if cell.bold {
            add!(run.attrs, pango::AttrInt::new_weight(pango::Weight::Bold), start, end);
        }
        if cell.italic {
            add!(run.attrs, pango::AttrInt::new_style(pango::Style::Italic), start, end);
        }
        if cell.underline {
            add!(run.attrs, pango::AttrInt::new_underline(pango::Underline::Single), start, end);
        }
        if cell.strike {
            add!(run.attrs, pango::AttrInt::new_strikethrough(true), start, end);
        }
        if wide {
            flush_run(&snap, &mut run);
        }
    }
    flush_run(&snap, &mut run);
    flush_bg(&snap, &mut bg_run, cells.len());
    snap.to_node()
}

fn draw(snap: &gtk::Snapshot, state: &State, w: f32, h: f32) {
    if std::env::var_os("GTKTERM_NODRAW").is_some() {
        return;
    }
    snap.append_color(&rgba(palette::BG), &graphene::Rect::new(0.0, 0.0, w, h));
    let cw = state.cell_w.get() as f32;
    let ch = state.cell_h.get() as f32;

    // Clear the request flag before capturing, so output arriving from here on asks for a new frame.
    state.shared.pending.store(false, Ordering::Release);
    let mut frame = state.frame.borrow_mut();
    let Frame { rs, rows, size } = &mut *frame;
    {
        let term = state.shared.lock();
        rs.update(&term);
    }
    let new_size = rs.size();
    let all = *size != new_size;
    if all {
        *size = new_size;
        rows.clear();
        rows.resize(new_size.1 as usize, None);
    }

    // Rebuild only the dirty rows (every row after a resize), then mark the frame clean.
    if all || rs.dirty() != Dirty::Clean {
        let ctx = state.pango.borrow().clone();
        if let Some(ctx) = ctx {
            let font = font_desc();
            rs.for_rows(all, |y, cells| {
                if let Some(slot) = rows.get_mut(y as usize) {
                    *slot = build_row(&ctx, &font, cells, cw, ch);
                }
            });
        }
        rs.clean();
    }

    for (y, node) in rows.iter().enumerate() {
        if let Some(n) = node {
            snap.save();
            snap.translate(&graphene::Point::new(0.0, PAD + y as f32 * ch));
            snap.append_node(n);
            snap.restore();
        }
    }

    // Cursor, in the style the application asked for.
    let cur = rs.cursor();
    if let (true, Some((cx, cy))) = (cur.visible, cur.pos) {
        let (cx, span) = if cur.wide_tail { (cx.saturating_sub(1), 2.0) } else { (cx, 1.0) };
        let (x, y, cwid) = (PAD + cx as f32 * cw, PAD + cy as f32 * ch, cw * span);
        let col = gdk::RGBA::new(0.77, 0.78, 0.78, 0.55);
        match cur.style {
            CursorStyle::Block => snap.append_color(&col, &graphene::Rect::new(x, y, cwid, ch)),
            CursorStyle::Bar => snap.append_color(&col, &graphene::Rect::new(x, y, 2.0, ch)),
            CursorStyle::Underline => snap.append_color(&col, &graphene::Rect::new(x, y + ch - 2.0, cwid, 2.0)),
            CursorStyle::BlockHollow => {
                snap.append_color(&col, &graphene::Rect::new(x, y, cwid, 1.0));
                snap.append_color(&col, &graphene::Rect::new(x, y + ch - 1.0, cwid, 1.0));
                snap.append_color(&col, &graphene::Rect::new(x, y, 1.0, ch));
                snap.append_color(&col, &graphene::Rect::new(x + cwid - 1.0, y, 1.0, ch));
            }
        }
    }
}
