//! The Console window: icon rail, tab bar, a tree of panes (GtkPaned) whose leaves are terminals
//! of the host, a status bar. The logic that does not need a widget lives in `layout`, `keymap`
//! and `procinfo`; this file only wires them to GTK.

use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::rc::Rc;

use gtk::prelude::*;
use gtk::{gdk, glib};

use crate::host::Host;
use crate::icons::{self, Icon};
use crate::keymap::{self, Action, Focus};
use crate::layout::{self, Dir, Node, SavedLayout, SavedTab};
use crate::procinfo::{self, Git};
use crate::term;

const THEME: &str = include_str!("theme.css");
const REFRESH_SECS: u32 = 2;

pub struct Config {
    pub host: Option<Host>,
    /// Tabs to open when there is nothing to restore.
    pub tabs: usize,
}

/// What the periodic read of /proc learned about a pane.
#[derive(Clone, Default)]
struct Info {
    known: bool,
    running: bool,
    shell: String,
    pid: Option<i32>,
    rss: Option<u64>,
    cwd: Option<String>,
    git: Option<Git>,
}

struct Pane {
    key: String,
    tid: Option<String>,
    id: u64,
    term: term::Terminal,
    root: gtk::Box,
    dot: gtk::Box,
    shell: gtk::Label,
    state: gtk::Label,
    ram: gtk::Label,
    info: RefCell<Info>,
}

struct Tab {
    n: u64,
    tree: Node,
    focus: String,
    body: gtk::Box,
    head: gtk::Box,
    ram: gtk::Label,
    count: gtk::Label,
}

struct Job {
    key: String,
    tid: Option<String>,
    local_pid: Option<u32>,
    known: Option<(i32, String)>,
}

struct Res {
    key: String,
    info: Info,
}

struct Ui {
    win: gtk::ApplicationWindow,
    stack: gtk::Stack,
    tab_strip: gtk::Box,
    folder: gtk::Label,
    git: gtk::Label,
    tabs: RefCell<Vec<Tab>>,
    active: Cell<usize>,
    panes: RefCell<HashMap<String, Rc<Pane>>>,
    by_id: RefCell<HashMap<u64, String>>,
    next_id: Cell<u64>,
    next_n: Cell<u64>,
    host: Option<Host>,
    home: Option<String>,
    refreshing: Cell<bool>,
    save_pending: Cell<bool>,
}

thread_local! {
    /// The worker thread hands its results back through the main context, which reaches the UI here.
    static UI: RefCell<Option<Rc<Ui>>> = const { RefCell::new(None) };
}

fn dismantle(w: &gtk::Widget) {
    if let Some(p) = w.downcast_ref::<gtk::Paned>() {
        let (a, b) = (p.start_child(), p.end_child());
        p.set_start_child(None::<&gtk::Widget>);
        p.set_end_child(None::<&gtk::Widget>);
        for c in [a, b].into_iter().flatten() {
            dismantle(&c);
        }
    }
}

fn label(text: &str, class: &str) -> gtk::Label {
    let l = gtk::Label::new(Some(text));
    l.add_css_class(class);
    l
}

fn tauri_bin() -> String {
    std::env::var("WYSS_TAURI_BIN").ok().filter(|v| !v.is_empty()).unwrap_or_else(|| format!("{}/.local/opt/wyss-console/bin/wyss-console", std::env::var("HOME").unwrap_or_default()))
}

/// Starts the Tauri app as a process of its own and does not wait for it.
fn launch_tauri() {
    use std::os::unix::process::CommandExt;
    let bin = tauri_bin();
    match std::process::Command::new(&bin).stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null()).process_group(0).spawn() {
        Ok(mut child) => {
            // Reaped in the background so it never lingers as a zombie.
            std::thread::spawn(move || {
                let _ = child.wait();
            });
        }
        Err(e) => eprintln!("gtk-term: cannot start {bin}: {e}"),
    }
}

impl Ui {
    // ---- panes ----------------------------------------------------------------------------

    fn new_pane(self: &Rc<Self>, source: term::Source, tid: Option<String>) -> Rc<Pane> {
        let id = self.next_id.get();
        self.next_id.set(id + 1);
        let key = tid.clone().unwrap_or_else(|| format!("local-{id}"));
        let weak = Rc::downgrade(self);
        let t = term::Terminal::new(id, source, move || {
            if let Some(ui) = weak.upgrade() {
                ui.on_exit(id);
            }
        });

        let root = gtk::Box::new(gtk::Orientation::Vertical, 0);
        root.add_css_class("pane");
        root.set_overflow(gtk::Overflow::Hidden);
        let header = gtk::Box::new(gtk::Orientation::Horizontal, 0);
        header.add_css_class("pane-header");
        let dot = gtk::Box::new(gtk::Orientation::Horizontal, 0);
        dot.add_css_class("dot");
        dot.set_valign(gtk::Align::Center);
        let shell = label("", "pane-shell");
        let state = label(" · Running", "pane-state");
        let ram = label(" · ", "pane-ram");
        shell.set_visible(false);
        ram.set_visible(false);
        for w in [dot.upcast_ref::<gtk::Widget>(), shell.upcast_ref(), state.upcast_ref(), ram.upcast_ref()] {
            header.append(w);
        }
        root.append(&header);
        t.widget.set_margin_start(8);
        t.widget.set_margin_top(6);
        root.append(&t.widget);

        let focus = gtk::EventControllerFocus::new();
        {
            let weak = Rc::downgrade(self);
            let key = key.clone();
            focus.connect_enter(move |_| {
                if let Some(ui) = weak.upgrade() {
                    ui.focus_changed(&key);
                }
            });
        }
        t.widget.add_controller(focus);

        let pane = Rc::new(Pane { key: key.clone(), tid, id, term: t, root, dot, shell, state, ram, info: RefCell::new(Info { running: true, ..Info::default() }) });
        self.panes.borrow_mut().insert(key.clone(), pane.clone());
        self.by_id.borrow_mut().insert(id, key);
        pane
    }

    fn on_exit(self: &Rc<Self>, id: u64) {
        let key = self.by_id.borrow().get(&id).cloned();
        if let Some(key) = key {
            // The shell ended: the host already dropped it.
            self.remove_pane(&key, false);
        }
    }

    fn source(&self) -> Option<(term::Source, Option<String>)> {
        let Some(host) = &self.host else { return Some((term::Source::Local, None)) };
        match host.create(24, 80) {
            Ok(tid) => Some((term::Source::Host { host: host.clone(), tid: tid.clone(), attach: term::Attach::Fresh }, Some(tid))),
            Err(e) => {
                eprintln!("gtk-term: term_create failed: {e}");
                None
            }
        }
    }

    fn pane(&self, key: &str) -> Option<Rc<Pane>> {
        self.panes.borrow().get(key).cloned()
    }

    fn tab_of(&self, key: &str) -> Option<usize> {
        self.tabs.borrow().iter().position(|t| layout::has(&t.tree, key))
    }

    // ---- tabs -----------------------------------------------------------------------------

    fn add_tab(self: &Rc<Self>, n: u64, tree: Node, focus: String) {
        let head = gtk::Box::new(gtk::Orientation::Horizontal, 0);
        head.add_css_class("tab");
        head.set_valign(gtk::Align::Fill);
        let name = label(&format!("Terminal {n}"), "tab-name");
        let ram = label("", "tab-ram");
        let count = label("", "tab-panes");
        ram.set_visible(false);
        count.set_visible(false);
        let close = gtk::Button::with_label("×");
        close.add_css_class("tab-close");
        close.set_valign(gtk::Align::Center);
        close.set_tooltip_text(Some("Close tab"));
        close.set_focusable(false);
        for w in [name.upcast_ref::<gtk::Widget>(), count.upcast_ref(), ram.upcast_ref(), close.upcast_ref()] {
            head.append(w);
        }
        let click = gtk::GestureClick::new();
        {
            let weak = Rc::downgrade(self);
            click.connect_pressed(move |g, _, _, _| {
                if g.current_button() != 1 {
                    return;
                }
                if let Some(ui) = weak.upgrade() {
                    if let Some(i) = ui.tabs.borrow().iter().position(|t| t.n == n) {
                        let ui = ui.clone();
                        glib::idle_add_local_once(move || ui.select(i));
                    }
                }
            });
        }
        head.add_controller(click);
        {
            let weak = Rc::downgrade(self);
            close.connect_clicked(move |_| {
                if let Some(ui) = weak.upgrade() {
                    let i = ui.tabs.borrow().iter().position(|t| t.n == n);
                    if let Some(i) = i {
                        ui.close_tab(i);
                    }
                }
            });
        }
        let body = gtk::Box::new(gtk::Orientation::Vertical, 0);
        body.add_css_class("body");
        self.stack.add_named(&body, Some(&format!("t{n}")));
        self.tab_strip.append(&head);
        self.tabs.borrow_mut().push(Tab { n, tree, focus, body, head, ram, count });
        let i = self.tabs.borrow().len() - 1;
        self.rebuild(i);
    }

    fn build(self: &Rc<Self>, node: &Node, path: &str, tab_n: u64) -> gtk::Widget {
        match node {
            Node::Leaf(k) => self.pane(k).map(|p| p.root.clone().upcast()).unwrap_or_else(|| gtk::Box::new(gtk::Orientation::Vertical, 0).upcast()),
            Node::Split { dir, ratio, a, b } => {
                let orient = if *dir == Dir::Row { gtk::Orientation::Horizontal } else { gtk::Orientation::Vertical };
                let p = gtk::Paned::new(orient);
                p.set_wide_handle(true);
                p.set_start_child(Some(&self.build(a, &format!("{path}a"), tab_n)));
                p.set_end_child(Some(&self.build(b, &format!("{path}b"), tab_n)));
                p.set_resize_start_child(true);
                p.set_resize_end_child(true);
                p.set_shrink_start_child(false);
                p.set_shrink_end_child(false);
                p.set_hexpand(true);
                p.set_vexpand(true);
                // Once it has a size: start at the saved share, then follow the divider.
                let ready = Rc::new(Cell::new(false));
                {
                    let (ready, ratio) = (ready.clone(), *ratio);
                    p.add_tick_callback(move |p, _| {
                        let size = if p.orientation() == gtk::Orientation::Horizontal { p.width() } else { p.height() };
                        if size <= 0 {
                            return glib::ControlFlow::Continue;
                        }
                        p.set_position((size as f64 * ratio).round() as i32);
                        ready.set(true);
                        glib::ControlFlow::Break
                    });
                }
                let weak = Rc::downgrade(self);
                let path = path.to_owned();
                p.connect_notify_local(Some("position"), move |p, _| {
                    if !ready.get() {
                        return;
                    }
                    let size = if p.orientation() == gtk::Orientation::Horizontal { p.width() } else { p.height() };
                    if size <= 0 {
                        return;
                    }
                    if let Some(ui) = weak.upgrade() {
                        ui.set_ratio(tab_n, &path, p.position() as f64 / size as f64);
                    }
                });
                p.upcast()
            }
        }
    }

    fn set_ratio(self: &Rc<Self>, tab_n: u64, path: &str, ratio: f64) {
        {
            let mut tabs = self.tabs.borrow_mut();
            let Some(t) = tabs.iter_mut().find(|t| t.n == tab_n) else { return };
            t.tree = layout::resize(&t.tree, path, ratio);
        }
        self.save_soon();
    }

    /// Builds the widget tree of a tab again from its layout tree.
    fn rebuild(self: &Rc<Self>, i: usize) {
        let (n, tree, body) = {
            let tabs = self.tabs.borrow();
            let t = &tabs[i];
            (t.n, t.tree.clone(), t.body.clone())
        };
        if let Some(old) = body.first_child() {
            dismantle(&old);
            body.remove(&old);
        }
        body.append(&self.build(&tree, "", n));
        self.refresh_tab_labels(i);
        self.mark_focus(i);
    }

    fn mark_focus(&self, i: usize) {
        let (tree, focus) = {
            let tabs = self.tabs.borrow();
            (tabs[i].tree.clone(), tabs[i].focus.clone())
        };
        let many = layout::leaves(&tree).len() > 1;
        for k in layout::leaves(&tree) {
            if let Some(p) = self.pane(&k) {
                if many && k == focus {
                    p.root.add_css_class("focused");
                } else {
                    p.root.remove_css_class("focused");
                }
            }
        }
    }

    fn refresh_tab_labels(&self, i: usize) {
        let tabs = self.tabs.borrow();
        let t = &tabs[i];
        let keys = layout::leaves(&t.tree);
        t.count.set_text(&format!("▦ {}", keys.len()));
        t.count.set_visible(keys.len() >= 2);
        let rss: Vec<Option<u64>> = keys.iter().map(|k| self.pane(k).and_then(|p| p.info.borrow().rss)).collect();
        if rss.iter().any(Option::is_some) {
            t.ram.set_text(&procinfo::mb(Some(rss.iter().flatten().sum())));
            t.ram.set_visible(true);
        } else {
            t.ram.set_visible(false);
        }
    }

    fn select(self: &Rc<Self>, i: usize) {
        let (n, focus) = {
            let tabs = self.tabs.borrow();
            let Some(t) = tabs.get(i) else { return };
            (t.n, t.focus.clone())
        };
        self.active.set(i);
        for (j, t) in self.tabs.borrow().iter().enumerate() {
            if j == i {
                t.head.add_css_class("active");
            } else {
                t.head.remove_css_class("active");
            }
        }
        self.stack.set_visible_child_name(&format!("t{n}"));
        self.update_status();
        self.focus_pane(&focus);
        self.save_soon();
    }

    fn focus_pane(&self, key: &str) {
        if let Some(p) = self.pane(key) {
            let w = p.term.widget.clone();
            glib::idle_add_local_once(move || {
                w.grab_focus();
            });
        }
    }

    fn focus_changed(&self, key: &str) {
        let Some(i) = self.tab_of(key) else { return };
        self.tabs.borrow_mut()[i].focus = key.to_owned();
        self.mark_focus(i);
        if i == self.active.get() {
            self.update_status();
        }
    }

    fn close_tab(self: &Rc<Self>, i: usize) {
        let keys = match self.tabs.borrow().get(i) {
            Some(t) => layout::leaves(&t.tree),
            None => return,
        };
        for k in keys {
            self.remove_pane(&k, true);
        }
    }

    fn remove_tab_at(self: &Rc<Self>, i: usize) {
        let t = self.tabs.borrow_mut().remove(i);
        if let Some(old) = t.body.first_child() {
            dismantle(&old);
            t.body.remove(&old);
        }
        self.stack.remove(&t.body);
        self.tab_strip.remove(&t.head);
        let left = self.tabs.borrow().len();
        if left == 0 {
            self.save_now();
            self.win.close();
            return;
        }
        let was = self.active.get();
        let now = if i < was || (i == was && i >= left) { was.saturating_sub(1) } else { was };
        self.select(now.min(left - 1));
    }

    fn remove_pane(self: &Rc<Self>, key: &str, close_in_host: bool) {
        let Some(i) = self.tab_of(key) else { return };
        let old = self.tabs.borrow()[i].tree.clone();
        let next_focus = layout::cycle(&old, key, 1).filter(|k| k != key);
        let pane = self.panes.borrow_mut().remove(key);
        if let Some(p) = &pane {
            self.by_id.borrow_mut().remove(&p.id);
            if let (Some(h), Some(tid)) = (self.host.clone(), p.tid.clone()) {
                if close_in_host {
                    std::thread::spawn(move || {
                        let _ = h.close(&tid);
                    });
                }
            }
        }
        match layout::remove(&old, key) {
            None => {
                // Detach the pane before its tab goes away.
                self.tabs.borrow_mut()[i].tree = Node::Leaf(String::new());
                self.remove_tab_at(i);
            }
            Some(tree) => {
                let was_focus = self.tabs.borrow()[i].focus == key;
                {
                    let mut tabs = self.tabs.borrow_mut();
                    tabs[i].tree = tree;
                    if was_focus {
                        tabs[i].focus = next_focus.clone().unwrap_or_default();
                    }
                }
                self.rebuild(i);
                if i == self.active.get() {
                    if let Some(k) = next_focus.filter(|_| was_focus) {
                        self.focus_pane(&k);
                    }
                    self.update_status();
                }
                self.save_soon();
            }
        }
    }

    // ---- actions --------------------------------------------------------------------------

    fn new_tab(self: &Rc<Self>) {
        let Some((src, tid)) = self.source() else { return };
        let pane = self.new_pane(src, tid);
        let n = self.next_n.get();
        self.next_n.set(n + 1);
        self.add_tab(n, layout::leaf(&pane.key), pane.key.clone());
        let last = self.tabs.borrow().len() - 1;
        self.select(last);
        self.refresh_soon();
    }

    fn split(self: &Rc<Self>, dir: Dir) {
        let i = self.active.get();
        let (tree, focus) = {
            let tabs = self.tabs.borrow();
            let Some(t) = tabs.get(i) else { return };
            (t.tree.clone(), t.focus.clone())
        };
        let Some((src, tid)) = self.source() else { return };
        let pane = self.new_pane(src, tid);
        let new_tree = layout::split(&tree, &focus, &pane.key, dir);
        if new_tree == tree {
            // The tab is full: the terminal made for it goes away again.
            self.panes.borrow_mut().remove(&pane.key);
            self.by_id.borrow_mut().remove(&pane.id);
            if let (Some(h), Some(tid)) = (self.host.clone(), pane.tid.clone()) {
                std::thread::spawn(move || {
                    let _ = h.close(&tid);
                });
            }
            return;
        }
        {
            let mut tabs = self.tabs.borrow_mut();
            tabs[i].tree = new_tree;
            tabs[i].focus = pane.key.clone();
        }
        self.rebuild(i);
        self.focus_pane(&pane.key);
        self.save_soon();
        self.refresh_soon();
    }

    fn do_action(self: &Rc<Self>, a: Action) {
        let i = self.active.get();
        match a {
            Action::NewTab => self.new_tab(),
            Action::Split(d) => self.split(d),
            Action::ClosePane => {
                let focus = self.tabs.borrow().get(i).map(|t| t.focus.clone());
                if let Some(k) = focus {
                    self.remove_pane(&k, true);
                }
            }
            Action::Focus(f) => {
                let (tree, focus) = match self.tabs.borrow().get(i) {
                    Some(t) => (t.tree.clone(), t.focus.clone()),
                    None => return,
                };
                let to = match f {
                    Focus::Way(w) => layout::neighbour(&tree, &focus, w),
                    Focus::Next => layout::cycle(&tree, &focus, 1),
                    Focus::Previous => layout::cycle(&tree, &focus, -1),
                };
                if let Some(k) = to {
                    self.focus_pane(&k);
                }
            }
            Action::Tab(step) => {
                let n = self.tabs.borrow().len() as i32;
                if n > 0 {
                    self.select((i as i32 + step).rem_euclid(n) as usize);
                }
            }
            Action::Jump(n) => {
                if n >= 1 && n <= self.tabs.borrow().len() {
                    self.select(n - 1);
                }
            }
        }
    }

    // ---- status bar and /proc -------------------------------------------------------------

    fn update_status(&self) {
        let focus = self.tabs.borrow().get(self.active.get()).map(|t| t.focus.clone());
        let info = focus.and_then(|k| self.pane(&k)).map(|p| p.info.borrow().clone());
        match info {
            Some(Info { known: true, cwd: Some(cwd), git, .. }) => {
                self.folder.set_text(&procinfo::home_short(&cwd, self.home.as_deref()));
                self.folder.set_tooltip_text(Some(&cwd));
                self.git.set_text(&match git {
                    Some(Git::Branch(b)) => b,
                    Some(Git::Detached(h)) => format!("detached {h}"),
                    _ => "no git".into(),
                });
            }
            _ => {
                self.folder.set_text("");
                self.git.set_text("");
            }
        }
    }

    fn visible(&self) -> bool {
        if !self.win.is_visible() || !self.win.is_mapped() {
            return false;
        }
        match self.win.surface().and_then(|s| s.downcast::<gdk::Toplevel>().ok()) {
            Some(t) => !t.state().contains(gdk::ToplevelState::MINIMIZED),
            None => true,
        }
    }

    fn refresh_soon(self: &Rc<Self>) {
        let ui = self.clone();
        glib::timeout_add_local_once(std::time::Duration::from_millis(400), move || ui.refresh());
    }

    /// Reads memory, folder and branch of every pane off the GTK thread. Only while the window shows.
    fn refresh(self: &Rc<Self>) {
        if !self.visible() || self.refreshing.get() {
            return;
        }
        self.refreshing.set(true);
        let jobs: Vec<Job> = self
            .panes
            .borrow()
            .values()
            .map(|p| {
                let info = p.info.borrow();
                Job { key: p.key.clone(), tid: p.tid.clone(), local_pid: p.term.local_pid, known: info.pid.map(|pid| (pid, info.shell.clone())).filter(|_| info.known) }
            })
            .collect();
        let host = self.host.clone();
        std::thread::spawn(move || {
            let results: Vec<Res> = jobs.into_iter().map(|j| probe(host.as_ref(), j)).collect();
            glib::MainContext::default().invoke(move || {
                UI.with(|u| {
                    if let Some(ui) = u.borrow().clone() {
                        ui.apply(results);
                    }
                });
            });
        });
    }

    fn apply(self: &Rc<Self>, results: Vec<Res>) {
        self.refreshing.set(false);
        for r in results {
            let Some(p) = self.pane(&r.key) else { continue };
            p.shell.set_text(&r.info.shell);
            p.shell.set_visible(!r.info.shell.is_empty());
            p.state.set_text(if r.info.running { " · Running" } else { " · Exited" });
            if r.info.running {
                p.dot.remove_css_class("ended");
            } else {
                p.dot.add_css_class("ended");
            }
            p.ram.set_text(&format!(" · {}", procinfo::mb(r.info.rss)));
            p.ram.set_visible(r.info.rss.is_some());
            *p.info.borrow_mut() = r.info;
        }
        for i in 0..self.tabs.borrow().len() {
            self.refresh_tab_labels(i);
        }
        self.update_status();
    }

    // ---- persistence ----------------------------------------------------------------------

    fn snapshot(&self) -> SavedLayout {
        let tabs = self.tabs.borrow();
        SavedLayout { tabs: tabs.iter().map(|t| SavedTab { n: t.n, root: t.tree.clone(), focus: t.focus.clone() }).collect(), active: self.active.get() }
    }

    fn save_now(&self) {
        if self.host.is_none() {
            return;
        }
        if let Some(path) = layout::state_path() {
            if let Err(e) = layout::save(&path, &self.snapshot()) {
                eprintln!("gtk-term: cannot save the layout: {e}");
            }
        }
    }

    fn save_soon(self: &Rc<Self>) {
        if self.host.is_none() || self.save_pending.replace(true) {
            return;
        }
        let ui = self.clone();
        glib::timeout_add_local_once(std::time::Duration::from_millis(300), move || {
            ui.save_pending.set(false);
            ui.save_now();
        });
    }
}

/// One pane's facts. Runs on the worker thread: a socket call at most once per terminal (shell and
/// process id), then only `/proc` and the files of a git checkout.
fn probe(host: Option<&Host>, j: Job) -> Res {
    let mut info = Info { known: true, running: true, ..Info::default() };
    let mut gone = false;
    match (&j.known, &j.tid, host, j.local_pid) {
        (Some((pid, shell)), _, _, _) => {
            info.pid = Some(*pid);
            info.shell = shell.clone();
        }
        (None, Some(tid), Some(h), _) => match h.status(tid) {
            Ok(st) if st.state == "running" => {
                info.pid = st.pid.map(|p| p as i32);
                info.shell = st.shell;
            }
            Ok(_) | Err(crate::host::HostError::Remote { .. }) => gone = true,
            Err(_) => info.known = false,
        },
        (None, None, _, Some(pid)) => {
            info.pid = Some(pid as i32);
            info.shell = std::env::var("SHELL").unwrap_or_else(|_| "sh".into());
        }
        _ => info.known = false,
    }
    if gone {
        info.running = false;
    } else if let Some(pid) = info.pid {
        match procinfo::tree_rss(pid) {
            Some(rss) => {
                info.rss = Some(rss);
                if let Some(cwd) = procinfo::cwd(pid) {
                    info.git = Some(procinfo::git_state(&cwd));
                    info.cwd = Some(cwd.to_string_lossy().into_owned());
                }
            }
            None => info.running = false,
        }
    }
    Res { key: j.key, info }
}

fn rail_button(icon: Icon, tip: &str, active: bool) -> (gtk::Box, gtk::Button) {
    let row = gtk::Box::new(gtk::Orientation::Horizontal, 0);
    let marker = gtk::Box::new(gtk::Orientation::Horizontal, 0);
    marker.add_css_class("rail-marker");
    marker.set_valign(gtk::Align::Center);
    if active {
        marker.add_css_class("active");
    }
    let b = gtk::Button::new();
    b.set_child(Some(&icons::widget(icon, 20)));
    b.add_css_class("rail-btn");
    if active {
        b.add_css_class("active");
    }
    b.set_tooltip_text(Some(tip));
    row.append(&marker);
    row.append(&b);
    (row, b)
}

fn tool_button(icon: Icon, tip: &str) -> gtk::Button {
    let b = gtk::Button::new();
    b.set_child(Some(&icons::widget(icon, 16)));
    b.add_css_class("tool-btn");
    b.set_tooltip_text(Some(tip));
    b.set_valign(gtk::Align::Center);
    b
}

fn shortcuts_popover(anchor: &gtk::Button) -> gtk::Popover {
    let pop = gtk::Popover::new();
    pop.add_css_class("shortcuts");
    pop.set_parent(anchor);
    let grid = gtk::Grid::new();
    grid.set_row_spacing(6);
    grid.set_column_spacing(24);
    let title = label("Keyboard shortcuts", "shortcut-title");
    title.set_halign(gtk::Align::Start);
    grid.attach(&title, 0, 0, 2, 1);
    for (i, (k, what)) in keymap::LEGEND.iter().enumerate() {
        let (kl, wl) = (label(k, "shortcut-key"), label(what, "shortcut-what"));
        kl.set_halign(gtk::Align::Start);
        wl.set_halign(gtk::Align::Start);
        grid.attach(&kl, 0, i as i32 + 1, 1, 1);
        grid.attach(&wl, 1, i as i32 + 1, 1, 1);
    }
    pop.set_child(Some(&grid));
    pop
}

pub fn build(app: &gtk::Application, cfg: Config) -> gtk::ApplicationWindow {
    let provider = gtk::CssProvider::new();
    provider.load_from_string(THEME);
    if let Some(display) = gdk::Display::default() {
        gtk::style_context_add_provider_for_display(&display, &provider, gtk::STYLE_PROVIDER_PRIORITY_APPLICATION);
    }
    let win = gtk::ApplicationWindow::builder().application(app).title("Wyss Console").default_width(1200).default_height(800).build();
    win.add_css_class("console");

    // Rail.
    let rail = gtk::Box::new(gtk::Orientation::Vertical, 4);
    rail.add_css_class("rail");
    for (icon, tip, active) in [
        (Icon::Terminal, "Console", true),
        (Icon::Sliders, "Workspace", false),
        (Icon::Palette, "Personalization", false),
        (Icon::Activity, "Activity", false),
        (Icon::Settings, "Settings", false),
    ] {
        let (row, b) = rail_button(icon, tip, active);
        if !active {
            b.connect_clicked(|_| launch_tauri());
        }
        rail.append(&row);
    }
    let spacer = gtk::Box::new(gtk::Orientation::Vertical, 0);
    spacer.set_vexpand(true);
    rail.append(&spacer);
    let (more_row, more) = rail_button(Icon::More, "More", false);
    more.connect_clicked(|_| launch_tauri());
    rail.append(&more_row);

    // Tab bar.
    let tab_strip = gtk::Box::new(gtk::Orientation::Horizontal, 0);
    tab_strip.set_hexpand(true);
    let tools = gtk::Box::new(gtk::Orientation::Horizontal, 0);
    tools.add_css_class("tools");
    let split_row = tool_button(Icon::SplitRow, "Split side by side (Ctrl+Shift+D)");
    let split_col = tool_button(Icon::SplitCol, "Split one above the other (Ctrl+Shift+E)");
    let keys = tool_button(Icon::Keyboard, "Keyboard shortcuts");
    for b in [&split_row, &split_col, &keys] {
        tools.append(b);
    }
    let tabbar = gtk::Box::new(gtk::Orientation::Horizontal, 0);
    tabbar.add_css_class("tabbar");
    tabbar.append(&tab_strip);
    tabbar.append(&tools);

    let stack = gtk::Stack::new();
    stack.set_vexpand(true);
    stack.set_hexpand(true);

    // Status bar.
    let status = gtk::Box::new(gtk::Orientation::Horizontal, 0);
    status.add_css_class("statusbar");
    let folder_icon = icons::widget(Icon::Folder, 14);
    let folder = label("", "status-folder");
    let git = label("", "status-git");
    let kind = label("Terminal", "status-kind");
    kind.set_hexpand(true);
    kind.set_halign(gtk::Align::End);
    for w in [folder_icon.upcast_ref::<gtk::Widget>(), folder.upcast_ref(), git.upcast_ref(), kind.upcast_ref()] {
        status.append(w);
    }

    let main = gtk::Box::new(gtk::Orientation::Vertical, 0);
    main.set_hexpand(true);
    main.append(&tabbar);
    main.append(&stack);
    main.append(&status);
    let outer = gtk::Box::new(gtk::Orientation::Horizontal, 0);
    outer.append(&rail);
    outer.append(&main);
    win.set_child(Some(&outer));

    let ui = Rc::new(Ui {
        win: win.clone(),
        stack,
        tab_strip,
        folder,
        git,
        tabs: RefCell::new(Vec::new()),
        active: Cell::new(0),
        panes: RefCell::new(HashMap::new()),
        by_id: RefCell::new(HashMap::new()),
        next_id: Cell::new(1),
        next_n: Cell::new(1),
        host: cfg.host.clone(),
        home: std::env::var("HOME").ok(),
        refreshing: Cell::new(false),
        save_pending: Cell::new(false),
    });
    UI.with(|u| *u.borrow_mut() = Some(ui.clone()));

    {
        let ui = ui.clone();
        split_row.connect_clicked(move |_| ui.split(Dir::Row));
    }
    {
        let ui = ui.clone();
        split_col.connect_clicked(move |_| ui.split(Dir::Col));
    }
    {
        let pop = shortcuts_popover(&keys);
        keys.connect_clicked(move |_| pop.popup());
    }

    // Restore from the host: the terminals still alive, in the saved layout.
    let mut plan = SavedLayout { tabs: Vec::new(), active: 0 };
    let mut attach: HashMap<String, term::Attach> = HashMap::new();
    if let Some(h) = &cfg.host {
        match h.hello().and_then(|_| h.list()) {
            Ok(list) => {
                let alive: Vec<String> = list.into_iter().filter(|e| e.state == "running").map(|e| e.id).collect();
                let saved = layout::state_path().and_then(|p| layout::load(&p));
                let (restored, next) = layout::restore(saved.as_ref(), &alive);
                ui.next_n.set(next);
                for id in alive {
                    let a = match h.screen(&id, 500) {
                        Ok(Some(s)) => term::Attach::Screen(s),
                        _ => term::Attach::Replay,
                    };
                    attach.insert(id, a);
                }
                plan = restored;
            }
            Err(e) => eprintln!("gtk-term: term_list failed: {e}"),
        }
    }
    for t in &plan.tabs {
        for k in layout::leaves(&t.root) {
            if let (Some(h), Some(a)) = (&cfg.host, attach.remove(&k)) {
                ui.new_pane(term::Source::Host { host: h.clone(), tid: k.clone(), attach: a }, Some(k));
            }
        }
        ui.add_tab(t.n, t.root.clone(), t.focus.clone());
    }
    if plan.tabs.is_empty() {
        for _ in 0..cfg.tabs.max(1) {
            ui.new_tab();
        }
    } else {
        ui.select(plan.active);
    }
    if ui.tabs.borrow().is_empty() {
        eprintln!("gtk-term: no terminal to show");
        win.close();
    }

    // Console shortcuts, before the terminal sees the key.
    let kc = gtk::EventControllerKey::new();
    kc.set_propagation_phase(gtk::PropagationPhase::Capture);
    {
        let ui = ui.clone();
        kc.connect_key_pressed(move |_, _, code, mods| match keymap::from_gtk(code, mods) {
            Some(a) => {
                let ui = ui.clone();
                glib::idle_add_local_once(move || ui.do_action(a));
                glib::Propagation::Stop
            }
            None => glib::Propagation::Proceed,
        });
    }
    win.add_controller(kc);

    {
        let ui = ui.clone();
        win.connect_close_request(move |_| {
            // Only disconnects: the terminals stay alive in the host.
            ui.save_now();
            glib::Propagation::Proceed
        });
    }
    {
        let ui = ui.clone();
        win.connect_map(move |_| ui.refresh_soon());
    }
    {
        let ui = ui.clone();
        glib::timeout_add_seconds_local(REFRESH_SECS, move || {
            ui.refresh();
            glib::ControlFlow::Continue
        });
    }

    // Test aid: GTKTERM_LAYOUT_DEMO=split splits the first tab and opens a second one.
    if std::env::var("GTKTERM_LAYOUT_DEMO").as_deref() == Ok("split") {
        ui.select(0);
        ui.split(Dir::Row);
        ui.new_tab();
        ui.select(0);
    }
    win.present();
    ui.refresh_soon();
    win
}
