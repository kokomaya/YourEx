import { describe, it, expect } from 'vitest';
import { extractRegex, extractRegexWithMeta } from '../../src/engine/regexExtractor';

describe('regexExtractor', () => {
  it('extracts from ```regex code block', () => {
    const input = '```regex\n/\\d+/g\n```';
    const result = extractRegex(input);
    expect(result).toBeInstanceOf(RegExp);
    expect(result!.source).toBe('\\d+');
    expect(result!.flags).toBe('g');
  });

  it('extracts from ``` code block (no language)', () => {
    const input = '```\n/hello/i\n```';
    const result = extractRegex(input);
    expect(result).toBeInstanceOf(RegExp);
    expect(result!.source).toBe('hello');
    expect(result!.flags).toBe('i');
  });

  it('extracts from inline backticks `/pattern/flags`', () => {
    const input = '正则表达式为：`/\\w+@\\w+\\.\\w+/`';
    const result = extractRegex(input);
    expect(result).toBeInstanceOf(RegExp);
    expect(result!.source).toBe('\\w+@\\w+\\.\\w+');
  });

  it('extracts bare /pattern/flags', () => {
    const input = '/hello/i';
    const result = extractRegex(input);
    expect(result).toBeInstanceOf(RegExp);
    expect(result!.source).toBe('hello');
    expect(result!.flags).toBe('i');
  });

  it('extracts from new RegExp("pattern", "flags")', () => {
    const input = 'new RegExp("\\\\d+", "g")';
    const result = extractRegex(input);
    expect(result).toBeInstanceOf(RegExp);
    expect(result!.flags).toBe('g');
  });

  it('returns null for no regex found', () => {
    expect(extractRegex('no regex here')).toBeNull();
  });

  it('returns null for invalid regex', () => {
    expect(extractRegex('/[invalid/flags')).toBeNull();
  });

  it('prioritizes code block over bare slash', () => {
    const input = 'Use /simple/ but here is the real answer:\n```regex\n/complex/gi\n```';
    const meta = extractRegexWithMeta(input);
    expect(meta).not.toBeNull();
    expect(meta!.raw).toBe('/complex/gi');
  });

  it('extracts from text with surrounding prose', () => {
    const input = 'The regex you need is `/^[\\w.+-]+@[\\w-]+\\.\\w{2,}$/` which matches emails.';
    const result = extractRegex(input);
    expect(result).toBeInstanceOf(RegExp);
    expect(result!.test('test@example.com')).toBe(true);
    expect(result!.test('bad@@example')).toBe(false);
  });

  it('extractRegexWithMeta returns raw string and flags', () => {
    const meta = extractRegexWithMeta('```regex\n/\\d{3}/g\n```');
    expect(meta).not.toBeNull();
    expect(meta!.raw).toBe('/\\d{3}/g');
    expect(meta!.flags).toBe('g');
  });
});
