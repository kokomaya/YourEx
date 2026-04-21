import { describe, it, expect } from 'vitest';
import { MockProvider } from '../../src/ai/mockProvider';

describe('MockProvider', () => {
  it('should return placeholder regex', async () => {
    const provider = new MockProvider();
    const result = await provider.generate('any prompt');
    expect(result).toBe('/placeholder/');
  });

  it('should always be available', async () => {
    const provider = new MockProvider();
    expect(await provider.isAvailable()).toBe(true);
  });
});
