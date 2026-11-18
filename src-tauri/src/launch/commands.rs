use super::*;
use crate::arsenal::{Arsenal, store::Store};
use crate::host::protocol::HostError;
use std::sync::{Arc, Mutex};
use tauri::State;

// Window commands

fn places() -> Result<Places, HostError> {
    Places::from_env().ok_or_else(|| HostError::new("launch_unavailable"))
}

fn refused(error: String) -> HostError {
    let mut e = HostError::new("launch_invalid");
    e.reasons.push(error);
    e
}

#[tauri::command]
pub async fn launch_list() -> Result<List, HostError> {
    tauri::async_runtime::spawn_blocking(|| list(&places()?).map_err(refused))
        .await
        .map_err(|_| HostError::new("internal"))?
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct LaunchRequest {
    id: String,
}

/// The launch as its file says now, for the window to open.
#[tauri::command]
pub async fn launch_get(request: LaunchRequest) -> Result<Launch, HostError> {
    tauri::async_runtime::spawn_blocking(move || get(&places()?, &request.id).map_err(refused))
        .await
        .map_err(|_| HostError::new("internal"))?
}

#[tauri::command]
pub async fn launch_before(request: LaunchRequest) -> Result<Vec<Outcome>, HostError> {
    tauri::async_runtime::spawn_blocking(move || {
        let launch = get(&places()?, &request.id).map_err(refused)?;
        Ok(run_before(&launch, BEFORE_TIMEOUT))
    })
    .await
    .map_err(|_| HostError::new("internal"))?
}

/// What the desktop holds: the presets from the Arsenal library.
struct Desktop {
    library: Option<Arc<Mutex<Store>>>,
}

impl Known for Desktop {
    fn presets(&self, agent: &str) -> Result<Vec<String>, String> {
        let library = self
            .library
            .as_ref()
            .ok_or("the Arsenal library is not open")?;
        let store = library
            .lock()
            .map_err(|_| "the Arsenal library is busy".to_owned())?;
        let selections = store
            .selections()
            .map_err(|_| "the Arsenal presets could not be read".to_owned())?;
        Ok(selections
            .into_iter()
            .filter(|s| s.provider == agent)
            .map(|s| s.name)
            .collect())
    }
}

fn saving(refusal: SaveRefusal) -> HostError {
    match refusal {
        SaveRefusal::Exists => HostError::new("exists"),
        SaveRefusal::Invalid(why) => refused(why),
    }
}

/// Saves the launch the window describes. The file is written by the desktop, which checks the
/// permission and the preset itself; a launch that already exists is replaced only when asked.
#[tauri::command]
pub async fn launch_save(
    request: SaveRequest,
    arsenal: State<'_, Arsenal>,
) -> Result<Launch, HostError> {
    let known = Desktop {
        library: arsenal.launch_handle(),
    };
    tauri::async_runtime::spawn_blocking(move || save(&places()?, &request, &known).map_err(saving))
        .await
        .map_err(|_| HostError::new("internal"))?
}

#[tauri::command]
pub async fn launch_save_variants(request: VariantsRequest) -> Result<Launch, HostError> {
    tauri::async_runtime::spawn_blocking(move || {
        save_variants(&places()?, &request).map_err(refused)
    })
    .await
    .map_err(|_| HostError::new("internal"))?
}

#[tauri::command]
pub async fn launch_delete(request: LaunchRequest) -> Result<(), HostError> {
    tauri::async_runtime::spawn_blocking(move || delete(&places()?, &request.id).map_err(refused))
        .await
        .map_err(|_| HostError::new("internal"))?
}

const COMMANDS: &[&str] = &[
    "launch_list",
    "launch_get",
    "launch_before",
    "launch_save",
    "launch_delete",
    "launch_save_variants",
];

pub fn extension() -> wyss_console::Extension {
    wyss_console::Extension {
        commands: COMMANDS,
        handler: Box::new(tauri::generate_handler![
            launch_list,
            launch_get,
            launch_before,
            launch_save,
            launch_delete,
            launch_save_variants
        ]),
        install: Box::new(|builder| builder),
        on_exit: None,
    }
}
