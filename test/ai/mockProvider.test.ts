import { describe, it, expect } from 'vitest';
import { MockProvider } from '../../src/ai/mockProvider';

describe('MockProvider', () => {
  it('returns placeholder for unknown prompt', async () => {
    const provider = new MockProvider();
    const result = await provider.generate('unknown prompt');
    expect(result).toBe('/placeholder/');
  });

  it('always reports available', async () => {
    const provider = new MockProvider();
    expect(await provider.isAvailable()).toBe(true);
  });

  it('returns default response for level_01 keyword', async () => {
    const provider = new MockProvider();
    const result = await provider.generate('level_01');
    expect(result).toContain('/hello/i');
  });

  it('returns default response for level_03 keyword', async () => {
    const provider = new MockProvider();
    const result = await provider.generate('solve level_03');
    expect(result).toContain('regex');
  });

  it('custom responses override defaults', async () => {
    const provider = new MockProvider({ level_01: '/custom/g' });
    const result = await provider.generate('level_01');
    expect(result).toBe('/custom/g');
  });

  it('setResponse adds new response at runtime', async () => {
    const provider = new MockProvider();
    provider.setResponse('special', '/^abc$/');
    const result = await provider.generate('special');
    expect(result).toBe('/^abc$/');
  });

  it('exact match takes priority', async () => {
    const provider = new MockProvider({ 'my prompt': '/exact/' });
    const result = await provider.generate('my prompt');
    expect(result).toBe('/exact/');
  });
});
