//! Bindings to libghostty-vt (1.4.0), the terminal emulator core: VT parser, screen state, scrollback
//! and render state. The C API is marked unstable, so every FFI declaration lives in this module and the
//! rest of the crate only sees the safe wrappers below. Signatures follow /usr/include/ghostty/vt/*.h.
#![allow(dead_code)] // the FFI surface mirrors the headers; not every constant is used yet

use std::ffi::c_void;
use std::os::raw::c_int;

type Handle = *mut c_void;

const SUCCESS: c_int = 0;

// terminal.h: GhosttyTerminalOption / GhosttyTerminalData
const OPT_USERDATA: c_int = 0;
const OPT_WRITE_PTY: c_int = 1;
const OPT_COLOR_FOREGROUND: c_int = 11;
const OPT_COLOR_BACKGROUND: c_int = 12;
const OPT_COLOR_PALETTE: c_int = 14;
const OPT_SCROLLBACK_MAX_LINES: c_int = 28;
const TDATA_VIEWPORT_ACTIVE: c_int = 32;
const TDATA_MODE: c_int = 37;
// terminal.h: GhosttyTerminalScrollViewportTag
const SCROLL_BOTTOM: c_int = 1;
const SCROLL_DELTA: c_int = 2;
// modes.h: ghostty_mode_new(1, false) is DECCKM (application cursor keys)
const MODE_DECCKM: u16 = 1;

// render.h
const RDATA_COLS: c_int = 1;
const RDATA_ROWS: c_int = 2;
const RDATA_DIRTY: c_int = 3;
const RDATA_ROW_ITERATOR: c_int = 4;
const RDATA_CURSOR: c_int = 18;
const ROW_DATA_CELLS: c_int = 3;
const CELLS_RAW: c_int = 1;
const CELLS_STYLE: c_int = 2;
const CELLS_BG_COLOR: c_int = 5;
const CELLS_FG_COLOR: c_int = 6;
const CELLS_HAS_STYLING: c_int = 8;
const CELLS_GRAPHEMES_UTF8: c_int = 9;
// screen.h
const CELL_DATA_WIDE: c_int = 3;

#[repr(C)]
struct ScrollViewport {
    tag: c_int,
    value: [i64; 2],
}

#[repr(C)]
struct ModeConfig {
    mode: u16,
    value: bool,
}

#[repr(C)]
struct Buffer {
    ptr: *mut u8,
    cap: usize,
    len: usize,
}

/// GhosttyStyle. Colors are tagged unions of 16 bytes; they are never read (the resolved colors come
/// from `CELLS_FG_COLOR`/`CELLS_BG_COLOR`), only their size matters.
#[repr(C)]
struct RawStyle {
    size: usize,
    fg: [u64; 2],
    bg: [u64; 2],
    underline_color: [u64; 2],
    bold: bool,
    italic: bool,
    faint: bool,
    blink: bool,
    inverse: bool,
    invisible: bool,
    strikethrough: bool,
    overline: bool,
    underline: c_int,
}

#[repr(C)]
struct RawCursor {
    size: usize,
    viewport_has_value: bool,
    viewport_x: u16,
    viewport_y: u16,
    wide_tail: bool,
    visible: bool,
    blinking: bool,
    password_input: bool,
    visual_style: c_int,
}

#[link(name = "ghostty-vt")]
extern "C" {
    fn ghostty_terminal_new(alloc: *const c_void, out: *mut Handle, cols: u16, rows: u16) -> c_int;
    fn ghostty_terminal_free(t: Handle);
    fn ghostty_terminal_resize(t: Handle, cols: u16, rows: u16, cell_w: u32, cell_h: u32) -> c_int;
    fn ghostty_terminal_set(t: Handle, option: c_int, value: *const c_void) -> c_int;
    fn ghostty_terminal_get(t: Handle, data: c_int, out: *mut c_void) -> c_int;
    fn ghostty_terminal_vt_write(t: Handle, data: *const u8, len: usize);
    fn ghostty_terminal_scroll_viewport(t: Handle, behavior: ScrollViewport);

    fn ghostty_render_state_new(alloc: *const c_void, out: *mut Handle) -> c_int;
    fn ghostty_render_state_free(s: Handle);
    fn ghostty_render_state_update(s: Handle, t: Handle) -> c_int;
    fn ghostty_render_state_clean(s: Handle) -> c_int;
    fn ghostty_render_state_get(s: Handle, data: c_int, out: *mut c_void) -> c_int;
    fn ghostty_render_state_row_iterator_new(alloc: *const c_void, out: *mut Handle) -> c_int;
    fn ghostty_render_state_row_iterator_free(it: Handle);
    fn ghostty_render_state_row_iterator_next(it: Handle) -> bool;
    fn ghostty_render_state_row_iterator_next_dirty(it: Handle, out_y: *mut u16) -> bool;
    fn ghostty_render_state_row_get(it: Handle, data: c_int, out: *mut c_void) -> c_int;
    fn ghostty_render_state_row_cells_new(alloc: *const c_void, out: *mut Handle) -> c_int;
    fn ghostty_render_state_row_cells_free(c: Handle);
    fn ghostty_render_state_row_cells_next(c: Handle) -> bool;
    fn ghostty_render_state_row_cells_get(c: Handle, data: c_int, out: *mut c_void) -> c_int;
    fn ghostty_cell_get(cell: u64, data: c_int, out: *mut c_void) -> c_int;
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[repr(C)]
pub struct Rgb {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

// ---------------------------------------------------------------------------------------------
// Terminal: VT state machine + screen + scrollback.

struct ReplyCtx {
    f: Box<dyn FnMut(&[u8]) + Send>,
}

extern "C" fn write_pty_trampoline(_t: Handle, userdata: *mut c_void, data: *const u8, len: usize) {
    // SAFETY: userdata is the `ReplyCtx` boxed in `Terminal`, alive as long as the terminal.
    let ctx = unsafe { &mut *(userdata as *mut ReplyCtx) };
    let bytes = unsafe { std::slice::from_raw_parts(data, len) };
    (ctx.f)(bytes);
}

pub struct Terminal {
    raw: Handle,
    _ctx: Box<ReplyCtx>,
}

// SAFETY: the C terminal has no thread affinity; callers serialize access (it lives behind a Mutex).
unsafe impl Send for Terminal {}

impl Terminal {
    /// `reply` receives what the terminal answers to queries (DA, DSR, mode reports...); it runs
    /// synchronously inside `write` and must not call back into this terminal.
    pub fn new(cols: u16, rows: u16, scrollback_lines: usize, reply: Box<dyn FnMut(&[u8]) + Send>) -> Terminal {
        let mut raw: Handle = std::ptr::null_mut();
        let rc = unsafe { ghostty_terminal_new(std::ptr::null(), &mut raw, cols, rows) };
        assert_eq!(rc, SUCCESS, "ghostty_terminal_new");
        let mut ctx = Box::new(ReplyCtx { f: reply });
        unsafe {
            ghostty_terminal_set(raw, OPT_USERDATA, &mut *ctx as *mut ReplyCtx as *const c_void);
            ghostty_terminal_set(raw, OPT_WRITE_PTY, write_pty_trampoline as *const c_void);
            ghostty_terminal_set(raw, OPT_SCROLLBACK_MAX_LINES, &scrollback_lines as *const usize as *const c_void);
        }
        Terminal { raw, _ctx: ctx }
    }

    pub fn set_colors(&mut self, fg: Rgb, bg: Rgb, palette: &[Rgb; 256]) {
        unsafe {
            ghostty_terminal_set(self.raw, OPT_COLOR_FOREGROUND, &fg as *const Rgb as *const c_void);
            ghostty_terminal_set(self.raw, OPT_COLOR_BACKGROUND, &bg as *const Rgb as *const c_void);
            ghostty_terminal_set(self.raw, OPT_COLOR_PALETTE, palette.as_ptr() as *const c_void);
        }
    }

    pub fn write(&mut self, bytes: &[u8]) {
        unsafe { ghostty_terminal_vt_write(self.raw, bytes.as_ptr(), bytes.len()) }
    }

    pub fn resize(&mut self, cols: u16, rows: u16, cell_w: u32, cell_h: u32) {
        unsafe { ghostty_terminal_resize(self.raw, cols, rows, cell_w, cell_h) };
    }

    /// Scrolls the viewport; negative goes up into the scrollback.
    pub fn scroll_delta(&mut self, rows: isize) {
        let v = ScrollViewport { tag: SCROLL_DELTA, value: [rows as i64, 0] };
        unsafe { ghostty_terminal_scroll_viewport(self.raw, v) };
    }

    pub fn scroll_bottom(&mut self) {
        let v = ScrollViewport { tag: SCROLL_BOTTOM, value: [0, 0] };
        unsafe { ghostty_terminal_scroll_viewport(self.raw, v) };
    }

    /// True while the viewport follows the active area (not scrolled into history).
    pub fn viewport_active(&self) -> bool {
        let mut b = true;
        unsafe { ghostty_terminal_get(self.raw, TDATA_VIEWPORT_ACTIVE, &mut b as *mut bool as *mut c_void) };
        b
    }

    /// DECCKM: arrows send `ESC O x` instead of `ESC [ x`.
    pub fn app_cursor(&self) -> bool {
        let mut m = ModeConfig { mode: MODE_DECCKM, value: false };
        unsafe { ghostty_terminal_get(self.raw, TDATA_MODE, &mut m as *mut ModeConfig as *mut c_void) };
        m.value
    }
}

impl Drop for Terminal {
    fn drop(&mut self) {
        unsafe { ghostty_terminal_free(self.raw) }
    }
}

// ---------------------------------------------------------------------------------------------
// Render state: a snapshot of the viewport with per-row dirty tracking.

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Dirty {
    Clean,
    Partial,
    Full,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Wide {
    Narrow,
    Wide,
    /// Second half of a wide character (or the filler before one at a soft wrap): draws no text.
    Spacer,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum CursorStyle {
    Bar,
    Block,
    Underline,
    BlockHollow,
}

#[derive(Clone, Copy, Debug)]
pub struct Cursor {
    /// Column/row in the viewport, if the cursor is inside it.
    pub pos: Option<(u16, u16)>,
    pub visible: bool,
    pub style: CursorStyle,
    /// The cursor sits on the second cell of a wide character.
    pub wide_tail: bool,
}

const MAX_TEXT: usize = 16;

/// One cell with colors already resolved through the palette. `fg`/`bg` are `None` for the defaults.
#[derive(Clone, Copy)]
pub struct Cell {
    text: [u8; MAX_TEXT],
    text_len: u8,
    pub wide: Wide,
    pub fg: Option<Rgb>,
    pub bg: Option<Rgb>,
    pub bold: bool,
    pub italic: bool,
    pub faint: bool,
    pub inverse: bool,
    pub invisible: bool,
    pub strike: bool,
    pub underline: bool,
}

impl Cell {
    const BLANK: Cell = Cell {
        text: [0; MAX_TEXT],
        text_len: 0,
        wide: Wide::Narrow,
        fg: None,
        bg: None,
        bold: false,
        italic: false,
        faint: false,
        inverse: false,
        invisible: false,
        strike: false,
        underline: false,
    };

    /// The grapheme cluster shown in this cell; empty for blank cells. Clusters longer than
    /// 16 bytes are cut at a character boundary.
    pub fn text(&self) -> &str {
        std::str::from_utf8(&self.text[..self.text_len as usize]).unwrap_or("")
    }
}

pub struct RenderState {
    state: Handle,
    iter: Handle,
    cells: Handle,
}

// SAFETY: same as Terminal; only the GTK thread touches it.
unsafe impl Send for RenderState {}

impl RenderState {
    pub fn new() -> RenderState {
        let (mut state, mut iter, mut cells) = (std::ptr::null_mut(), std::ptr::null_mut(), std::ptr::null_mut());
        unsafe {
            assert_eq!(ghostty_render_state_new(std::ptr::null(), &mut state), SUCCESS);
            assert_eq!(ghostty_render_state_row_iterator_new(std::ptr::null(), &mut iter), SUCCESS);
            assert_eq!(ghostty_render_state_row_cells_new(std::ptr::null(), &mut cells), SUCCESS);
        }
        RenderState { state, iter, cells }
    }

    /// Captures the terminal's viewport. Dirty flags accumulate until `clean`.
    pub fn update(&mut self, term: &Terminal) {
        unsafe { ghostty_render_state_update(self.state, term.raw) };
    }

    pub fn clean(&mut self) {
        unsafe { ghostty_render_state_clean(self.state) };
    }

    pub fn size(&self) -> (u16, u16) {
        let (mut c, mut r) = (0u16, 0u16);
        unsafe {
            ghostty_render_state_get(self.state, RDATA_COLS, &mut c as *mut u16 as *mut c_void);
            ghostty_render_state_get(self.state, RDATA_ROWS, &mut r as *mut u16 as *mut c_void);
        }
        (c, r)
    }

    pub fn dirty(&self) -> Dirty {
        let mut d: c_int = 0;
        unsafe { ghostty_render_state_get(self.state, RDATA_DIRTY, &mut d as *mut c_int as *mut c_void) };
        match d {
            0 => Dirty::Clean,
            1 => Dirty::Partial,
            _ => Dirty::Full,
        }
    }

    pub fn cursor(&self) -> Cursor {
        let mut c = RawCursor {
            size: std::mem::size_of::<RawCursor>(),
            viewport_has_value: false,
            viewport_x: 0,
            viewport_y: 0,
            wide_tail: false,
            visible: false,
            blinking: false,
            password_input: false,
            visual_style: 1,
        };
        unsafe { ghostty_render_state_get(self.state, RDATA_CURSOR, &mut c as *mut RawCursor as *mut c_void) };
        Cursor {
            pos: c.viewport_has_value.then_some((c.viewport_x, c.viewport_y)),
            visible: c.visible,
            style: match c.visual_style {
                0 => CursorStyle::Bar,
                2 => CursorStyle::Underline,
                3 => CursorStyle::BlockHollow,
                _ => CursorStyle::Block,
            },
            wide_tail: c.wide_tail,
        }
    }

    /// Calls `f(row, cells)` for the rows that need a redraw, top to bottom: only the dirty ones
    /// (every row when the whole frame is dirty), or all rows when `all` is set. Does not clean.
    pub fn for_rows(&mut self, all: bool, mut f: impl FnMut(u16, &[Cell])) {
        let rc = unsafe { ghostty_render_state_get(self.state, RDATA_ROW_ITERATOR, &mut self.iter as *mut Handle as *mut c_void) };
        if rc != SUCCESS {
            return;
        }
        let mut row: Vec<Cell> = Vec::with_capacity(256);
        let mut counter: u16 = 0;
        loop {
            let mut y: u16 = 0;
            let more = unsafe {
                if all {
                    let m = ghostty_render_state_row_iterator_next(self.iter);
                    y = counter;
                    counter = counter.wrapping_add(1);
                    m
                } else {
                    ghostty_render_state_row_iterator_next_dirty(self.iter, &mut y)
                }
            };
            if !more {
                break;
            }
            row.clear();
            let rc = unsafe { ghostty_render_state_row_get(self.iter, ROW_DATA_CELLS, &mut self.cells as *mut Handle as *mut c_void) };
            if rc != SUCCESS {
                continue;
            }
            while unsafe { ghostty_render_state_row_cells_next(self.cells) } {
                row.push(self.read_cell());
            }
            f(y, &row);
        }
    }

    fn read_cell(&self) -> Cell {
        let c = self.cells;
        let mut cell = Cell::BLANK;
        unsafe {
            // Wide property comes from the raw cell.
            let mut raw: u64 = 0;
            if ghostty_render_state_row_cells_get(c, CELLS_RAW, &mut raw as *mut u64 as *mut c_void) == SUCCESS {
                let mut w: c_int = 0;
                ghostty_cell_get(raw, CELL_DATA_WIDE, &mut w as *mut c_int as *mut c_void);
                cell.wide = match w {
                    1 => Wide::Wide,
                    2 | 3 => Wide::Spacer,
                    _ => Wide::Narrow,
                };
            }
            // Text: the whole grapheme cluster as UTF-8.
            let mut buf = [0u8; 64];
            let mut b = Buffer { ptr: buf.as_mut_ptr(), cap: buf.len(), len: 0 };
            match ghostty_render_state_row_cells_get(c, CELLS_GRAPHEMES_UTF8, &mut b as *mut Buffer as *mut c_void) {
                SUCCESS => {
                    let mut n = b.len.min(MAX_TEXT);
                    while n > 0 && std::str::from_utf8(&buf[..n]).is_err() {
                        n -= 1;
                    }
                    cell.text[..n].copy_from_slice(&buf[..n]);
                    cell.text_len = n as u8;
                }
                _ => {
                    // Cluster longer than the buffer: show the replacement character.
                    let r = "\u{fffd}".as_bytes();
                    cell.text[..r.len()].copy_from_slice(r);
                    cell.text_len = r.len() as u8;
                }
            }
            let mut rgb = Rgb { r: 0, g: 0, b: 0 };
            if ghostty_render_state_row_cells_get(c, CELLS_BG_COLOR, &mut rgb as *mut Rgb as *mut c_void) == SUCCESS {
                cell.bg = Some(rgb);
            }
            let mut styled = false;
            ghostty_render_state_row_cells_get(c, CELLS_HAS_STYLING, &mut styled as *mut bool as *mut c_void);
            if styled {
                if ghostty_render_state_row_cells_get(c, CELLS_FG_COLOR, &mut rgb as *mut Rgb as *mut c_void) == SUCCESS {
                    cell.fg = Some(rgb);
                }
                let mut st: RawStyle = std::mem::zeroed();
                st.size = std::mem::size_of::<RawStyle>();
                if ghostty_render_state_row_cells_get(c, CELLS_STYLE, &mut st as *mut RawStyle as *mut c_void) == SUCCESS {
                    cell.bold = st.bold;
                    cell.italic = st.italic;
                    cell.faint = st.faint;
                    cell.inverse = st.inverse;
                    cell.invisible = st.invisible;
                    cell.strike = st.strikethrough;
                    cell.underline = st.underline != 0;
                }
            }
        }
        cell
    }
}

impl Drop for RenderState {
    fn drop(&mut self) {
        unsafe {
            ghostty_render_state_row_cells_free(self.cells);
            ghostty_render_state_row_iterator_free(self.iter);
            ghostty_render_state_free(self.state);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Mutex};

    /// Sizes the C headers report (abi/check-abi.sh checks the same numbers against the headers).
    #[test]
    fn ffi_struct_sizes_match_libghostty_1_4() {
        use std::mem::{offset_of, size_of};
        assert_eq!(size_of::<RawStyle>(), 72);
        assert_eq!(offset_of!(RawStyle, bold), 56);
        assert_eq!(offset_of!(RawStyle, underline), 64);
        assert_eq!(size_of::<RawCursor>(), 24);
        assert_eq!(offset_of!(RawCursor, visual_style), 20);
        assert_eq!(size_of::<ScrollViewport>(), 24);
        assert_eq!(size_of::<ModeConfig>(), 4);
        assert_eq!(size_of::<Rgb>(), 3);
    }

    const RED: Rgb = Rgb { r: 0xcc, g: 0x66, b: 0x66 };
    const FG: Rgb = Rgb { r: 0xc5, g: 0xc8, b: 0xc6 };
    const BG: Rgb = Rgb { r: 0x16, g: 0x18, b: 0x1a };

    fn term(cols: u16, rows: u16) -> (Terminal, RenderState, Arc<Mutex<Vec<u8>>>) {
        let replies = Arc::new(Mutex::new(Vec::new()));
        let r2 = replies.clone();
        let mut t = Terminal::new(cols, rows, 1000, Box::new(move |b| r2.lock().unwrap().extend_from_slice(b)));
        let mut pal = [Rgb { r: 0, g: 0, b: 0 }; 256];
        pal[1] = RED;
        t.set_colors(FG, BG, &pal);
        (t, RenderState::new(), replies)
    }

    fn rows(rs: &mut RenderState, all: bool) -> Vec<(u16, Vec<Cell>)> {
        let mut out = Vec::new();
        rs.for_rows(all, |y, cells| out.push((y, cells.to_vec())));
        out
    }

    #[test]
    fn text_and_colors_round_trip() {
        let (mut t, mut rs, _) = term(20, 3);
        t.write(b"hola\x1b[31mrojo");
        rs.update(&t);
        let r = rows(&mut rs, true);
        assert_eq!(r.len(), 3);
        let line: String = r[0].1.iter().map(|c| if c.text().is_empty() { ' ' } else { c.text().chars().next().unwrap() }).collect();
        assert!(line.starts_with("holarojo"), "{line:?}");
        assert_eq!(r[0].1[0].fg, None, "default colors are reported as None");
        assert_eq!(r[0].1[3].fg, None);
        assert_eq!(r[0].1[4].fg, Some(RED), "'r' after SGR 31 uses palette 1");
        assert_eq!(r[0].1[7].fg, Some(RED));
        assert!(r[0].1[8].text().is_empty());
    }

    #[test]
    fn wide_chars_take_two_cells() {
        let (mut t, mut rs, _) = term(10, 2);
        t.write("日a".as_bytes());
        rs.update(&t);
        let r = rows(&mut rs, true);
        let c = &r[0].1;
        assert_eq!((c[0].text(), c[0].wide), ("日", Wide::Wide));
        assert_eq!(c[1].wide, Wide::Spacer);
        assert_eq!(c[2].text(), "a");
        assert_eq!(c[2].wide, Wide::Narrow);
    }

    #[test]
    fn only_the_written_row_is_dirty() {
        let (mut t, mut rs, _) = term(20, 5);
        rs.update(&t);
        assert_eq!(rs.dirty(), Dirty::Full, "first frame is fully dirty");
        assert_eq!(rows(&mut rs, false).len(), 5);
        rs.clean();
        rs.update(&t);
        assert_eq!(rs.dirty(), Dirty::Clean);
        assert!(rows(&mut rs, false).is_empty());
        t.write(b"x");
        rs.update(&t);
        assert_eq!(rs.dirty(), Dirty::Partial);
        let d: Vec<u16> = rows(&mut rs, false).iter().map(|r| r.0).collect();
        assert_eq!(d, vec![0]);
        rs.clean();
        t.write(b"\r\n\r\nz");
        rs.update(&t);
        let d: Vec<u16> = rows(&mut rs, false).iter().map(|r| r.0).collect();
        assert_eq!(d, vec![0, 1, 2], "rows touched by the cursor move and the write; rows 3 and 4 stay clean");
    }

    #[test]
    fn queries_are_answered_through_the_reply_callback() {
        let (mut t, _, replies) = term(20, 3);
        t.write(b"\x1b[6n"); // cursor position report
        assert_eq!(&*replies.lock().unwrap(), b"\x1b[1;1R");
    }
}
