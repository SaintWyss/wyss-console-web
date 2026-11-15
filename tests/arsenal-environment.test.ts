import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CODEX_SPEC,
  DEFAULT_SPEC,
  hookLabel,
  isCodexDefault,
  isDefault,
  parseCodexOptions,
  parseCodexSpec,
  parseOptions,
  parseSpec,
  toggle,
} from '../src/lib/features/arsenal/environment';

describe('arsenal launch environment', () => {
  it('treats the owner configuration as the default and any change as its own folder', () => {
    expect(isDefault(DEFAULT_SPEC)).toBe(true);
    expect(isDefault({ ...DEFAULT_SPEC, memory: false })).toBe(false);
    expect(isDefault({ ...DEFAULT_SPEC, mcp: [] })).toBe(false);
    expect(isDefault({ ...DEFAULT_SPEC, agents: false })).toBe(false);
    expect(
      isDefault({
        ...DEFAULT_SPEC,
        account_skills_off: ['anthropic-skills:pdf'],
      }),
    ).toBe(false);
    expect(
      isDefault({ ...DEFAULT_SPEC, hooks_off: ['0123456789abcdef'] }),
    ).toBe(false);
  });

  it('keeps toggled lists sorted and unique', () => {
    expect(toggle(['b'], 'a', true)).toEqual(['a', 'b']);
    expect(toggle(['a', 'b'], 'a', true)).toEqual(['a', 'b']);
    expect(toggle(['a', 'b'], 'a', false)).toEqual(['b']);
  });

  it('names a hook by its event, matcher and script', () => {
    expect(
      hookLabel({
        key: 'k',
        event: 'PreToolUse',
        matcher: 'Bash',
        command: 'python3 /home/u/.claude/hooks/model-routing-gate.py',
      }),
    ).toBe('PreToolUse (Bash) · model-routing-gate.py');
    expect(
      hookLabel({
        key: 'k',
        event: 'SessionStart',
        matcher: '',
        command: 'rtk hook claude',
      }),
    ).toBe('SessionStart · rtk');
  });

  it('parses what the desktop answers and refuses a malformed reply', () => {
    expect(parseSpec({ ...DEFAULT_SPEC, mcp: ['context7'] }).mcp).toEqual([
      'context7',
    ]);
    expect(() => parseSpec({ ...DEFAULT_SPEC, memory: 'yes' })).toThrow();
    const options = parseOptions({
      hooks: [{ key: 'k', event: 'E', matcher: '', command: 'c' }],
      mcp: ['context7'],
      plugins: [],
      rules: ['ux.md'],
      account_skills: ['anthropic-skills:pdf'],
      instructions: true,
      token_stored: false,
    });
    expect(options.hooks).toHaveLength(1);
    expect(() => parseOptions({ hooks: [{ key: 1 }] })).toThrow();
  });

  it('treats the owner Codex configuration as the default and any change as its own folder', () => {
    expect(isCodexDefault(DEFAULT_CODEX_SPEC)).toBe(true);
    expect(isCodexDefault({ instructions: false, hooks_off: [] })).toBe(false);
    expect(
      isCodexDefault({ instructions: true, hooks_off: ['0123456789abcdef'] }),
    ).toBe(false);
  });

  it('parses a Codex environment and its options, and refuses a malformed reply', () => {
    expect(parseCodexSpec({ instructions: false, hooks_off: ['k'] })).toEqual({
      instructions: false,
      hooks_off: ['k'],
    });
    expect(() =>
      parseCodexSpec({ instructions: 'no', hooks_off: [] }),
    ).toThrow();
    expect(() => parseCodexSpec({ instructions: true })).toThrow();
    const options = parseCodexOptions({
      hooks: [{ key: 'k', event: 'Stop', matcher: '', command: 'bye.sh' }],
      config_hooks: [{ event: 'Stop', matcher: '', command: 'cfg.sh' }],
      instructions: true,
    });
    expect(options.hooks).toHaveLength(1);
    expect(options.config_hooks[0]!.command).toBe('cfg.sh');
    expect(() =>
      parseCodexOptions({ hooks: [], instructions: true }),
    ).toThrow();
    expect(() =>
      parseCodexOptions({
        hooks: [],
        config_hooks: [{ event: 'Stop' }],
        instructions: true,
      }),
    ).toThrow();
  });
});
