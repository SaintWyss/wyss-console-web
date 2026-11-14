<script lang="ts">
  import { t } from '../../i18n/index.svelte';
  import type { ChangesController, ChangesState } from './changes-controller';
  import {
    CHANGE_FAILURE_TEXT,
    EFFECT_LABEL,
    NOTICE_LABEL,
    OPERATION_LABEL,
    OUTCOME_LABEL,
    PROVIDER_LABEL,
    RISK_LABEL,
    SOURCE_LABEL,
    STORAGE_LABEL,
    VERDICT_LABEL,
  } from './present';

  /** The change waiting for confirmation and how the last one ended: Configuration's own block,
   * shown wherever a change is drafted from (Configuration, an Arsenal card). */
  let {
    changes,
    changesController,
  }: { changes: ChangesState; changesController: ChangesController } = $props();
</script>

{#if changes.plan}
  {@const plan = changes.plan}
  <section class="configuration-plan" aria-label={t('Change to confirm')}>
    <h3>{t(OPERATION_LABEL[plan.operation])}: {plan.name}</h3>
    <p class="event-meta">
      {PROVIDER_LABEL[plan.provider]} · {t(SOURCE_LABEL[plan.source])}
    </p>
    {#if plan.diff.length > 0}
      <ul class="configuration-diff" aria-label={t('What would change')}>
        {#each plan.diff as line, index (index)}
          <li data-kind={line.kind}>
            <span aria-hidden="true"
              >{line.kind === 'removed'
                ? '−'
                : line.kind === 'added'
                  ? '+'
                  : ''}</span
            >
            <span class="mono">{line.text}</span>
          </li>
        {/each}
      </ul>
    {/if}
    {#if plan.shared_with_declared_writers}
      <p class="event-meta">
        {t('Another account you named in')}
        <span class="mono">trusted-writers</span>
        {t(
          'can also write this file’s folder. It is accepted because you named it.',
        )}
      </p>
    {/if}
    {#if plan.holds_hidden_values}
      <p class="configuration-warning">
        {t('This entry holds values that are not shown here.')}
      </p>
    {/if}
    {#if plan.storage}
      <p class="event-meta">{t(STORAGE_LABEL[plan.storage])}</p>
    {/if}
    <p class="event-meta">{t(EFFECT_LABEL[plan.effect])}</p>
    {#if plan.managed_effect}
      <p class="event-meta">
        {t('Prediction, not a reading: managed Inference')}
        {t(VERDICT_LABEL[plan.managed_effect.before])}
        {t('now')}
        {#if plan.managed_effect.before === plan.managed_effect.after}
          {t('and this change does not alter that.')}
        {:else}
          {t('and would')}
          {t(VERDICT_LABEL[plan.managed_effect.after])}
          {t('after it.')}
        {/if}
      </p>
    {/if}
    {#if RISK_LABEL[plan.risk]}
      <p class="configuration-warning">{t(RISK_LABEL[plan.risk])}</p>
    {/if}
    <div class="configuration-plan-actions">
      <button
        type="button"
        class="action primary"
        disabled={changes.applying}
        onclick={() => changesController.apply()}
        >{changes.applying
          ? plan.needs_native_dialog
            ? t('Waiting for the confirmation window…')
            : t('Applying…')
          : plan.needs_native_dialog
            ? t('Continue to confirm')
            : t('Apply')}</button
      >
      <button
        type="button"
        class="action"
        disabled={changes.applying}
        onclick={() => changesController.cancel()}>{t('Cancel')}</button
      >
    </div>
  </section>
{/if}
{#if changes.planning}
  <p class="sessions-status" role="status">{t('Preparing the change…')}</p>
{/if}
{#if changes.result}
  <p
    class="sessions-status"
    class:failed={OUTCOME_LABEL[changes.result].tone === 'error' ||
      OUTCOME_LABEL[changes.result].tone === 'warn'}
    role="status"
  >
    {t(OUTCOME_LABEL[changes.result].text)}
  </p>
{/if}
{#if changes.failure}
  <p class="sessions-status failed" role="alert">
    {t(CHANGE_FAILURE_TEXT[changes.failure])}
  </p>
{/if}
{#if changes.notice}
  <p class="sessions-status" role="status">
    {t(NOTICE_LABEL[changes.notice])}
  </p>
{/if}
