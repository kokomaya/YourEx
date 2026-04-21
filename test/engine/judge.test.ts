import { describe, it, expect } from 'vitest';
import { judge } from '../../src/engine/judge';

describe('judge', () => {
  it('should return fail status for stub implementation', () => {
    const result = judge(/test/, ['test'], ['test']);
    expect(result.status).toBe('fail');
  });
});
