use super::*;
use crate::host::protocol::HostError;

fn places() -> Result<Places, HostError> {
    Places::from_env().ok_or_else(|| HostError::new("distributor_unavailable"))
}

fn refused(error: String) -> HostError {
    let mut e = HostError::new("distributor_invalid");
    e.reasons.push(error);
    e
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct IdRequest {
    id: String,
}

macro_rules! blocking {
    ($body:expr) => {
        tauri::async_runtime::spawn_blocking(move || $body)
            .await
            .map_err(|_| HostError::new("internal"))?
    };
}

#[tauri::command]
pub async fn distributor_list() -> Result<List, HostError> {
    blocking!(list(&places()?).map_err(refused))
}

#[tauri::command]
pub async fn distributor_get(request: IdRequest) -> Result<Distributor, HostError> {
    blocking!(get(&places()?, &request.id).map_err(refused))
}

#[tauri::command]
pub async fn distributor_save(request: SaveRequest) -> Result<Distributor, HostError> {
    blocking!(save(&places()?, &request).map_err(refused))
}

#[tauri::command]
pub async fn distributor_delete(request: IdRequest) -> Result<(), HostError> {
    blocking!(delete(&places()?, &request.id).map_err(refused))
}

#[tauri::command]
pub async fn distributor_make_launch(request: IdRequest) -> Result<String, HostError> {
    blocking!(make_launch(&places()?, &request.id).map_err(refused))
}

const COMMANDS: &[&str] = &[
    "distributor_list",
    "distributor_get",
    "distributor_save",
    "distributor_delete",
    "distributor_make_launch",
];

pub fn extension() -> wyss_console::Extension {
    wyss_console::Extension {
        commands: COMMANDS,
        handler: Box::new(tauri::generate_handler![
            distributor_list,
            distributor_get,
            distributor_save,
            distributor_delete,
            distributor_make_launch
        ]),
        install: Box::new(|builder| builder),
        on_exit: None,
    }
}
