import { msg, t } from '../../i18n/index.svelte';
import type { Origin } from './guide';

/** What the tree and the rows call each origin. What comes with the tool depends on the tool. */
const NAME: Record<Exclude<Origin, 'bundled'>, string> = {
  mine: msg('My skills'),
  gsd: msg('GSD Core'),
  plugin: msg('Plugins'),
  repos: msg('Git repos'),
};

export function originName(origin: Origin, tool: string): string {
  if (origin === 'bundled')
    return tool === 'codex' ? t('Included with Codex') : t('Claude account');
  return t(NAME[origin]);
}

/** The legend over a list: what each colour means. */
export const ORIGIN_HELP: Record<Origin, string> = {
  mine: msg('Yours: you made it'),
  gsd: msg('GSD: updates itself'),
  plugin: msg('Plugin: comes from outside'),
  bundled: msg('Comes with the tool'),
  repos: msg('Git repo'),
};
