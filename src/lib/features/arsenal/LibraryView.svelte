<script lang="ts">
  import { msg, t } from '../../i18n/index.svelte';
  import type {
    GuideEntry,
    GuideSet,
    GuideSetKind,
  } from '../../contracts/arsenal';
  import type { ConfigItem } from '../../contracts/configuration';
  import ConfigurationView from '../configuration/ConfigurationView.svelte';
  import ChangePlan from '../configuration/ChangePlan.svelte';
  import { changeFor } from '../configuration/present';
  import type {
    ConfigurationController,
    ConfigurationState,
  } from '../configuration/controller';
  import type {
    ChangesController,
    ChangesState,
  } from '../configuration/changes-controller';
  import { GROUP_HELP, GROUP_LABEL, type Group } from './groups';
  import {
    CONFIG_KINDS,
    ORIGINS,
    ORIGIN_OF,
    blocks,
    byCategory,
    entriesOf,
    firstSentence,
    helpSkill,
    matches,
    splitDescription,
    usageSection,
    type Origin,
  } from './guide';
  import { ORIGIN_HELP, originName } from './origin';
  import type { GuideStore, GuideTool } from './guide-store.svelte';

  /**
   * Arsenal as a guide (arsenal-UI-SPEC "Etapa 4", plan arsenal-skills-guia, step 1): the tool on
   * top, the page chosen in the tree at the side, a list and the card of what is open. Global,
   * Hooks and MCP are the agent's own configuration files, the embedded Configuration view.
   */
  let {
    visible,
    store,
    configuration,
    configurationController,
    changes,
    changesController,
  }: {
    visible: boolean;
    store: GuideStore;
    configuration: ConfigurationState;
    configurationController: ConfigurationController;
    changes: ChangesState;
    changesController: ChangesController;
  } = $props();

  const configItems = $derived(configuration.reply?.inventory.items ?? []);
  const TOOLS = $derived.by(() => {
    const tools: { id: GuideTool; name: string }[] = [
      { id: 'claude_code', name: 'Claude Code' },
      { id: 'codex', name: 'Codex' },
    ];
    // OpenCode has no skills; it is offered when its configuration holds something, or when
    // its own "Configuration" link opened it.
    if (
      store.tool === 'opencode' ||
      configItems.some((item) => item.provider === 'opencode')
    )
      tools.push({ id: 'opencode', name: 'OpenCode' });
    return tools;
  });

  $effect(() => {
    if (visible) store.ensure();
  });
  $effect(() => {
    if (visible) configurationController.setProvider(store.tool);
  });
  $effect(() => {
    // A section that no longer exists (the Guide, a set) lands on the owner's own skills.
    if (
      !['hooks', 'mcp', 'global', 'agents'].includes(store.section) &&
      !store.section.startsWith('origin:')
    )
      store.choose({ section: 'origin:mine' });
  });
  $effect(() => {
    // OpenCode has only its configuration pages.
    if (
      store.tool === 'opencode' &&
      !['hooks', 'mcp', 'global'].includes(store.section)
    )
      store.choose({ section: 'global' });
  });

  const section = $derived(store.section);
  const configKinds = $derived(
    section === 'global' || section === 'hooks' || section === 'mcp'
      ? CONFIG_KINDS[section]
      : null,
  );
  const skillTool = $derived(store.tool === 'opencode' ? null : store.tool);
  const origin = $derived(
    section.startsWith('origin:')
      ? (section.slice('origin:'.length) as Origin)
      : null,
  );
  const searching = $derived(store.query.trim() !== '');

  /** A block of the list: a heading (a set, a category or an origin) and its rows. */
  interface Block {
    key: string;
    title: string;
    origin: Origin;
    about: string | null;
    help: string | null;
    entries: GuideEntry[];
  }
  const setsOf = (o: Origin) =>
    (store.guide?.sets ?? []).filter(
      (s) => s.tool === skillTool && ORIGIN_OF[s.kind] === o,
    );
  function setTitle(set: GuideSet): string {
    const named = SET_NAME[set.kind];
    return named ? t(named) : set.name;
  }
  const listBlocks = $derived.by((): Block[] => {
    if (skillTool === null || store.guide === null) return [];
    const tool = skillTool;
    const find = (o: Origin): Block[] => {
      if (o === 'mine') {
        const mine = entriesOf(store.guide, tool, 'mine').filter((e) =>
          matches(e, store.query),
        );
        return byCategory(mine).map((c) => ({
          key: `mine:${c.group}`,
          title: t(GROUP_LABEL[c.group as Group]),
          origin: 'mine',
          about: t(GROUP_HELP[c.group as Group]),
          help: null,
          entries: c.entries,
        }));
      }
      return setsOf(o)
        .map((set) => {
          const all = entriesOf(store.guide, tool, set.key);
          return {
            key: set.key,
            title: setTitle(set) + (set.version ? ` ${set.version}` : ''),
            origin: o,
            about: set.description || t(SET_ABOUT[set.kind]),
            help: helpSkill(all),
            entries: all.filter((e) => matches(e, store.query)),
          };
        })
        .filter((b) => b.entries.length > 0)
        .sort((a, b) => a.title.localeCompare(b.title));
    };
    if (section === 'agents') {
      const agents: Block[] = [
        {
          key: 'agents',
          title: t('Agents'),
          origin: 'mine',
          about: null,
          help: null,
          entries: entriesOf(store.guide, tool, 'agents').filter((e) =>
            matches(e, store.query),
          ),
        },
      ];
      return agents.filter((b) => b.entries.length > 0);
    }
    if (searching)
      return [
        ...ORIGINS.flatMap(find),
        ...[
          {
            key: 'agents',
            title: t('Agents'),
            origin: 'mine' as Origin,
            about: null,
            help: null,
            entries: entriesOf(store.guide, tool, 'agents').filter((e) =>
              matches(e, store.query),
            ),
          },
        ].filter((b) => b.entries.length > 0),
      ];
    return origin === null ? [] : find(origin);
  });
  const listedCount = $derived(
    listBlocks.reduce((n, b) => n + b.entries.length, 0),
  );
  const shownOrigins = $derived([...new Set(listBlocks.map((b) => b.origin))]);
  const entryOrigin = (entry: GuideEntry): Origin => {
    if (entry.set === 'mine' || entry.set === 'agents') return 'mine';
    const set = store.guide?.sets.find((s) => s.key === entry.set);
    return set ? ORIGIN_OF[set.kind] : 'plugin';
  };
  const open = $derived(
    store.openId === null
      ? null
      : (store.guide?.entries.find((e) => e.id === store.openId) ?? null),
  );
  const openOrigin = $derived(open ? entryOrigin(open) : null);

  const SET_NAME: Partial<Record<GuideSetKind, string>> = {
    account: msg('Claude account'),
    system: msg('Included with Codex'),
    repos: msg('Git repos'),
  };
  const SET_ABOUT: Record<GuideSetKind, string> = {
    gsd: msg(
      'A method for planning, building and checking work in phases. Its skills and agents are linked in from its own install.',
    ),
    plugin: msg('A plugin installed for this tool.'),
    account: msg('Skills that come with your Claude account.'),
    bundle: msg('Skills one tool installed in a batch.'),
    system: msg('Skills Codex installs and replaces itself.'),
    repos: msg('Skills that are a Git repository of their own.'),
  };
  const UNREADABLE: Record<string, string> = {
    outside_roots: msg('its link leads out of the agents’ folders'),
    broken_link: msg('its link leads nowhere'),
    no_skill_file: msg('it has no SKILL.md'),
    unreadable: msg('the file cannot be read'),
  };
  const SCOPE_LABEL = {
    claude: msg('Claude'),
    codex: msg('Codex'),
    both: msg('Both · global'),
  } as const;
  const SCOPE_HELP = {
    claude: msg('Only Claude Code sees it.'),
    codex: msg('Only Codex sees it.'),
    both: msg(
      'It is in the folders both tools read, so it loads in every session of each.',
    ),
  } as const;

  const split = $derived(open ? splitDescription(open.description) : null);
  const usage = $derived(store.body ? usageSection(store.body.text) : null);
  const body = $derived(store.body ? blocks(store.body.text) : []);
  /** The Configuration entry that switches this skill on and off, when there is one. */
  const switchItem = $derived.by((): ConfigItem | null => {
    if (!open || open.kind !== 'skill' || open.set !== 'mine') return null;
    return (
      configItems.find(
        (item) =>
          item.kind === 'skill' &&
          item.provider === open.tool &&
          // The account's own entry: an open project's skill of that name is another one.
          item.scope !== 'project' &&
          item.name === open.name &&
          changeFor(item) !== null,
      ) ?? null
    );
  });
  const switchChange = $derived(switchItem ? changeFor(switchItem) : null);

  function row(entry: GuideEntry): string {
    if (entry.unreadable) return t('Its text could not be read.');
    if (entry.description === '') return t('Its file has no description.');
    return firstSentence(entry.description);
  }
  /** The card a change was drafted from: its plan is shown there only. */
  let changedFor = $state<string | null>(null);
  /** The last change each card applied: its Undo names that change and no other. */
  let applied = $state<Record<string, string>>({});
  /** A card drafted a change and waits for it to be applied; `seen` is the change before it. */
  let awaiting = $state<{ card: string; seen: string | null } | null>(null);
  $effect(() => {
    const last = changes.lastChange;
    if (awaiting && last !== null && last !== awaiting.seen) {
      applied = { ...applied, [awaiting.card]: last };
      awaiting = null;
    }
  });
  function draftFrom(card: string, make: () => void) {
    changedFor = card;
    awaiting = { card, seen: changes.lastChange };
    make();
  }
  /** Leaving a card drops a plan it left unconfirmed. */
  function leave() {
    if (changes.plan && !changes.applying) changesController.cancel();
    if (!changes.applying) awaiting = null;
  }
  function choose(entry: GuideEntry) {
    leave();
    opener = document.activeElement as HTMLElement | null;
    void store.open(entry.id);
  }
  /** The row that opened the card: the focus goes back to it when the card closes. */
  let opener: HTMLElement | null = null;
  function back() {
    leave();
    store.close();
    opener?.focus({ preventScroll: true });
    opener = null;
  }
  let cardTitle = $state<HTMLHeadingElement | null>(null);
  let dialog = $state<HTMLDivElement | null>(null);
  $effect(() => {
    if (open && cardTitle) cardTitle.focus({ preventScroll: true });
  });
  /** Esc closes the card; Tab stays inside it. */
  function onDialogKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      back();
      return;
    }
    if (event.key !== 'Tab' || dialog === null) return;
    const focusable = [
      ...dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), summary, [tabindex="0"], a[href]',
      ),
    ];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
</script>

<section
  class="library-feature"
  aria-label={t('Arsenal')}
  hidden={!visible}
  inert={!visible}
>
  <div class="ars-tools" role="tablist" aria-label={t('Tool')}>
    {#each TOOLS as x (x.id)}
      <button
        type="button"
        role="tab"
        class="ars-tool"
        aria-selected={store.tool === x.id}
        onclick={() => store.choose({ tool: x.id })}>{x.name}</button
      >
    {/each}
  </div>

  {#if configKinds !== null}
    <div class="ars-config">
      <ConfigurationView
        visible={visible && configKinds !== null}
        embedded
        kinds={configKinds}
        {configuration}
        controller={configurationController}
        {changes}
        {changesController}
      />
    </div>
  {:else}
    <div class="ars-list">
      {#if store.failed}
        <p class="notice" data-tone="error" role="alert">
          {t('The skills on disk could not be read.')}
          <button type="button" class="action" onclick={() => void store.load()}
            >{t('Try again')}</button
          >
        </p>
      {:else if store.guide === null}
        <p class="lib-muted" role="status">{t('Reading…')}</p>
      {:else}
        {#if store.guide.truncated}
          <p class="notice" data-tone="warn">
            {t('A folder holds more than is read: the lists are incomplete.')}
          </p>
        {/if}
        {#if searching}
          <p class="lib-muted" role="status">
            {t('{n} found for “{q}”', {
              n: listedCount,
              q: store.query.trim(),
            })}
            <button
              type="button"
              class="action quiet"
              onclick={() => (store.query = '')}>{t('Clear')}</button
            >
          </p>
        {/if}
        {#if shownOrigins.length > 1}
          <ul class="ars-legend" aria-label={t('Colours')}>
            {#each shownOrigins as o (o)}
              <li data-origin={o}>
                <span class="ars-dot" aria-hidden="true"></span>{t(
                  ORIGIN_HELP[o],
                )}
              </li>
            {/each}
          </ul>
        {/if}
        {#if listBlocks.length === 0}
          <p class="lib-muted">{t('Nothing here.')}</p>
        {/if}
        {#each listBlocks as b (b.key)}
          <section class="ars-block" data-origin={b.origin}>
            <header class="ars-block-head">
              <h2>
                <span class="ars-dot" aria-hidden="true"></span>{b.title}
                <span class="ars-count">{b.entries.length}</span>
              </h2>
              {#if b.about}<p>{b.about}</p>{/if}
              {#if b.help}
                <p>
                  <strong>{t('Start with /{name}', { name: b.help })}</strong>
                </p>
              {/if}
            </header>
            <ul class="ars-rows">
              {#each b.entries as entry (entry.id)}
                <li>
                  <button
                    type="button"
                    class="ars-row"
                    data-origin={b.origin}
                    aria-haspopup="dialog"
                    onclick={() => choose(entry)}
                  >
                    <span class="lib-name" title={entry.name}>{entry.name}</span
                    >
                    <span class="lib-desc">{row(entry)}</span>
                    <span class="ars-tag"
                      >{originName(b.origin, store.tool)}</span
                    >
                  </button>
                </li>
              {/each}
            </ul>
          </section>
        {/each}
      {/if}
    </div>

    {#if open}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div
        class="ars-overlay"
        onclick={(e) => {
          if (e.target === e.currentTarget) back();
        }}
      >
        <div
          class="ars-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ars-card-title"
          data-origin={openOrigin}
          tabindex="-1"
          bind:this={dialog}
          onkeydown={onDialogKey}
        >
          <button
            type="button"
            class="action quiet ars-close"
            aria-label={t('Close')}
            onclick={back}>✕</button
          >
          <span class="ars-tag" data-origin={openOrigin}
            >{openOrigin ? originName(openOrigin, store.tool) : ''}</span
          >
          <h2 id="ars-card-title" tabindex="-1" bind:this={cardTitle}>
            {open.name}
            {#if open.scope}<span class="ars-scope"
                >{t(SCOPE_LABEL[open.scope])}</span
              >{/if}
          </h2>

          {#if open.unreadable}
            <p class="notice" data-tone="warn">
              {t('Its text could not be read ({reason}).', {
                reason: t(UNREADABLE[open.unreadable] ?? UNREADABLE.unreadable),
              })}
            </p>
          {:else if split}
            <section>
              <h3>{t('What it does')}</h3>
              <p>{split.what || t('Its file has no description.')}</p>
            </section>
            {#if open.description_cut}
              <p class="lib-muted">
                {t('The description is longer: only its beginning is shown.')}
              </p>
            {/if}
            {#if split.when}
              <section>
                <h3>{t('Use it when')}</h3>
                <p>{split.when}</p>
              </section>
            {/if}
            {#if split.whenNot}
              <section>
                <h3>{t('Do not use it when')}</h3>
                <p>{split.whenNot}</p>
              </section>
            {/if}
            {#if usage}
              <section>
                <h3>{t('How it is used')}</h3>
                <pre class="lib-pre">{usage}</pre>
              </section>
            {/if}
          {/if}

          {#if switchItem && switchChange}
            <section>
              <h3>{t('State')}</h3>
              <p class="ars-state">
                <span
                  >{switchItem.persisted === 'present_disabled'
                    ? t('Switched off')
                    : t('Switched on')}</span
                >
                <button
                  type="button"
                  class="action"
                  disabled={changes.planning || changes.applying}
                  onclick={() =>
                    draftFrom(open.id, () =>
                      changesController.draft(
                        switchChange.operation,
                        switchItem.id,
                      ),
                    )}
                  >{switchItem.persisted === 'present_disabled'
                    ? t('Switch on')
                    : t('Switch off')}</button
                >
                {#if applied[open.id] && !changes.plan}
                  {@const change = applied[open.id]}
                  <button
                    type="button"
                    class="action quiet"
                    disabled={changes.planning || changes.applying}
                    onclick={() =>
                      draftFrom(open.id, () => changesController.undo(change))}
                    >{t('Undo')}</button
                  >
                {/if}
              </p>
              {#if changedFor === open.id}
                <ChangePlan {changes} {changesController} />
              {/if}
            </section>
          {/if}

          {#if !open.unreadable}
            <details class="ars-fold">
              <summary>{t('Instructions')}</summary>
              {#if store.bodyLoading}
                <p class="lib-muted" role="status">{t('Reading…')}</p>
              {:else if store.bodyFailed}
                <p class="notice" data-tone="error">
                  {t('The file could not be read.')}
                </p>
              {:else if store.body}
                <div class="ars-md">
                  {#each body as b, i (i)}
                    {#if b.kind === 'heading'}
                      <p class="ars-md-h" data-level={b.level}>{b.text}</p>
                    {:else if b.kind === 'paragraph'}
                      <p>{b.text}</p>
                    {:else if b.kind === 'list'}
                      <ul>
                        {#each b.items as item, j (j)}<li>{item}</li>{/each}
                      </ul>
                    {:else}
                      <pre class="lib-pre">{b.text}</pre>
                    {/if}
                  {/each}
                  {#if store.body.cut}
                    <p class="lib-muted">
                      {t('Only the first 256 KB are shown.')}
                    </p>
                  {/if}
                </div>
              {/if}
            </details>
            {#if store.body && open.kind === 'skill'}
              <details class="ars-fold">
                <summary
                  >{t('Files ({n})', {
                    n: store.body.files.length + store.body.more_files,
                  })}</summary
                >
                <ul class="lib-files">
                  {#each store.body.files as f (f)}
                    <li class="mono">{f}</li>
                  {/each}
                  {#if store.body.more_files > 0}
                    <li class="lib-muted">
                      {t('and {n} more', { n: store.body.more_files })}
                    </li>
                  {/if}
                  {#if store.body.files_cut}
                    <li class="lib-muted">
                      {t('The folder holds more files than are counted here.')}
                    </li>
                  {/if}
                </ul>
              </details>
            {/if}
          {/if}

          <section>
            <h3>{t('Scope')}</h3>
            {#if open.scope}
              <p>
                <strong>{t(SCOPE_LABEL[open.scope])}</strong>:
                {t(SCOPE_HELP[open.scope])}
              </p>
            {/if}
            {#if open.codex_differs}
              <p>{t('Codex’s copy is different.')}</p>
            {/if}
            <p class="mono ars-where">{open.origin}</p>
            {#if open.linked_to}
              <p class="mono ars-where">→ {open.linked_to}</p>
            {/if}
          </section>
        </div>
      </div>
    {/if}
  {/if}
</section>
