//! What the managed Codex runtime offers (F6a, MV-02/11/12): one read of its catalogue, with
//! what the runtime's own listing says about each entry, and where and when it was read.
//!
//! A listing is not entitlement: the runtime lists models it can name, and nothing here says
//! an account may use one. A default, an effort or a replacement is shown **as the runtime
//! marked it**, never as what a session uses; that is the observed model, read elsewhere.
//! The runtime's own prose (upgrade copy, descriptions) is never carried.
#[cfg(test)]
use super::view::AgentMode;
use crate::contracts::control::ModelOffer;
use serde::Serialize;

#[cfg(test)]
pub const CATALOGUE_SCHEMA_VERSION: u8 = 1;
/// Whether the managed runtime that was asked is there to answer.
#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum CatalogueState {
    /// Ready: the entries are what it listed when it started.
    Listed,
    /// Not running or not ready. A catalogue of a runtime that has stopped is never shown.
    NotReady,
}

/// One model the runtime listed. `None` for default, efforts and replacement means "the
/// authority did not report it" (an earlier version), which is not "no".
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct CatalogueEntry {
    pub model_id: String,
    pub display_name: Option<String>,
    pub provider_id: Option<String>,
    /// The runtime marks it as its default.
    pub is_default: Option<bool>,
    /// The effort the runtime marks as this model's default.
    pub default_effort: Option<String>,
    /// The efforts the runtime says this model supports.
    pub efforts: Option<Vec<String>>,
    /// The model the runtime marks as replacing this one, as an identifier.
    pub replaced_by: Option<String>,
    /// The date the runtime gives for retirement, as it gave it.
    pub retires_at: Option<String>,
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ModelCatalogue {
    pub schema_version: u8,
    pub state: CatalogueState,
    /// The mode of the generation that listed it, while it is ready.
    pub mode: Option<AgentMode>,
    /// The runtime's own version string, as it reported it.
    pub runtime_version: Option<String>,
    /// `Some(false)`: the runtime's listing continued past what the authority took.
    /// `None`: not reported.
    pub complete: Option<bool>,
    pub entries: Vec<CatalogueEntry>,
    /// When this desktop read it from the authority (Unix seconds).
    pub read_at: u64,
}

/// The descriptor's fields by name: its own accessors are not public, its encoding is.
pub(crate) fn entry_of(
    model: &serde_json::Value,
    offer: Option<&ModelOffer>,
) -> Option<CatalogueEntry> {
    let text = |key: &str| {
        model
            .get(key)
            .and_then(serde_json::Value::as_str)
            .map(str::to_owned)
    };
    Some(CatalogueEntry {
        model_id: text("model_id")?,
        display_name: text("display_name"),
        provider_id: text("provider_id"),
        is_default: offer.map(|o| o.is_default),
        default_effort: offer.and_then(|o| o.default_effort.clone()),
        efforts: offer.map(|o| o.efforts.clone()),
        replaced_by: offer.and_then(|o| o.replaced_by.clone()),
        retires_at: offer.and_then(|o| o.retires_at.clone()),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn an_entry_carries_what_the_runtime_marked_and_none_of_its_prose() {
        let model = json!({"schema_version":1,"provider_id":"custom","model_id":"m-1",
            "display_name":"M One","availability":"unknown"});
        let offer = ModelOffer {
            is_default: true,
            default_effort: Some("medium".into()),
            efforts: vec!["low".into(), "medium".into()],
            replaced_by: Some("m-2".into()),
            retires_at: Some("2027-01-31T00:00:00Z".into()),
        };
        let entry = entry_of(&model, Some(&offer)).unwrap();
        assert_eq!(entry.model_id, "m-1");
        assert_eq!(entry.display_name.as_deref(), Some("M One"));
        assert_eq!(entry.provider_id.as_deref(), Some("custom"));
        assert_eq!(entry.is_default, Some(true));
        assert_eq!(entry.efforts.as_deref().map(<[_]>::len), Some(2));
        assert_eq!(entry.replaced_by.as_deref(), Some("m-2"));
        // Availability is not carried at all: nothing says the account may use it.
        assert!(
            !serde_json::to_string(&entry)
                .unwrap()
                .contains("availability")
        );
        // An authority that reported no offer says nothing, which is not "not the default".
        let bare = entry_of(&model, None).unwrap();
        assert_eq!(
            (bare.is_default, bare.efforts, bare.default_effort),
            (None, None, None)
        );
        // No identifier, no entry.
        assert!(entry_of(&json!({"display_name":"x"}), None).is_none());
    }
}

#[cfg(test)]
mod service_tests {
    use super::*;
    #[test]
    fn the_catalogue_serializes_exactly_the_windows_fixture() {
        let fixture: serde_json::Value = serde_json::from_str(include_str!(
            "../../../tests/fixtures/model-catalogue-v1.json"
        ))
        .unwrap();
        // One entry, built from the same parts the fixture names.
        struct Offer<'a> {
            default: bool,
            effort: &'a str,
            efforts: &'a [&'a str],
            replaced_by: Option<&'a str>,
            retires_at: Option<&'a str>,
        }
        let entry = |id: &str, name: Option<&str>, provider: Option<&str>, offer: Option<Offer>| {
            CatalogueEntry {
                model_id: id.into(),
                display_name: name.map(Into::into),
                provider_id: provider.map(Into::into),
                is_default: offer.as_ref().map(|o| o.default),
                default_effort: offer.as_ref().map(|o| o.effort.to_owned()),
                efforts: offer
                    .as_ref()
                    .map(|o| o.efforts.iter().map(|e| (*e).to_owned()).collect()),
                replaced_by: offer.as_ref().and_then(|o| o.replaced_by.map(Into::into)),
                retires_at: offer.as_ref().and_then(|o| o.retires_at.map(Into::into)),
            }
        };
        let listed = ModelCatalogue {
            schema_version: CATALOGUE_SCHEMA_VERSION,
            state: CatalogueState::Listed,
            mode: Some(AgentMode::Inference),
            runtime_version: Some("0.159.0".into()),
            complete: Some(true),
            entries: vec![
                entry(
                    "model-a",
                    Some("Model A"),
                    None,
                    Some(Offer {
                        default: true,
                        effort: "medium",
                        efforts: &["low", "medium", "high"],
                        replaced_by: None,
                        retires_at: None,
                    }),
                ),
                entry(
                    "model-b",
                    Some("Model B (older)"),
                    Some("custom"),
                    Some(Offer {
                        default: false,
                        effort: "high",
                        efforts: &["high"],
                        replaced_by: Some("model-a"),
                        retires_at: Some("2027-01-31T00:00:00Z"),
                    }),
                ),
            ],
            read_at: 1_792_466_400,
        };
        assert_eq!(serde_json::to_value(&listed).unwrap(), fixture["listed"]);
        let partial = ModelCatalogue {
            schema_version: CATALOGUE_SCHEMA_VERSION,
            state: CatalogueState::Listed,
            mode: Some(AgentMode::LocalTools),
            runtime_version: None,
            complete: Some(false),
            entries: vec![entry("model-only", None, None, None)],
            read_at: 1_792_466_401,
        };
        assert_eq!(
            serde_json::to_value(&partial).unwrap(),
            fixture["partial_without_offers"]
        );
        let not_ready = ModelCatalogue {
            schema_version: CATALOGUE_SCHEMA_VERSION,
            state: CatalogueState::NotReady,
            mode: None,
            runtime_version: None,
            complete: None,
            entries: vec![],
            read_at: 1_792_466_402,
        };
        assert_eq!(
            serde_json::to_value(&not_ready).unwrap(),
            fixture["not_ready"]
        );
    }
}
