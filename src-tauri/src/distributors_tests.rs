use super::*;
use serde_json::json;
use std::os::unix::fs::PermissionsExt;

fn places() -> Places {
    let root = fs::canonicalize(std::env::temp_dir())
        .unwrap()
        .join(format!("wyss-dist-{}", uuid::Uuid::new_v4().simple()));
    let home = root.join("home");
    let bin = root.join("bin");
    fs::create_dir_all(&bin).unwrap();
    fs::create_dir_all(&home).unwrap();
    let tool = bin.join("kimi");
    fs::write(&tool, "#!/bin/sh\n").unwrap();
    fs::set_permissions(&tool, fs::Permissions::from_mode(0o755)).unwrap();
    Places {
        folder: home.join(".config/wyss-console/distributors"),
        launches: home.join(".config/wyss-console/launch"),
        home,
        path_var: Some(bin.into_os_string()),
    }
}

fn request(value: serde_json::Value) -> SaveRequest {
    serde_json::from_value(value).unwrap()
}

#[test]
fn an_added_distributor_is_saved_found_by_name_and_read_back() {
    let places = places();
    assert!(list(&places).unwrap().distributors.is_empty());
    let saved = save(
        &places,
        &request(json!({"name": "Kimi CLI", "maker": "Moonshot", "open": "kimi", "update": "uv tool upgrade kimi-cli"})),
    )
    .unwrap();
    assert_eq!(saved.id, "kimi-cli");
    assert_eq!(saved.executable, "kimi");
    assert!(saved.found.as_deref().unwrap().ends_with("/bin/kimi"));
    assert_eq!(saved.update.as_deref(), Some("uv tool upgrade kimi-cli"));
    let mode = fs::metadata(places.folder.join("kimi-cli.toml"))
        .unwrap()
        .permissions()
        .mode();
    assert_eq!(mode & 0o777, 0o600);
    // Not installed: listed, and nothing is run to find out.
    save(
        &places,
        &request(json!({"name": "Gemini CLI", "open": "gemini"})),
    )
    .unwrap();
    let all = list(&places).unwrap();
    assert_eq!(all.distributors.len(), 2);
    assert!(
        all.distributors
            .iter()
            .any(|d| d.id == "gemini-cli" && d.found.is_none())
    );
    // Edited by id; a new one with a name that exists is refused.
    let edited = save(
        &places,
        &request(json!({"id": "kimi-cli", "name": "Kimi CLI", "open": "kimi --yolo"})),
    )
    .unwrap();
    assert_eq!(edited.open, "kimi --yolo");
    assert!(edited.update.is_none());
    assert!(
        save(
            &places,
            &request(json!({"name": "Kimi CLI", "open": "kimi"}))
        )
        .is_err()
    );
    delete(&places, "gemini-cli").unwrap();
    assert_eq!(list(&places).unwrap().distributors.len(), 1);
}

#[test]
fn a_bad_command_or_name_writes_nothing() {
    let places = places();
    for bad in [
        json!({"name": "x", "open": "kimi\nrm -rf ~"}),
        json!({"name": "x", "open": "kimi", "update": "a\u{1b}[2J"}),
        json!({"name": "x", "open": "../kimi"}),
        json!({"name": "x", "open": "$(id)"}),
        json!({"name": "", "open": "kimi"}),
        json!({"name": "x", "open": ""}),
        json!({"id": "../x", "name": "x", "open": "kimi"}),
        json!({"id": "nope", "name": "x", "open": "kimi"}),
    ] {
        assert!(save(&places, &request(bad.clone())).is_err(), "{bad}");
    }
    assert!(fs::read_dir(&places.folder).map(|d| d.count()).unwrap_or(0) == 0);
    assert!(
        serde_json::from_value::<SaveRequest>(json!({"name": "x", "open": "k", "run": "id"}))
            .is_err()
    );
}

#[test]
fn a_launch_is_made_from_the_file_and_never_replaces_one() {
    let places = places();
    save(
        &places,
        &request(json!({"name": "Kimi CLI", "open": "kimi"})),
    )
    .unwrap();
    let id = make_launch(&places, "kimi-cli").unwrap();
    let text = fs::read_to_string(places.launches.join(format!("{id}.toml"))).unwrap();
    assert!(text.contains("commands = [\"kimi\"]"));
    let lp = crate::launch::Places {
        folder: places.launches.clone(),
        home: places.home.clone(),
        os_release: places.home.join("none"),
    };
    let launch = crate::launch::get(&lp, &id).unwrap();
    assert_eq!(launch.name, "Kimi CLI");
    assert!(make_launch(&places, "kimi-cli").is_err());
    assert!(make_launch(&places, "missing").is_err());
}
