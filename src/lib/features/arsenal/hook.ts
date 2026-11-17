import type { ConfigItem } from '../../contracts/configuration';
import { t } from '../../i18n/index.svelte';

/** One field of a configuration item's detail, as shown text; '' when it has none. */
export function field(item: ConfigItem, key: string): string {
  const d = item.detail;
  if (!d || d.kind !== 'map') return '';
  const found = d.value.find(([k]) => k === key)?.[1];
  if (!found) return '';
  if (found.kind === 'text') return found.value.text;
  if (found.kind === 'hidden') return t('[hidden]');
  if (found.kind === 'number' || found.kind === 'bool')
    return String(found.value);
  return '';
}

/** What a hook runs, as read (secrets redacted by the desktop). */
export function hookCommand(item: ConfigItem): string {
  return field(item, 'command');
}

/** The script a hook command runs, by its file name: the word that names it in a list. */
export function scriptName(command: string): string {
  const words = command.split(/\s+/).map((w) => w.replace(/^["']|["']$/g, ''));
  const script = words.find((w) => /\.(py|sh|js|mjs|ts|rb)$/.test(w));
  const pick =
    script ??
    words.find(
      (w) => w !== '' && !/^(bash|sh|python3?|node|\/usr\/bin\/\S+)$/.test(w),
    ) ??
    '';
  return pick.split('/').pop() ?? '';
}
