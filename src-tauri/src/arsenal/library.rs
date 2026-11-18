use serde::Serialize;

use super::{
    analysis::{self, Compatibility},
    store::{Error, Selection, Store, Summary},
    terminal,
};

/// Maximum stored bytes read for dependency analysis in one operation.
const ANALYSIS_BYTES: usize = 64 * 1024 * 1024;

/// A library entry with what its format means for its own provider.
#[derive(Debug, Serialize)]
pub struct LibraryItem {
    #[serde(flatten)]
    pub summary: Summary,
    pub compatibility: Compatibility,
}

/// The library, each entry with the compatibility its detail shows: judged from its files and
/// their dependencies while the reading budget lasts, from its file names after that.
pub fn library(store: &Store) -> Result<Vec<LibraryItem>, Error> {
    let mut budget = ANALYSIS_BYTES;
    store
        .list()?
        .into_iter()
        .map(|summary| {
            let detail = store.detail(&summary.id, None)?;
            let size: usize = detail
                .files
                .iter()
                .map(|f| usize::try_from(f.size).unwrap_or(usize::MAX))
                .sum();
            let dependencies = if size <= budget {
                budget -= size;
                analysis::dependencies(&store.revision_content(&summary.id, detail.revision)?, None)
            } else {
                Vec::new()
            };
            let paths: Vec<&str> = detail.files.iter().map(|f| f.path.as_str()).collect();
            let compatibility = analysis::compatibility(
                &summary.kind,
                &summary.provider,
                &summary.provider,
                &paths,
                &dependencies,
            );
            Ok(LibraryItem {
                summary,
                compatibility,
            })
        })
        .collect()
}

/// The selection's items as the library holds them now, with their files while the reading budget
/// lasts. The second value says whether every resolved item's files were read.
pub fn resolve_items(
    store: &Store,
    selection: &Selection,
) -> Result<(Vec<terminal::Resolved>, bool), Error> {
    let mut budget = ANALYSIS_BYTES;
    let mut complete = true;
    let mut resolved = Vec::with_capacity(selection.items.len());
    for item in &selection.items {
        let pinned = item.revision.is_some();
        match store.detail(&item.capability, item.revision) {
            Ok(detail) => {
                let size: usize = detail
                    .files
                    .iter()
                    .map(|f| usize::try_from(f.size).unwrap_or(usize::MAX))
                    .sum();
                let files = if size <= budget {
                    budget -= size;
                    store.revision_content(&item.capability, detail.revision)?
                } else {
                    complete = false;
                    // Names only: compatibility can still see scripts, dependencies stay unknown.
                    detail
                        .files
                        .iter()
                        .map(|f| (f.path.clone(), Vec::new()))
                        .collect()
                };
                let tree_hash = detail
                    .revisions
                    .iter()
                    .find(|revision| revision.number == detail.revision)
                    .map(|revision| revision.tree_hash.clone())
                    .unwrap_or_default();
                resolved.push(terminal::Resolved {
                    capability: item.capability.clone(),
                    state: "resolved",
                    name: detail.summary.name,
                    kind: detail.summary.kind,
                    provider: detail.summary.provider,
                    revision: Some(detail.revision),
                    pinned,
                    tree_hash,
                    files,
                });
            }
            Err(Error::NotFound) => {
                let state = match store.detail(&item.capability, None) {
                    Ok(_) => "revision_missing",
                    Err(_) => "missing",
                };
                resolved.push(terminal::Resolved {
                    capability: item.capability.clone(),
                    state,
                    name: String::new(),
                    kind: String::new(),
                    provider: String::new(),
                    revision: item.revision,
                    pinned,
                    tree_hash: String::new(),
                    files: Vec::new(),
                });
            }
            Err(error) => return Err(error),
        }
    }
    Ok((resolved, complete))
}
