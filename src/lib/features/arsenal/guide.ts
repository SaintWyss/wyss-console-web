/**
 * The Guide's pure rules (arsenal-UI-SPEC "Etapa 4"): how a description is split into what a skill
 * does and when to use it, which heading of its file says how it is used, how its instructions are
 * cut into blocks shown as plain text, and how entries are grouped into the tree. Nothing here
 * reads the disk or builds HTML.
 */
import type {
  ArsenalProvider,
  Guide,
  GuideEntry,
  GuideSet,
  GuideSetKind,
} from '../../contracts/arsenal';
import type { ItemKind } from '../../contracts/configuration';
import { GROUPS, groupFor } from './groups';

/**
 * Where a skill comes from, the tree's first level and the colour of its rows: the owner's own,
 * GSD Core, plugins (and the batches one tool installed), what comes with the tool (the Claude
 * account, or what Codex includes) and Git checkouts.
 */
export type Origin = 'mine' | 'gsd' | 'plugin' | 'bundled' | 'repos';
export const ORIGINS: readonly Origin[] = [
  'mine',
  'gsd',
  'plugin',
  'bundled',
  'repos',
];
export const ORIGIN_OF: Record<GuideSetKind, Exclude<Origin, 'mine'>> = {
  gsd: 'gsd',
  plugin: 'plugin',
  bundle: 'plugin',
  account: 'bundled',
  system: 'bundled',
  repos: 'repos',
};

/** The tree's sections: an origin is `origin:<origin>`. */
export type GuideSection =
  'agents' | 'hooks' | 'mcp' | 'global' | `origin:${Origin}`;

/** Where "use it when" begins. Checked in the text in any case. */
const WHEN = [
  /\bUse (?:this skill |this |it )?(?:when|whenever)\b/i,
  /(?<!\p{L})[UÚ]s[aá]l[ao] cuando(?!\p{L})/iu,
  /\bTRIGGER\b/,
  /\bTriggers? on\b/i,
];
/** Where "do not use it when" begins. */
const WHEN_NOT = [
  /\bDo not use\b/i,
  /\bDon['’]t use\b/i,
  /\bNo l[ao] uses\b/i,
  /\bN[Oo] usar\b/,
  /\bSKIP\b/,
  /\bNOT for\b/,
];

function earliest(text: string, patterns: readonly RegExp[]): number {
  let at = -1;
  for (const pattern of patterns) {
    const found = text.search(pattern);
    if (found >= 0 && (at < 0 || found < at)) at = found;
  }
  return at;
}

export interface Split {
  what: string;
  when: string | null;
  whenNot: string | null;
}

/**
 * Splits a description at its "Use when" and "Do not use" markers. When nothing comes before the
 * first marker, or there is none, the whole description is "what it does".
 */
export function splitDescription(description: string): Split {
  const text = description.trim();
  const when = earliest(text, WHEN);
  const not = earliest(text, WHEN_NOT);
  const first = [when, not].filter((at) => at > 0).sort((a, b) => a - b)[0];
  if (first === undefined) return { what: text, when: null, whenNot: null };
  const what = text.slice(0, first).trim();
  if (when > 0 && (not < 0 || not < when)) {
    // "Do not use" before "Use when", or none.
    if (not > 0)
      return {
        what,
        whenNot: text.slice(not, when).trim(),
        when: text.slice(when).trim(),
      };
    return { what, when: text.slice(when).trim(), whenNot: null };
  }
  if (when > 0)
    return {
      what,
      when: text.slice(when, not).trim(),
      whenNot: text.slice(not).trim(),
    };
  return { what, when: null, whenNot: text.slice(not).trim() };
}

/** The first sentence of a text, for a row: up to its first full stop or line break. */
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  const stop = trimmed.search(/[.!?。](?:\s|$)|\n/);
  return stop < 0 ? trimmed : trimmed.slice(0, stop + 1).trim();
}

const USAGE =
  /^(#{2,3})\s+(?:Cómo se usa|Como se usa|Usage|How to use|When to use)\s*$/im;

/** The text under a "## Usage" heading of a skill's instructions, or `null` when it has none. */
export function usageSection(body: string): string | null {
  const found = USAGE.exec(body);
  if (found === null) return null;
  const level = found[1].length;
  const rest = body.slice(found.index + found[0].length);
  const next = new RegExp(`^#{1,${level}}\\s`, 'm').exec(rest);
  const text = (next === null ? rest : rest.slice(0, next.index)).trim();
  return text === '' ? null : text;
}

export type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'code'; text: string };

/**
 * A skill's instructions as blocks: headings, paragraphs, lists and code. Each block's text is shown
 * through text interpolation, so nothing in a third party's file becomes markup.
 */
export function blocks(body: string): Block[] {
  const out: Block[] = [];
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  let paragraph: string[] = [];
  let items: string[] | null = null;
  const flush = () => {
    if (paragraph.length > 0)
      out.push({ kind: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
    if (items !== null) out.push({ kind: 'list', items });
    items = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) {
      flush();
      const fence = line.trim().slice(0, 3);
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) {
        code.push(lines[i]);
        i++;
      }
      out.push({ kind: 'code', text: code.join('\n') });
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      out.push({
        kind: 'heading',
        level: heading[1].length,
        text: heading[2].trim(),
      });
      continue;
    }
    const item = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (item) {
      if (paragraph.length > 0) {
        out.push({ kind: 'paragraph', text: paragraph.join(' ') });
        paragraph = [];
      }
      items = [...(items ?? []), item[1].trim()];
      continue;
    }
    if (line.trim() === '') {
      flush();
      continue;
    }
    if (items !== null && /^\s+\S/.test(line)) {
      items[items.length - 1] += ' ' + line.trim();
      continue;
    }
    if (items !== null) flush();
    paragraph.push(line.trim());
  }
  flush();
  return out;
}

/** The `*-help` skill of a set, if it has one: where to start. */
export function helpSkill(entries: readonly GuideEntry[]): string | null {
  return (
    entries
      .filter((entry) => entry.kind === 'skill' && /-help$/.test(entry.name))
      .map((entry) => entry.name)
      .sort()[0] ?? null
  );
}

const SET_ORDER: Record<GuideSetKind, number> = {
  gsd: 0,
  plugin: 1,
  account: 2,
  bundle: 3,
  system: 4,
  repos: 5,
};

export interface TreeSet {
  set: GuideSet;
  count: number;
}

export interface Tree {
  mine: number;
  sets: TreeSet[];
  agents: number;
}

/** What the tree shows for one tool: the owner's own, each set that holds something, agents. */
export function treeOf(guide: Guide | null, tool: ArsenalProvider): Tree {
  if (guide === null) return { mine: 0, sets: [], agents: 0 };
  const own = guide.entries.filter((entry) => entry.tool === tool);
  const count = (set: string) => own.filter((e) => e.set === set).length;
  const sets = guide.sets
    .filter((set) => set.tool === tool)
    .map((set) => ({ set, count: count(set.key) }))
    .filter((row) => row.count > 0)
    .sort(
      (a, b) =>
        SET_ORDER[a.set.kind] - SET_ORDER[b.set.kind] ||
        a.set.name.localeCompare(b.set.name),
    );
  return { mine: count('mine'), sets, agents: count('agents') };
}

export interface OriginRow {
  origin: Origin;
  count: number;
  /** The sets it gathers, in tree order; empty for the owner's own. */
  sets: TreeSet[];
}

/** The tree by origin for one tool: only origins that hold something, in `ORIGINS` order. */
export function originsOf(tree: Tree): OriginRow[] {
  return ORIGINS.map((origin) => {
    if (origin === 'mine') return { origin, count: tree.mine, sets: [] };
    const sets = tree.sets.filter((row) => ORIGIN_OF[row.set.kind] === origin);
    return {
      origin,
      count: sets.reduce((n, row) => n + row.count, 0),
      sets,
    };
  }).filter((row) => row.count > 0);
}

/** Whether an entry matches what was typed in the search box: its name or its description. */
export function matches(entry: GuideEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return (
    entry.name.toLowerCase().includes(q) ||
    entry.description.toLowerCase().includes(q)
  );
}

export function entriesOf(
  guide: Guide | null,
  tool: ArsenalProvider,
  set: string,
): GuideEntry[] {
  return (guide?.entries ?? [])
    .filter((entry) => entry.tool === tool && entry.set === set)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The owner's own skills by category, in screen order; only categories that hold something. */
export function byCategory(
  entries: readonly GuideEntry[],
): { group: string; entries: GuideEntry[] }[] {
  return GROUPS.map((group) => ({
    group: group as string,
    entries: entries.filter(
      (entry) =>
        groupFor({
          name: entry.name,
          kind: entry.kind,
          description: entry.description,
        }) === group,
    ),
  })).filter((row) => row.entries.length > 0);
}

/** What each configuration page of Arsenal shows of the agent's own files. */
export const CONFIG_KINDS: Record<
  'global' | 'hooks' | 'mcp',
  readonly ItemKind[]
> = {
  global: ['rule_file', 'model_preference', 'plugin'],
  hooks: ['hook'],
  mcp: ['mcp_server'],
};
