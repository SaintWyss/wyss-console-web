import { describe, expect, it } from 'vitest';
import type { LibraryItem } from '../src/lib/contracts/arsenal';
import {
  DEFAULT_CODEX_SPEC,
  DEFAULT_SPEC,
} from '../src/lib/features/arsenal/environment';
import {
  eventText,
  groupHooksByMoment,
  groupLaunches,
  groupSkills,
  launchChangesNothing,
  matcherText,
} from '../src/lib/features/workspace/model';
import type { Launch } from '../src/lib/desktop/launch-client';

const libraryItem = (name: string): LibraryItem =>
  ({
    id: name,
    name,
    kind: 'skill',
    provider: 'claude_code',
    description: `${name} description`,
  }) as LibraryItem;

describe('Workspace presentation model', () => {
  it('lists command launches under System before session launches under Agents', () => {
    const launches = [
      { id: 'agent', kind: 'session', name: 'My agent' },
      { id: 'command', kind: 'commands', name: 'Update system' },
    ] as Launch[];
    expect(groupLaunches(launches, '')).toEqual({
      system: [launches[1]],
      agents: [launches[0]],
    });
    expect(groupLaunches(launches, 'UPDATE')).toEqual({
      system: [launches[1]],
      agents: [],
    });
  });

  it('groups skills by Arsenal sections and category, and adds account skills as their own category', () => {
    const sections = groupSkills(
      [
        libraryItem('combo'),
        libraryItem('frontend-design'),
        libraryItem('cachyos-kde-workstation'),
        libraryItem('tutor'),
        libraryItem('bespoke-topic'),
      ],
      ['claude-account-skill'],
    );
    expect(sections.map((section) => section.label)).toEqual([
      'General',
      'By type of work',
      'Environment',
      'Own topics',
    ]);
    expect(sections[0].categories.map((category) => category.label)).toEqual([
      'Planning and method',
    ]);
    expect(sections[1].categories.map((category) => category.label)).toEqual([
      'Design and interface',
    ]);
    expect(sections[2].categories.map((category) => category.label)).toEqual([
      'System and setup',
      'Claude account',
    ]);
    expect(sections[3].categories.map((category) => category.label)).toEqual([
      'Study and knowledge',
      'Other',
    ]);
    expect(sections[2].categories[1].entries[0].account).toBe(true);
  });

  it('groups hook rows by moment and script and translates trigger words', () => {
    const sections = groupHooksByMoment([
      {
        key: 'a',
        event: 'PostToolUse',
        matcher: 'Read',
        command: 'node /x/report.mjs',
      },
      {
        key: 'b',
        event: 'SessionStart',
        matcher: '',
        command: 'python /x/setup.py',
      },
      {
        key: 'c',
        event: 'PreToolUse',
        matcher: 'Bash',
        command: 'node /x/gate.js',
      },
      {
        key: 'd',
        event: 'PreToolUse',
        matcher: 'Write',
        command: 'node /x/gate.js',
      },
      {
        key: 'e',
        event: 'PreToolUse',
        matcher: 'Edit',
        command: 'node /x/gate.js',
      },
    ]);
    expect(sections.map((section) => section.event)).toEqual([
      'SessionStart',
      'PreToolUse',
      'PostToolUse',
    ]);
    expect(sections[1].rows).toEqual([
      expect.objectContaining({
        script: 'gate.js',
        matchers: ['Bash', 'Write', 'Edit'],
        hooks: [
          expect.objectContaining({ key: 'c' }),
          expect.objectContaining({ key: 'd' }),
          expect.objectContaining({ key: 'e' }),
        ],
      }),
    ]);
    expect(sections[1].rows[0].hooks).toHaveLength(3);
    expect(matcherText('')).toBe('Always');
    expect(matcherText('Bash')).toBe('Commands');
    expect(matcherText('Write')).toBe('Writing/editing');
    expect(matcherText('Read')).toBe('Reading files');
    expect(matcherText('Task')).toBe('Agents');
    expect(eventText('SessionStart')).toBe('When the session starts');
  });

  it('recognizes launches that use their complete provider configuration', () => {
    expect(launchChangesNothing('claude_code', DEFAULT_SPEC, null)).toBe(true);
    expect(launchChangesNothing('codex', null, DEFAULT_CODEX_SPEC)).toBe(true);
    expect(launchChangesNothing('claude_code', null, null)).toBe(false);
    expect(
      launchChangesNothing(
        'claude_code',
        { ...DEFAULT_SPEC, instructions: false },
        null,
      ),
    ).toBe(false);
  });
});
