//! Parser-only throughput: alacritty_terminal vs libghostty-vt over the same file, 64 KiB chunks.
use std::time::Instant;
use alacritty_terminal::event::VoidListener;
use alacritty_terminal::term::{test::TermSize, Config, Term};
use alacritty_terminal::vte::ansi::Processor;

#[repr(C)] struct Opaque { _p: [u8; 0] }
#[link(name = "ghostty-vt")]
extern "C" {
    fn ghostty_terminal_new(alloc: *const Opaque, t: *mut *mut Opaque, cols: u16, rows: u16) -> i32;
    fn ghostty_terminal_vt_write(t: *mut Opaque, data: *const u8, len: usize);
    fn ghostty_terminal_free(t: *mut Opaque);
}

fn main() {
    let data = std::fs::read(std::env::args().nth(1).expect("file")).unwrap();
    for _ in 0..2 {
        let mut term = Term::new(Config::default(), &TermSize::new(120, 40), VoidListener);
        let mut p: Processor = Processor::new();
        let t = Instant::now();
        for c in data.chunks(65536) { p.advance(&mut term, c); }
        println!("alacritty_terminal: {:.3}s", t.elapsed().as_secs_f64());
        unsafe {
            let mut g = std::ptr::null_mut();
            assert_eq!(ghostty_terminal_new(std::ptr::null(), &mut g, 120, 40), 0);
            let t = Instant::now();
            for c in data.chunks(65536) { ghostty_terminal_vt_write(g, c.as_ptr(), c.len()); }
            println!("libghostty-vt:      {:.3}s", t.elapsed().as_secs_f64());
            ghostty_terminal_free(g);
        }
    }
}
