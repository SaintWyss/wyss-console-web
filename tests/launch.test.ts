import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ENVIRONMENT_UNREADABLE,
  isFullAccess,
  LaunchRefusal,
  openLaunch,
  type LaunchDeps,
  type SelectionName,
} from '../src/lib/features/terminal/launch';
import type { Launch } from '../src/lib/desktop/launch-client';
import {
  PERMISSIONS,
  permissionProfileId,
  permissionsFor,
  profilePermission,
  type StartReply,
} from '../src/lib/contracts/native';
import { t, setLanguage } from '../src/lib/i18n/index.svelte';
import { parseTerminalPlan } from '../src/lib/contracts/arsenal';
import { ES } from '../src/lib/i18n/es';
import {
  failureText,
  HOME_FOLDER_REFUSED,
} from '../src/lib/features/native/present';

// A note is a sentence and its values; the terminal view draws it through t(), and so do these.
const shown = (note: {
  text: string;
  values?: Record<string, string | number>;
}) => t(note.text, note.values);
afterEach(() => setLanguage('en'));

const session = (
  over: Partial<Extract<Launch, { kind: 'session' }>> = {},
): Launch => ({
  id: 'codex',
  name: 'Codex',
  directory: '/home/me',
  kind: 'session',
  agent: 'codex',
  permission: 'bypass',
  before: ['scan'],
  preset: null,
  ...over,
});
const selectionOf = (
  id: string,
  name: string,
  provider: 'claude_code' | 'codex',
): SelectionName => ({ id, name, provider });
function deps(
  launch: Launch,
  before = [{ command: 'scan', result: 'ok' }],
  {
    selection = null as string | null,
    canApply = true,
    canStart = true,
    codexEnvironment = null as {
      instructions: boolean;
      hooks_off: string[];
    } | null,
    presetId = 'sel-preset' as string | null,
    selections = null as SelectionName[] | null,
  } = {},
) {
  const reply = { session: { id: 's1' } } as unknown as StartReply;
  // By default one Codex selection named Estudio exists, with the id presetId (none when null).
  const named: SelectionName[] =
    selections ?? (presetId ? [selectionOf(presetId, 'Estudio', 'codex')] : []);
  const d: LaunchDeps = {
    getLaunch: vi.fn(async () => launch),
    runBefore: vi.fn(async () => before),
    remembered: vi.fn(async () => selection),
    selections: vi.fn(async () => named),
    plan: vi.fn(
      async () =>
        ({
          selection: 'sel-1',
          selection_name: 'Work',
          config_hash: 'hash-1',
          can_apply: canApply,
          enforcement: { reason: 'Codex 0.1 is not qualified.' },
          codex_environment: codexEnvironment,
        }) as never,
    ),
    bind: vi.fn(async () => ({
      state: canApply ? ('applied' as const) : ('not_applied' as const),
      selection_name: 'Work',
    })),
    preview: vi.fn(
      async () =>
        ({
          plan_token: 'tok',
          provider_version: 'codex-cli 0.159.0',
          can_start: canStart,
        }) as never,
    ),
    start: vi.fn(async () => reply),
    openTerminal: vi.fn(),
    openNative: vi.fn(),
  };
  return { d, reply };
}

describe('openLaunch', () => {
  it('a commands launch opens a terminal with each command typed and Enter after it', async () => {
    const { d } = deps({
      id: 'up',
      name: 'Actualizar sistema',
      directory: '/home/me',
      kind: 'commands',
      commands: ['sudo -v', 'sysupdate'],
      variants: [],
      active: null,
      template: null,
    });
    expect(await openLaunch('up', d)).toEqual({ notes: [] });
    expect(d.getLaunch).toHaveBeenCalledWith('up');
    expect(d.openTerminal).toHaveBeenCalledWith(
      'Actualizar sistema',
      '/home/me',
      'sudo -v\rsysupdate\r',
    );
    expect(d.runBefore).not.toHaveBeenCalled();
    expect(d.start).not.toHaveBeenCalled();
  });

  it('a commands launch with nothing for this distribution opens no terminal and says why', async () => {
    const { d } = deps({
      id: 'up',
      name: 'Actualizar sistema',
      directory: '/home/me',
      kind: 'commands',
      commands: [],
      variants: [
        { distro: 'fedora', commands: ['dnf'], options: [], manual: false },
      ],
      active: null,
      template: 'system-update',
    });
    await expect(openLaunch('up', d)).rejects.toThrow(
      'no commands for this distribution',
    );
    expect(d.openTerminal).not.toHaveBeenCalled();
  });

  it('a session launch runs before, previews its permission as its template and starts with that plan', async () => {
    const { d, reply } = deps(session());
    expect(await openLaunch('codex', d)).toEqual({ notes: [] });
    expect(d.runBefore).toHaveBeenCalledWith('codex');
    expect(d.preview).toHaveBeenCalledWith(
      'codex',
      'template-full-access',
      null,
    );
    expect(d.start).toHaveBeenCalledWith(
      'codex',
      '/home/me',
      'template-full-access',
      expect.objectContaining({ plan_token: 'tok' }),
      null,
    );
    expect(d.bind).not.toHaveBeenCalled();
    expect(d.openNative).toHaveBeenCalledWith(reply);
    expect(d.openTerminal).not.toHaveBeenCalled();
  });

  it('a before command that fails is said, and the agent still starts', async () => {
    const { d } = deps(session(), [{ command: 'scan', result: 'exit 7' }]);
    const opened = await openLaunch('codex', d);
    expect(opened.notes).toHaveLength(1);
    expect(shown(opened.notes[0])).toContain('exit 7');
    expect(d.start).toHaveBeenCalled();
  });

  it('the preset a launch names wins over the one its folder remembers', async () => {
    const { d } = deps(session({ preset: 'Estudio' }), undefined, {
      selection: 'sel-remembered',
    });
    await openLaunch('codex', d);
    expect(d.selections).toHaveBeenCalled();
    expect(d.remembered).not.toHaveBeenCalled();
    expect(d.plan).toHaveBeenCalledWith('sel-preset', 'codex', '/home/me');
  });

  it('a launch with no preset keeps the one its folder remembers', async () => {
    const { d } = deps(session(), undefined, { selection: 'sel-remembered' });
    await openLaunch('codex', d);
    expect(d.selections).not.toHaveBeenCalled();
    expect(d.plan).toHaveBeenCalledWith('sel-remembered', 'codex', '/home/me');
  });

  it('a preset with no name for this agent stops the launch before anything runs, and says which', async () => {
    const { d } = deps(session({ preset: 'Missing' }), undefined, {
      presetId: null,
    });
    const refusal = await openLaunch('codex', d).catch(
      (error: unknown) => error,
    );
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    expect((refusal as Error).message).toContain('Missing');
    // The sentence and its values reach the view, which draws them through t().
    const { template, values } = refusal as LaunchRefusal;
    expect(template).toContain('{name}');
    expect(values).toEqual({ name: 'Missing' });
    expect(d.runBefore).not.toHaveBeenCalled();
    expect(d.plan).not.toHaveBeenCalled();
    expect(d.start).not.toHaveBeenCalled();
  });

  it('two selections of this agent with the preset name stop the launch before anything runs, and say to delete the extra ones', async () => {
    const { d } = deps(session({ preset: 'Estudio' }), undefined, {
      selections: [
        selectionOf('a', 'Estudio', 'codex'),
        selectionOf('b', 'Estudio', 'codex'),
      ],
    });
    const refusal = await openLaunch('codex', d).catch(
      (error: unknown) => error,
    );
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    // Its own sentence, not the "no preset" one: the owner has one too many, not none.
    const { template, values } = refusal as LaunchRefusal;
    expect(template).toContain('More than one preset');
    expect(template).toContain('Arsenal › Presets');
    expect(template).not.toContain('No preset named');
    expect(values).toEqual({ name: 'Estudio' });
    expect(ES[template]).toBeDefined();
    setLanguage('es');
    expect(shown({ text: template, values })).toContain('Arsenal › Presets');
    expect(d.runBefore).not.toHaveBeenCalled();
    expect(d.plan).not.toHaveBeenCalled();
    expect(d.start).not.toHaveBeenCalled();
  });

  it('routes a preset that cannot be applied with this permission to Workspace in a translated refusal', async () => {
    const { d } = deps(session({ preset: 'Estudio' }), undefined, {
      canStart: false,
    });
    const refusal = await openLaunch('codex', d).catch(
      (error: unknown) => error,
    );

    expect(refusal).toBeInstanceOf(LaunchRefusal);
    const { template, values } = refusal as LaunchRefusal;
    expect(template).toContain('Workspace');
    expect(template).not.toContain('Agents');
    expect(values).toEqual({ name: 'Work' });
    expect(ES[template]).toBeDefined();
    setLanguage('es');
    expect(shown({ text: template, values })).toContain('Workspace');
    expect(shown({ text: template, values })).not.toContain('Agents');
    expect(d.start).not.toHaveBeenCalled();
    expect(d.openNative).not.toHaveBeenCalled();
  });

  it('a same-named preset of the other agent is not a second match', async () => {
    const { d } = deps(session({ preset: 'Estudio' }), undefined, {
      selections: [
        selectionOf('a', 'Estudio', 'claude_code'),
        selectionOf('b', 'Estudio', 'codex'),
      ],
    });
    await openLaunch('codex', d);
    expect(d.plan).toHaveBeenCalledWith('b', 'codex', '/home/me');
  });

  it('each permission a launch names is sent as its fixed template', async () => {
    for (const [permission, template] of [
      ['ask', 'template-strict'],
      ['read_only', 'template-review'],
      ['bypass', 'template-full-access'],
    ] as const) {
      const { d } = deps(session({ permission }));
      await openLaunch('codex', d);
      expect(d.preview).toHaveBeenCalledWith('codex', template, null);
      expect(d.start).toHaveBeenCalledWith(
        'codex',
        '/home/me',
        template,
        expect.objectContaining({ plan_token: 'tok' }),
        null,
      );
    }
    const { d } = deps(session({ agent: 'claude_code', permission: 'edits' }));
    await openLaunch('codex', d);
    expect(d.preview).toHaveBeenCalledWith(
      'claude_code',
      'template-edits',
      null,
    );
    expect(d.start).toHaveBeenCalledWith(
      'claude_code',
      '/home/me',
      'template-edits',
      expect.anything(),
      null,
    );
  });

  it('no permission starts the agent as configured', async () => {
    const { d } = deps(session({ permission: null }));
    await openLaunch('codex', d);
    expect(d.preview).toHaveBeenCalledWith('codex', null, null);
    expect(d.start).toHaveBeenCalledWith(
      'codex',
      '/home/me',
      null,
      expect.anything(),
      null,
    );
  });
});

describe('a session launch and the Arsenal selection its folder remembers', () => {
  const start = {
    selection: 'sel-1',
    config_hash: 'hash-1',
    project: '/home/me',
  };
  it('applies it when it can: the preview and the start carry it, and the terminal is bound', async () => {
    const { d, reply } = deps(session(), undefined, { selection: 'sel-1' });
    const opened = await openLaunch('codex', d);
    expect(d.remembered).toHaveBeenCalledWith('/home/me', 'codex');
    expect(d.plan).toHaveBeenCalledWith('sel-1', 'codex', '/home/me');
    expect(d.preview).toHaveBeenCalledWith(
      'codex',
      'template-full-access',
      start,
    );
    expect(d.start).toHaveBeenCalledWith(
      'codex',
      '/home/me',
      'template-full-access',
      expect.anything(),
      start,
    );
    expect(d.bind).toHaveBeenCalledWith(reply.session.id, 'sel-1', 'hash-1');
    expect(opened.notes.map(shown)).toContain('Started with Work applied.');
  });
  it('records it without applying when the plan cannot apply', async () => {
    const { d } = deps(session(), undefined, {
      selection: 'sel-1',
      canApply: false,
    });
    const opened = await openLaunch('codex', d);
    expect(d.preview).toHaveBeenCalledWith(
      'codex',
      'template-full-access',
      null,
    );
    expect(d.start).toHaveBeenCalledWith(
      'codex',
      '/home/me',
      'template-full-access',
      expect.anything(),
      null,
    );
    expect(d.bind).toHaveBeenCalled();
    expect(opened.notes.map(shown).join(' ')).toContain('recorded');
  });
  it('does not start when the preset leaves a Codex hook out and cannot be applied, and says why', async () => {
    const { d } = deps(session(), undefined, {
      selection: 'sel-1',
      canApply: false,
      codexEnvironment: { instructions: true, hooks_off: ['0123456789abcdef'] },
    });
    const refusal = await openLaunch('codex', d).catch((e: unknown) => e);
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    const { template, values } = refusal as LaunchRefusal;
    const text = t(template, values);
    expect(text).toContain('Work');
    expect(text).toContain('Codex 0.1 is not qualified.');
    expect(text).toContain('Nothing was started');
    // Nothing ran and nothing started: not the before commands, not the agent, not a record.
    expect(d.runBefore).not.toHaveBeenCalled();
    expect(d.preview).not.toHaveBeenCalled();
    expect(d.start).not.toHaveBeenCalled();
    expect(d.bind).not.toHaveBeenCalled();
  });
  it('still records an unapplied preset that changes no Codex environment', async () => {
    // Control: the same plan without a Codex environment starts as before.
    const { d } = deps(session(), undefined, {
      selection: 'sel-1',
      canApply: false,
      codexEnvironment: null,
    });
    await openLaunch('codex', d);
    expect(d.start).toHaveBeenCalled();
  });
  it('starts a Codex environment preset when it can be applied', async () => {
    const { d } = deps(session(), undefined, {
      selection: 'sel-1',
      canApply: true,
      codexEnvironment: { instructions: false, hooks_off: [] },
    });
    await openLaunch('codex', d);
    expect(d.start).toHaveBeenCalled();
  });
  it('does not start when the applied preview cannot start', async () => {
    const { d } = deps(session(), undefined, {
      selection: 'sel-1',
      canStart: false,
    });
    await expect(openLaunch('codex', d)).rejects.toThrow('Work');
    expect(d.start).not.toHaveBeenCalled();
  });

  it('does not claim nothing ran when before commands preceded a permission refusal', async () => {
    const { d } = deps(session(), undefined, {
      selection: 'sel-1',
      canStart: false,
    });
    const refusal = (await openLaunch('codex', d).catch(
      (error: unknown) => error,
    )) as LaunchRefusal;
    expect(d.runBefore).toHaveBeenCalledOnce();
    expect(d.start).not.toHaveBeenCalled();
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    expect(t(refusal.template, refusal.values)).toContain(
      'The agent was not started.',
    );
    expect(t(refusal.template, refusal.values)).not.toContain(
      'Nothing was started.',
    );
    setLanguage('es');
    expect(t(refusal.template, refusal.values)).toContain(
      'No se inició el agente.',
    );
    expect(t(refusal.template, refusal.values)).not.toContain(
      'No se inició nada.',
    );
  });
});

it('refuses every unappliable custom instruction plan before running commands', async () => {
  const base = {
    selection: 'sel-1',
    selection_name: 'Work',
    provider_version: null,
    project: '/home/me',
    status: 'blocked',
    can_apply: false,
    enforcement: {
      state: 'unqualified',
      reason: 'not qualified',
      evidence: null,
    },
    items: [],
    kept: [],
    excluded: [],
    inherited_off: [],
    excluded_files: [],
    untouched: [],
    composites: [],
    conflicts: [],
    warnings: [],
    overlay: null,
    config_hash: 'hash-1',
  };
  for (const [agent, project] of [
    ['claude_code', 'role'],
    ['claude_code', 'exclude'],
    ['codex', 'exclude'],
  ] as const) {
    const { d } = deps(session({ agent }), undefined, { selection: 'sel-1' });
    const plan = parseTerminalPlan({
      ...base,
      provider: agent,
      launch_instructions: {
        project,
        role: project === 'role' ? 'role text' : '',
      },
    });
    expect(plan).toHaveProperty('launch_instructions', {
      project,
      role: project === 'role' ? 'role text' : '',
    });
    d.plan = vi.fn(async () => plan);
    await expect(openLaunch('codex', d)).rejects.toBeInstanceOf(LaunchRefusal);
    expect(d.runBefore).not.toHaveBeenCalled();
    expect(d.preview).not.toHaveBeenCalled();
    expect(d.start).not.toHaveBeenCalled();
  }
  for (const bad of [
    { project: 'invalid' },
    { project: 'role', role: '' },
    { project: 'exclude' },
    { project: 'load', unexpected: true },
  ]) {
    expect(() =>
      parseTerminalPlan({
        ...base,
        provider: 'codex',
        launch_instructions: bad,
      }),
    ).toThrow();
  }
  const control = deps(session(), undefined, { selection: 'sel-1' });
  control.d.plan = vi.fn(async () =>
    parseTerminalPlan({
      ...base,
      provider: 'codex',
      launch_instructions: { project: 'load' },
    }),
  );
  await openLaunch('codex', control.d);
  expect(control.d.start).toHaveBeenCalled();
  const applied = deps(session(), undefined, { selection: 'sel-1' });
  applied.d.plan = vi.fn(async () =>
    parseTerminalPlan({
      ...base,
      provider: 'codex',
      can_apply: true,
      launch_instructions: { project: 'exclude', role: '' },
    }),
  );
  await openLaunch('codex', applied.d);
  expect(applied.d.start).toHaveBeenCalledWith(
    'codex',
    '/home/me',
    'template-full-access',
    expect.anything(),
    expect.objectContaining({ selection: 'sel-1' }),
  );
});

describe('a permission and the template it is sent as', () => {
  it('maps the five cases: none, ask, read only, edits and bypass', () => {
    expect(permissionProfileId(null)).toBeNull();
    expect(permissionProfileId('ask')).toBe('template-strict');
    expect(permissionProfileId('read_only')).toBe('template-review');
    expect(permissionProfileId('edits')).toBe('template-edits');
    expect(permissionProfileId('bypass')).toBe('template-full-access');
    // One template per permission, none shared.
    expect(new Set(PERMISSIONS.map(permissionProfileId)).size).toBe(
      PERMISSIONS.length,
    );
  });

  it('reads a recorded session back to its permission, and nothing else as one', () => {
    for (const permission of PERMISSIONS)
      expect(profilePermission({ id: permissionProfileId(permission)! })).toBe(
        permission,
      );
    expect(profilePermission(null)).toBeNull();
    // As configured, the template that no longer ships, and a profile the owner had saved.
    expect(profilePermission({ id: 'template-as-configured' })).toBeNull();
    expect(profilePermission({ id: 'template-exploration' })).toBeNull();
    expect(profilePermission({ id: 'a'.repeat(32) })).toBeNull();
  });

  it('offers accept edits only to Claude Code, and nothing to an agent it does not manage', () => {
    expect(permissionsFor('claude_code')).toEqual([
      'ask',
      'read_only',
      'edits',
      'bypass',
    ]);
    expect(permissionsFor('codex')).toEqual(['ask', 'read_only', 'bypass']);
    expect(permissionsFor('opencode')).toEqual([]);
    expect(permissionsFor('hermes')).toEqual([]);
  });
});

it('full access is shown only for a session launch whose permission is bypass', () => {
  expect(isFullAccess(session())).toBe(true);
  for (const permission of ['ask', 'read_only', 'edits', null] as const)
    expect(isFullAccess(session({ permission }))).toBe(false);
  expect(
    isFullAccess({
      id: 'x',
      name: 'x',
      directory: '/',
      kind: 'commands',
      commands: ['ls'],
      variants: [],
      active: null,
      template: null,
    }),
  ).toBe(false);
});

describe('openLaunch when what a preset leaves out cannot be told', () => {
  const refuse = async (code: string) => {
    const { d } = deps(session(), undefined, { selection: 'sel-remembered' });
    d.plan = vi.fn(async () => {
      throw Object.assign(new Error(code), { code });
    });
    const refusal = await openLaunch('codex', d).catch(
      (error: unknown) => error,
    );
    return { d, refusal };
  };

  it('translates unreadable launch instructions and runs nothing', async () => {
    const { d, refusal } = await refuse('role_unreadable');
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    const { template } = refusal as LaunchRefusal;
    setLanguage('en');
    expect(t(template)).toContain('role-instructions.json');
    setLanguage('es');
    expect(t(template)).toContain('role-instructions.json');
    expect(t(template)).not.toBe(template);
    setLanguage('en');
    expect(d.runBefore).not.toHaveBeenCalled();
    expect(d.preview).not.toHaveBeenCalled();
    expect(d.start).not.toHaveBeenCalled();
  });

  it('an environment file that cannot be read refuses the launch and runs nothing before it', async () => {
    const { d, refusal } = await refuse('environment_unreadable');
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    expect((refusal as LaunchRefusal).template).toBe(ENVIRONMENT_UNREADABLE);
    expect(d.plan).toHaveBeenCalled();
    expect(d.runBefore).not.toHaveBeenCalled();
    expect(d.preview).not.toHaveBeenCalled();
    expect(d.start).not.toHaveBeenCalled();
    expect(d.openNative).not.toHaveBeenCalled();
  });

  it('a hook the preset leaves out that hooks.json no longer has refuses it, with the launch name', async () => {
    const { d, refusal } = await refuse('environment_stale');
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    const { template, values } = refusal as LaunchRefusal;
    expect(template).toContain('no longer in hooks.json');
    expect(values).toEqual({ name: 'Codex' });
    expect((refusal as Error).message).toContain('Codex');
    expect(d.runBefore).not.toHaveBeenCalled();
    expect(d.start).not.toHaveBeenCalled();
  });

  it('any other failure of the plan is not turned into a refusal', async () => {
    const { d, refusal } = await refuse('internal');
    expect(refusal).not.toBeInstanceOf(LaunchRefusal);
    expect((refusal as { code?: string }).code).toBe('internal');
    expect(d.runBefore).not.toHaveBeenCalled();
    expect(d.start).not.toHaveBeenCalled();
  });
});

describe('openLaunch in the owner home with a folder of its own', () => {
  const codexEnvironment = { instructions: false, hooks_off: ['k1'] };
  const inHome = (over: Partial<Extract<Launch, { kind: 'session' }>> = {}) =>
    session({ directory: '/home/me', before: ['scan'], ...over });
  const untouched = (d: LaunchDeps) => {
    expect(d.runBefore).not.toHaveBeenCalled();
    expect(d.preview).not.toHaveBeenCalled();
    expect(d.start).not.toHaveBeenCalled();
    expect(d.openNative).not.toHaveBeenCalled();
  };

  it('20: refuses before any command runs, a preview or a start (Codex environment)', async () => {
    const { d } = deps(inHome(), undefined, {
      selection: 'sel-remembered',
      codexEnvironment,
    });
    d.ownerHome = vi.fn(async () => '/home/me');
    const refusal = await openLaunch('codex', d).catch((e: unknown) => e);
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    expect((refusal as LaunchRefusal).template).toBe(HOME_FOLDER_REFUSED);
    untouched(d);
  });

  it('20: the same for a Claude preset that owns its folder, and not for one that does not', async () => {
    const claude = () =>
      inHome({
        id: 'claude',
        agent: 'claude_code' as const,
        permission: 'ask',
      });
    const refused = deps(claude(), undefined, { selection: 'sel-remembered' });
    refused.d.ownerHome = vi.fn(async () => '/home/me');
    refused.d.ownsHome = vi.fn(async () => true);
    const refusal = await openLaunch('claude', refused.d).catch(
      (e: unknown) => e,
    );
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    expect(refused.d.ownsHome).toHaveBeenCalledWith('sel-1');
    untouched(refused.d);
    // Control: the default environment starts in the home.
    const open = deps(claude(), undefined, { selection: 'sel-remembered' });
    open.d.ownerHome = vi.fn(async () => '/home/me');
    open.d.ownsHome = vi.fn(async () => false);
    await openLaunch('claude', open.d);
    expect(open.d.start).toHaveBeenCalledTimes(1);
  });

  it('20 control: a project folder other than the home starts', async () => {
    const { d } = deps(inHome({ directory: '/home/me/app' }), undefined, {
      selection: 'sel-remembered',
      codexEnvironment,
    });
    d.ownerHome = vi.fn(async () => '/home/me');
    await openLaunch('codex', d);
    expect(d.start).toHaveBeenCalledTimes(1);
  });

  it('21: without the optional deps nothing blocks in the window (the host decides)', async () => {
    const { d } = deps(inHome(), undefined, {
      selection: 'sel-remembered',
      codexEnvironment,
    });
    expect(d.ownerHome).toBeUndefined();
    await openLaunch('codex', d);
    expect(d.start).toHaveBeenCalledTimes(1);
    // Claude knows the home but has no way to read the environment: not blocked either.
    const claude = deps(
      inHome({ id: 'claude', agent: 'claude_code' as const }),
      undefined,
      { selection: 'sel-remembered' },
    );
    claude.d.ownerHome = vi.fn(async () => '/home/me');
    await openLaunch('claude', claude.d);
    expect(claude.d.start).toHaveBeenCalledTimes(1);
  });

  it('21: deps that fail or find no home do not block either', async () => {
    const failing = deps(inHome(), undefined, {
      selection: 'sel-remembered',
      codexEnvironment,
    });
    failing.d.ownerHome = vi.fn(async () => {
      throw new Error('launcher unreadable');
    });
    await openLaunch('codex', failing.d);
    expect(failing.d.start).toHaveBeenCalledTimes(1);
    const unknown = deps(inHome(), undefined, {
      selection: 'sel-remembered',
      codexEnvironment,
    });
    unknown.d.ownerHome = vi.fn(async () => null);
    await openLaunch('codex', unknown.d);
    expect(unknown.d.start).toHaveBeenCalledTimes(1);
  });

  it('22: a start the host refuses as arsenal_home_cwd_is_home becomes the same refusal', async () => {
    // The window could not tell (another name of the same folder): no ownerHome here.
    const { d } = deps(inHome({ directory: '/alias/of/home' }), undefined, {
      selection: 'sel-remembered',
      codexEnvironment,
    });
    d.start = vi.fn(async () => {
      throw { failure: { code: 'arsenal_home_cwd_is_home' } };
    });
    const refusal = await openLaunch('codex', d).catch((e: unknown) => e);
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    expect((refusal as LaunchRefusal).template).toBe(HOME_FOLDER_REFUSED);
    expect(d.openNative).not.toHaveBeenCalled();
  });

  it('23: any other start error reaches the caller untouched', async () => {
    for (const error of [
      { failure: { code: 'arsenal_home_failed' } },
      { failure: {} },
      new Error('boom'),
      'text',
    ]) {
      const { d } = deps(inHome(), undefined, {
        selection: 'sel-remembered',
        codexEnvironment,
      });
      d.start = vi.fn(async () => {
        throw error;
      });
      const caught = await openLaunch('codex', d).catch((e: unknown) => e);
      expect(caught).toBe(error);
      expect(caught).not.toBeInstanceOf(LaunchRefusal);
    }
  });
});

describe('the text of the desktop failures about a folder of its own', () => {
  it('24: arsenal_home_cwd_is_home says its sentence, and the sentence is translated', () => {
    expect(failureText('arsenal_home_cwd_is_home')).toBe(HOME_FOLDER_REFUSED);
    expect(failureText('arsenal_home_cwd_is_home')).toContain(
      'cannot use your home folder as its project',
    );
    expect(ES[HOME_FOLDER_REFUSED]).toContain('carpeta personal');
  });

  // Every code the host returns about a folder of its own or a launch environment has its own
  // text, translated: none falls back to the generic sentence.
  const GENERIC = 'Something went wrong in the desktop.';
  for (const code of [
    'arsenal_home_failed',
    'arsenal_home_unqualified',
    'arsenal_token_missing',
    'arsenal_environment_unreadable',
    'arsenal_environment_too_large',
  ]) {
    it(`${code} has a text of its own, translated`, () => {
      const text = failureText(code);
      expect(text).not.toBe(GENERIC);
      expect(ES[text], code).toBeTruthy();
    });
  }
  it('the unreadable text names both files, the qualification one only Codex', () => {
    expect(failureText('arsenal_environment_unreadable')).toContain(
      'environment.json for Claude',
    );
    expect(failureText('arsenal_unqualified')).toContain('Codex build');
  });
});

it.each([
  ['instructions', 1],
  ['instructions', 7],
  ['codex', 1],
  ['codex', 7],
] as const)(
  'names blocked items instead of enforcement for %s (%i items)',
  async (kind, count) => {
    const { d } = deps(session(), undefined, { selection: 'sel-1' });
    d.plan = vi.fn(
      async () =>
        ({
          selection: 'sel-1',
          selection_name: 'Work',
          can_apply: false,
          status: 'blocked',
          enforcement: { reason: 'ENFORCEMENT_CONTROL' },
          items: Array.from({ length: count }, (_, i) => ({
            capability: `id-${i}`,
            name: `Skill ${i}`,
            state: i % 2 ? 'missing' : 'rejected',
          })),
          ...(kind === 'instructions'
            ? { launch_instructions: { project: 'exclude', role: '' } }
            : { codex_environment: { instructions: false, hooks_off: [] } }),
        }) as never,
    );
    const refusal = (await openLaunch('codex', d).catch(
      (e: unknown) => e,
    )) as LaunchRefusal;
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    try {
      for (const language of ['en', 'es'] as const) {
        setLanguage(language);
        const rendered = t(refusal.template, refusal.values);
        expect(rendered).toContain('Skill 0');
        if (count > 5) expect(rendered).toContain('Skill 4');
        expect(rendered).not.toContain('Skill 5');
        expect(rendered).not.toContain('ENFORCEMENT_CONTROL');
        if (count > 5)
          expect(rendered).toContain(
            language === 'es' ? 'y 2 más' : 'and 2 more',
          );
        else expect(rendered).not.toContain(language === 'es' ? 'más' : 'more');
        expect(rendered).toContain('Arsenal');
      }
    } finally {
      setLanguage('en');
    }
    expect(d.start).not.toHaveBeenCalled();
  },
);

it('identifies a removed capability when its plan no longer has a name', async () => {
  const { d } = deps(session(), undefined, { selection: 'sel-1' });
  d.plan = vi.fn(
    async () =>
      ({
        selection: 'sel-1',
        selection_name: 'Work',
        can_apply: false,
        status: 'blocked',
        enforcement: { reason: 'unrelated' },
        launch_instructions: { project: 'exclude', role: '' },
        items: [{ capability: 'removed-skill', name: '', state: 'missing' }],
      }) as never,
  );
  await expect(openLaunch('codex', d)).rejects.toThrow('removed-skill');
});

it.each(['name_collision', 'methodology_conflict', 'exclusion_limit'] as const)(
  'regression: blocked by %s reports its cause without inventing missing items',
  async (cause) => {
    const { d } = deps(session(), undefined, { selection: 'sel-1' });
    d.plan = vi.fn(
      async () =>
        ({
          selection: 'sel-1',
          selection_name: 'Work',
          can_apply: false,
          status: 'blocked',
          items: [],
          conflicts:
            cause === 'exclusion_limit'
              ? []
              : [{ code: cause, blocking: true, names: ['Alpha', 'Beta'] }],
          enforcement: {
            reason: 'More than 512 installed skills would be switched off.',
          },
          launch_instructions: { project: 'exclude', role: '' },
        }) as never,
    );
    const refusal = (await openLaunch('codex', d).catch(
      (e: unknown) => e,
    )) as LaunchRefusal;
    expect(refusal).toBeInstanceOf(LaunchRefusal);
    expect(refusal.message).toContain(
      cause === 'exclusion_limit' ? 'More than 512' : 'Alpha, Beta',
    );
    expect(refusal.message).not.toContain('missing or rejected');
    expect(refusal.message).toContain('Nothing was started.');
    expect(d.start).not.toHaveBeenCalled();
  },
);
