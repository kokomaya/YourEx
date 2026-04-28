import { describe, it, expect } from 'vitest';
import { judgeWithConfig, judgeFromStringWithConfig } from '../../src/engine/judge';
import type { Level } from '../../src/types';

const baseLevel: Level = {
  id: 'level_test',
  title: 't',
  chapter: 1,
  story: '',
  difficulty: 'easy',
  promptChallenge: '',
  input: ['hello', 'world', 'HELLO'],
  expected: ['hello'],
  hints: [],
  promptHints: [],
  feedback: { onPass: '', onFail: '', onPerfect: '', onDirectWrite: '' },
};

describe('judgeWithConfig — legacy passthrough', () => {
  it('falls back to legacy judge when no judgeConfig present', () => {
    const result = judgeWithConfig(/^hello$/, baseLevel);
    expect(result.status).toBe('perfect');
    expect(result.matched).toEqual(['hello']);
    expect(result.profileId).toBeUndefined();
  });
});

describe('judgeWithConfig — profile selection', () => {
  it('runs a whole-input + matched-substrings profile', () => {
    const level: Level = {
      ...baseLevel,
      input: ['abc def', 'ghi'],
      expected: ['def'],
      judgeConfig: {
        includeLegacy: false,
        profiles: [
          {
            id: 'merged',
            source: { mergeLines: true, joiner: ' ' },
            match: { scope: 'whole-input', resultMode: 'matched-substrings' },
          },
        ],
      },
    };
    const result = judgeWithConfig(/def/, level);
    expect(result.status).toBe('perfect');
    expect(result.matched).toEqual(['def']);
    expect(result.profileId).toBe('merged');
  });

  it('legacy fallback wins when its status is higher than profile status', () => {
    // profile will fail (mergeLines + whole-input + bogus expected),
    // legacy passes ('hello' is in input + expected).
    const level: Level = {
      ...baseLevel,
      judgeConfig: {
        profiles: [
          {
            id: 'doomed',
            expected: ['nope'],
            source: { mergeLines: true },
            match: { scope: 'whole-input', resultMode: 'matched-substrings' },
          },
        ],
      },
    };
    const result = judgeWithConfig(/^hello$/, level);
    expect(result.status).toBe('perfect');
    expect(result.profileId).toBe('__legacy__');
  });

  it('omits legacy fallback when includeLegacy=false', () => {
    const level: Level = {
      ...baseLevel,
      judgeConfig: {
        includeLegacy: false,
        profiles: [
          {
            id: 'doomed',
            expected: ['nope'],
            source: { mergeLines: true },
            match: { scope: 'whole-input', resultMode: 'matched-substrings' },
          },
        ],
      },
    };
    const result = judgeWithConfig(/^hello$/, level);
    expect(result.status).toBe('fail');
    expect(result.profileId).toBe('doomed');
  });

  it('uses level.expected when profile has no expected', () => {
    const level: Level = {
      ...baseLevel,
      input: ['xx hello xx'],
      expected: ['hello'],
      judgeConfig: {
        includeLegacy: false,
        profiles: [
          {
            id: 'sub',
            source: { mergeLines: true },
            match: { scope: 'whole-input', resultMode: 'matched-substrings' },
          },
        ],
      },
    };
    const result = judgeWithConfig(/hello/, level);
    expect(result.status).toBe('perfect');
    expect(result.matched).toEqual(['hello']);
  });

  it('handles /g/ flag without infinite loop and dedupes matches', () => {
    const level: Level = {
      ...baseLevel,
      input: ['ab ab ab'],
      expected: ['ab'],
      judgeConfig: {
        includeLegacy: false,
        profiles: [
          {
            id: 'g',
            source: { mergeLines: true },
            match: { scope: 'whole-input', resultMode: 'matched-substrings' },
          },
        ],
      },
    };
    const result = judgeWithConfig(/ab/g, level);
    expect(result.matched).toEqual(['ab']);
    expect(result.status).toBe('perfect');
  });
});

describe('judgeWithConfig — Level 26 hex-decoded scenario', () => {
  // Three lines: first contains the start of the target frame in ASCII column 59-75
  // but the hex column [10,57) contains the same bytes. We shrink the test to a tiny case.
  const level: Level = {
    ...baseLevel,
    // 'hi' = 68 69; '!!' = 21 21
    input: [
      '00000000  68 69 21 21                                       hi!!            ',
    ],
    expected: ['hi!!'],
    judgeConfig: {
      includeLegacy: false,
      profiles: [
        {
          id: 'hex-decoded-whole',
          source: {
            columnRanges: [{ start: 10, end: 57 }],
            decode: 'hex-bytes',
            mergeLines: true,
            joiner: '',
          },
          match: { scope: 'whole-input', resultMode: 'matched-substrings' },
        },
      ],
    },
  };

  it('decodes hex column to ASCII and matches expected substring', () => {
    const result = judgeWithConfig(/hi!!/, level);
    expect(result.status).toBe('perfect');
    expect(result.matched).toEqual(['hi!!']);
    expect(result.profileId).toBe('hex-decoded-whole');
  });

  it('judgeFromStringWithConfig works end-to-end', () => {
    const result = judgeFromStringWithConfig('/hi!!/', level);
    expect(result.status).toBe('perfect');
  });
});
