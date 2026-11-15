import type { ConfigItem } from '../../contracts/configuration';

/** One field of a configuration item's detail, as shown text; '' when it has none. */
export function field(item: ConfigItem, key: string): string {
  const d = item.detail;
  if (!d || d.kind !== 'map') return '';
  const found = d.value.find(([k]) => k === key)?.[1];
  if (!found) return '';
  if (found.kind === 'text') return found.value.text;
  if (found.kind === 'hidden') return '[hidden]';
  if (found.kind === 'number' || found.kind === 'bool')
    return String(found.value);
  return '';
}

/** What a hook runs, as read (secrets redacted by the desktop). */
export function hookCommand(item: ConfigItem): string {
  return field(item, 'command');
}
