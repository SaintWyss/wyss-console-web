<script lang="ts">
  import { currentLanguage, msg, t } from '../../i18n/index.svelte';
  import type {
    ArsenalProvider,
    GuideEntry,
    GuideSet,
    GuideSetKind,
    Selection,
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
  import {
    CONFIG_KINDS,
    blocks,
    splitDescription,
    outline,
    type Block as MdBlock,
  } from './guide';
  import ArsenalBrowser from './ArsenalBrowser.svelte';
  import PresetsPanel from './PresetsPanel.svelte';
  import SyncLine from './SyncLine.svelte';
  import { field, hookCommand, scriptName } from './hook';
  import { eventOf, matcherOf } from './map';
  import {
    CHANGE_FAILURE_TEXT,
    HOOK_EVENTS,
    NOT_WRITABLE_LABEL,
    SOURCE_LABEL,
    authoringFor,
  } from '../configuration/present';
  import { mapOf, type MapNode, type MapTool } from './map';
  import type { GuideStore, GuideTool } from './guide-store.svelte';
  import type { ArsenalController, ArsenalState } from './controller';

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
    arsenal,
    arsenalController,
    oneditlaunch,
    oncreatelaunch,
  }: {
    visible: boolean;
    store: GuideStore;
    configuration: ConfigurationState;
    configurationController: ConfigurationController;
    changes: ChangesState;
    changesController: ChangesController;
    arsenal: ArsenalState;
    arsenalController: ArsenalController;
    oneditlaunch: (id: string) => void;
    oncreatelaunch: (selection: Selection) => void;
  } = $props();

  const configItems = $derived(configuration.reply?.inventory.items ?? []);
  let presetsProvider = $state<ArsenalProvider>('claude_code');
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

  function setTitle(set: GuideSet): string {
    const named = SET_NAME[set.kind];
    return named ? t(named) : set.name;
  }
  const open = $derived(
    store.openId === null
      ? null
      : (store.guide?.entries.find((e) => e.id === store.openId) ?? null),
  );

  const SET_NAME: Partial<Record<GuideSetKind, string>> = {
    account: msg('Claude account'),
    system: msg('Included with Codex'),
    repos: msg('Git repos'),
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

  /** Where the open entry lives, said in words: Personal › category, or its set. */
  const cardPlace = $derived.by(() => {
    if (!open) return '';
    if (open.set === 'mine') return t('Personal');
    if (open.set === 'agents') return t('Agents');
    const set = store.guide?.sets.find((x) => x.key === open.set);
    return set ? setTitle(set) : '';
  });
  // In Spanish, a `SKILL.es.md` beside the skill is what is shown; the file the tools read is not touched.
  const spanish = $derived(currentLanguage() === 'es');
  const cardMeta = $derived(
    [cardPlace, open?.scope ? t(SCOPE_LABEL[open.scope]) : '']
      .filter(Boolean)
      .join(' · '),
  );
  const split = $derived(
    open
      ? splitDescription((spanish && open.description_es) || open.description)
      : null,
  );
  /** The translation is shown unless the owner asked for the original. */
  let showOriginal = $state(false);
  const translated = $derived(
    spanish && (store.body?.text_es ?? null) !== null,
  );
  const bodyText = $derived(
    store.body
      ? (translated && !showOriginal && store.body.text_es) || store.body.text
      : null,
  );
  const index = $derived(outline(bodyText ? blocks(bodyText) : []));
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
    if (!changes.applying) changesController.cancel();
    if (!changes.applying) awaiting = null;
  }
  function choose(entry: GuideEntry) {
    leave();
    void store.open(entry.id);
  }
  function back() {
    leave();
    store.close();
    // The list puts the focus back on the row, by its id, once it is drawn again.
  }
  let cardTitle = $state<HTMLHeadingElement | null>(null);
  $effect(() => {
    if (open && cardTitle) cardTitle.focus({ preventScroll: true });
  });

  /** The map's root: Arsenal, then each tool that has anything. */
  const mapRoots = $derived.by((): MapNode[] => {
    const tools: MapTool[] = TOOLS.map((x) => x.id);
    const children = mapOf(
      store.guide,
      configItems,
      tools,
      {
        tool: {
          claude_code: 'Anthropic · Claude Code',
          codex: 'OpenAI · Codex',
          opencode: 'OpenCode',
        },
        skills: t('Skills'),
        agents: t('Agents'),
        personal: t('Personal'),
        sets: t('Sets'),
        hooks: t('Hooks'),
        keptAside: t('Kept aside'),
        hookEvent: (event) => t(HOOK_EVENT_NAME[event] ?? event),
        mcp: t('MCP'),
        configuration: t('Configuration'),
        presets: t('Presets'),
        setName: (key) => {
          const set = store.guide?.sets.find((x) => x.key === key);
          return set ? setTitle(set) : key;
        },
        category: (label) => t(label),
      },
      arsenal.selections,
    );
    return [
      {
        kind: 'branch',
        key: 'arsenal',
        label: t('Arsenal'),
        count: null,
        origin: null,
        children,
      },
    ];
  });
  /** Hook events by their meaning; the name the tool uses goes in grey under it. */
  const HOOK_EVENT_NAME: Record<string, string> = {
    SessionStart: msg('When a session opens'),
    SessionEnd: msg('When a session ends'),
    UserPromptSubmit: msg('When you send a message'),
    PreToolUse: msg('Before a tool runs'),
    PostToolUse: msg('After a tool runs'),
    PostToolUseFailure: msg('When a tool fails'),
    PermissionRequest: msg('When permission is requested'),
    SubagentStart: msg('When a subagent starts'),
    Notification: msg('On a notification'),
    Stop: msg('When the answer ends'),
    SubagentStop: msg('When a subagent ends'),
    PreCompact: msg('Before the context is compacted'),
  };
  /** The hook whose card is open, by id; null when none is. */
  let openItemId = $state<string | null>(null);
  const openItem = $derived(
    openItemId === null
      ? null
      : (configItems.find((i) => i.id === openItemId) ?? null),
  );
  /** Kept entries have no provider or kind in their public metadata. */
  let parkedOpen = $state(false);
  /** The tool used by the add-hook form on the kept-entries page. */
  let parkedTool = $state<'claude_code' | 'codex'>('claude_code');
  const parked = $derived(
    (changes.records ?? []).filter((r) => r.state === 'parked'),
  );
  function showParked(on: boolean) {
    if (parkedOpen === on) return;
    parkedOpen = on;
    changesController.show(on ? 'parked' : 'items');
  }
  /** Over a hook event's list: the form that adds one, when open. */
  let adding = $state<string | null>(null);
  let addMatcher = $state('');
  let addEvent = $state('PreToolUse');
  let itemTitle = $state<HTMLHeadingElement | null>(null);
  $effect(() => {
    if (openItem && itemTitle) itemTitle.focus({ preventScroll: true });
  });
  function closeItem() {
    leave();
    openItemId = null;
  }

  /** A configuration page is open over the Arsenal when the section is one: a link to it opens it too. */
  const configOpen = $derived(configKinds !== null);
  function openConfig(tool: MapTool, section: 'hooks' | 'mcp' | 'global') {
    showParked(false);
    leave();
    openItemId = null;
    adding = null;
    store.choose({ tool, section });
  }
  function openPresets(tool: ArsenalProvider) {
    showParked(false);
    leave();
    store.close();
    openItemId = null;
    presetsProvider = tool;
    store.choose({ tool, section: 'origin:mine' });
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (visible && e.key === 'Escape') {
      if (openItem) closeItem();
      else if (open) back();
    }
  }}
/>

<section
  class="library-feature"
  aria-label={t('Arsenal')}
  hidden={!visible}
  inert={!visible}
>
  {#snippet parkedPanel()}
    <div class="ars-config-inline">
      <h2 class="ab-title">{t('Kept aside')}</h2>
      {@render listTop(`${parkedTool}/hooks/${addEvent}`)}
      {#if changes.records === null}
        {#if changes.failure}
          <p role="alert">{t(CHANGE_FAILURE_TEXT[changes.failure])}</p>
          <button
            type="button"
            class="action"
            onclick={() => changesController.loadRecords()}
            >{t('Try again')}</button
          >
        {:else}
          <p class="lib-muted" role="status">{t('Reading…')}</p>
        {/if}
      {:else if parked.length === 0}
        <p class="lib-muted">{t('Nothing is kept aside.')}</p>
      {:else}
        <ul class="ars-rows">
          {#each parked as record (record.id)}
            <li class="ars-parked">
              <span class="lib-name">{record.label}</span>
              <button
                type="button"
                class="action"
                disabled={changes.planning || changes.applying}
                onclick={() => {
                  changedFor = `restore:${record.id}`;
                  changesController.draft('restore_hook', record.id);
                }}>{t('Put back')}</button
              >
              {#if changedFor === `restore:${record.id}`}
                <ChangePlan {changes} {changesController} />
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/snippet}
  {#snippet configPanel()}
    <div class="ars-config-inline">
      <ConfigurationView
        visible={visible && configOpen}
        embedded
        kinds={configKinds ?? []}
        {configuration}
        controller={configurationController}
        {changes}
        {changesController}
      />
    </div>
  {/snippet}
  {#snippet presetsPanel()}
    <div class="ars-config-inline">
      {#if arsenal.sync}
        <SyncLine sync={arsenal.sync} />
      {/if}
      <PresetsPanel
        {visible}
        provider={presetsProvider}
        {arsenal}
        controller={arsenalController}
        onedit={oneditlaunch}
        oncreate={oncreatelaunch}
      />
    </div>
  {/snippet}
  {#snippet listTop(key: string)}
    {#if key.startsWith('claude_code/hooks/') || key.startsWith('codex/hooks/')}
      {@const agent = key.startsWith('codex/') ? 'codex' : 'claude_code'}
      {@const event = key.slice(`${agent}/hooks/`.length)}
      <div class="ars-list-top">
        {#if adding === event}
          <form
            class="ars-add"
            onsubmit={(e) => {
              e.preventDefault();
              changedFor = `add:${event}`;
              changesController.author((c) =>
                c.authorHook(
                  addEvent,
                  addMatcher.trim() || null,
                  null,
                  false,
                  agent,
                ),
              );
              adding = null;
            }}
          >
            <label
              >{t('When it runs')}
              <select bind:value={addEvent}>
                {#each HOOK_EVENTS as name (name)}
                  <option value={name}
                    >{t(HOOK_EVENT_NAME[name] ?? name)} · {name}</option
                  >
                {/each}
              </select></label
            >
            <label
              >{t('For which tools (empty = all)')}
              <input
                class="le-input mono"
                placeholder="Bash|Write"
                spellcheck="false"
                bind:value={addMatcher}
              /></label
            >
            <button type="submit" class="action primary"
              >{t('Write the command…')}</button
            >
            <button type="button" class="action" onclick={() => (adding = null)}
              >{t('Cancel')}</button
            >
          </form>
        {:else}
          <button
            type="button"
            class="action"
            disabled={changes.planning || changes.applying}
            onclick={() => {
              adding = event;
              addEvent = event;
              addMatcher = '';
            }}>{t('Add a hook')}</button
          >
        {/if}
        {#if changedFor === `add:${event}`}
          <ChangePlan {changes} {changesController} />
        {/if}
      </div>
    {/if}
  {/snippet}
  {#snippet itemBody()}
    {#if openItem}
      {@const item = openItem}
      {@const authoring = authoringFor(item)}
      {@const off = changeFor(item)}
      <article class="ars-card ars-inline" aria-labelledby="ars-card-title">
        <header class="ars-card-head">
          <h2 id="ars-card-title" tabindex="-1" bind:this={itemTitle}>
            {scriptName(hookCommand(item)) || matcherOf(item.name)}
          </h2>
          <button type="button" class="action ars-back-top" onclick={closeItem}
            >{t('Back')}</button
          >
        </header>
        <p class="ars-meta">
          {t(HOOK_EVENT_NAME[eventOf(item.name)] ?? eventOf(item.name))} ·
          {eventOf(item.name)} ·
          {matcherOf(item.name) || t('Every tool')} ·
          {item.persisted === 'present_enabled' ? t('On') : t('Off')}
        </p>
        {#if item.provider === 'codex'}
          <p class="ars-note">
            {t(
              'Codex asks you to trust a new or changed hook the next time it starts. Deleting one moves the hooks after it in its event, and Codex asks to trust those again.',
            )}
          </p>
        {/if}
        <section class="ars-sec">
          <h3>{t('What it runs')}</h3>
          <pre class="lib-pre">{hookCommand(item) || '—'}</pre>
          {#if field(item, 'timeout')}
            <p class="ars-note">
              {t('Stops after {n} s.', { n: field(item, 'timeout') })}
            </p>
          {/if}
        </section>
        <section class="ars-sec">
          <h3>{t('Actions')}</h3>
          <p class="ars-state">
            {#if authoring}
              <button
                type="button"
                class="action"
                disabled={changes.planning || changes.applying}
                onclick={() =>
                  draftFrom(item.id, () =>
                    changesController.author((c) => c.editHook(item.id)),
                  )}>{t('Edit')}</button
              >
            {/if}
            {#if off}
              <button
                type="button"
                class="action"
                title={t('It is kept aside and can be brought back.')}
                disabled={changes.planning || changes.applying}
                onclick={() =>
                  draftFrom(item.id, () =>
                    changesController.draft(off.operation, item.id),
                  )}>{t('Keep aside')}</button
              >
            {/if}
            {#if applied[item.id] && !changes.plan}
              {@const change = applied[item.id]}
              <button
                type="button"
                class="action quiet"
                disabled={changes.planning || changes.applying}
                onclick={() =>
                  draftFrom(item.id, () => changesController.undo(change))}
                >{t('Undo')}</button
              >
            {/if}
          </p>
          {#if !authoring && !off}
            <p class="ars-note">
              {item.not_writable === 'not_in_this_phase'
                ? t('This hook cannot be changed from here.')
                : t(NOT_WRITABLE_LABEL[item.not_writable])}
            </p>
          {/if}
          {#if changedFor === item.id}
            <ChangePlan {changes} {changesController} />
          {/if}
        </section>
        <div class="ars-folds">
          <details class="ars-sec ars-fold">
            <summary><h3>{t('Location')}</h3></summary>
            <p class="ars-note">{t(SOURCE_LABEL[item.source])}</p>
          </details>
        </div>
      </article>
    {/if}
  {/snippet}
  {#snippet cardBody()}
    {#if open}
      <article class="ars-card ars-inline" aria-labelledby="ars-card-title">
        <header class="ars-card-head">
          <h2 id="ars-card-title" tabindex="-1" bind:this={cardTitle}>
            {open.name}
          </h2>
          <button type="button" class="action ars-back-top" onclick={back}
            >{t('Back')}</button
          >
        </header>
        <p class="ars-meta">{cardMeta}</p>

        {#if open.unreadable}
          <p class="notice" data-tone="warn">
            {t('Its text could not be read ({reason}).', {
              reason: t(UNREADABLE[open.unreadable] ?? UNREADABLE.unreadable),
            })}
          </p>
        {:else if split}
          <p class="ars-lead">
            {split.what || t('Its file has no description.')}
          </p>
          {#if open.description_cut}
            <p class="ars-note">
              {t('The description is longer: only its beginning is shown.')}
            </p>
          {/if}
          {#if split.when}
            <section class="ars-sec">
              <h3>{t('Use it when')}</h3>
              <p>{split.when}</p>
            </section>
          {/if}
          {#if split.whenNot}
            <section class="ars-sec">
              <h3>{t('Do not use it when')}</h3>
              <p>{split.whenNot}</p>
            </section>
          {/if}
        {/if}

        {#if switchItem && switchChange}
          <section class="ars-sec">
            <h3>{t('State')}</h3>
            <p class="ars-state">
              <span
                >{switchItem.persisted === 'present_disabled'
                  ? t('Off')
                  : t('On')}</span
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
                  ? t('Turn on')
                  : t('Turn off')}</button
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

        {#snippet blockList(list: MdBlock[])}
          {#each list as b, i (i)}
            {#if b.kind === 'heading'}
              <p class="ars-md-h" data-level={b.level}>{b.text}</p>
            {:else if b.kind === 'paragraph'}
              <p>{b.text}</p>
            {:else if b.kind === 'list'}
              <ul>
                {#each b.items as item, j (j)}<li>{item}</li>{/each}
              </ul>
            {:else}
              <details class="ars-code">
                <summary
                  >{t('Code ({n} lines)', {
                    n: b.text.split('\n').length,
                  })}</summary
                >
                <pre class="lib-pre">{b.text}</pre>
              </details>
            {/if}
          {/each}
        {/snippet}
        {#if !open.unreadable}
          <section class="ars-sec ars-instr">
            <h3>{t('Instructions')}</h3>
            {#if translated}
              <p class="ars-note">
                {showOriginal
                  ? t('Original text: what the tool reads.')
                  : t('Translated text; the tool reads the original.')}
                <button
                  type="button"
                  class="action quiet"
                  onclick={() => (showOriginal = !showOriginal)}
                  >{showOriginal
                    ? t('See translation')
                    : t('See original')}</button
                >
              </p>
            {/if}
            {#if store.bodyLoading}
              <p class="lib-muted" role="status">{t('Reading…')}</p>
            {:else if store.bodyFailed}
              <p class="notice" data-tone="error">
                {t('The file could not be read.')}
              </p>
            {:else if store.body}
              <div class="ars-md">
                {@render blockList(index.intro)}
                {#each index.parts as part, i (i)}
                  <details class="ars-part">
                    <summary>{part.title}</summary>
                    <div class="ars-md">
                      {@render blockList(part.blocks)}
                      {#each part.parts as inner, j (j)}
                        <details class="ars-part ars-part-inner">
                          <summary>{inner.title}</summary>
                          <div class="ars-md">
                            {@render blockList(inner.blocks)}
                          </div>
                        </details>
                      {/each}
                    </div>
                  </details>
                {/each}
                {#if store.body.cut}
                  <p class="lib-muted">
                    {t('Only the first 256 KB are shown.')}
                  </p>
                {/if}
              </div>
            {/if}
          </section>
        {/if}
        <div class="ars-folds">
          <details class="ars-sec ars-fold">
            <summary><h3>{t('Location')}</h3></summary>
            {#if open.scope}
              <p class="ars-note">{t(SCOPE_HELP[open.scope])}</p>
            {/if}
            {#if open.codex_differs}
              <p class="ars-note">
                {t(
                  'The copies in Claude Code’s and Codex’s folders are different.',
                )}
              </p>
            {/if}
            <p class="mono ars-where">{open.origin}</p>
            {#if open.linked_to}
              <p class="mono ars-where">→ {open.linked_to}</p>
            {/if}
          </details>
          {#if !open.unreadable}
            {#if store.body && open.kind === 'skill'}
              <details class="ars-sec ars-fold">
                <summary
                  ><h3>
                    {t('Files ({n})', {
                      n: store.body.files.length + store.body.more_files,
                    })}
                  </h3></summary
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
        </div>
      </article>
    {/if}
  {/snippet}
  {#if store.guide !== null && !store.failed}
    <ArsenalBrowser
      bind:query={store.query}
      roots={mapRoots[0]?.kind === 'branch' ? mapRoots[0].children : []}
      onentry={choose}
      onconfig={openConfig}
      onpresets={openPresets}
      presetsView={presetsPanel}
      openId={open?.id ?? openItem?.id ?? null}
      onclose={() => (openItem ? closeItem() : back())}
      card={openItem ? itemBody : cardBody}
      onitem={(item) => {
        showParked(false);
        leave();
        store.close();
        openItemId = item.id;
      }}
      {listTop}
      configShown={configOpen || parkedOpen}
      configView={parkedOpen ? parkedPanel : configPanel}
      onparked={(key) => {
        parkedTool = key.startsWith('codex/') ? 'codex' : 'claude_code';
        leave();
        store.close();
        openItemId = null;
        if (configOpen) store.choose({ section: 'origin:mine' });
        showParked(true);
      }}
      onlist={() => {
        showParked(false);
        // A plan left unconfirmed in the list just left is dropped.
        leave();
        store.close();
        openItemId = null;
        adding = null;
        if (configOpen) store.choose({ section: 'origin:mine' });
      }}
    />
  {:else if store.failed}
    <p class="notice" data-tone="error" role="alert">
      {t('The skills on disk could not be read.')}
      <button type="button" class="action" onclick={() => void store.load()}
        >{t('Try again')}</button
      >
    </p>
  {:else}
    <p class="lib-muted" role="status">{t('Reading…')}</p>
  {/if}
  {#if store.guide?.truncated}
    <p class="notice" data-tone="warn">
      {t('A folder holds more than is read: the lists are incomplete.')}
    </p>
  {/if}
</section>
