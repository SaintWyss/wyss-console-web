<script lang="ts">
  import type { InventoryReply } from '../../../contracts/configuration';
  import type { EstimateData } from '../data';
  import { t } from '../../../i18n/index.svelte';
  import { isDefault, toggle } from '../../arsenal/environment';
  import { kTokens } from '../estimate';
  import { instructionDocument, type InstructionDocument } from '../model';
  import type { LaunchDraft } from '../plan';
  import MarkdownBlocks from '../MarkdownBlocks.svelte';
  import Section from '../Section.svelte';
  import ToggleRow from '../ToggleRow.svelte';

  let {
    draft,
    data,
    inventory,
    disabled = false,
  }: {
    draft: LaunchDraft;
    data: EstimateData;
    inventory: InventoryReply | null;
    disabled?: boolean;
  } = $props();

  const projectText = $derived(
    draft.instructions?.project === 'load'
      ? t(
          'The agent reads the project instructions in addition to these files.',
        )
      : draft.instructions?.project === 'exclude'
        ? t(
            'The agent skips the project instructions. These global files follow their switches.',
          )
        : t(
            'The agent reads this custom text instead of the project instructions.',
          ),
  );
  const readable = $derived(
    draft.agent === 'claude_code'
      ? draft.spec !== null
      : draft.codexSpec !== null,
  );
  const tokenWarning = $derived(
    draft.agent === 'claude_code' &&
      (draft.instructions?.project === 'role' ||
        (draft.spec !== null && !isDefault(draft.spec))) &&
      data.options !== null &&
      !data.options.token_stored,
  );

  const documents = $derived.by((): InstructionDocument[] => {
    const provider = draft.agent;
    const known =
      inventory?.inventory.items.filter(
        (item) =>
          item.provider === provider &&
          item.scope === 'global' &&
          item.kind === 'rule_file',
      ) ?? [];
    const files =
      provider === 'claude_code'
        ? [
            ...(data.options?.instructions ? ['CLAUDE.md'] : []),
            ...(data.options?.rules ?? []).map((name) => `rules/${name}`),
          ]
        : data.codexOptions?.instructions
          ? ['AGENTS.md']
          : [];
    return files.map((file) => {
      const found = known.find((item) => item.name === file);
      return found
        ? instructionDocument(found)
        : {
            file,
            title: file.split('/').at(-1) ?? file,
            description: '',
            conditional: false,
            markdown: null,
            outline: null,
          };
    });
  });

  const totalEnabled = $derived(documents.filter(isEnabled).length);
  const summaryCount = $derived(
    t('{on} of {all}', { on: totalEnabled, all: documents.length }),
  );

  function isEnabled(document: InstructionDocument): boolean {
    if (draft.agent === 'codex') return draft.codexSpec?.instructions ?? false;
    if (document.file === 'CLAUDE.md') return draft.spec?.instructions ?? false;
    const rule = document.file.replace(/^rules\//, '');
    return Boolean(
      draft.spec?.instructions && !draft.spec.rules_off.includes(rule),
    );
  }

  function isDisabled(document: InstructionDocument): boolean {
    return (
      disabled ||
      draft.instructions === null ||
      (draft.agent === 'claude_code' &&
        document.file !== 'CLAUDE.md' &&
        !draft.spec?.instructions)
    );
  }

  function setEnabled(document: InstructionDocument, enabled: boolean) {
    if (draft.agent === 'codex') {
      if (draft.codexSpec) draft.codexSpec.instructions = enabled;
      return;
    }
    if (!draft.spec) return;
    if (document.file === 'CLAUDE.md') {
      draft.spec.instructions = enabled;
      return;
    }
    const rule = document.file.replace(/^rules\//, '');
    draft.spec.rules_off = toggle(draft.spec.rules_off, rule, !enabled);
  }

  function sizeOf(document: InstructionDocument): string {
    const key =
      draft.agent === 'claude_code'
        ? document.file === 'CLAUDE.md'
          ? 'instructions'
          : `rule:${document.file.replace(/^rules\//, '')}`
        : '';
    const bytes = key ? data.options?.sizes[key] : undefined;
    return bytes === undefined ? t('Not estimated') : `~${kTokens(bytes)}`;
  }

  function blockList(document: InstructionDocument) {
    return document.outline?.intro ?? [];
  }
</script>

<Section title={t('From the project')}>
  <div class="workspace-row">
    <div class="row-label">
      <label for="project-instructions">{t('Project instructions')}</label>
    </div>
    <div class="row-control project-control">
      <select
        id="project-instructions"
        aria-label={t('Project instructions')}
        disabled={disabled || draft.instructions === null}
        value={draft.instructions?.project ?? 'load'}
        onchange={(event) => {
          const mode = event.currentTarget.value as 'load' | 'exclude' | 'role';
          const old = draft.instructions;
          draft.instructions =
            mode === 'load'
              ? { project: 'load' }
              : { project: mode, role: old && 'role' in old ? old.role : '' };
        }}
      >
        <option value="load">{t('Load')}</option>
        <option value="exclude">{t('Skip')}</option>
        <option value="role">{t('Custom text')}</option>
      </select>
      <p class="row-help">{projectText}</p>
    </div>
  </div>
  {#if draft.instructions?.project === 'role'}
    <div class="workspace-row">
      <label class="row-label" for="custom-project-text"
        >{t('Custom text')}</label
      >
      <textarea
        id="custom-project-text"
        rows="6"
        {disabled}
        aria-label={t('Custom text')}
        bind:value={draft.instructions.role}></textarea>
    </div>
    <p class="row-help project-note">
      {t(
        'The text applies at start. Another open terminal of this launch may see it change; resuming a conversation keeps what it already had.',
      )}
    </p>
  {/if}
  {#if draft.instructions === null}
    <p class="workspace-inline-notice" role="status">
      <span aria-hidden="true">⚠</span><strong>{t('Warning')}</strong>{t(
        'The launch instructions file cannot be read. It was not modified.',
      )}
    </p>
  {/if}
  {#if tokenWarning}
    <p class="workspace-inline-notice" role="alert">
      <span aria-hidden="true">⚠</span><strong>{t('Warning')}</strong>
      {t(
        'No long-lived token is stored, so this terminal will not start. Run claude setup-token in your own terminal and store it with: secret-tool store --label "Claude Code token (Wyss Console)" service wyss-console kind claude-oauth-token',
      )}
    </p>
  {/if}
</Section>

<Section title={t('Global')} count={readable ? summaryCount : ''}>
  {#if !readable}
    <p class="workspace-inline-notice" role="status">
      <span aria-hidden="true">⚠</span><strong>{t('Warning')}</strong>{t(
        'Global instructions are unavailable because the launch environment could not be read.',
      )}
    </p>
  {:else if documents.length === 0}
    <p class="workspace-empty">
      {t('No global instruction files are available.')}
    </p>
  {:else}
    {#each documents as document (document.file)}
      {@const conditional =
        document.conditional || document.file === 'rules/ux.md'}
      <ToggleRow
        label={document.title}
        detail={`${document.file}${document.description ? ` · ${document.description}` : ''}${conditional ? ` · ${t('Only loads when touching matching files.')}` : ''}`}
        meta={sizeOf(document)}
        checked={isEnabled(document)}
        disabled={isDisabled(document)}
        onchange={(enabled) => setEnabled(document, enabled)}
      />
      <details class="document-content">
        <summary>{t('Show content')}</summary>
        {#if document.outline}
          {#if blockList(document).length > 0}
            <MarkdownBlocks nodes={blockList(document)} />
          {/if}
          {#each document.outline.parts as part, i (`${document.file}-${i}`)}
            <details>
              <summary>{part.title}</summary>
              <MarkdownBlocks nodes={part.blocks} />
              {#each part.parts as subpart, j (`${document.file}-${i}-${j}`)}
                <details>
                  <summary>{subpart.title}</summary>
                  <MarkdownBlocks nodes={subpart.blocks} />
                </details>
              {/each}
            </details>
          {/each}
        {:else}
          <p class="workspace-empty">{t('Content not available')}</p>
        {/if}
      </details>
    {/each}
  {/if}
</Section>

<style>
  .row-control {
    display: grid;
    grid-template-columns: minmax(140px, 240px) minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  select,
  textarea {
    width: 100%;
    min-width: 0;
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text);
    font: var(--text-sm) var(--font-sans);
  }
  textarea {
    padding: 8px 10px;
    resize: vertical;
    font-family: var(--font-mono);
  }
  .row-help,
  .workspace-empty,
  .workspace-inline-notice {
    color: var(--muted);
    font-size: var(--text-xs);
  }
  .project-note {
    grid-column: 2;
  }
  .workspace-inline-notice {
    padding: 10px 12px;
    border-left: 3px solid var(--warn);
    background: var(--warn-soft);
  }
  .document-content {
    max-height: 360px;
    overflow: auto;
    margin: 0 0 8px 8px;
    padding: 4px 10px;
    border-left: 2px solid var(--line);
  }
  .document-content > summary {
    display: flex;
    align-items: center;
    min-height: var(--control-h);
    padding: 4px 0;
    color: var(--muted);
    font-size: var(--text-xs);
  }
  .document-content details {
    margin: 4px 0;
    padding-left: 12px;
    border-left: 1px solid var(--line);
  }
  .document-content details > summary {
    min-height: var(--control-h);
    padding: 4px 0;
    color: var(--text);
    font-size: var(--text-xs);
  }
  @media (max-width: 1023px) {
    .workspace-row {
      grid-template-columns: minmax(0, 1fr);
      gap: 8px;
    }
    .row-control {
      grid-template-columns: minmax(0, 1fr);
    }
    .project-note {
      grid-column: 1;
    }
  }
</style>
