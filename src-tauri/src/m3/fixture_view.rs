use super::report::ProviderReport;
use serde::Serialize;

/// One held action, complete: the user decides on exactly this.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ApprovalView {
    pub item: String,
    pub kind: String,
    pub fingerprint: String,
    /// The `ProviderAction` as the approval machinery holds it (command, cwd, or file diffs).
    pub action: serde_json::Value,
    pub decisions: Vec<&'static str>,
    /// How the decision ended: `pending`, `accepted`, `declined`, `cancelled`, `confirmed`,
    /// `failed` or `indeterminate`.
    pub state: &'static str,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Message {
    pub role: &'static str,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct TurnView {
    pub id: String,
    /// `starting`, `running`, `completed`, `failed`, `interrupted`.
    pub state: &'static str,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct FixtureView {
    pub label: &'static str,
    /// `stopped`, `starting`, `ready`, `refused`, `failed`.
    pub phase: &'static str,
    pub profile: Option<&'static str>,
    pub conversation: Vec<Message>,
    pub turn: Option<TurnView>,
    pub approvals: Vec<ApprovalView>,
    pub report: Option<ProviderReport>,
    pub detail: Option<String>,
}
