import { describe, expect, it } from 'vitest';
import { mockIPC } from '@tauri-apps/api/mocks';
import { getAppInfo } from '../src/lib/desktop/client';
import fixture from './fixtures/app-info-v1.json';

describe('AppInfo IPC', () => {
  it('uses get_app_info and matches the Rust serialization fixture', async () => {
    const commands: string[] = [];
    mockIPC((command) => {
      commands.push(command);
      return fixture;
    });

    const info = await getAppInfo();
    expect(commands).toEqual(['get_app_info']);
    expect(info).toEqual(fixture);
    expect(Object.keys(info).sort()).toEqual([
      'name',
      'schema_version',
      'version',
    ]);
  });
});
