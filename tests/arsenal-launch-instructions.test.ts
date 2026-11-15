import { describe, expect, it } from 'vitest';
import { parseLaunchInstructions } from '../src/lib/desktop/arsenal-client';

describe('launch instructions parser', () => {
  it('accepts the default and valid choices', () => {
    expect(parseLaunchInstructions({ project: 'load' })).toEqual({
      project: 'load',
    });
    expect(parseLaunchInstructions({ project: 'role', role: 'texto' })).toEqual(
      { project: 'role', role: 'texto' },
    );
  });
  it('rejects unknown fields and invalid role text', () => {
    for (const value of [
      { project: 'load', role: '' },
      { project: 'role', role: '' },
      { project: 'role', role: '\0' },
      { project: 'role', role: 'é'.repeat(32769) },
      { project: 'exclude', role: '', extra: true },
    ])
      expect(() => parseLaunchInstructions(value)).toThrow();
  });
});
