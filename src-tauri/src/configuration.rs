//! The two window commands of the inventory (F1-09). Both are reads of what the service
//! already holds: neither reads a file, takes a path, or starts anything, so a window that
//! asks as often as it likes costs the providers' files nothing.
use crate::agentconfig::author::HookSpec;
use crate::agentconfig::changes::Authoring;
use crate::agentconfig::changes::Confirm;
use crate::agentconfig::changes::{Applied, ChangeFailure, ChangeService, PlanView};
use crate::agentconfig::document::NewKind;
use crate::agentconfig::opencode_plan::{McpSpec, mcp_name_ok};
use crate::agentconfig::{
    Bounds, Change, Changes, Environment, Faults, Inventory, InventoryService, Operation,
    SecretToolStore, Summary, Vault,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use zeroize::Zeroizing;

/// A field displayed by a trusted native editor.
pub struct Field {
    pub label: String,
    pub initial: String,
    pub multiline: bool,
}

/// Native input for configuration workflows. Implementations keep file paths and secrets
/// within the trusted frontend; the service can preserve the order of checks and prompts.
pub trait Dialogs {
    fn choose_file(&self, save: bool, name: &str) -> Option<PathBuf>;
    fn choose_file_titled(&self, save: bool, name: &str, title: &'static str) -> Option<PathBuf>;
    fn choose_folder(&self) -> Option<PathBuf>;
    fn passphrase(&self, again: bool) -> Option<Zeroizing<String>>;
    fn text_form(&self, title: &str, intro: &str, fields: Vec<Field>) -> Option<Vec<String>>;
    fn text_form_labeled(
        &self,
        title: &str,
        intro: &str,
        fields: Vec<Field>,
        accept: &str,
    ) -> Option<Vec<String>>;
}

/// The service as the desktop holds it. `None` when there is no home to read from, which
/// the window is told rather than shown an empty inventory (an empty one would say the
/// user has no configuration).
pub struct Configuration {
    inventory: Option<InventoryService>,
    /// Changes: present when the private state directory could be made safely. Without it
    /// the inventory still works and every change command says it is unavailable.
    changes: Option<Arc<ChangeService>>,
}

/// Where the Console keeps what it owns about configuration changes (14 §3).
fn state_directory() -> Option<std::path::PathBuf> {
    let base = std::env::var_os("XDG_STATE_HOME")
        .map(std::path::PathBuf::from)
        .filter(|p| p.is_absolute())
        .or_else(|| {
            std::env::var_os("HOME").map(|home| std::path::PathBuf::from(home).join(".local/state"))
        })?;
    Some(base.join("wyss-console").join("configuration"))
}

impl Configuration {
    pub fn start(confirm: Box<dyn Confirm>) -> Self {
        let mut environment = Environment::from_process(None);
        // The accounts the owner named as allowed to write a provider's directory (file only
        // he can write, under the state directory; see `agentconfig::declared`).
        if let (Some(environment), Some(state)) = (environment.as_mut(), state_directory()) {
            environment.declared_writers =
                crate::agentconfig::declared::load(state.parent().unwrap_or(&state));
        }
        let inventory = environment
            .clone()
            .and_then(|environment| InventoryService::start(environment, Bounds::PROPOSED));
        let changes = environment
            .zip(inventory.clone())
            .zip(state_directory())
            .and_then(|((environment, inventory), state)| {
                let changes = ChangeService::for_providers(
                    environment,
                    inventory,
                    &state,
                    Vault::new(Box::new(SecretToolStore::new())),
                    confirm,
                    Faults::default(),
                )
                .ok()?;
                // What a crash left is finished before anything new is planned.
                changes.recover();
                Some(Arc::new(changes))
            });
        Self { inventory, changes }
    }

    /// The project the user selected and the engine accepted, for read-only discovery. The window
    /// never names it: it is set through `configuration_select_project` and validated there.
    pub fn selected_project(&self) -> Option<std::path::PathBuf> {
        self.changes.as_ref().and_then(|changes| changes.project())
    }

    fn service(&self) -> Result<&InventoryService, ConfigurationError> {
        self.inventory
            .as_ref()
            .ok_or(ConfigurationError::Unavailable)
    }

    pub fn changes(&self) -> Result<Arc<ChangeService>, ConfigurationError> {
        self.changes.clone().ok_or(ConfigurationError::Unavailable)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ConfigurationError {
    Unavailable,
    /// The request is not one the desktop accepts; it names something it does not know.
    Invalid,
    /// The change commands answer with the reason, a closed word.
    Change(ChangeFailure),
}

impl From<ChangeFailure> for ConfigurationError {
    fn from(failure: ChangeFailure) -> Self {
        Self::Change(failure)
    }
}

/// The whole inventory at a revision.
#[derive(Debug, Serialize)]
pub struct InventoryReply {
    pub revision: u64,
    pub inventory: Inventory,
}

pub fn inventory_reply(
    configuration: &Configuration,
) -> Result<InventoryReply, ConfigurationError> {
    let snapshot = configuration.service()?.snapshot();
    Ok(InventoryReply {
        revision: snapshot.revision,
        inventory: (*snapshot.inventory).clone(),
    })
}

pub fn changes_reply(
    configuration: &Configuration,
    since: u64,
) -> Result<Changes, ConfigurationError> {
    Ok(configuration.service()?.changes_since(since))
}

// ---- changing (F2a) ---------------------------------------------------------------------
//
// Every request names something the desktop already holds: an item, a record, a plan, a
// change, a source's closed word. None carries a path, text of an entry, or a command.

/// Identifiers are lowercase hex; a source's word is lowercase letters and underscores.
fn well_formed(text: &str) -> bool {
    !text.is_empty()
        && text.len() <= 64
        && text
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_')
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PlanRequest {
    pub operation: Operation,
    pub target: String,
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PlanId {
    pub plan: String,
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ChangeId {
    pub change: String,
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RecordId {
    pub record: String,
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct HistoryRequest {
    pub cursor: Option<String>,
    pub limit: u32,
}

#[derive(Debug, Serialize)]
pub struct HistoryReply {
    pub changes: Vec<Change>,
    pub next: Option<String>,
}
#[derive(Debug, Serialize)]
pub struct Done {
    pub done: bool,
}

fn checked(text: &str) -> Result<&str, ConfigurationError> {
    well_formed(text)
        .then_some(text)
        .ok_or(ConfigurationError::Invalid)
}

pub fn plan(changes: &ChangeService, request: PlanRequest) -> Result<PlanView, ConfigurationError> {
    let target = checked(&request.target)?.to_owned();
    Ok(changes.plan(request.operation, &target)?)
}

/// How an apply ended, and whether the launch presets followed an edited hook.
#[derive(Debug, Serialize)]
pub struct ApplyReply {
    #[serde(flatten)]
    pub applied: Applied,
    /// The hook was edited, but the presets that left the old one out could not be brought up to
    /// date. The edit stands; the window says so. A Codex launch whose preset still names the
    /// old hook does not start (its key names no hook any more) until the preset is saved again.
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub launch_presets_not_followed: bool,
}

pub fn apply(changes: &ChangeService, request: PlanId) -> Result<ApplyReply, ConfigurationError> {
    let (applied, edit) = changes.apply_reporting_hook_edit(checked(&request.plan)?)?;
    let followed = edit.as_ref().is_none_or(follow_edited_hook);
    Ok(ApplyReply {
        applied,
        launch_presets_not_followed: !followed,
    })
}

/// An applied edit of a hook of the user's own Claude Code settings or of Codex's `hooks.json`:
/// the launches of that provider that left the old one out keep the new one out. Only that
/// provider's file follows: the same key in the other one names another hook. `false` when the
/// presets could not be read or written: the caller tells the owner, never drops it.
fn follow_edited_hook(edit: &crate::agentconfig::changes::HookEdit) -> bool {
    use crate::agentconfig::changes::HookFile;
    use crate::arsenal::environment;
    let key = |hook: &crate::agentconfig::changes::Hook| {
        crate::native::launch_home::hook_key(&hook.0, &hook.1, &hook.2)
    };
    let (old, new) = (key(&edit.old), key(&edit.new));
    let Some(dir) = environment::directory() else {
        return false;
    };
    match edit.file {
        HookFile::CodexHooks => {
            environment::codex::rename_hook_key(&dir, &old, &new, edit.old_remains)
        }
        HookFile::ClaudeSettings => {
            environment::rename_hook_key(&dir, &old, &new, edit.old_remains)
        }
    }
    .is_ok()
}

pub fn history(
    changes: &ChangeService,
    request: HistoryRequest,
) -> Result<HistoryReply, ConfigurationError> {
    let cursor = request.cursor.as_deref().map(checked).transpose()?;
    let (changes, next) = changes.history(cursor, request.limit.min(50) as usize);
    Ok(HistoryReply { changes, next })
}

pub fn undo(changes: &ChangeService, request: ChangeId) -> Result<PlanView, ConfigurationError> {
    Ok(changes.undo(checked(&request.change)?)?)
}

// ---- authoring (F5) ------------------------------------------------------------------------
//
// The page names what kind of thing the user wants to write and where (an event, a name), and
// nothing else. The text that will run is typed in a window the desktop draws, which says what
// it will become, and only what that window returns reaches the planner. A plan made from it
// still asks again, natively, before anything is written.

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AuthorHook {
    pub event: String,
    pub matcher: Option<String>,
    pub timeout: Option<u32>,
    /// Start from a passphrase-sealed template: its event, matcher, command and timeout fill
    /// the form of the native window, which the user reviews and may change.
    #[serde(default)]
    pub from_template: bool,
    /// `codex` writes it into Codex's own `hooks.json`; anything else, Claude Code's settings.
    #[serde(default)]
    pub agent: Option<String>,
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ItemId {
    pub item: String,
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AuthorMcp {
    pub name: String,
    /// `local` or `remote`.
    pub kind: String,
    /// `opencode` or `codex`: whose configuration the server goes into.
    pub agent: String,
    /// Start from a sealed template: whether the server is local or remote is then the
    /// template's, and what it starts or connects to fills the native window.
    #[serde(default)]
    pub from_template: bool,
}

fn cancelled() -> ConfigurationError {
    ConfigurationError::Change(ChangeFailure::Cancelled)
}
fn invalid() -> ConfigurationError {
    ConfigurationError::Change(ChangeFailure::InvalidEntry)
}

/// A program and its arguments as the window shows them: the program, then one argument per
/// line. Nothing is split on spaces and nothing goes through a shell.
fn mcp_fields(current: Option<&McpSpec>, kind_remote: bool) -> Vec<Field> {
    match (current, kind_remote) {
        (Some(McpSpec::Local { command }), _) => vec![
            Field {
                label: "Program".to_owned(),
                initial: command.first().cloned().unwrap_or_default(),
                multiline: false,
            },
            Field {
                label: "Arguments, one per line".to_owned(),
                initial: command
                    .iter()
                    .skip(1)
                    .cloned()
                    .collect::<Vec<_>>()
                    .join("\n"),
                multiline: true,
            },
        ],
        (Some(McpSpec::Remote { url }), _) => vec![Field {
            label: "Address (https://…)".to_owned(),
            initial: url.clone(),
            multiline: false,
        }],
        (None, true) => vec![Field {
            label: "Address (https://…)".to_owned(),
            initial: String::new(),
            multiline: false,
        }],
        (None, false) => vec![
            Field {
                label: "Program".to_owned(),
                initial: String::new(),
                multiline: false,
            },
            Field {
                label: "Arguments, one per line".to_owned(),
                initial: String::new(),
                multiline: true,
            },
        ],
    }
}

fn mcp_from(typed: &[String], remote: bool) -> McpSpec {
    if remote {
        McpSpec::Remote {
            url: typed.first().cloned().unwrap_or_default().trim().to_owned(),
        }
    } else {
        let mut command = vec![typed.first().cloned().unwrap_or_default().trim().to_owned()];
        command.extend(
            typed
                .get(1)
                .map(|a| {
                    a.lines()
                        .map(str::to_owned)
                        .filter(|l| !l.is_empty())
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default(),
        );
        McpSpec::Local { command }
    }
}

pub fn document_export(
    changes: &ChangeService,
    dialogs: &impl Dialogs,
    request: ItemId,
) -> Result<Done, ConfigurationError> {
    let item = checked(&request.item)?.to_owned();
    // Resolve before drawing dialogs; text stays within the backend.
    changes.document_current(&item)?;
    let Some(secret) = dialogs.passphrase(true) else {
        return Ok(Done { done: false });
    };
    let bytes = changes.export_document_template(&item, &secret)?;
    let Some(path) = dialogs.choose_file_titled(
        true,
        "instructions.wyss-template",
        "Export instruction template",
    ) else {
        return Ok(Done { done: false });
    };
    write_private_file(&path, &bytes)
        .map_err(|()| ConfigurationError::Change(ChangeFailure::Internal))?;
    Ok(Done { done: true })
}

pub fn document_import(
    changes: &ChangeService,
    dialogs: &impl Dialogs,
    request: ItemId,
) -> Result<PlanView, ConfigurationError> {
    let item = checked(&request.item)?.to_owned();
    let (label, expected) = changes.document_current(&item)?;
    let place = changes.document_place(&item);
    let path = dialogs
        .choose_file_titled(false, "", "Import instruction template")
        .ok_or_else(cancelled)?;
    let bytes = read_small_file(&path)
        .map_err(|()| ConfigurationError::Change(ChangeFailure::ImportInvalid))?;
    let secret = dialogs.passphrase(false).ok_or_else(cancelled)?;
    let text = changes.open_document_template(&item, &bytes, &secret)?;
    let typed = dialogs.text_form("Review an instruction template",
        &format!("Destination: {label} {place}. This imported text is untrusted. Review every instruction before replacing this existing file. Importing grants no permissions; a separate plan and native confirmation are still required."),
        vec![Field { label: "Imported instructions (Markdown, at most 64 KiB)".to_owned(), initial: text, multiline: true }]
    ).ok_or_else(cancelled)?;
    Ok(changes.plan_authored(Authoring::EditDocument {
        item,
        text: typed[0].clone(),
        expected,
    })?)
}

/// Instruction text never crosses the webview boundary, in either direction.
pub fn edit_document(
    changes: &ChangeService,
    dialogs: &impl Dialogs,
    request: ItemId,
) -> Result<PlanView, ConfigurationError> {
    let item = checked(&request.item)?.to_owned();
    let (label, expected) = changes.document_current(&item)?;
    let place = changes.document_place(&item);
    let typed = dialogs.text_form("Change an instruction file",
        &format!("File: {label} {place}. These instructions can change an agent's behaviour. Review the full text here. The previous bytes are kept encrypted for exact undo; a later outside edit is never overwritten."),
        vec![Field { label: "Instructions (Markdown, at most 64 KiB)".to_owned(), initial: expected.clone(), multiline: true }],
    ).ok_or_else(cancelled)?;
    Ok(changes.plan_authored(Authoring::EditDocument {
        item,
        text: typed[0].clone(),
        expected,
    })?)
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CreateDocument {
    /// One of the closed words `NewKind` knows. Never a path, a name or text.
    pub kind: String,
    /// Start from a passphrase-sealed template the user chooses in a native window.
    #[serde(default)]
    pub from_template: bool,
    /// `account` (the default) or `project`: the project selected in the desktop, which the
    /// page cannot name.
    #[serde(default)]
    pub scope: Scope,
}

#[derive(Debug, Default, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Scope {
    #[default]
    Account,
    Project,
}

/// A new instruction file or skill where none exists. The page names only a kind; the
/// name (where one is needed) and the text are typed in the desktop's own windows.
pub fn create_document(
    changes: &ChangeService,
    dialogs: &impl Dialogs,
    request: CreateDocument,
) -> Result<PlanView, ConfigurationError> {
    let kind = NewKind::parse(&request.kind).ok_or_else(invalid)?;
    // A kind the project level does not have is refused here, before any window.
    let source = match request.scope {
        Scope::Account => kind.source(),
        Scope::Project => kind.project_source().ok_or_else(invalid)?,
    };
    let place = changes.place_words(source);
    let typed_name = match kind.fixed_name() {
        Some(_) => String::new(),
        None => {
            let label = if kind.is_skill() {
                "Skill name (letters, digits, - _ . and spaces)"
            } else {
                "File name under rules/ (for example review.md)"
            };
            dialogs.text_form_labeled("Name the new file",
                "Nothing exists under this name now. The next window is for its text; nothing is written until you review a plan and confirm it separately.",
                vec![Field { label: label.to_owned(), initial: String::new(), multiline: false }],
                "Continue",
            )
            .ok_or_else(cancelled)?
            .remove(0)
        }
    };
    // A name that cannot be a file of this kind is refused before a second window opens.
    let name = kind.checked_name(&typed_name).ok_or_else(invalid)?;
    // Nothing is typed into a window for a file that cannot be made: a name already taken
    // (a file, a link, a folder) or a place that cannot be trusted is said at once.
    changes.check_new_document(source, &name)?;
    let initial = if request.from_template {
        let path = dialogs
            .choose_file_titled(false, "", "Choose an instruction template")
            .ok_or_else(cancelled)?;
        let bytes = read_small_file(&path)
            .map_err(|()| ConfigurationError::Change(ChangeFailure::ImportInvalid))?;
        let secret = dialogs.passphrase(false).ok_or_else(cancelled)?;
        changes.open_new_document_template(source, &name, &bytes, &secret)?
    } else {
        kind.starting_text(&name)
    };
    let shown = if kind.is_skill() {
        format!("skills/{name}/SKILL.md")
    } else {
        name.clone()
    };
    let typed = dialogs.text_form("Write the new instruction file",
        &format!("New file: {shown} {place}. It does not exist yet, and undoing the change removes it again. These instructions can change an agent's behaviour: review the full text here."),
        vec![Field {
            label: "Instructions (Markdown, at most 64 KiB)".to_owned(),
            initial,
            multiline: true,
        }],
    )
    .ok_or_else(cancelled)?;
    Ok(changes.plan_authored(Authoring::CreateDocument {
        source,
        name,
        text: typed[0].clone(),
    })?)
}

/// The project the desktop has selected, by the name of its folder; never its path.
#[derive(Debug, Serialize)]
pub struct ProjectView {
    pub name: Option<String>,
}

pub fn project(changes: &ChangeService) -> Result<ProjectView, ConfigurationError> {
    Ok(ProjectView {
        name: changes.project_name(),
    })
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SelectProject {
    /// Select none. Otherwise the desktop's own folder window chooses.
    pub clear: bool,
}

/// Selects the project whose instruction files and skills are listed and may be changed. The
/// folder is chosen in the desktop's own window and judged before it is kept; the page never
/// names a path.
pub fn select_project(
    changes: &ChangeService,
    dialogs: &impl Dialogs,
    request: SelectProject,
) -> Result<ProjectView, ConfigurationError> {
    let chosen = if request.clear {
        None
    } else {
        Some(dialogs.choose_folder().ok_or_else(cancelled)?)
    };
    changes.select_project(chosen)?;
    Ok(ProjectView {
        name: changes.project_name(),
    })
}

/// The file and passphrase of a template, chosen and typed in the desktop's own windows.
fn open_template(
    dialogs: &impl Dialogs,
) -> Result<crate::agentconfig::config_template::Template, ConfigurationError> {
    let path = dialogs
        .choose_file_titled(false, "", "Choose a hook or server template")
        .ok_or_else(cancelled)?;
    let bytes = read_small_file(&path)
        .map_err(|()| ConfigurationError::Change(ChangeFailure::ImportInvalid))?;
    let secret = dialogs.passphrase(false).ok_or_else(cancelled)?;
    Ok(ChangeService::open_config_template(&bytes, &secret)?)
}

/// A hook or an MCP server the user has, sealed under a passphrase and saved to a file the
/// user names. The page names the item; the content never reaches it.
pub fn template_export(
    changes: &ChangeService,
    dialogs: &impl Dialogs,
    request: ItemId,
) -> Result<Done, ConfigurationError> {
    let item = checked(&request.item)?.to_owned();
    let Some(secret) = dialogs.passphrase(true) else {
        return Ok(Done { done: false });
    };
    let bytes = changes.export_config_template(&item, &secret)?;
    let Some(path) = dialogs.choose_file_titled(
        true,
        "entry.wyss-template",
        "Export a hook or server template",
    ) else {
        return Ok(Done { done: false });
    };
    write_private_file(&path, &bytes)
        .map_err(|()| ConfigurationError::Change(ChangeFailure::Internal))?;
    Ok(Done { done: true })
}

pub fn author_hook(
    changes: &ChangeService,
    dialogs: &impl Dialogs,
    request: AuthorHook,
) -> Result<PlanView, ConfigurationError> {
    let codex = request.agent.as_deref() == Some("codex");
    let mut spec = HookSpec {
        event: request.event,
        matcher: request.matcher,
        command: "x".to_owned(),
        timeout: request.timeout,
    };
    // What the page named is judged before a window is drawn for it.
    spec.check().map_err(|_| invalid())?;
    if request.from_template {
        let template = open_template(dialogs)?;
        let crate::agentconfig::config_template::Template::Hook(found) = template else {
            return Err(ConfigurationError::Change(ChangeFailure::ImportInvalid));
        };
        let typed = dialogs.text_form("Add a hook from a template",
            "This hook came from a file. It is untrusted: review every field. The command will run on the event you keep, in every Claude Code session you start, and is written into your own Claude Code settings.",
            vec![
                Field { label: "Event".to_owned(), initial: found.event, multiline: false },
                Field { label: "Matcher (optional)".to_owned(), initial: found.matcher.unwrap_or_default(), multiline: false },
                Field { label: "Command".to_owned(), initial: found.command, multiline: false },
                Field { label: "Timeout in seconds (optional)".to_owned(), initial: found.timeout.map(|t| t.to_string()).unwrap_or_default(), multiline: false },
            ],
        )
        .ok_or_else(cancelled)?;
        let optional = |text: &str| Some(text.trim().to_owned()).filter(|t| !t.is_empty());
        let timeout = match optional(&typed[3]) {
            Some(text) => Some(text.parse::<u32>().map_err(|_| invalid())?),
            None => None,
        };
        let spec = HookSpec {
            event: typed[0].trim().to_owned(),
            matcher: optional(&typed[1]),
            command: typed[2].trim().to_owned(),
            timeout,
        };
        spec.check().map_err(|_| invalid())?;
        return Ok(changes.plan_authored(if codex {
            Authoring::AddCodexHook(spec)
        } else {
            Authoring::AddHook(spec)
        })?);
    }
    let where_ = format!(
        "This command will run on every {} event{} of every Claude Code session you start. \
         It is written into your own Claude Code settings.",
        spec.event,
        spec.matcher
            .as_deref()
            .map_or(String::new(), |m| format!(" for \"{m}\""))
    );
    let typed = dialogs
        .text_form(
            "Add a hook",
            &where_,
            vec![Field {
                label: "Command".to_owned(),
                initial: String::new(),
                multiline: false,
            }],
        )
        .ok_or_else(cancelled)?;
    spec.command = typed[0].trim().to_owned();
    Ok(changes.plan_authored(if codex {
        Authoring::AddCodexHook(spec)
    } else {
        Authoring::AddHook(spec)
    })?)
}

pub fn edit_hook(
    changes: &ChangeService,
    dialogs: &impl Dialogs,
    request: ItemId,
) -> Result<PlanView, ConfigurationError> {
    let item = checked(&request.item)?.to_owned();
    let current = changes
        .hook_command(&item)
        .ok_or(ConfigurationError::Change(ChangeFailure::EntryGone))?;
    // The window names which hook it is: the backend's own name for it, not the page's.
    let which = changes.item_label(&item).unwrap_or_default();
    let typed = dialogs.text_form("Change a hook",
        &format!(
            "This is the command that runs for the hook \"{which}\". What you write replaces it in your own Claude Code settings."
        ),
        vec![Field {
            label: "Command".to_owned(),
            initial: current.clone(),
            multiline: false,
        }],
    )
    .ok_or_else(cancelled)?;
    Ok(changes.plan_authored(Authoring::EditHook {
        item,
        command: typed[0].trim().to_owned(),
        expected: current,
    })?)
}

pub fn author_mcp(
    changes: &ChangeService,
    dialogs: &impl Dialogs,
    request: AuthorMcp,
) -> Result<PlanView, ConfigurationError> {
    if !mcp_name_ok(&request.name) {
        return Err(invalid());
    }
    let mut remote = match request.kind.as_str() {
        "local" => false,
        "remote" => true,
        _ => return Err(invalid()),
    };
    let from_template = if request.from_template {
        let crate::agentconfig::config_template::Template::Mcp(found) = open_template(dialogs)?
        else {
            return Err(ConfigurationError::Change(ChangeFailure::ImportInvalid));
        };
        remote = matches!(found, McpSpec::Remote { .. });
        Some(found)
    } else {
        None
    };
    let codex = match request.agent.as_str() {
        "codex" => true,
        "opencode" => false,
        _ => return Err(invalid()),
    };
    let intro = format!(
        "{} will {} for the server \"{}\". It is written into your own {} configuration.",
        if codex { "Codex" } else { "OpenCode" },
        if remote {
            "connect to the address you write"
        } else {
            "start the program you write"
        },
        request.name,
        if codex { "Codex" } else { "OpenCode" }
    );
    let intro = if from_template.is_some() {
        format!(
            "{intro} This server came from a file and is untrusted: review what it starts or connects to."
        )
    } else {
        intro
    };
    let typed = dialogs
        .text_form(
            "Add an MCP server",
            &intro,
            mcp_fields(from_template.as_ref(), remote),
        )
        .ok_or_else(cancelled)?;
    let spec = mcp_from(&typed, remote);
    Ok(changes.plan_authored(if codex {
        Authoring::AddCodexMcp {
            name: request.name,
            spec,
        }
    } else {
        Authoring::AddMcp {
            name: request.name,
            spec,
        }
    })?)
}

pub fn edit_mcp(
    changes: &ChangeService,
    dialogs: &impl Dialogs,
    request: ItemId,
) -> Result<PlanView, ConfigurationError> {
    let item = checked(&request.item)?.to_owned();
    let current = changes
        .mcp_current(&item)
        .ok_or(ConfigurationError::Change(ChangeFailure::EntryGone))?;
    let remote = matches!(current, McpSpec::Remote { .. });
    let which = changes.item_label(&item).unwrap_or_default();
    let codex = changes.item_provider(&item) == Some(crate::agentconfig::ProviderId::Codex);
    let agent = if codex { "Codex" } else { "OpenCode" };
    let typed = dialogs
        .text_form(
            "Change an MCP server",
            &format!(
                "What you write replaces what the {agent} server \"{which}\" starts or connects to."
            ),
            mcp_fields(Some(&current), remote),
        )
        .ok_or_else(cancelled)?;
    let spec = mcp_from(&typed, remote);
    Ok(changes.plan_authored(if codex {
        Authoring::EditCodexMcp {
            item,
            spec,
            expected: current,
        }
    } else {
        Authoring::EditMcp {
            item,
            spec,
            expected: current,
        }
    })?)
}

pub fn records(changes: &ChangeService) -> Result<Vec<Summary>, ConfigurationError> {
    Ok(changes.records())
}

pub fn record_delete(
    changes: &ChangeService,
    request: RecordId,
) -> Result<Done, ConfigurationError> {
    changes.delete_record(checked(&request.record)?)?;
    Ok(Done { done: true })
}

/// A record written to a file the user chooses, sealed under a passphrase typed in a native
/// window. Cancelling anywhere writes nothing.
pub fn export(
    changes: &ChangeService,
    dialogs: &impl Dialogs,
    request: RecordId,
) -> Result<Done, ConfigurationError> {
    let record = checked(&request.record)?.to_owned();
    let Some(secret) = dialogs.passphrase(true) else {
        return Ok(Done { done: false });
    };
    let bytes = changes.export_record(&record, &secret)?;
    let Some(path) = dialogs.choose_file(true, "wyss-restoration.export") else {
        return Ok(Done { done: false });
    };
    write_private_file(&path, &bytes)
        .map_err(|()| ConfigurationError::Change(ChangeFailure::Internal))?;
    Ok(Done { done: true })
}

pub fn import(changes: &ChangeService, dialogs: &impl Dialogs) -> Result<Done, ConfigurationError> {
    let Some(path) = dialogs.choose_file(false, "") else {
        return Ok(Done { done: false });
    };
    // A record is a few kilobytes; a file far larger than that is not one.
    let bytes = read_small_file(&path)
        .map_err(|()| ConfigurationError::Change(ChangeFailure::ImportInvalid))?;
    let Some(secret) = dialogs.passphrase(false) else {
        return Ok(Done { done: false });
    };
    changes.import_record(&bytes, &secret)?;
    Ok(Done { done: true })
}

/// A file the user named in the native chooser, made 0600 and not followed through a link.
pub(crate) fn write_private_file(path: &std::path::Path, bytes: &[u8]) -> Result<(), ()> {
    use std::{io::Write, os::unix::fs::OpenOptionsExt};
    let mut file = std::fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .mode(0o600)
        .custom_flags(nix::libc::O_NOFOLLOW)
        .open(path)
        .map_err(|_| ())?;
    file.write_all(bytes)
        .and_then(|()| file.sync_all())
        .map_err(|_| ())
}

fn read_small_file(path: &std::path::Path) -> Result<Vec<u8>, ()> {
    use std::{io::Read, os::unix::fs::OpenOptionsExt};
    let file = std::fs::OpenOptions::new()
        .read(true)
        .custom_flags(nix::libc::O_NOFOLLOW | nix::libc::O_NONBLOCK)
        .open(path)
        .map_err(|_| ())?;
    let mut bytes = Vec::new();
    file.take(512 * 1024 + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| ())?;
    (bytes.len() <= 512 * 1024).then_some(bytes).ok_or(())
}

#[cfg(feature = "desktop")]
pub mod commands;

#[cfg(test)]
mod tests {
    use super::*;
    use std::{fs, os::unix::fs::DirBuilderExt};

    fn configuration_over(files: &[(&str, &str)]) -> (Configuration, std::path::PathBuf) {
        let base = fs::canonicalize(std::env::temp_dir()).unwrap();
        let home = base.join(format!("wyss-cmd-{}", uuid::Uuid::new_v4().simple()));
        fs::DirBuilder::new().mode(0o700).create(&home).unwrap();
        for (relative, text) in files {
            let path = home.join(relative);
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(path, text).unwrap();
        }
        let environment = Environment {
            home: home.clone(),
            claude_config_dir: None,
            codex_home: None,
            project: None,
            system: home.join("etc"),
            declared_writers: Vec::new(),
        };
        let service = InventoryService::start(environment, Bounds::PROPOSED).unwrap();
        (
            Configuration {
                inventory: Some(service),
                changes: None,
            },
            home,
        )
    }

    #[test]
    fn the_inventory_reply_has_the_shape_the_window_is_written_against() {
        let (configuration, home) = configuration_over(&[(
            ".claude/settings.json",
            r#"{ "model": "opus", "env": { "K": "SEKRET" } }"#,
        )]);
        let reply = serde_json::to_value(inventory_reply(&configuration).unwrap()).unwrap();
        assert_eq!(reply["revision"], 1);
        assert_eq!(reply["inventory"]["truncated"], false);
        let item = &reply["inventory"]["items"][0];
        assert_eq!(item["provider"], "claude_code");
        assert_eq!(item["kind"], "model_preference");
        assert_eq!(item["persisted"], "present_enabled");
        assert_eq!(item["effective"], "documented");
        assert_eq!(item["session_use"], "unknown");
        assert_eq!(item["not_writable"], "not_in_this_phase");
        let source = reply["inventory"]["sources"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["key"] == "claude_user_settings")
            .unwrap();
        assert_eq!(source["outcome"], "read");
        assert_eq!(source["unrecognised"], 0);
        assert!(source["hash"].as_str().unwrap().len() == 64);
        assert!(!reply.to_string().contains("SEKRET"));
        let _ = fs::remove_dir_all(home);
    }

    #[test]
    fn the_changes_reply_names_its_result() {
        let (configuration, home) = configuration_over(&[]);
        assert_eq!(
            serde_json::to_value(changes_reply(&configuration, 1).unwrap()).unwrap(),
            serde_json::json!({ "result": "same", "revision": 1 })
        );
        assert_eq!(
            serde_json::to_value(changes_reply(&configuration, 9).unwrap()).unwrap(),
            serde_json::json!({ "result": "resync", "revision": 1 })
        );
        let _ = fs::remove_dir_all(home);
    }

    #[test]
    fn without_a_service_both_commands_say_unavailable_and_serialize_so() {
        let none = Configuration {
            inventory: None,
            changes: None,
        };
        assert_eq!(
            inventory_reply(&none).unwrap_err(),
            ConfigurationError::Unavailable
        );
        assert_eq!(
            changes_reply(&none, 0).unwrap_err(),
            ConfigurationError::Unavailable
        );
        assert_eq!(
            serde_json::to_value(ConfigurationError::Unavailable).unwrap(),
            serde_json::json!("unavailable")
        );
    }

    #[cfg(feature = "desktop")]
    #[test]
    fn the_commands_the_extension_routes_are_the_ones_the_manifest_and_capability_name() {
        let routed = commands::extension().commands;
        let build = include_str!("../build.rs");
        let capability = include_str!("../capabilities/main.json");
        for command in routed {
            assert!(
                build.contains(&format!("\"{command}\"")),
                "{command} not in build.rs"
            );
            let permission = format!("allow-{}", command.replace('_', "-"));
            assert!(
                capability.contains(&permission),
                "{permission} not in the capability"
            );
        }
    }

    /// The contract the window is written against, as one file both sides read:
    /// `tests/fixtures/configuration-inventory-v1.json`. Set `WYSS_UPDATE_FIXTURES=1` to
    /// write it again after a deliberate change, then run Prettier on it.
    #[test]
    fn the_inventory_reply_is_exactly_the_shared_fixture() {
        let (configuration, home) = configuration_over(&[
            (
                ".claude/settings.json",
                r#"{ "model": "opus",
                    "skillOverrides": { "noisy": "off" },
                    "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [
                      { "type": "command", "command": "guard.sh --token SEKRET", "timeout": 5 } ] } ] } }"#,
            ),
            (".claude/skills/useful/SKILL.md", "# useful"),
            (".claude/skills/noisy/SKILL.md", "# noisy"),
            (".claude/CLAUDE.md", "rules"),
            (
                ".claude.json",
                r#"{ "mcpServers": { "context7": { "command": "npx", "args": ["-y", "ctx"],
                     "env": { "CONTEXT7_API_KEY": "SEKRET" } } } }"#,
            ),
            (
                ".codex/config.toml",
                "model = \"gpt-6\"\n[mcp_servers.off]\ncommand = \"x\"\nenabled = false\n",
            ),
            (".codex/hooks.json", "{ not json"),
        ]);
        // A provider directory a group can write: read, and never writable.
        // A provider directory a group with others in it can write (root's group, which is
        // never private): read, and never writable. An ACL, so that the answer does not
        // depend on which groups this machine has.
        use crate::agentconfig::{
            ACL_GROUP, ACL_GROUP_OBJ, ACL_MASK, ACL_OTHER, ACL_USER_OBJ, set_acl_for_test,
        };
        assert!(set_acl_for_test(
            &home.join(".codex"),
            &[
                (ACL_USER_OBJ, 7, 0),
                (ACL_GROUP_OBJ, 5, 0),
                (ACL_GROUP, 7, 0),
                (ACL_MASK, 7, 0),
                (ACL_OTHER, 5, 0),
            ]
        ));
        configuration
            .service()
            .unwrap()
            .select_project(Some(home.clone()));
        let reply = inventory_reply(&configuration).unwrap();
        let mut value = serde_json::to_value(&reply).unwrap();
        // The revision depends on how many readings the setup caused; the fixture pins
        // the shape, not that count.
        value["revision"] = serde_json::json!(1);
        let text = serde_json::to_string_pretty(&value).unwrap() + "\n";
        assert!(!text.contains("SEKRET") && !text.contains(home.to_str().unwrap()));
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../tests/fixtures/configuration-inventory-v1.json");
        if std::env::var_os("WYSS_UPDATE_FIXTURES").is_some() {
            fs::write(&path, &text).unwrap();
        }
        // Compared as values: the file is formatted by Prettier, not by this test.
        let expected: serde_json::Value =
            serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(
            value, expected,
            "the contract changed: update the fixture on purpose"
        );
        let _ = fs::remove_dir_all(home);
    }

    /// TS-CFG-15: the desktop's prediction of what a Codex configuration does to managed
    /// Inference equals what the authority's own checks decide on the same definitions.
    #[test]
    fn the_managed_inference_prediction_equals_the_authoritys_rule() {
        use crate::agentconfig::codex_plan::{Facts, Verdict};
        use wyss_console::adapters::codex::managed_inference_blocker;
        let names = |n: usize| (0..n).map(|i| format!("s{i}")).collect::<Vec<_>>();
        let mut cases: Vec<(Vec<Vec<bool>>, Vec<String>)> = vec![
            (vec![], vec![]),
            (vec![vec![]], vec![]),
            (vec![vec![false]], names(3)),
            (vec![vec![true]], vec![]),
            (vec![vec![false, true]], vec![]),
            (vec![vec![false], vec![false]], names(64)),
            (vec![vec![false]], names(65)),
            (vec![vec![false; 256]], vec![]),
            (vec![vec![false; 257]], vec![]),
            (vec![vec![false]; 64], vec![]),
            (vec![vec![false]; 65], vec![]),
            (vec![], vec!["ok_name-1".into()]),
            (vec![], vec!["bad name".into()]),
            (vec![], vec!["x".repeat(65)]),
            (vec![], vec!["x".repeat(64)]),
            (vec![], vec![String::new()]),
            (vec![vec![true]], vec!["bad name".into()]),
        ];
        // Every combination of a few hooks and a few names, exhaustively on a small grid.
        for hooks in [vec![], vec![false], vec![true], vec![false, true]] {
            for name in ["", "a", "a-b_c", "a b", "é"] {
                cases.push((vec![hooks.clone()], vec![name.to_owned()]));
            }
        }
        for (sources, servers) in cases {
            let facts = Facts {
                hook_sources: sources.iter().filter(|s| !s.is_empty()).cloned().collect(),
                mcp_names: servers.clone(),
            };
            let authority = managed_inference_blocker(&facts.hook_sources, &servers);
            let predicted = facts.verdict();
            assert_eq!(
                authority.is_none(),
                predicted == Verdict::Available,
                "{sources:?} {servers:?}: authority {authority:?}, predicted {predicted:?}"
            );
            // And the cause agrees, not only the yes or no.
            match predicted {
                Verdict::Available => assert_eq!(authority, None, "{sources:?} {servers:?}"),
                Verdict::ExternalHooks => assert!(
                    matches!(authority, Some("external_hooks_enabled" | "hook_bound")),
                    "{authority:?}"
                ),
                Verdict::McpUnprovable => assert!(
                    matches!(authority, Some("mcp_bound" | "mcp_clamp_unproven")),
                    "{authority:?}"
                ),
            }
        }
    }

    fn reply(not_followed: bool) -> serde_json::Value {
        serde_json::to_value(ApplyReply {
            applied: Applied {
                change: "c-1".to_owned(),
                // The type is not public: it is named by inference.
                outcome: serde_json::from_value(serde_json::json!("applied")).unwrap(),
                revision: 3,
            },
            launch_presets_not_followed: not_followed,
        })
        .unwrap()
    }

    #[test]
    fn the_apply_reply_says_launch_presets_not_followed_only_when_they_were_not() {
        let followed = reply(false);
        assert_eq!(
            followed,
            serde_json::json!({"change": "c-1", "outcome": "applied", "revision": 3})
        );
        assert!(followed.get("launch_presets_not_followed").is_none());
        let not = reply(true);
        assert_eq!(not["launch_presets_not_followed"], true);
        // The rest of the reply is flat, as the window's parser expects.
        assert_eq!(not["change"], "c-1");
        assert_eq!(not["revision"], 3);
    }

    #[test]
    fn a_failed_rename_of_the_presets_is_reported_and_a_good_one_or_none_is_not() {
        use crate::agentconfig::changes::{HookEdit, HookFile};
        use crate::arsenal::environment;
        let root = fs::canonicalize(std::env::temp_dir())
            .unwrap()
            .join(format!("wyss-follow-{}", uuid::Uuid::new_v4().simple()));
        fs::create_dir_all(root.join("home")).unwrap();
        let _env = crate::native::service_tests::FakeOwnerEnv::new(&root.join("home"));
        let dir = environment::directory().unwrap();
        assert!(dir.starts_with(root.join("home")), "never the real one");
        fs::create_dir_all(&dir).unwrap();
        let hook = |command: &str| ("Stop".to_owned(), String::new(), command.to_owned());
        let edit = |file, old_remains| HookEdit {
            file,
            old: hook("old.sh"),
            new: hook("new.sh"),
            old_remains,
        };
        let key = |command: &str| crate::native::launch_home::hook_key("Stop", "", command);

        // No presets at all: nothing to follow, and nothing failed.
        assert!(follow_edited_hook(&edit(HookFile::CodexHooks, false)));
        assert!(follow_edited_hook(&edit(HookFile::ClaudeSettings, false)));

        // A preset that left the old hook out follows it.
        let spec = crate::native::launch_home_codex::CodexHomeSpec {
            instructions: true,
            hooks_off: vec![key("old.sh")],
        };
        environment::codex::set(&dir, "p1", &spec).unwrap();
        assert!(follow_edited_hook(&edit(HookFile::CodexHooks, false)));
        assert_eq!(
            environment::codex::get(&dir, "p1")
                .unwrap()
                .unwrap()
                .hooks_off,
            vec![key("new.sh")]
        );
        // The old one remains: both keys are left out.
        environment::codex::set(&dir, "p1", &spec).unwrap();
        assert!(follow_edited_hook(&edit(HookFile::CodexHooks, true)));
        assert_eq!(
            environment::codex::get(&dir, "p1")
                .unwrap()
                .unwrap()
                .hooks_off,
            vec![key("old.sh"), key("new.sh")]
        );

        // A Codex file that cannot be read: not followed, and the file is left alone.
        let file = dir.join("environment-codex.json");
        fs::write(&file, "{broken").unwrap();
        assert!(!follow_edited_hook(&edit(HookFile::CodexHooks, false)));
        assert_eq!(fs::read(&file).unwrap(), b"{broken");
        // Claude's file is read the same strict way: not followed, and left alone.
        fs::write(dir.join("environment.json"), "{broken").unwrap();
        assert!(!follow_edited_hook(&edit(HookFile::ClaudeSettings, false)));
        assert_eq!(fs::read(dir.join("environment.json")).unwrap(), b"{broken");
        let _ = fs::remove_dir_all(root);
    }
}
