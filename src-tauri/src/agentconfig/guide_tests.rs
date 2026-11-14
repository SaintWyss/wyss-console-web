use super::*;
use std::fs;
use std::os::unix::fs::symlink;

fn home() -> PathBuf {
    let home = std::env::temp_dir().join(format!("guide-{}", uuid::Uuid::new_v4().simple()));
    fs::create_dir_all(home.join(".claude/skills")).unwrap();
    fs::create_dir_all(home.join(".agents/skills")).unwrap();
    home
}

fn env(home: &Path) -> Environment {
    Environment {
        home: home.to_path_buf(),
        claude_config_dir: None,
        codex_home: None,
        project: None,
        system: PathBuf::from("/etc"),
        declared_writers: Vec::new(),
    }
}

fn skill(folder: &Path, front: &str, body: &str) {
    fs::create_dir_all(folder).unwrap();
    fs::write(
        folder.join("SKILL.md"),
        format!("---\n{front}\n---\n{body}"),
    )
    .unwrap();
}

fn find<'a>(guide: &'a Guide, tool: &str, name: &str) -> &'a GuideEntry {
    guide
        .entries
        .iter()
        .find(|entry| entry.tool == tool && entry.name == name)
        .unwrap_or_else(|| panic!("{tool} {name} not listed"))
}

#[test]
fn classifies_each_skill_by_where_it_resolves() {
    let home = home();
    let skills = home.join(".claude/skills");
    // The owner's own: a plain folder, with a folded description.
    skill(
        &skills.join("loops"),
        "name: loops\ndescription: >\n  Designs loops.\n  Use when a task repeats.",
        "# Loops\n",
    );
    // A link to the GSD Core payload.
    let gsd = home.join(".local/share/wyss/gsd-core/1.15.0/skills/gsd-help");
    skill(&gsd, "name: gsd-help\ndescription: Shows GSD commands.", "");
    symlink(&gsd, skills.join("gsd-help")).unwrap();
    // A link to a folder of the owner's that lives inside a checkout one level up: still the owner's.
    let source = home.join(".claude/skills-src/humanizer");
    fs::create_dir_all(source.join(".git")).unwrap();
    skill(
        &source.join("skills/humanizer"),
        "description: |\n  Rewrites text.",
        "",
    );
    symlink(
        "../skills-src/humanizer/skills/humanizer",
        skills.join("humanizer"),
    )
    .unwrap();
    // A Git checkout.
    skill(
        &skills.join("taste"),
        "description: Reads a site's taste.",
        "",
    );
    fs::create_dir_all(skills.join("taste/.git")).unwrap();
    // The Claude account's synced skills.
    skill(
        &skills.join("synced/acct/pdf"),
        "description: Reads PDFs.",
        "",
    );
    // A link out of the roots is listed, never read.
    let outside = home.join("elsewhere/evil");
    skill(&outside, "description: Should not be read.", "");
    symlink(&outside, skills.join("evil")).unwrap();

    let (guide, places) = scan(&env(&home));

    let loops = find(&guide, "claude_code", "loops");
    assert_eq!(loops.set, "mine");
    assert_eq!(loops.description, "Designs loops. Use when a task repeats.");
    assert_eq!(loops.scope, Some("claude"));
    let help = find(&guide, "claude_code", "gsd-help");
    assert_eq!(help.set, "gsd:claude_code");
    assert_eq!(help.description, "Shows GSD commands.");
    assert!(
        help.linked_to
            .as_deref()
            .unwrap()
            .contains("gsd-core/1.15.0")
    );
    let humanizer = find(&guide, "claude_code", "humanizer");
    assert_eq!(humanizer.set, "mine");
    assert_eq!(humanizer.description, "Rewrites text.");
    assert_eq!(
        find(&guide, "claude_code", "taste").set,
        "repos:claude_code"
    );
    let pdf = find(&guide, "claude_code", "pdf");
    assert_eq!(pdf.set, "account:claude_code");
    assert!(guide.entries.iter().all(|entry| entry.name != "synced"));
    let evil = find(&guide, "claude_code", "evil");
    assert_eq!(evil.unreadable, Some("outside_roots"));
    assert_eq!(evil.description, "");
    assert!(body(&env(&home), &places, &evil.id).is_none());
    let gsd_set = guide
        .sets
        .iter()
        .find(|set| set.key == "gsd:claude_code")
        .unwrap();
    assert_eq!(
        (gsd_set.name.as_str(), gsd_set.version.as_str()),
        ("GSD Core", "1.15.0")
    );
    fs::remove_dir_all(&home).unwrap();
}

#[test]
fn tells_which_tools_see_a_skill_and_whether_the_copies_differ() {
    let home = home();
    skill(
        &home.join(".claude/skills/same"),
        "description: Same.",
        "body",
    );
    skill(
        &home.join(".agents/skills/same"),
        "description: Same.",
        "body",
    );
    skill(
        &home.join(".claude/skills/differs"),
        "description: One.",
        "claude",
    );
    skill(
        &home.join(".agents/skills/differs"),
        "description: One.",
        "codex",
    );
    skill(
        &home.join(".agents/skills/codex-only"),
        "description: C.",
        "",
    );
    skill(
        &home.join(".agents/skills/gstack-qa"),
        "description: QA.",
        "",
    );
    skill(
        &home.join(".agents/skills/website-to-hyperframes"),
        "description: H.",
        "",
    );

    let (guide, _) = scan(&env(&home));

    let same = find(&guide, "claude_code", "same");
    assert_eq!((same.scope, same.codex_differs), (Some("both"), false));
    let differs = find(&guide, "claude_code", "differs");
    assert_eq!((differs.scope, differs.codex_differs), (Some("both"), true));
    assert!(find(&guide, "codex", "differs").codex_differs);
    assert_eq!(find(&guide, "codex", "codex-only").scope, Some("codex"));
    assert_eq!(find(&guide, "codex", "codex-only").set, "mine");
    assert_eq!(
        find(&guide, "codex", "gstack-qa").set,
        "bundle:codex:gstack"
    );
    assert_eq!(
        find(&guide, "codex", "website-to-hyperframes").set,
        "bundle:codex:hyperframes"
    );
    fs::remove_dir_all(&home).unwrap();
}

#[test]
fn reads_plugins_agents_and_the_body_by_id_only() {
    let home = home();
    let plugin = home.join(".claude/plugins/cache/market/caveman/1.0");
    fs::create_dir_all(plugin.join(".claude-plugin")).unwrap();
    fs::write(
        plugin.join(".claude-plugin/plugin.json"),
        r#"{"name":"caveman","version":"1.0","description":"Talks short."}"#,
    )
    .unwrap();
    skill(
        &plugin.join("skills/caveman-help"),
        "description: Help.",
        "",
    );
    fs::write(
        home.join(".claude/plugins/installed_plugins.json"),
        format!(
            r#"{{"plugins":{{"caveman@market":[{{"installPath":"{}"}}]}}}}"#,
            plugin.display()
        ),
    )
    .unwrap();
    let synced = home.join(".claude/plugins/synced/acct/uuid-1");
    fs::create_dir_all(synced.join(".claude-plugin")).unwrap();
    fs::write(
        synced.join(".claude-plugin/plugin.json"),
        r#"{"name":"design","version":"1.2.0"}"#,
    )
    .unwrap();
    skill(
        &synced.join("skills/critique"),
        "description: Critiques.",
        "",
    );
    fs::create_dir_all(home.join(".claude/agents")).unwrap();
    fs::write(
        home.join(".claude/agents/planner.md"),
        "---\ndescription: Plans.\n---\nYou plan.",
    )
    .unwrap();
    skill(
        &home.join(".claude/skills/hostile"),
        "description: Hostile.",
        "# Title\n<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n",
    );
    fs::write(home.join(".claude/skills/hostile/notes.txt"), "n").unwrap();

    let (guide, places) = scan(&env(&home));

    assert_eq!(
        find(&guide, "claude_code", "caveman-help").set,
        "plugin:claude_code:caveman"
    );
    assert_eq!(
        find(&guide, "claude_code", "critique").set,
        "plugin:claude_code:design"
    );
    let agent = find(&guide, "claude_code", "planner");
    assert_eq!(
        (agent.kind, agent.description.as_str()),
        ("agent", "Plans.")
    );
    let caveman = guide.sets.iter().find(|set| set.name == "caveman").unwrap();
    assert_eq!(caveman.description, "Talks short.");

    let hostile = find(&guide, "claude_code", "hostile");
    let read = body(&env(&home), &places, &hostile.id).unwrap();
    // The text is returned as it is written, without its front matter; the window shows it as text.
    assert!(read.text.starts_with("# Title\n<script>"));
    assert_eq!(
        read.files,
        vec!["SKILL.md".to_owned(), "notes.txt".to_owned()]
    );
    assert!(!read.cut);
    let agent_body = body(&env(&home), &places, &agent.id).unwrap();
    assert_eq!(agent_body.text, "You plan.");
    assert!(body(&env(&home), &places, "claude_code/skill/mine/../../etc").is_none());
    fs::remove_dir_all(&home).unwrap();
}

#[test]
fn reads_a_skills_folder_that_is_itself_a_link() {
    let home = home();
    let elsewhere = home.join("dotfiles/skills");
    skill(&elsewhere.join("loops"), "description: Loops.", "");
    fs::remove_dir(home.join(".claude/skills")).unwrap();
    symlink(&elsewhere, home.join(".claude/skills")).unwrap();
    // A plugins folder that is a link too: its record and its plugin are read through it.
    let plugins = home.join("dotfiles/plugins");
    let plugin = plugins.join("cache/m/p/1.0");
    fs::create_dir_all(plugin.join(".claude-plugin")).unwrap();
    fs::write(plugin.join(".claude-plugin/plugin.json"), r#"{"name":"p"}"#).unwrap();
    skill(&plugin.join("skills/ps"), "description: Plugin skill.", "");
    fs::write(
        plugins.join("installed_plugins.json"),
        format!(r#"{{"plugins":{{"p@m":[{{"installPath":"{}"}}]}}}}"#, plugin.display()),
    )
    .unwrap();
    symlink(&plugins, home.join(".claude/plugins")).unwrap();
    let (guide, places) = scan(&env(&home));
    let loops = find(&guide, "claude_code", "loops");
    assert_eq!(
        (loops.description.as_str(), loops.unreadable),
        ("Loops.", None)
    );
    assert!(body(&env(&home), &places, &loops.id).is_some());
    assert_eq!(find(&guide, "claude_code", "ps").set, "plugin:claude_code:p");
    fs::remove_dir_all(&home).unwrap();
}

#[test]
fn cuts_a_long_body_and_says_so() {
    let home = home();
    skill(
        &home.join(".claude/skills/long"),
        "description: Long.",
        &"á".repeat(BODY_BYTES),
    );
    let (guide, places) = scan(&env(&home));
    let read = body(
        &env(&home),
        &places,
        &find(&guide, "claude_code", "long").id,
    )
    .unwrap();
    assert!(read.cut);
    assert!(read.text.len() <= BODY_BYTES);
    fs::remove_dir_all(&home).unwrap();
}
