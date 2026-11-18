//! The Native side of the host protocol (`native_launcher`, `native_preview`, `native_start`,
//! `native_restart`, `native_stop`, `native_forget`, `native_sessions`) and the flow of opening a
//! launch, the same as `openLaunch` in `src/lib/features/terminal/launch.ts`. The parsers are pure
//! and tested against answers shaped like the host's structs (`src-tauri/src/native/service.rs`).

use std::time::Duration;

use serde_json::{json, Value};

use crate::host::{Host, HostError, ListEntry};
use crate::i18n::{tr, trf};
use crate::launches::{self, Kind, Launch};
use crate::t;

/// The first size of a terminal that has not been fitted yet (`FIRST_SIZE` in the Console).
pub const FIRST_SIZE: (u16, u16) = (24, 80);
fn bad(what: &str) -> HostError {
    HostError::Protocol(format!("native: {what}"))
}

/// What marks a terminal as an agent's (`NativeTag`).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Tag {
    pub session_id: String,
    pub agent_name: String,
    pub project: String,
    /// The name of the profile the host recorded (a template's name, or `None` as configured).
    pub profile: Option<String>,
}

pub fn parse_tag(v: &Value) -> Option<Tag> {
    Some(Tag {
        session_id: v["session_id"].as_str()?.to_owned(),
        agent_name: v["agent_name"].as_str()?.to_owned(),
        project: v["project"].as_str().unwrap_or("").to_owned(),
        profile: v["profile"].as_str().map(str::to_owned),
    })
}

/// `native_launcher`: home, registered project paths and agents found.
#[derive(Debug, PartialEq, Eq)]
pub struct Launcher {
    pub home: Option<String>,
    pub installed: Vec<String>,
    pub projects: Vec<(String, u64)>,
}

pub fn parse_launcher(v: &Value) -> Result<Launcher, HostError> {
    let agents = v["agents"].as_array().ok_or_else(|| bad("launcher has no agents"))?;
    let projects = v["projects"].as_array().into_iter().flatten();
    Ok(Launcher {
        home: projects.clone().find(|project| project["home"] == true)
            .and_then(|project| project["path"].as_str()).map(str::to_owned),
        installed: agents.iter().filter(|a| a["installed"] == true)
            .filter_map(|a| a["agent_id"].as_str().map(str::to_owned)).collect(),
        projects: projects.filter_map(|project| Some((
            project["path"].as_str()?.to_owned(),
            project["last_used"].as_u64().unwrap_or_default(),
        ))).collect(),
    })
}

/// `native_preview`: whether the start may go on, and the token that binds the start to this check.
#[derive(Debug, PartialEq, Eq)]
pub struct Preview {
    pub can_start: bool,
    pub plan_token: Option<String>,
    pub provider_version: Option<String>,
}

pub fn parse_preview(v: &Value) -> Result<Preview, HostError> {
    Ok(Preview {
        can_start: v["can_start"].as_bool().ok_or_else(|| bad("preview has no can_start"))?,
        plan_token: v["plan_token"].as_str().map(str::to_owned),
        provider_version: v["provider_version"].as_str().map(str::to_owned),
    })
}

/// A session as `native_sessions` lists it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Session {
    pub id: String,
    pub agent_name: String,
    /// `requested`, `running`, `exited`, `stopped`, `failed_start` or `lost`.
    pub state: String,
    pub terminal_id: Option<String>,
    pub project: String,
    pub profile: Option<String>,
}

pub fn parse_session(v: &Value) -> Option<Session> {
    Some(Session {
        id: v["id"].as_str()?.to_owned(),
        agent_name: v["agent_name"].as_str()?.to_owned(),
        state: v["state"].as_str()?.to_owned(),
        terminal_id: v["terminal_id"].as_str().map(str::to_owned),
        project: v["project"].as_str().unwrap_or("").to_owned(),
        profile: v["profile"]["name"].as_str().map(str::to_owned),
    })
}

pub fn parse_sessions(v: &Value) -> Result<Vec<Session>, HostError> {
    Ok(v.as_array().ok_or_else(|| bad("sessions is not a list"))?.iter().filter_map(parse_session).collect())
}

/// `native_start` and `native_restart`: the new session and the terminal it runs in.
#[derive(Debug, PartialEq, Eq)]
pub struct Started {
    pub session: Session,
    pub terminal_id: String,
}

pub fn parse_started(v: &Value) -> Result<Started, HostError> {
    let session = parse_session(&v["session"]).ok_or_else(|| bad("reply has no session"))?;
    let terminal_id = v["terminal"]["terminal_id"].as_str().ok_or_else(|| bad("reply has no terminal"))?.to_owned();
    Ok(Started { session, terminal_id })
}

/// What a panel's header offers for an agent, from the state of its session (`nativeActionState`
/// of `TerminalPanel.svelte`): running agents can be stopped or restarted, finished ones started
/// again or forgotten, and one being requested nothing.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Lifecycle {
    Running,
    Finished,
}

pub fn lifecycle(state: &str) -> Option<Lifecycle> {
    match state {
        "running" => Some(Lifecycle::Running),
        "requested" => None,
        _ => Some(Lifecycle::Finished),
    }
}

/// `tabStartedWith`: what a tab says its agent was started with, from the name the host recorded.
pub fn started_with(profile: Option<&str>) -> Option<String> {
    match profile {
        None => None,
        Some("As configured") => None,
        Some("Strict") => Some(tr("Ask before acting")),
        Some("Review, read only") => Some(tr("Read only")),
        Some("Accept edits") => Some(tr("Accept edits")),
        Some("Full access (bypass)") => Some(tr("Full access")),
        Some(name) => Some(trf("Profile {name}", &[("name", name)])),
    }
}

/// The label of an agent's session in the status bar: `Native · {agent}` and, when the agent was
/// started with a permission, ` · ` and the permission (`agentPart` of `session-bar.ts`).
pub fn agent_label(tag: &Tag) -> String {
    let kind = trf("Native · {agent}", &[("agent", &tag.agent_name)]);
    match started_with(tag.profile.as_deref()) {
        Some(p) => format!("{kind} · {p}"),
        None => kind,
    }
}

// ---- failure words -----------------------------------------------------------------------

/// What the window says for a host failure code (`FAILURE_TEXT` of `present.ts`, the codes a
/// start from a launch can meet); any other code is the general sentence.
pub fn failure_text(code: &str) -> String {
    match code {
        "agent_not_installed" => tr(t!("That agent is not installed on this computer.")),
        "project_invalid" => tr(t!("That folder cannot be used. Choose a folder with the folder button.")),
        "project_unknown" | "project_refused" => tr(t!("This launch’s folder is not a project the Console knows. Choose it once with Browse… in Workspace, then try again.")),
        "profile_not_applicable" => tr(t!("This permission cannot be applied to that agent.")),
        "profile_unknown" => tr(t!("What this session was started with no longer exists, so it cannot start that way. Start a new one from Workspace.")),
        "profile_preview_required" => tr(t!("The start was not checked first. Choose the permission again and start.")),
        "profile_preview_stale" => tr(t!("What the start would do changed after it was checked. Check it again and start.")),
        "provider_version_unverified" => tr(t!("This exact provider build is not verified for permission flags, so nothing was launched with them. Choose “As configured” or use a qualified build.")),
        "brief_invalid" => tr(t!("The brief must start with a “# ” heading, hold no NUL and be at most 16 KiB.")),
        "limit_reached" => tr(t!("The terminal limit (16) is reached. Close one to start another.")),
        "spawn_failed" => tr(t!("The agent could not be started.")),
        "busy" => tr(t!("A start is already in progress.")),
        "session_unknown" => tr(t!("That session is not known any more.")),
        "not_running" => tr(t!("That session is not running.")),
        "still_running" => tr(t!("A running session cannot be removed. Stop it first.")),
        "stop_failed" => tr(t!("The session could not be stopped.")),
        "store_unavailable" => tr(t!("The Console could not write its own state.")),
        "unavailable" => tr(t!("The Console has no private folder to keep native sessions in, so it cannot start agents.")),
        "request_invalid" => tr(t!("The request was not valid.")),
        "host_unavailable" => tr(t!("The terminal host is not answering. Nothing was sent; nothing changed.")),
        "host_outdated" => tr(t!("The terminal host is older than this window and cannot start with this option. Update it before using it; existing sessions are unchanged.")),
        _ => tr(t!("Something went wrong in the desktop.")),
    }
}

/// A failure as a sentence for the banner.
pub fn explain(e: &HostError) -> String {
    match e {
        HostError::Remote { code, .. } => failure_text(code),
        HostError::Io(_) => failure_text("host_unavailable"),
        HostError::Protocol(_) => failure_text("internal"),
    }
}

// ---- calls -------------------------------------------------------------------------------

pub fn launcher(host: &Host) -> Result<Launcher, HostError> {
    parse_launcher(&host.call("native_launcher", json!({}))?)
}

/// `native_preview` for an agent and the profile a permission is sent as.
pub fn preview(host: &Host, agent: &str, profile: Option<&str>) -> Result<Preview, HostError> {
    parse_preview(&host.call("native_preview", json!({"agent_id": agent, "profile_id": profile}))?)
}

pub fn start(host: &Host, agent: &str, project: &str, profile: Option<&str>, preview: &Preview) -> Result<Started, HostError> {
    let params = json!({
        "agent_id": agent,
        "project": project,
        "profile_id": profile,
        "size": {"rows": FIRST_SIZE.0, "cols": FIRST_SIZE.1},
        "brief": null,
        "plan_token": preview.plan_token,
        "expected_cli_version": preview.provider_version,
    });
    parse_started(&host.call("native_start", params)?)
}

pub fn restart(host: &Host, id: &str) -> Result<Started, HostError> {
    parse_started(&host.call("native_restart", json!({"id": id, "size": {"rows": FIRST_SIZE.0, "cols": FIRST_SIZE.1}}))?)
}

pub fn stop(host: &Host, id: &str) -> Result<(), HostError> {
    host.call("native_stop", json!({"id": id})).map(|_| ())
}

pub fn forget(host: &Host, id: &str) -> Result<(), HostError> {
    host.call("native_forget", json!({"id": id})).map(|_| ())
}

pub fn sessions(host: &Host) -> Result<Vec<Session>, HostError> {
    parse_sessions(&host.call("native_sessions", json!({"sample": false}))?)
}

// ---- opening a launch --------------------------------------------------------------------

/// Why a launch did not open: a sentence in the language in force.
#[derive(Debug, PartialEq, Eq)]
pub struct Refusal(pub String);

impl From<HostError> for Refusal {
    fn from(e: HostError) -> Self {
        Refusal(explain(&e))
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum Opened {
    /// A terminal of the host with the commands already typed.
    Terminal { terminal_id: String, title: String },
    /// An agent the host started, and what its `before` commands said.
    Agent { started: Started, notes: Vec<String> },
}

type BeforeCommands<'a> = dyn Fn(&[String], &str) -> Vec<(String, String)> + 'a;

/// Opens one launch, in the order of `openLaunch`: a commands launch is a terminal in its folder
/// with the commands typed; a session launch is checked with `native_preview`, runs its `before`
/// commands and starts with `native_start`. `before` gets the commands and the folder and answers
/// `(command, result)` for each; tests give it a stand-in.
pub fn open_launch(host: &Host, launch: &Launch, home: &str, before: &BeforeCommands<'_>) -> Result<Opened, Refusal> {
    let directory = launches::resolve_directory(&launch.directory, home).map_err(|e| Refusal(e.to_owned()))?;
    match &launch.kind {
        Kind::Commands { commands } => {
            if commands.is_empty() {
                return Err(Refusal(tr(t!("This launch has no commands for this distribution. Add one in Workspace."))));
            }
            let id = host.create_in(FIRST_SIZE.0, FIRST_SIZE.1, Some(&directory), Some(&launch.name))?;
            host.write(&id, &launches::typed(commands))?;
            Ok(Opened::Terminal { terminal_id: id, title: launch.name.clone() })
        }
        Kind::Session { agent, permission, before: before_cmds, preset } => {
            if let Some(name) = preset {
                // The preset is an Arsenal selection: its plan and its exclusions live in the
                // Console app, which this window cannot ask. Nothing is started without them.
                return Err(Refusal(trf(t!("The preset “{name}” can only be applied by the Console app. Nothing was started."), &[("name", name)])));
            }
            let profile = permission.map(|p| p.profile_id());
            let pre = preview(host, agent.id(), profile)?;
            if !pre.can_start {
                return Err(Refusal(trf(t!("The launch “{name}” cannot start with this permission. No commands were run."), &[("name", &launch.name)])));
            }
            let notes: Vec<String> = before(before_cmds, &directory)
                .into_iter()
                .filter(|(_, result)| result != "ok")
                .map(|(_, result)| trf(t!("A command before the start did not succeed ({result}); the agent started anyway."), &[("result", &result)]))
                .collect();
            let started = start(host, agent.id(), &directory, profile, &pre)?;
            Ok(Opened::Agent { started, notes })
        }
    }
}

/// Runs a session launch's `before` commands in order, each in `/bin/sh -c` in its folder with no
/// input and its output discarded, bounded in time (`run_before` of `launch.rs`).
pub fn run_before(commands: &[String], folder: &str) -> Vec<(String, String)> {
    before_with_timeout(commands, folder, wyss_console::launch::BEFORE_TIMEOUT)
}

fn before_with_timeout(commands: &[String], folder: &str, timeout: Duration) -> Vec<(String, String)> {
    use wyss_console::launch::{Kind, Launch};
    let launch = Launch {
        id: String::new(),
        name: String::new(),
        directory: folder.to_owned(),
        kind: Kind::Session {
            agent: String::new(),
            permission: None,
            before: commands.to_vec(),
            preset: None,
        },
    };
    wyss_console::launch::run_before(&launch, timeout)
        .into_iter().map(|outcome| (outcome.command, outcome.result)).collect()
}

/// `term_list` entries that are agents' terminals, by terminal id.
pub fn tags(list: &[ListEntry]) -> Vec<(String, Tag)> {
    list.iter().filter_map(|e| e.native.clone().map(|t| (e.id.clone(), t))).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::host::{read_frame, write_frame};
    use crate::launches::{Agent, Permission};
    use std::os::unix::net::UnixListener;

    // Answers shaped like the host's structs (`LauncherView`, `PreviewView`, `StartReply`, `SessionView`, `NativeTag`).
    fn launcher_answer() -> Value {
        json!({"agents": [
            {"agent_id": "claude_code", "executable": "claude", "installed": true, "name": "Claude Code", "path": "/x/claude", "version": "2.1.327 (Claude Code)"},
            {"agent_id": "codex", "executable": "codex", "installed": false, "name": "Codex", "path": null, "version": null}],
          "m9_native_status": "legacy_host",
          "projects": [{"default_agent": null, "default_profile": null, "home": false, "last_used": 3, "path": "/work/a"}, {"default_agent": null, "default_profile": null, "home": true, "last_used": 0, "path": "/home/o"}],
          "shell": {"family": "fish", "path": "/bin/fish", "through_shell": true}})
    }

    fn session_answer(state: &str) -> Value {
        json!({"id": "0123456789abcdef0123456789abcdef", "agent_id": "codex", "agent_name": "Codex", "version": "codex-cli 0.159.0", "project": "/home/o",
          "profile": {"id": "template-full-access", "name": "Full access (bypass)", "version": 1}, "through_shell": true, "state": state, "started_at": 1,
          "ended_at": null, "exit_code": null, "exit_signal": null, "error": null, "restart_of": null, "restarts": 0, "delegation": false,
          "plane": "native", "terminal_id": "t-1", "pid": 42, "usage": null})
    }

    #[test]
    fn the_launcher_gives_the_home_and_the_installed_agents() {
        let l = parse_launcher(&launcher_answer()).unwrap();
        assert_eq!(l, Launcher {
            home: Some("/home/o".into()),
            installed: vec!["claude_code".into()],
            projects: vec![("/work/a".into(), 3), ("/home/o".into(), 0)],
        });
        assert!(parse_launcher(&json!({"shell": null})).is_err());
    }

    #[test]
    fn previews_sessions_and_replies_are_read() {
        let p = parse_preview(&json!({"applied": [], "can_start": true, "not_applicable": [], "plan_token": "tok", "through_shell": true, "with_cost": []})).unwrap();
        assert_eq!(p, Preview { can_start: true, plan_token: Some("tok".into()), provider_version: None });
        assert!(!parse_preview(&json!({"can_start": false, "plan_token": null})).unwrap().can_start);
        assert!(parse_preview(&json!({})).is_err());

        let s = parse_session(&session_answer("running")).unwrap();
        assert_eq!((s.id.as_str(), s.state.as_str(), s.terminal_id.as_deref(), s.profile.as_deref()), ("0123456789abcdef0123456789abcdef", "running", Some("t-1"), Some("Full access (bypass)")));
        assert_eq!(parse_sessions(&json!([session_answer("stopped"), {"nope": 1}])).unwrap().len(), 1, "an entry that is not a session is skipped");
        assert!(parse_sessions(&json!({})).is_err());

        let reply = json!({"session": session_answer("running"), "terminal": {"terminal_id": "t-9", "shell": "/bin/fish", "cwd": "/home/o", "observed_pid": 7, "state": "running"}});
        let st = parse_started(&reply).unwrap();
        assert_eq!((st.terminal_id.as_str(), st.session.agent_name.as_str()), ("t-9", "Codex"));
        assert!(parse_started(&json!({"session": session_answer("running")})).is_err());
    }

    #[test]
    fn the_tag_of_a_terminal_labels_the_agent_like_the_session_bar() {
        let tag = parse_tag(&json!({"session_id": "s", "agent_name": "Claude Code", "project": "/home/o", "profile": "Full access (bypass)", "through_shell": true})).unwrap();
        assert_eq!(agent_label(&tag), "Native · Claude Code · Full access");
        let plain = Tag { profile: None, ..tag.clone() };
        assert_eq!(agent_label(&plain), "Native · Claude Code");
        let old = Tag { profile: Some("My old profile".into()), ..tag.clone() };
        assert_eq!(agent_label(&old), "Native · Claude Code · Profile My old profile");
        assert_eq!(started_with(Some("As configured")), None);
        assert_eq!(started_with(Some("Strict")).as_deref(), Some("Ask before acting"));
        assert_eq!(started_with(Some("Review, read only")).as_deref(), Some("Read only"));
        assert_eq!(parse_tag(&json!(null)), None);
    }

    #[test]
    fn a_session_offers_stop_and_restart_while_it_runs_and_restart_and_forget_after() {
        assert_eq!(lifecycle("running"), Some(Lifecycle::Running));
        for s in ["exited", "stopped", "failed_start", "lost"] {
            assert_eq!(lifecycle(s), Some(Lifecycle::Finished), "{s}");
        }
        assert_eq!(lifecycle("requested"), None, "a start being prepared offers nothing");
    }

    #[test]
    fn failures_have_words_and_unknown_codes_the_general_sentence() {
        assert_eq!(failure_text("agent_not_installed"), "That agent is not installed on this computer.");
        assert_eq!(failure_text("limit_reached"), "The terminal limit (16) is reached. Close one to start another.");
        assert_eq!(failure_text("something_new"), "Something went wrong in the desktop.");
        assert_eq!(explain(&HostError::Io(std::io::Error::other("x"))), failure_text("host_unavailable"));
        assert_eq!(explain(&HostError::Remote { code: "busy".into(), reasons: vec![] }), "A start is already in progress.");
    }

    /// A fake host: answers each connection with the recorded answer for its op and records the request.
    fn fake(answers: Vec<(&'static str, Value)>) -> (std::path::PathBuf, std::thread::JoinHandle<Vec<Value>>) {
        let path = std::env::temp_dir().join(format!("gtkterm-native-{}-{:?}.sock", std::process::id(), std::thread::current().id()));
        let _ = std::fs::remove_file(&path);
        let listener = UnixListener::bind(&path).unwrap();
        let p = path.clone();
        let h = std::thread::spawn(move || {
            let mut seen = Vec::new();
            for (op, answer) in answers {
                let (mut s, _) = listener.accept().unwrap();
                let req = read_frame(&mut s).unwrap();
                assert_eq!(req["op"], op, "the ops come in the order of openLaunch");
                write_frame(&mut s, &answer).unwrap();
                seen.push(req);
            }
            let _ = std::fs::remove_file(p);
            seen
        });
        (path, h)
    }

    fn session_launch(permission: Option<Permission>, preset: Option<&str>) -> Launch {
        Launch {
            id: "codex".into(),
            name: "Codex".into(),
            directory: "~".into(),
            kind: Kind::Session { agent: Agent::Codex, permission, before: vec!["true".into()], preset: preset.map(str::to_owned) },
        }
    }

    #[test]
    fn a_session_launch_goes_preview_then_start_with_the_template_and_the_token() {
        let reply = json!({"session": session_answer("running"), "terminal": {"terminal_id": "t-9"}});
        let (path, h) = fake(vec![
            ("native_preview", json!({"ok": {"applied": [], "can_start": true, "not_applicable": [], "plan_token": "tok-1", "through_shell": true, "with_cost": [], "provider_version": "codex-cli 0.159.0"}})),
            ("native_start", json!({"ok": reply})),
        ]);
        let home = std::env::temp_dir().to_string_lossy().into_owned();
        let ran = std::cell::RefCell::new(Vec::new());
        let before = |c: &[String], dir: &str| {
            ran.borrow_mut().push((c.to_vec(), dir.to_owned()));
            vec![("true".to_owned(), "ok".to_owned()), ("curl x".to_owned(), "exit 7".to_owned())]
        };
        let out = open_launch(&Host::new(&path), &session_launch(Some(Permission::Bypass), None), &home, &before).unwrap();
        let Opened::Agent { started, notes } = out else { panic!("{out:?}") };
        assert_eq!(started.terminal_id, "t-9");
        assert_eq!(notes, vec!["A command before the start did not succeed (exit 7); the agent started anyway."], "only what did not succeed is said");
        assert_eq!(ran.borrow()[0], (vec!["true".to_string()], home.clone()));
        let seen = h.join().unwrap();
        assert_eq!(seen[0]["params"], json!({"agent_id": "codex", "profile_id": "template-full-access"}), "the host takes the params themselves, not the Tauri `request` wrapper");
        let start = &seen[1]["params"];
        assert_eq!(start["agent_id"], "codex");
        assert_eq!(start["project"], home.as_str());
        assert_eq!(start["profile_id"], "template-full-access");
        assert_eq!(start["plan_token"], "tok-1");
        assert_eq!(start["expected_cli_version"], "codex-cli 0.159.0");
        assert_eq!(start["size"], json!({"rows": 24, "cols": 80}));
        assert_eq!(start["brief"], Value::Null);
    }

    #[test]
    fn a_preview_that_cannot_start_stops_everything_before_any_command_runs() {
        let (path, h) = fake(vec![("native_preview", json!({"ok": {"can_start": false, "plan_token": null}}))]);
        let home = std::env::temp_dir().to_string_lossy().into_owned();
        let before = |_: &[String], _: &str| -> Vec<(String, String)> { panic!("no command may run") };
        let r = open_launch(&Host::new(&path), &session_launch(None, None), &home, &before).unwrap_err();
        assert_eq!(r.0, "The launch “Codex” cannot start with this permission. No commands were run.");
        let seen = h.join().unwrap();
        assert_eq!(seen[0]["params"]["profile_id"], Value::Null, "as configured sends no template");
    }

    #[test]
    fn a_launch_with_an_arsenal_preset_is_refused_without_touching_the_host() {
        let host = Host::new("/nonexistent/none.sock");
        let before = |_: &[String], _: &str| -> Vec<(String, String)> { panic!("no command may run") };
        let home = std::env::temp_dir().to_string_lossy().into_owned();
        let r = open_launch(&host, &session_launch(Some(Permission::Ask), Some("Reviewer")), &home, &before).unwrap_err();
        assert!(r.0.contains("Reviewer") && r.0.contains("Nothing was started"), "{}", r.0);
    }

    #[test]
    fn host_failures_become_the_consoles_sentences() {
        let (path, _h) = fake(vec![("native_preview", json!({"err": {"code": "agent_not_installed", "reasons": [], "bytes_written": 0}}))]);
        let home = std::env::temp_dir().to_string_lossy().into_owned();
        let before = |_: &[String], _: &str| -> Vec<(String, String)> { Vec::new() };
        let r = open_launch(&Host::new(&path), &session_launch(None, None), &home, &before).unwrap_err();
        assert_eq!(r.0, "That agent is not installed on this computer.");
    }

    #[test]
    fn stop_restart_forget_and_sessions_send_what_the_console_sends() {
        let reply = json!({"session": session_answer("running"), "terminal": {"terminal_id": "t-10"}});
        let (path, h) = fake(vec![
            ("native_stop", json!({"ok": null})),
            ("native_restart", json!({"ok": reply})),
            ("native_forget", json!({"ok": null})),
            ("native_sessions", json!({"ok": [session_answer("stopped")]})),
        ]);
        let host = Host::new(&path);
        stop(&host, "sid").unwrap();
        assert_eq!(restart(&host, "sid").unwrap().terminal_id, "t-10");
        forget(&host, "sid").unwrap();
        assert_eq!(sessions(&host).unwrap()[0].state, "stopped");
        let seen = h.join().unwrap();
        assert_eq!(seen[0]["params"], json!({"id": "sid"}));
        assert_eq!(seen[1]["params"], json!({"id": "sid", "size": {"rows": 24, "cols": 80}}));
        assert_eq!(seen[2]["params"], json!({"id": "sid"}));
        assert_eq!(seen[3]["params"], json!({"sample": false}));
    }

    #[test]
    fn a_commands_launch_creates_a_terminal_in_its_folder_and_types_the_commands() {
        let (path, h) = fake(vec![("term_create", json!({"ok": {"terminal_id": "t-5"}})), ("term_write", json!({"ok": 15}))]);
        let l = Launch { id: "x".into(), name: "Preset de prueba".into(), directory: "/tmp".into(), kind: Kind::Commands { commands: vec!["echo preset-ok".into()] } };
        let before = |_: &[String], _: &str| -> Vec<(String, String)> { panic!("a terminal launch has no before") };
        let out = open_launch(&Host::new(&path), &l, "/home/o", &before).unwrap();
        assert_eq!(out, Opened::Terminal { terminal_id: "t-5".into(), title: "Preset de prueba".into() });
        let seen = h.join().unwrap();
        assert_eq!(seen[0]["params"]["cwd"], "/tmp");
        assert_eq!(seen[0]["params"]["title"], "Preset de prueba");
        assert_eq!(seen[1]["params"]["data"], json!(b"echo preset-ok\r".to_vec()));
        let empty = Launch { kind: Kind::Commands { commands: vec![] }, ..l };
        assert!(open_launch(&Host::new("/nonexistent/none.sock"), &empty, "/home/o", &before).unwrap_err().0.contains("no commands"));
    }

    #[test]
    fn before_commands_report_ok_exit_codes_and_timeouts() {
        let temp = std::env::temp_dir();
        let folder = temp.to_str().unwrap();
        let r = run_before(&["true".into(), "exit 3".into(), "echo hi >/dev/null".into()], folder);
        assert_eq!(r.iter().map(|(_, s)| s.as_str()).collect::<Vec<_>>(), vec!["ok", "exit 3", "ok"]);
        assert_eq!(before_with_timeout(&["sleep 5".into()], folder, Duration::from_millis(200))[0].1, "timeout");
        assert_eq!(before_with_timeout(&["true".into()], "/definitely/not/here", Duration::from_secs(1))[0].1, "not_started");
    }
}
