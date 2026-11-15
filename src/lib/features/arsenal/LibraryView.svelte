<script lang="ts">
  import { currentLanguage, msg, t } from '../../i18n/index.svelte';
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
  import {
    CONFIG_KINDS,
    blocks,
    splitDescription,
    outline,
    type Block as MdBlock,
  } from './guide';
  import ArsenalBrowser from './ArsenalBrowser.svelte';
  import { mapOf, type MapNode, type MapTool } from './map';
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
    if (changes.plan && !changes.applying) changesController.cancel();
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
    const children = mapOf(store.guide, configItems, tools, {
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
      mcp: t('MCP'),
      configuration: t('Configuration'),
      setName: (key) => {
        const set = store.guide?.sets.find((x) => x.key === key);
        return set ? setTitle(set) : key;
      },
      category: (label) => t(label),
    });
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
  /** A configuration page is open over the Arsenal when the section is one: a link to it opens it too. */
  const configOpen = $derived(configKinds !== null);
  function openConfig(tool: MapTool, section: 'hooks' | 'mcp' | 'global') {
    store.choose({ tool, section });
  }
  function closeConfig() {
    store.choose({ section: 'origin:mine' });
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (visible && open && e.key === 'Escape') back();
  }}
/>

<section
  class="library-feature"
  aria-label={t('Arsenal')}
  hidden={!visible}
  inert={!visible}
>
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
              <p class="ars-note">{t('Codex’s copy is different.')}</p>
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
      openId={open?.id ?? null}
      onclose={back}
      card={cardBody}
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
  {#if configOpen && configKinds !== null}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class="ars-overlay"
      onclick={(e) => {
        if (e.target === e.currentTarget) closeConfig();
      }}
    >
      <div
        class="ars-card ars-config-card"
        role="dialog"
        aria-modal="true"
        aria-label={t('Configuration')}
        tabindex="-1"
        onkeydown={(e) => {
          if (e.key === 'Escape') closeConfig();
        }}
      >
        <button
          type="button"
          class="action quiet ars-close"
          aria-label={t('Close')}
          onclick={closeConfig}>✕</button
        >
        <ConfigurationView
          visible={visible && configOpen}
          embedded
          kinds={configKinds}
          {configuration}
          controller={configurationController}
          {changes}
          {changesController}
        />
      </div>
    </div>
  {/if}
</section>
