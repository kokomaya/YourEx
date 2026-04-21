import { describe, it, expect } from 'vitest';
import { scorePrompt } from '../../src/engine/promptScorer';

describe('promptScorer', () => {
  it('should return zero scores for stub implementation', () => {
    const result = scorePrompt('test prompt', 1, 10, true);
    expect(result.total).toBe(0);
  });
});
