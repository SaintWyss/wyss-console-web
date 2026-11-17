/**
 * Arsenal as a map in layers (owner, 2026-11-15): Arsenal → tool → kind (skills, agents, hooks,
 * MCP, configuration) → the owner's own ("Personal") or each set → category → the entry. One
 * branch is open per layer; a leaf opens its card. Pure: nothing here reads the disk or the DOM.
 */
import type {
  ArsenalProvider,
  Guide,
  GuideEntry,
  Selection,
} from '../../contracts/arsenal';
import type { ConfigItem } from '../../contracts/configuration';
import { GROUP_LABEL, type Group } from './groups';
import {
  CONFIG_KINDS,
  ORIGIN_OF,
  byCategory,
  entriesOf,
  type Origin,
} from './guide';

export type MapTool = ArsenalProvider | 'opencode';

export type MapNode =
  | {
      kind: 'branch';
      key: string;
      label: string;
      /** How many entries hang under it; null when it is not counted. */
      count: number | null;
      origin: Origin | null;
      children: MapNode[];
    }
  | { kind: 'entry'; key: string; entry: GuideEntry; origin: Origin }
  /** One item of the agent's own configuration (a hook), opened as a card like an entry. */
  | { kind: 'item'; key: string; item: ConfigItem; label: string }
  /** Claude Code's hooks kept aside: shown at the side, each with Put back. */
  | { kind: 'parked'; key: string; label: string }
  | {
      kind: 'config';
      key: string;
      label: string;
      count: number;
      tool: MapTool;
      section: 'hooks' | 'mcp' | 'global';
    }
  | {
      kind: 'presets';
      key: string;
      label: string;
      count: number;
      tool: ArsenalProvider;
    };

export interface MapText {
  tool: Record<MapTool, string>;
  skills: string;
  agents: string;
  personal: string;
  sets: string;
  hooks: string;
  keptAside: string;
  /** What a hook event is called on screen (`PreToolUse` → "Before a tool"). */
  hookEvent: (event: string) => string;
  mcp: string;
  configuration: string;
  presets: string;
  setName: (key: string) => string;
  category: (label: string) => string;
}

const branch = (
  key: string,
  label: string,
  children: MapNode[],
  origin: Origin | null = null,
): MapNode => ({
  kind: 'branch',
  key,
  label,
  count: children.reduce((n, c) => n + countOf(c), 0),
  origin,
  children,
});

function countOf(node: MapNode): number {
  if (node.kind === 'entry' || node.kind === 'item') return 1;
  if (node.kind === 'config' || node.kind === 'parked') return 0;
  return node.count ?? 0;
}

/** Entries by category, each category a branch; only categories that hold something. */
function byGroup(
  keyPrefix: string,
  entries: GuideEntry[],
  origin: Origin,
  text: MapText,
): MapNode[] {
  return byCategory(entries).map((c) =>
    branch(
      `${keyPrefix}/${c.group}`,
      text.category(GROUP_LABEL[c.group as Group]),
      c.entries.map((entry) => ({
        kind: 'entry' as const,
        key: entry.id,
        entry,
        origin,
      })),
      origin,
    ),
  );
}

/** The whole map: one branch per tool that has anything, in the order given. */
export function mapOf(
  guide: Guide | null,
  configItems: readonly ConfigItem[],
  tools: readonly MapTool[],
  text: MapText,
  selections: readonly Selection[] = [],
): MapNode[] {
  return tools
    .map((tool): MapNode => {
      const kinds: MapNode[] = [];
      if (tool !== 'opencode' && guide !== null) {
        const mine = entriesOf(guide, tool, 'mine');
        const sets = guide.sets
          .filter((s) => s.tool === tool)
          .map((set) => {
            const origin = ORIGIN_OF[set.kind];
            const entries = entriesOf(guide, tool, set.key);
            return branch(
              `${tool}/sets/${set.key}`,
              text.setName(set.key),
              byGroup(`${tool}/sets/${set.key}`, entries, origin, text),
              origin,
            );
          })
          .filter((b) => countOf(b) > 0)
          .sort((a, b) =>
            a.kind === 'branch' && b.kind === 'branch'
              ? a.label.localeCompare(b.label)
              : 0,
          );
        const skills: MapNode[] = [];
        if (mine.length > 0)
          skills.push(
            branch(
              `${tool}/personal`,
              text.personal,
              byGroup(`${tool}/personal`, mine, 'mine', text),
              'mine',
            ),
          );
        if (sets.length > 0)
          skills.push(branch(`${tool}/sets`, text.sets, sets));
        if (skills.length > 0)
          kinds.push(branch(`${tool}/skills`, text.skills, skills));
        const agents = entriesOf(guide, tool, 'agents');
        if (agents.length > 0)
          kinds.push(
            branch(
              `${tool}/agents`,
              text.agents,
              byGroup(`${tool}/agents`, agents, 'mine', text),
            ),
          );
        kinds.push({
          kind: 'presets',
          key: `${tool}/presets`,
          label: text.presets,
          count: selections.filter((selection) => selection.provider === tool)
            .length,
          tool,
        });
      }
      // Hooks are a branch like skills: by event, then each hook (Claude Code and Codex).
      const withHooks = tool === 'claude_code' || tool === 'codex';
      const hooks = withHooks
        ? configItems.filter((i) => i.provider === tool && i.kind === 'hook')
        : [];
      if (withHooks) {
        const events = [...new Set(hooks.map((h) => eventOf(h.name)))];
        kinds.push(
          branch(`${tool}/hooks`, text.hooks, [
            ...events.map((event) =>
              branch(
                `${tool}/hooks/${event}`,
                text.hookEvent(event),
                hooks
                  .filter((h) => eventOf(h.name) === event)
                  .map((item) => ({
                    kind: 'item' as const,
                    key: item.id,
                    item,
                    label: matcherOf(item.name) || text.hookEvent(event),
                  })),
              ),
            ),
            {
              kind: 'parked' as const,
              key: `${tool}/hooks/parked`,
              label: text.keptAside,
            },
          ]),
        );
      }
      for (const [section, label] of [
        ['hooks', text.hooks],
        ['mcp', text.mcp],
        ['global', text.configuration],
      ] as const) {
        if (section === 'hooks' && withHooks) continue;
        const count = configItems.filter(
          (item) =>
            item.provider === tool && CONFIG_KINDS[section].includes(item.kind),
        ).length;
        if (count > 0 || tool === 'opencode')
          kinds.push({
            kind: 'config',
            key: `${tool}/${section}`,
            label,
            count,
            tool,
            section,
          });
      }
      return branch(`${tool}`, text.tool[tool], kinds);
    })
    .filter((node) => node.kind === 'branch' && node.children.length > 0);
}

/** A hook's name is `Event · matcher`: its event. */
export function eventOf(name: string): string {
  return name.split(' · ')[0].trim();
}
/** A hook's name is `Event · matcher`: what it matches, or '' for every tool. */
export function matcherOf(name: string): string {
  return name.split(' · ').slice(1).join(' · ').trim();
}
