import { describe, it, expect } from 'vitest';
import { judge, judgeFromString } from '../../src/engine/judge';

describe('judge', () => {
  const input = ['hello', 'world', '123', 'test'];

  it('returns perfect when matched equals expected exactly', () => {
    const result = judge(/\d+/, input, ['123']);
    expect(result.status).toBe('perfect');
    expect(result.matched).toEqual(['123']);
  });

  it('returns pass when all expected matched with duplicates in input', () => {
    const dupeInput = ['hello', 'hello', 'world', '123'];
    const result = judge(/^(hello|world)$/, dupeInput, ['hello', 'world']);
    expect(result.status).toBe('pass');
  });

  it('returns partial when some expected are matched', () => {
    const result = judge(/hello|123/, input, ['hello']);
    // matched = ['hello', '123'] but expected only ['hello'] → extra match
    expect(result.status).toBe('partial');
  });

  it('returns fail when no expected items are matched', () => {
    const result = judge(/xyz/, input, ['hello']);
    expect(result.status).toBe('fail');
    expect(result.matched).toEqual([]);
  });

  it('returns error for regex that throws during test', () => {
    // Create a regex with a getter that throws
    const badRegex = /test/;
    Object.defineProperty(badRegex, 'test', {
      value: () => { throw new Error('boom'); }
    });
    const result = judge(badRegex, input, ['test']);
    expect(result.status).toBe('error');
    expect(result.errorMessage).toBe('boom');
  });

  it('includes regex and rawRegexString in result', () => {
    const regex = /\d+/;
    const result = judge(regex, input, ['123']);
    expect(result.regex).toBe(regex);
    expect(result.rawRegexString).toBe('/\\d+/');
  });

  it('handles empty input array', () => {
    const result = judge(/test/, [], ['expected']);
    expect(result.status).toBe('fail');
  });

  it('handles empty expected array with matches as fail', () => {
    const result = judge(/test/, input, []);
    // regex matches 'test' but expected is empty — no expected items in matched
    expect(result.status).toBe('fail');
  });
});

describe('judgeFromString', () => {
  it('parses valid regex string and judges', () => {
    const result = judgeFromString('/\\d+/', ['abc', '123'], ['123']);
    expect(result.status).toBe('perfect');
  });

  it('returns error for invalid regex format', () => {
    const result = judgeFromString('not-a-regex', ['abc'], ['abc']);
    expect(result.status).toBe('error');
    expect(result.errorMessage).toBe('Invalid regex format');
  });

  it('returns error for invalid regex pattern', () => {
    const result = judgeFromString('/[invalid/', ['abc'], ['abc']);
    expect(result.status).toBe('error');
  });
});
