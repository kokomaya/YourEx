import { describe, it, expect } from 'vitest';
import { scorePrompt } from '../../src/engine/promptScorer';

describe('promptScorer', () => {
  it('returns zero scores when not passed', () => {
    const result = scorePrompt('any prompt', 1, 10, false);
    expect(result.total).toBe(0);
    expect(result.brevityScore).toBe(0);
  });

  it('short prompt gets high brevity score', () => {
    const result = scorePrompt('match digits', 1, 10, true);
    expect(result.brevityScore).toBeGreaterThan(80);
  });

  it('long prompt gets low brevity score', () => {
    const longPrompt = 'a'.repeat(200);
    const result = scorePrompt(longPrompt, 1, 10, true);
    expect(result.brevityScore).toBe(0);
  });

  it('very short prompt (<=15 chars) gets max brevity', () => {
    const result = scorePrompt('match email', 1, 10, true);
    expect(result.brevityScore).toBe(100);
  });

  it('first attempt gets highest firstTry score', () => {
    const result = scorePrompt('test', 1, 10, true);
    expect(result.firstTryScore).toBe(100);
  });

  it('second attempt gets reduced firstTry score', () => {
    const result = scorePrompt('test', 2, 10, true);
    expect(result.firstTryScore).toBe(70);
  });

  it('fourth+ attempt gets minimum firstTry score', () => {
    const result = scorePrompt('test', 5, 10, true);
    expect(result.firstTryScore).toBe(10);
  });

  it('prompt with constraints gets elegance bonus', () => {
    const plain = scorePrompt('match email', 1, 10, true);
    const withConstraint = scorePrompt('match email, 不要匹配无效格式', 1, 10, true);
    expect(withConstraint.eleganceScore).toBeGreaterThan(plain.eleganceScore);
  });

  it('short regex gets high quality score', () => {
    const result = scorePrompt('test', 1, 5, true);
    expect(result.regexQualityScore).toBe(100);
  });

  it('long regex gets low quality score', () => {
    const result = scorePrompt('test', 1, 80, true);
    expect(result.regexQualityScore).toBe(10);
  });

  it('total is weighted sum of dimensions', () => {
    const result = scorePrompt('test', 1, 10, true);
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it('perfect scenario (short prompt, first try, short regex) scores high', () => {
    const result = scorePrompt('match digits', 1, 5, true);
    expect(result.total).toBeGreaterThanOrEqual(80);
  });

  it('poor scenario (long prompt, many attempts, long regex) scores low', () => {
    const result = scorePrompt('a'.repeat(180), 5, 70, true);
    expect(result.total).toBeLessThan(30);
  });
});
