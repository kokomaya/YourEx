import { describe, it, expect } from 'vitest';
import { ModeService } from '../../src/mode/modeService';

describe('ModeService', () => {
  it('uses configured default mode when storage is empty', () => {
    const service = new ModeService('developer');
    service.bindStorage(
      () => {},
      () => undefined
    );

    expect(service.getMode()).toBe('developer');
  });

  it('restores persisted mode from storage', () => {
    const service = new ModeService('user');
    service.bindStorage(
      () => {},
      () => 'developer'
    );

    expect(service.getMode()).toBe('developer');
  });

  it('falls back to default mode for invalid stored value', () => {
    const service = new ModeService('user');
    service.bindStorage(
      () => {},
      () => 'invalid-mode'
    );

    expect(service.getMode()).toBe('user');
  });

  it('persists mode changes and emits change event', async () => {
    const writes: Array<{ key: string; value: string }> = [];
    const service = new ModeService('user');

    service.bindStorage(
      (key, value) => {
        writes.push({ key, value });
      },
      () => undefined
    );

    const seen: string[] = [];
    service.onDidChangeMode((mode) => {
      seen.push(mode);
    });

    await service.setMode('developer');

    expect(service.getMode()).toBe('developer');
    expect(writes).toEqual([{ key: 'yourex.runMode', value: 'developer' }]);
    expect(seen).toEqual(['developer']);
  });

  it('does not persist or emit when mode is unchanged', async () => {
    let writes = 0;
    let emits = 0;
    const service = new ModeService('user');

    service.bindStorage(
      () => {
        writes += 1;
      },
      () => undefined
    );

    service.onDidChangeMode(() => {
      emits += 1;
    });

    await service.setMode('user');

    expect(writes).toBe(0);
    expect(emits).toBe(0);
  });
});
