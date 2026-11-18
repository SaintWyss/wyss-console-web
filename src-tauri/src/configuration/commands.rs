use super::*;
use crate::native_dialog::{self, GtkConfirm};
use std::sync::OnceLock;
use tauri::{AppHandle, State};

pub struct DesktopConfiguration {
    service: Configuration,
    app: Arc<OnceLock<AppHandle>>,
}

impl DesktopConfiguration {
    fn start() -> Self {
        let app = Arc::new(OnceLock::new());
        let service = Configuration::start(Box::new(GtkConfirm::new(app.clone())));
        Self { service, app }
    }

    fn changes_for(&self, app: &AppHandle) -> Result<Arc<ChangeService>, ConfigurationError> {
        let _ = self.app.set(app.clone());
        self.service.changes()
    }

    pub(crate) fn selected_project(&self) -> Option<PathBuf> {
        self.service.selected_project()
    }
}

struct TauriDialogs(AppHandle);

impl Dialogs for TauriDialogs {
    fn choose_file(&self, save: bool, name: &str) -> Option<PathBuf> {
        native_dialog::choose_file(&self.0, save, name)
    }

    fn choose_file_titled(&self, save: bool, name: &str, title: &'static str) -> Option<PathBuf> {
        native_dialog::choose_file_titled(&self.0, save, name, title)
    }

    fn choose_folder(&self) -> Option<PathBuf> {
        native_dialog::choose_folder(&self.0)
    }

    fn passphrase(&self, again: bool) -> Option<Zeroizing<String>> {
        native_dialog::passphrase(&self.0, again)
    }

    fn text_form(&self, title: &str, intro: &str, fields: Vec<Field>) -> Option<Vec<String>> {
        native_dialog::text_form(&self.0, title, intro, fields)
    }

    fn text_form_labeled(
        &self,
        title: &str,
        intro: &str,
        fields: Vec<Field>,
        accept: &str,
    ) -> Option<Vec<String>> {
        native_dialog::text_form_labeled(&self.0, title, intro, fields, accept)
    }
}

/// Runs `work` off the main thread: an apply waits for a dialog that the main thread draws.
async fn blocking<T: Send + 'static>(
    work: impl FnOnce() -> Result<T, ConfigurationError> + Send + 'static,
) -> Result<T, ConfigurationError> {
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|_| ConfigurationError::Change(ChangeFailure::Internal))?
}

#[tauri::command]
fn configuration_inventory(
    configuration: State<'_, DesktopConfiguration>,
) -> Result<InventoryReply, ConfigurationError> {
    inventory_reply(&configuration.service)
}

#[tauri::command]
fn configuration_changes(
    configuration: State<'_, DesktopConfiguration>,
    since: u64,
) -> Result<Changes, ConfigurationError> {
    changes_reply(&configuration.service, since)
}

#[tauri::command]
async fn configuration_plan(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: PlanRequest,
) -> Result<PlanView, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || plan(&changes, request)).await
}

#[tauri::command]
async fn configuration_apply(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: PlanId,
) -> Result<ApplyReply, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || apply(&changes, request)).await
}

#[tauri::command]
async fn configuration_history(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: HistoryRequest,
) -> Result<HistoryReply, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || history(&changes, request)).await
}

#[tauri::command]
async fn configuration_undo(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: ChangeId,
) -> Result<PlanView, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || undo(&changes, request)).await
}

#[tauri::command]
async fn configuration_document_export(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: ItemId,
) -> Result<Done, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || document_export(&changes, &TauriDialogs(app), request)).await
}

#[tauri::command]
async fn configuration_document_import(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: ItemId,
) -> Result<PlanView, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || document_import(&changes, &TauriDialogs(app), request)).await
}

#[tauri::command]
async fn configuration_edit_document(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: ItemId,
) -> Result<PlanView, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || edit_document(&changes, &TauriDialogs(app), request)).await
}

#[tauri::command]
async fn configuration_create_document(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: CreateDocument,
) -> Result<PlanView, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || create_document(&changes, &TauriDialogs(app), request)).await
}

#[tauri::command]
async fn configuration_project(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
) -> Result<ProjectView, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    project(&changes)
}

#[tauri::command]
async fn configuration_select_project(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: SelectProject,
) -> Result<ProjectView, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || select_project(&changes, &TauriDialogs(app), request)).await
}

#[tauri::command]
async fn configuration_template_export(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: ItemId,
) -> Result<Done, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || template_export(&changes, &TauriDialogs(app), request)).await
}

#[tauri::command]
async fn configuration_author_hook(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: AuthorHook,
) -> Result<PlanView, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || author_hook(&changes, &TauriDialogs(app), request)).await
}

#[tauri::command]
async fn configuration_edit_hook(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: ItemId,
) -> Result<PlanView, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || edit_hook(&changes, &TauriDialogs(app), request)).await
}

#[tauri::command]
async fn configuration_author_mcp(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: AuthorMcp,
) -> Result<PlanView, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || author_mcp(&changes, &TauriDialogs(app), request)).await
}

#[tauri::command]
async fn configuration_edit_mcp(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: ItemId,
) -> Result<PlanView, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || edit_mcp(&changes, &TauriDialogs(app), request)).await
}

#[tauri::command]
async fn configuration_records(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
) -> Result<Vec<Summary>, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || records(&changes)).await
}

#[tauri::command]
async fn configuration_record_delete(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: RecordId,
) -> Result<Done, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || record_delete(&changes, request)).await
}

#[tauri::command]
async fn configuration_export(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
    request: RecordId,
) -> Result<Done, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || export(&changes, &TauriDialogs(app), request)).await
}

#[tauri::command]
async fn configuration_import(
    app: AppHandle,
    configuration: State<'_, DesktopConfiguration>,
) -> Result<Done, ConfigurationError> {
    let changes = configuration.changes_for(&app)?;
    blocking(move || import(&changes, &TauriDialogs(app))).await
}

const COMMANDS: &[&str] = &[
    "configuration_inventory",
    "configuration_changes",
    "configuration_plan",
    "configuration_apply",
    "configuration_history",
    "configuration_undo",
    "configuration_records",
    "configuration_record_delete",
    "configuration_export",
    "configuration_import",
    "configuration_author_hook",
    "configuration_edit_hook",
    "configuration_author_mcp",
    "configuration_edit_mcp",
    "configuration_edit_document",
    "configuration_document_export",
    "configuration_document_import",
    "configuration_create_document",
    "configuration_project",
    "configuration_select_project",
    "configuration_template_export",
];

/// What the desktop binary hands to the library: the commands, the state they read, and
/// nothing else.
pub fn extension() -> wyss_console::Extension {
    wyss_console::Extension {
        commands: COMMANDS,
        handler: Box::new(tauri::generate_handler![
            configuration_inventory,
            configuration_changes,
            configuration_plan,
            configuration_apply,
            configuration_history,
            configuration_undo,
            configuration_records,
            configuration_record_delete,
            configuration_export,
            configuration_import,
            configuration_author_hook,
            configuration_edit_hook,
            configuration_author_mcp,
            configuration_edit_mcp,
            configuration_edit_document,
            configuration_document_export,
            configuration_document_import,
            configuration_create_document,
            configuration_project,
            configuration_select_project,
            configuration_template_export
        ]),
        install: Box::new(|builder| builder.manage(DesktopConfiguration::start())),
        on_exit: None,
    }
}
