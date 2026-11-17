import { ArsenalCallError } from '../../desktop/arsenal-client';
import { LaunchError } from '../../desktop/launch-client';
import { msg, t, tIncoming } from '../../i18n/index.svelte';
import { failureMessage } from '../arsenal/messages';
import { FAILURE_TEXT } from '../native/present';

/** Keep host codes out of visible text, while preserving the reason when one was provided. */
export function errorMessage(error: unknown): string {
  if (error instanceof LaunchError) {
    if (error.reasons.length) return error.reasons.map(tIncoming).join('; ');
    if (error.code === 'launch_unavailable')
      return t('The launch folder is not available.');
    return t('Something unexpected happened. Try again.');
  }
  if (error instanceof ArsenalCallError) {
    const extra: Record<string, string> = {
      project_unknown: msg(
        'That folder is not registered. Choose it with Browse… and try again.',
      ),
      provider_unsupported: msg('This agent does not support launch plans.'),
    };
    return t(
      extra[error.code] ?? FAILURE_TEXT[error.code] ?? failureMessage(error),
    );
  }
  return error instanceof Error
    ? tIncoming(error.message)
    : t('Something unexpected happened. Try again.');
}

/** A host reason may be a lowercase fragment without punctuation. */
export function sentence(text: string): string {
  const trimmed = text.trim();
  return trimmed
    ? (/^[\w.-]+\.[\w]+\b/.test(trimmed)
        ? trimmed[0]
        : trimmed[0].toLocaleUpperCase()) +
        trimmed.slice(1) +
        (/[.!?…]$/.test(trimmed) ? '' : '.')
    : trimmed;
}
