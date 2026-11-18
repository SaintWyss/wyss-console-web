//! Default colors and the 256-color palette (base 16 + 6x6x6 cube + grayscale ramp).

use crate::ghostty::Rgb;

/// `--terminal-fg` and `--terminal-bg` of the Console (`src/app.css`).
pub const FG: Rgb = Rgb { r: 0xec, g: 0xec, b: 0xec };
pub const BG: Rgb = Rgb { r: 0x0e, g: 0x0e, b: 0x0e };

pub fn table() -> [Rgb; 256] {
    const BASE: [(u8, u8, u8); 16] = [
        (0x1d, 0x1f, 0x21), (0xcc, 0x66, 0x66), (0xb5, 0xbd, 0x68), (0xf0, 0xc6, 0x74),
        (0x81, 0xa2, 0xbe), (0xb2, 0x94, 0xbb), (0x8a, 0xbe, 0xb7), (0xc5, 0xc8, 0xc6),
        (0x66, 0x66, 0x66), (0xd5, 0x4e, 0x53), (0xb9, 0xca, 0x4a), (0xe7, 0xc5, 0x47),
        (0x7a, 0xa6, 0xda), (0xc3, 0x97, 0xd8), (0x70, 0xc0, 0xb1), (0xea, 0xea, 0xea),
    ];
    let mut t = [Rgb { r: 0, g: 0, b: 0 }; 256];
    for (i, e) in t.iter_mut().enumerate() {
        *e = if i < 16 {
            let (r, g, b) = BASE[i];
            Rgb { r, g, b }
        } else if i < 232 {
            let i = i - 16;
            let v = |x: usize| if x == 0 { 0 } else { (x * 40 + 55) as u8 };
            Rgb { r: v(i / 36), g: v((i / 6) % 6), b: v(i % 6) }
        } else {
            let g = (8 + (i - 232) * 10) as u8;
            Rgb { r: g, g, b: g }
        };
    }
    t
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn palette_layout() {
        let t = table();
        assert_eq!(t[1], Rgb { r: 0xcc, g: 0x66, b: 0x66 });
        assert_eq!(t[16], Rgb { r: 0, g: 0, b: 0 });
        assert_eq!(t[231], Rgb { r: 255, g: 255, b: 255 });
        assert_eq!(t[232], Rgb { r: 8, g: 8, b: 8 });
        assert_eq!(t[255], Rgb { r: 238, g: 238, b: 238 });
    }
}
