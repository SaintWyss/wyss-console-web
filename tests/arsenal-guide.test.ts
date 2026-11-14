import { describe, expect, it } from 'vitest';
import {
  blocks,
  byCategory,
  entriesOf,
  firstSentence,
  helpSkill,
  splitDescription,
  treeOf,
  usageSection,
} from '../src/lib/features/arsenal/guide';
import {
  parseGuide,
  type Guide,
  type GuideEntry,
} from '../src/lib/contracts/arsenal';

const entry = (over: Partial<GuideEntry>): GuideEntry => ({
  id: over.name ?? 'x',
  tool: 'claude_code',
  kind: 'skill',
  name: 'x',
  description: '',
  set: 'mine',
  origin: '~/.claude/skills/x',
  linked_to: null,
  scope: 'claude',
  codex_differs: false,
  unreadable: null,
  description_cut: false,
  ...over,
});

describe('splitDescription', () => {
  it('splits at Use when and Do not use', () => {
    expect(
      splitDescription(
        'Reviews diffs. Use when a PR is ready. Do not use for drafts.',
      ),
    ).toEqual({
      what: 'Reviews diffs.',
      when: 'Use when a PR is ready.',
      whenNot: 'Do not use for drafts.',
    });
  });
  it('reads the Spanish markers and SKIP', () => {
    const split = splitDescription(
      'Diseña loops. Úsalo cuando el usuario diga "/loops". SKIP si es una vez.',
    );
    expect(split.what).toBe('Diseña loops.');
    expect(split.when).toBe('Úsalo cuando el usuario diga "/loops".');
    expect(split.whenNot).toBe('SKIP si es una vez.');
    expect(splitDescription('Hace X. Usala cuando Y.').when).toBe(
      'Usala cuando Y.',
    );
  });
  it('reads "No usar" as do-not-use', () => {
    expect(
      splitDescription('Método X. No usar si la causa se conoce.'),
    ).toEqual({
      what: 'Método X.',
      when: null,
      whenNot: 'No usar si la causa se conoce.',
    });
  });
  it('finds a marker past 500 characters', () => {
    const long = 'A'.repeat(600) + '. Use when needed.';
    expect(splitDescription(long).when).toBe('Use when needed.');
  });
  it('keeps the whole text when it cannot be split', () => {
    expect(splitDescription('Just a sentence.')).toEqual({
      what: 'Just a sentence.',
      when: null,
      whenNot: null,
    });
    // Nothing before the marker: there is no "what it does" to show apart.
    expect(splitDescription('Use when X.').what).toBe('Use when X.');
    expect(splitDescription('Use when X.').when).toBeNull();
  });
  it('handles Do not use before Use when', () => {
    const split = splitDescription('Does A. Do not use for B. Use when C.');
    expect(split).toEqual({
      what: 'Does A.',
      whenNot: 'Do not use for B.',
      when: 'Use when C.',
    });
  });
});

describe('firstSentence', () => {
  it('stops at the first full stop or line break', () => {
    expect(firstSentence('One. Two.')).toBe('One.');
    expect(firstSentence('v1.2 is out. Next.')).toBe('v1.2 is out.');
    expect(firstSentence('No stop')).toBe('No stop');
    expect(firstSentence('Line\nnext')).toBe('Line');
  });
});

describe('usageSection', () => {
  it('reads the text under a usage heading until the next heading', () => {
    const body =
      '# T\n\nIntro\n\n## Cómo se usa\n\n`/x` y listo.\n\n## Otro\n\nNo.';
    expect(usageSection(body)).toBe('`/x` y listo.');
    expect(usageSection('## Usage\nRun it\n### Detail\nmore\n## End')).toBe(
      'Run it\n### Detail\nmore',
    );
    expect(usageSection('## When to Use\nAlways')).toBe('Always');
  });
  it('is null without one, or when it is empty', () => {
    expect(usageSection('# T\n## Steps\n1. a')).toBeNull();
    expect(usageSection('## Usage\n\n## Next')).toBeNull();
  });
});

describe('blocks', () => {
  it('cuts headings, paragraphs, lists and code, keeping markup as text', () => {
    const out = blocks(
      '# Title\nSome <b>text</b>\ncontinued.\n\n- one\n- two\n  more\n\n```sh\n<script>x</script>\n```\n<img src=x onerror=alert(1)>',
    );
    expect(out).toEqual([
      { kind: 'heading', level: 1, text: 'Title' },
      { kind: 'paragraph', text: 'Some <b>text</b> continued.' },
      { kind: 'list', items: ['one', 'two more'] },
      { kind: 'code', text: '<script>x</script>' },
      { kind: 'paragraph', text: '<img src=x onerror=alert(1)>' },
    ]);
  });
  it('closes an unterminated fence at the end', () => {
    expect(blocks('```\ncode')).toEqual([{ kind: 'code', text: 'code' }]);
  });
});

describe('tree', () => {
  const guide: Guide = {
    entries: [
      entry({ name: 'loops' }),
      entry({ name: 'gsd-help', set: 'gsd:claude_code' }),
      entry({ name: 'gsd-plan', set: 'gsd:claude_code' }),
      entry({ name: 'taste', set: 'repos:claude_code' }),
      entry({ name: 'planner', kind: 'agent', set: 'agents' }),
      entry({ name: 'qa', tool: 'codex', set: 'mine' }),
    ],
    sets: [
      {
        key: 'repos:claude_code',
        tool: 'claude_code',
        kind: 'repos',
        name: 'Git repos',
        version: '',
        description: '',
      },
      {
        key: 'gsd:claude_code',
        tool: 'claude_code',
        kind: 'gsd',
        name: 'GSD Core',
        version: '1.15.0',
        description: '',
      },
      {
        key: 'plugin:claude_code:empty',
        tool: 'claude_code',
        kind: 'plugin',
        name: 'empty',
        version: '',
        description: '',
      },
    ],
    truncated: false,
  };
  it('counts each part for one tool, sets in order, empty ones hidden', () => {
    const tree = treeOf(guide, 'claude_code');
    expect(tree.mine).toBe(1);
    expect(tree.agents).toBe(1);
    expect(tree.sets.map((row) => [row.set.name, row.count])).toEqual([
      ['GSD Core', 2],
      ['Git repos', 1],
    ]);
    expect(treeOf(guide, 'codex').mine).toBe(1);
    expect(treeOf(null, 'codex').sets).toEqual([]);
  });
  it('finds where to start in a set', () => {
    expect(helpSkill(entriesOf(guide, 'claude_code', 'gsd:claude_code'))).toBe(
      'gsd-help',
    );
    expect(
      helpSkill(entriesOf(guide, 'claude_code', 'repos:claude_code')),
    ).toBe(null);
  });
  it('groups the owner’s skills by category', () => {
    const rows = byCategory([
      entry({ name: 'loops' }),
      entry({ name: 'zzz-unknown' }),
    ]);
    expect(rows.map((row) => row.group)).toEqual(['planning', 'other']);
  });
});

describe('parseGuide', () => {
  it('reads the desktop reply and refuses another shape', () => {
    const reply = {
      entries: [entry({ name: 'a', linked_to: '~/x' })],
      sets: [],
      truncated: false,
    };
    expect(parseGuide(reply).entries[0].linked_to).toBe('~/x');
    expect(() =>
      parseGuide({
        ...reply,
        entries: [{ ...reply.entries[0], scope: 'all' }],
      }),
    ).toThrow();
  });
});
