<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { Selection } from './lib/contracts/arsenal';
  import type { ManagedSessionId } from './lib/contracts/identities';
  import type { SessionSummary } from './lib/contracts/sessions';
  import { getAppInfo } from './lib/desktop/client';
  import AgentView from './lib/features/agent/AgentView.svelte';
  import { AgentController } from './lib/features/agent/controller';
  import ApprovalsView from './lib/features/approvals/ApprovalsView.svelte';
  import { ApprovalsController } from './lib/features/approvals/controller';
  import LibraryView from './lib/features/arsenal/LibraryView.svelte';
  import {
    GuideStore,
    type GuideTool,
  } from './lib/features/arsenal/guide-store.svelte';
  import { arsenalClient } from './lib/desktop/arsenal-client';
  import { ArsenalController } from './lib/features/arsenal/controller';
  import { ChangesController } from './lib/features/configuration/changes-controller';
  import { ConfigurationController } from './lib/features/configuration/controller';
  import { CredentialsController } from './lib/features/credentials/controller';
  import CredentialsView from './lib/features/credentials/CredentialsView.svelte';
  import { EventsController } from './lib/features/events/controller';
  import DistributorsView from './lib/features/distributors/DistributorsView.svelte';
  import { NativeController } from './lib/features/native/controller';
  import LaunchEditor from './lib/features/workspace/LaunchEditor.svelte';
  import { SettingsController } from './lib/features/settings/controller';
  import SettingsView from './lib/features/settings/SettingsView.svelte';
  import { whenWorkspaceReady } from './lib/features/native/bridge';
  import { setAppearance } from './lib/features/terminal/appearance';
  import EventsView from './lib/features/events/EventsView.svelte';
  import { SessionsController } from './lib/features/sessions/controller';
  import {
    sessionLabel,
    sessionNames,
    shortId,
  } from './lib/features/sessions/present';
  import SessionsView from './lib/features/sessions/SessionsView.svelte';
  import TerminalView from './lib/features/terminal/TerminalView.svelte';
  import LifecycleCard from './lib/features/terminal/LifecycleCard.svelte';
  import type { WorkspaceState } from './lib/features/terminal/session-manager';
  import { retryAuthority } from './lib/desktop/lifecycle-client';
  import AuthorityNotice from './lib/shell/AuthorityNotice.svelte';
  import {
    followLifecycle,
    lifecycleNotice,
    pendingLifecycle,
    type LifecycleObservation,
  } from './lib/shell/lifecycle';
  import Sidebar from './lib/shell/Sidebar.svelte';
  import { msg, setLanguage, t } from './lib/i18n/index.svelte';
  import StatusBar from './lib/shell/StatusBar.svelte';
  import {
    followAuthority,
    pendingAuthority,
    type AuthorityObservation,
  } from './lib/shell/authority';
  import {
    inPersonalization,
    NAV_ITEMS,
    PERSONALIZATION,
    type ShownView,
    type ViewId,
  } from './lib/shell/nav';
  import {
    idleRuntime,
    summarizeRuntime,
    type RuntimeSummary,
  } from './lib/shell/runtime';

  let version = $state('');
  // Activity is not a view of its own: it shows Approvals over Events, both unchanged.
  let activeView = $state<ShownView>('console');
  // The terminal workspace is mounted on the first visit to the Console, and stays mounted after
  // it. The provisional 'console' above does not count: the preference decides where the window opens.
  let consoleOpened = $state(false);
  let runtime = $state<RuntimeSummary>(idleRuntime);
  let authority = $state<AuthorityObservation>(pendingAuthority);
  // Whether the authority is being made available, and why not when it is not. The
  // shell follows it once; no view asks for it or starts anything for it.
  let lifecycle = $state<LifecycleObservation>(pendingLifecycle);
  let retrying = $state(false);
  const notice = $derived(lifecycleNotice(lifecycle, authority));
  // One controller for the application's lifetime, whichever view is shown.
  const sessionsController = new SessionsController((next) => {
    sessions = next;
  });
  let sessions = $state(sessionsController.state());
  // Likewise for turns: a turn goes on being read whichever view is shown.
  const agentController = new AgentController((next) => {
    agent = next;
  });
  let agent = $state(agentController.state());
  // And for approvals: one reader, for the Approvals view and for the card under a turn.
  const approvalsController = new ApprovalsController((next) => {
    approvals = next;
  });
  let approvals = $state(approvalsController.state());
  // History is read only while its view is shown, and has no watcher of its own.
  const eventsController = new EventsController((next) => {
    events = next;
  });
  let events = $state(eventsController.state());
  // What the agents are configured with: read, and followed for changes, only while its
  // view is shown. The desktop's watcher sees the files; the window only asks it.
  const configurationController = new ConfigurationController((next) => {
    configuration = next;
  });
  let configuration = $state(configurationController.state());
  // The Arsenal library: read while its view is shown; it changes only what the owner asks for.
  const arsenalController = new ArsenalController((next) => {
    arsenal = next;
  });
  let arsenal = $state(arsenalController.snapshot());
  // Changing it: a plan is drafted, confirmed here, and applied by the desktop, which asks
  // again in a window of its own when the change is risky.
  const changesController = new ChangesController(
    (next) => {
      changes = next;
    },
    () => configurationController.refresh(),
  );
  let changes = $state(changesController.state());
  // Agents started in terminals and the permission they start with. An agent that was started
  // opens as a tab of the Console, which is shown.
  const nativeController = new NativeController(
    (next) => {
      native = next;
    },
    (reply) => {
      // The Console may not be mounted yet: the tab is made once its terminals are restored.
      whenWorkspaceReady((workspace) => {
        const tab = workspace.tabOf(reply.session.id);
        if (tab) workspace.activate(tab);
        else workspace.createNative(reply);
      });
      go('console');
    },
  );
  let native = $state(nativeController.state());
  // API keys: listed by name while their view is shown; a key never reaches the window.
  const credentialsController = new CredentialsController((next) => {
    credentials = next;
  });
  let credentials = $state(credentialsController.state());
  // The desktop's own preferences: read once, written only when the user changes one.
  const settingsController = new SettingsController((next) => {
    settings = next;
  });
  let settings = $state(settingsController.state());
  const defaultFilter = $derived(settings.preferences.events.default_filter);
  const items = NAV_ITEMS;
  let opened = false;
  let navigated = false;
  const activity = $derived(activeView === 'activity');
  // The name of the view, alone, over Activity and over the views that draw no heading of
  // their own: there it is the only place that says which view is open. No subtitle.
  const TITLED: readonly ShownView[] = ['agents'];
  const title = $derived(
    activity
      ? msg('Activity')
      : TITLED.includes(activeView)
        ? (items.find((item) => item.id === activeView)?.label ?? '')
        : '',
  );

  // Sessions are read only while their view is shown.
  $effect(() => {
    agentController.setVisible(activeView === 'agents');
  });
  // Approvals are read while their view is shown or a turn is being followed: an
  // approval exists only for a turn that runs. Nothing is read for them otherwise.
  $effect(() => {
    approvalsController.setVisible(activeView === 'approvals' || activity);
  });
  $effect(() => {
    approvalsController.setWatching(agent.following);
  });
  $effect(() => {
    eventsController.setVisible(activeView === 'events' || activity);
  });
  // Arsenal reads the same inventory as Configuration; it asks for nothing of its own.
  $effect(() => {
    configurationController.setVisible(activeView === 'arsenal');
  });
  $effect(() => {
    arsenalController.setVisible(activeView === 'arsenal');
  });
  $effect(() => {
    sessionsController.setVisible(activeView === 'sessions');
  });
  let distributorsAnswered = $state(true);
  let distributorRead = 0;
  $effect(() => {
    const read = ++distributorRead;
    if (activeView !== 'distributors') return;
    void nativeController.rediscover().then((answered) => {
      if (read === distributorRead) distributorsAnswered = answered;
    });
  });
  $effect(() => {
    credentialsController.setVisible(activeView === 'credentials');
  });
  // The overview reads the registry (with resources) while it is shown.
  $effect(() => {
    nativeController.setVisible(activeView === 'launches');
  });

  // The window opens on the view the preferences name, unless the user has already
  // moved: a late answer never takes them somewhere they did not go.
  $effect(() => {
    if (settings.phase === 'loading' || opened) return;
    // Preferences that cannot be read leave the window on its default view, the Console, as before.
    if (settings.phase === 'failed') {
      opened = true;
      if (activeView === 'console') consoleOpened = true;
      return;
    }
    opened = true;
    if (!navigated) activeView = settings.preferences.interface.landing_page;
    if (activeView === 'console') consoleOpened = true;
  });
  // Presentation preferences, applied to every terminal, open or new.
  $effect(() => {
    const theme = settings.preferences.interface.theme;
    document.documentElement.dataset.theme = theme;
    setLanguage(settings.preferences.interface.language);
    const t = settings.preferences.terminal;
    setAppearance({
      theme,
      fontSize: t.font_size,
      scrollback: t.scrollback,
      cursorStyle: t.cursor_style,
      cursorBlink: t.cursor_blink,
    });
  });
  // Where the history starts. It narrows what is shown and nothing the authority keeps.
  $effect(() => {
    eventsController.setFilter(defaultFilter);
  });

  onMount(() => {
    let active = true;
    settingsController.start();
    nativeController.start0();
    void getAppInfo().then(
      (info) => {
        if (active) version = info.version;
      },
      () => undefined,
    );
    // Separate from the terminal workspace: neither waits on the other. The one
    // follower also wakes the Sessions and Agent views; no other is started for them.
    const unfollow = followAuthority((observation) => {
      authority = observation;
      sessionsController.observe(observation);
      agentController.observe(observation);
      approvalsController.observe(observation);
      eventsController.observe(observation);
    });
    const unfollowLifecycle = followLifecycle((observation) => {
      lifecycle = observation;
    });
    return () => {
      active = false;
      unfollow();
      unfollowLifecycle();
      sessionsController.dispose();
      agentController.dispose();
      approvalsController.dispose();
      eventsController.dispose();
      configurationController.dispose();
      arsenalController.dispose();
      changesController.dispose();
      nativeController.dispose();
      credentialsController.dispose();
      settingsController.dispose();
    };
  });

  /** A launch just made from a distributor: Workspace opens on it. */
  let launchToOpen = $state<string | null>(null);
  let launchToCreate = $state<{
    request: number;
    selection: Selection;
  } | null>(null);
  let createLaunchRequest = 0;
  // The Personalization tab last visited: the rail opens it again.
  let personalTab = $state<ViewId>('distributors');
  $effect(() => {
    if (inPersonalization(activeView)) personalTab = activeView as ViewId;
  });
  const guide = new GuideStore(arsenalClient);
  function go(view: ShownView, tool?: GuideTool) {
    navigated = true;
    // Models is part of Distributors now: a link or a saved page that names it lands there.
    if (view === 'models') view = 'distributors';
    // Coming into Arsenal from elsewhere lands on the owner's own skills (arsenal-UI-SPEC "Etapa 4").
    if (view === 'arsenal' && activeView !== 'arsenal')
      guide.choose({ section: 'origin:mine' });
    // Configuration is part of Arsenal now: its Global tab holds the agents' own files.
    if (view === 'configuration') {
      view = 'arsenal';
      guide.choose({ tool: tool ?? 'claude_code', section: 'global' });
    }
    if (view === 'console') consoleOpened = true;
    activeView = view;
  }

  // One name for each session the Sessions page has listed, unique among them. A name is
  // for reading: nothing is looked up, sent or decided by it.
  const names = $derived(sessionNames(sessions.page?.sessions ?? []));
  const nameOf = (id: ManagedSessionId): string | null => names.get(id) ?? null;

  /** Opens a session the user picked in Sessions in the Agent view, and shows it. */
  function openAgent(session: SessionSummary) {
    if (
      agentController.open(
        session.id,
        names.get(session.id) ?? sessionLabel(session),
        false,
      )
    )
      go('agents');
  }

  // From a record to where the thing it names lives. Nothing is taken from the record:
  // each view reads what the session is now from the authority.
  function showSession(session: ManagedSessionId) {
    sessionsController.select(session);
    go('sessions');
  }
  function showAgent(session: ManagedSessionId) {
    // A session the Sessions page has not listed is named from what the Agent view reads.
    const label = nameOf(session);
    if (
      agentController.open(
        session,
        label ?? t('Session {id}', { id: shortId(session) }),
        label === null,
      )
    )
      go('agents');
  }
  /** The loaded history of one session, from its details in Sessions. */
  function showEvents(session: SessionSummary) {
    eventsController.setScope({ session: session.id, turn: null });
    go('events');
  }

  /** The user's Retry: one request at a time. What comes of it arrives as a view. */
  function retry() {
    if (retrying) return;
    retrying = true;
    void retryAuthority().then(
      () => (retrying = false),
      () => (retrying = false),
    );
  }

  let terminal = $state<TerminalView>();
  /** Shows the Console and opens a saved launch there (the launch editor's Try). */
  async function openInConsole(id: string) {
    go('console');
    for (let attempt = 0; attempt < 40; attempt++) {
      await tick();
      if (terminal) {
        await terminal.open(id);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  /** Shows the Console and opens a terminal that types `input`; waits for the workspace to mount. */
  async function runInConsole(title: string, cwd: string, input: string) {
    go('console');
    for (let attempt = 0; attempt < 40; attempt++) {
      await tick();
      if (terminal?.runCommand(title, cwd, input)) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  let legend = $state(false);
  let launchOpen = $state(false);
  function observeWorkspace(state: WorkspaceState) {
    runtime = summarizeRuntime(state);
  }
</script>

<div class="shell">
  <a class="skip-link" href="#main-content">{t('Skip to main content')}</a>
  <!-- The product's name and version are read out; the window's title bar shows the name. -->
  <div class="visually-hidden">
    <h1>Wyss Console</h1>
    {#if version}<span>v{version}</span>{/if}
  </div>
  <Sidebar
    active={activeView}
    onselect={go}
    personal={personalTab}
    waiting={approvals.pending?.length ?? 0}
    {items}
  />
  <main id="main-content" class="content" tabindex="-1" data-view={activeView}>
    {#if title}
      <p class="context-title">{t(title)}</p>
    {/if}
    {#if notice}
      <AuthorityNotice {notice} {retrying} onretry={retry} />
    {/if}
    <!-- Mounted on the first visit to the Console, then kept: leaving the Console never ends a terminal. -->
    {#if consoleOpened}
      <TerminalView
        bind:this={terminal}
        bind:legend
        bind:launchesOpen={launchOpen}
        {native}
        {nativeController}
        visible={activeView === 'console'}
        onworkspace={observeWorkspace}
      />
    {/if}
    <LaunchEditor
      visible={activeView === 'launches'}
      recent={native.launcher?.projects ?? []}
      choose={() => nativeController.choose()}
      onopen={(id) => void openInConsole(id)}
      select={launchToOpen}
      createPreset={launchToCreate}
      onpresetused={(request) => {
        if (launchToCreate?.request === request) launchToCreate = null;
      }}
    />
    <SessionsView
      visible={activeView === 'sessions'}
      {sessions}
      controller={sessionsController}
      {authority}
      onagent={openAgent}
      onevents={showEvents}
    />
    <AgentView
      visible={activeView === 'agents'}
      {agent}
      controller={agentController}
      {authority}
      {approvals}
      {approvalsController}
      onsessions={() => go('sessions')}
    />
    <!-- Personalization: how the agents start. Its tabs are views of their own, one under another. -->
    <div class="personal" hidden={!inPersonalization(activeView)}>
      <nav
        class="personal-tabs"
        class:folded={activeView === 'arsenal'}
        aria-label={t('Personalization')}
      >
        {#each PERSONALIZATION as tab (tab.id)}
          <button
            type="button"
            class="personal-tab"
            aria-current={activeView === tab.id ? 'page' : undefined}
            title={t(tab.hint)}
            onclick={() => go(tab.id)}
            ><svg viewBox="0 0 24 24" aria-hidden="true"
              ><path d={tab.icon} /></svg
            ><span class="personal-label">{t(tab.label)}</span></button
          >
        {/each}
      </nav>
      <div class="personal-body">
        <DistributorsView
          visible={activeView === 'distributors'}
          {native}
          launcherAnswered={distributorsAnswered}
          onrun={(title, cwd, input) => void runInConsole(title, cwd, input)}
          onlaunch={(id) => {
            launchToOpen = id;
            go('launches');
          }}
        />
        <LibraryView
          visible={activeView === 'arsenal'}
          store={guide}
          {configuration}
          {configurationController}
          {changes}
          {changesController}
          {arsenal}
          {arsenalController}
          oneditlaunch={(id) => {
            launchToCreate = null;
            launchToOpen = id;
            go('launches');
          }}
          oncreatelaunch={(selection) => {
            launchToOpen = null;
            launchToCreate = { request: ++createLaunchRequest, selection };
            go('launches');
          }}
        />
        <CredentialsView
          visible={activeView === 'credentials'}
          {credentials}
          controller={credentialsController}
        />
      </div>
    </div>
    <ApprovalsView
      visible={activeView === 'approvals' || activity}
      {approvals}
      controller={approvalsController}
      {authority}
      {names}
    />
    <EventsView
      visible={activeView === 'events' || activity}
      {events}
      controller={eventsController}
      {authority}
      timeFormat={settings.preferences.events.time_format}
      {nameOf}
      onsession={showSession}
      onagent={showAgent}
      onapprovals={() => go('approvals')}
    />
    <SettingsView
      visible={activeView === 'settings'}
      {settings}
      controller={settingsController}
      {authority}
      {lifecycle}
      {retrying}
      onretry={retry}
    >
      <LifecycleCard />
    </SettingsView>
  </main>
  <!-- On the Console the session bar takes its place; it stays mounted, and read out, there. -->
  <StatusBar
    hidden={activeView === 'console'}
    {runtime}
    {authority}
    {lifecycle}
  />
</div>
