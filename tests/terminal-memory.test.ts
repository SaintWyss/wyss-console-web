import { afterEach, expect, it } from 'vitest';
import { clearMocks, mockIPC } from '@tauri-apps/api/mocks';
import { memoryText, terminalMemory } from '../src/lib/desktop/terminal-client';
import type { TerminalId } from '../src/lib/contracts/terminal';

afterEach(() => clearMocks());

it('says memory in MB, and in GB past a gigabyte', () => {
  expect(memoryText(84 * 1024 * 1024)).toBe('84 MB');
  expect(memoryText(1.25 * 1024 * 1024 * 1024)).toBe('1.3 GB');
});

it('asks the host by terminal id and accepts only a byte count', async () => {
  const asked: unknown[] = [];
  mockIPC((command, args) => {
    asked.push([command, args]);
    return { rss_bytes: 1024 };
  });
  expect(await terminalMemory('t-1' as TerminalId)).toBe(1024);
  expect(asked).toEqual([
    ['terminal_memory', { request: { terminal_id: 't-1' } }],
  ]);
  mockIPC(() => ({ rss_bytes: null }));
  expect(await terminalMemory('t-1' as TerminalId)).toBeNull();
  mockIPC(() => ({ rss_bytes: -5 }));
  expect(await terminalMemory('t-1' as TerminalId)).toBeNull();
});
