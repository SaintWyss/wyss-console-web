// The shared host tests already run in the console suite. An explicit --bins also
// selects this executable, so leave its test harness empty.
#![cfg(not(test))]

#[cfg(all(target_os = "linux", feature = "desktop"))]
#[path = "../host_modules.rs"]
mod host_modules;

#[cfg(all(target_os = "linux", feature = "desktop"))]
pub use host_modules::*;

#[cfg(all(target_os = "linux", not(feature = "desktop")))]
use wyss_console::host;

fn main() {
    #[cfg(target_os = "linux")]
    std::process::exit(host::run());
    #[cfg(not(target_os = "linux"))]
    {
        eprintln!("wyss-host is only available on Linux");
        std::process::exit(2);
    }
}
