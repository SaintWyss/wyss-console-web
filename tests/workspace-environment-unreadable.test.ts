import { describe, expect, it } from 'vitest';
import { loadEstimateData } from '../src/lib/features/workspace/data';

const selection = (id: string, provider: string) => ({
  id,
  name: id,
  provider,
  items: [],
  composites: [],
  created_at: 1,
  updated_at: 1,
});
const unreadable = () =>
  Promise.reject(
    Object.assign(new Error('x'), { code: 'environment_unreadable' }),
  );

describe('a launch environment file that cannot be read', () => {
  const base = {
    capabilities: async () => [],
    environmentOptions: async () => null as never,
  };

  it('is said for Claude, and the preset gets no environment', async () => {
    const data = await loadEstimateData({
      ...base,
      selections: async () => [selection('c1', 'claude_code')] as never,
      environment: unreadable,
    });
    expect(data.claudeUnreadable).toBe(true);
    expect(data.environments.has('c1')).toBe(false);
  });

  it('is not said for another error, nor when it is read', async () => {
    const other = await loadEstimateData({
      ...base,
      selections: async () => [selection('c1', 'claude_code')] as never,
      environment: () => Promise.reject(new Error('host down')),
    });
    expect(other.claudeUnreadable).toBe(false);
    const read = await loadEstimateData({
      ...base,
      selections: async () => [selection('c1', 'claude_code')] as never,
      environment: async () => ({ instructions: false }) as never,
    });
    expect(read.claudeUnreadable).toBe(false);
    expect(read.environments.has('c1')).toBe(true);
  });

  it('for Claude does not mark Codex, and the other way round', async () => {
    const data = await loadEstimateData({
      ...base,
      selections: async () =>
        [selection('c1', 'claude_code'), selection('x1', 'codex')] as never,
      environment: unreadable,
      codexEnvironmentOptions: async () => null as never,
      codexEnvironment: async () => ({ instructions: true, hooks_off: [] }),
    });
    expect(data.claudeUnreadable).toBe(true);
    expect(data.codexUnreadable).toBe(false);
  });
});
