//! Parser-only throughput of libghostty-vt over a file, written in 64 KiB chunks.
//! Reuses the crate's FFI module instead of declaring the bindings again.
#![allow(dead_code)]
use std::time::Instant;

#[path = "../ghostty.rs"]
mod ghostty;

fn main() {
    let data = std::fs::read(std::env::args().nth(1).expect("file")).unwrap();
    for _ in 0..2 {
        let mut term = ghostty::Terminal::new(120, 40, 10_000, Box::new(|_| {}));
        let t = Instant::now();
        for c in data.chunks(65536) {
            term.write(c);
        }
        println!("libghostty-vt: {:.3}s", t.elapsed().as_secs_f64());
    }
}
