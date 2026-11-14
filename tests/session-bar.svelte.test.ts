import { afterEach, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import SessionBar from '../src/lib/features/terminal/SessionBar.svelte';
import { agentPart, gitParts } from '../src/lib/features/terminal/session-bar';
import {
  parseSessionGit,
  type SessionGit,
} from '../src/lib/contracts/terminal';
import type { TerminalSession } from '../src/lib/features/terminal/session-manager';

let component: ReturnType<typeof mount> | undefined;
afterEach(() => {
  if (component) void unmount(component);
  component = undefined;
  document.body.replaceChildren();
  vi.useRealTimers();
});

const words = (git: SessionGit | null) =>
  gitParts(git, '/start').map((p) => ({
    key: p.key,
    text: p.phrase.text,
    values: p.phrase.values,
    tone: p.tone,
  }));

it('reads what the desktop answers, and anything else as unknown', () => {
  expect(
    parseSessionGit({
      kind: 'repo',
      dir: '/home/me/x',
      home: '/home/me',
      branch: 'main',
      changes: 3,
      ahead: 2,
      truncated: false,
    }),
  ).toEqual({
    kind: 'repo',
    dir: '/home/me/x',
    home: '/home/me',
    branch: 'main',
    changes: 3,
    ahead: 2,
    truncated: false,
  });
  expect(parseSessionGit({ kind: 'no_repo', dir: '/tmp' }).kind).toBe(
    'no_repo',
  );
  for (const bad of [
    null,
    'repo',
    {
      kind: 'repo',
      dir: '/x',
      branch: 1,
      changes: 0,
      ahead: null,
      truncated: false,
    },
    {
      kind: 'repo',
      dir: '/x',
      branch: 'm',
      changes: -1,
      ahead: null,
      truncated: false,
    },
    {
      kind: 'repo',
      dir: '/x',
      branch: 'm',
      changes: 0,
      ahead: 'x',
      truncated: false,
    },
    { kind: 'repo', dir: '/x', branch: 'm', changes: 0, ahead: null },
    { kind: 'other', dir: '/x' },
  ])
    expect(parseSessionGit(bad).kind, JSON.stringify(bad)).toBe('unknown');
});

it('says all committed, N changes, N not pushed, no git, and only the folder when unknown', () => {
  const repo = (over: Partial<SessionGit & { kind: 'repo' }>): SessionGit => ({
    kind: 'repo',
    dir: '/home/me/repo',
    home: '/home/me',
    branch: 'main',
    changes: 0,
    ahead: 0,
    truncated: false,
    ...over,
  });
  expect(words(repo({}))).toEqual([
    {
      key: 'folder',
      text: '{folder}',
      values: { folder: '~/repo' },
      tone: undefined,
    },
    {
      key: 'branch',
      text: '{branch}',
      values: { branch: 'main' },
      tone: undefined,
    },
    { key: 'changes', text: '✓ all committed', values: undefined, tone: 'ok' },
  ]);
  expect(words(repo({ changes: 1 }))[2]).toMatchObject({
    text: '● 1 change not committed',
    tone: 'warn',
  });
  expect(words(repo({ changes: 4, truncated: true }))[2]).toMatchObject({
    text: '● {count} changes not committed',
    values: { count: '4+' },
  });
  expect(words(repo({ ahead: 2 }))[3]).toMatchObject({
    key: 'ahead',
    text: '↑{count} not pushed',
    values: { count: 2 },
  });
  // No upstream: nothing is said about pushing.
  expect(words(repo({ ahead: null })).map((w) => w.key)).toEqual([
    'folder',
    'branch',
    'changes',
  ]);
  expect(words(repo({ branch: null }))[1].text).toBe('detached HEAD');
  expect(words({ kind: 'no_repo', dir: '/tmp/x' }).map((w) => w.key)).toEqual([
    'folder',
    'nogit',
  ]);
  // Unknown is not "no git": only the folder, where the terminal started.
  expect(words({ kind: 'unknown', dir: null })).toEqual([
    {
      key: 'folder',
      text: '{folder}',
      values: { folder: '/start' },
      tone: undefined,
    },
  ]);
});

it('names a plain terminal, and a native agent with the permission it was started with', () => {
  expect(agentPart(undefined).kind.text).toBe('Terminal');
  const native = (profile: string | null) => ({
    sessionId: 's',
    agent: 'Codex',
    project: '/p',
    profile,
    throughShell: false,
  });
  expect(agentPart(native('Full access (bypass)'))).toEqual({
    kind: { text: 'Native · {agent}', values: { agent: 'Codex' } },
    detail: { text: 'Full access' },
  });
  expect(agentPart(native('Strict')).detail).toEqual({
    text: 'Ask before acting',
  });
  expect(agentPart(native('Review, read only')).detail).toEqual({
    text: 'Read only',
  });
  expect(agentPart(native('Accept edits')).detail).toEqual({
    text: 'Accept edits',
  });
  // Started as configured: nothing is said, whether the host recorded no profile or that template.
  expect(agentPart(native(null)).detail).toBeNull();
  expect(agentPart(native('As configured')).detail).toBeNull();
  // A session started with a profile saved before profiles were removed keeps its name.
  expect(agentPart(native('Revisión')).detail).toEqual({
    text: 'Profile {name}',
    values: { name: 'Revisión' },
  });
  // A name that is also a property of every object is a name, not a template.
  expect(agentPart(native('toString')).detail).toEqual({
    text: 'Profile {name}',
    values: { name: 'toString' },
  });
});

const session = (id: string, cwd = '/home/me/a'): TerminalSession =>
  ({
    id,
    title: 'Terminal',
    view: { state: 'running', info: { terminal_id: id, cwd } },
  }) as unknown as TerminalSession;

it('asks for the focused terminal only, and drops an answer that arrives after the focus moved', async () => {
  const answers = new Map<string, (git: SessionGit) => void>();
  const read = vi.fn(
    (id: string) =>
      new Promise<SessionGit>((resolve) => answers.set(id, resolve)),
  );
  const props = $state({
    session: session('t-1'),
    read,
  });
  component = mount(SessionBar, { target: document.body, props });
  flushSync();
  expect(read).toHaveBeenCalledWith('t-1');
  props.session = session('t-2', '/home/me/b');
  flushSync();
  // The answer about t-1 comes late: it is not shown on t-2.
  answers.get('t-1')!({
    kind: 'repo',
    dir: '/home/me/a',
    branch: 'old',
    changes: 9,
    ahead: null,
    truncated: false,
  });
  await tick();
  await tick();
  expect(document.body.textContent).not.toContain('old');
  expect(read).toHaveBeenLastCalledWith('t-2');
  answers.get('t-2')!({ kind: 'no_repo', dir: '/home/me/b' });
  await tick();
  await tick();
  expect(document.querySelector('.session-bar')?.textContent).toContain(
    'no git',
  );
  expect(document.querySelector('.session-bar')?.textContent).toContain(
    '/home/me/b',
  );
});

it('waits longer before asking again where git ran past its limit', async () => {
  vi.useFakeTimers();
  const read = vi.fn(() =>
    Promise.resolve<SessionGit>({ kind: 'unknown', dir: '/big', slow: true }),
  );
  component = mount(SessionBar, {
    target: document.body,
    props: {
      session: session('t-1'),
      read,
      every: 100,
      slowEvery: 1000,
    },
  });
  flushSync();
  await vi.advanceTimersByTimeAsync(10);
  expect(read).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(500);
  expect(read).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(700);
  expect(read).toHaveBeenCalledTimes(2);
});
