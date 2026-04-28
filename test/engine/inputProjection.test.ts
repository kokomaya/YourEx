import { describe, it, expect } from 'vitest';
import { projectInput } from '../../src/engine/inputProjection';

describe('projectInput', () => {
  const sample = [
    '00000000  7F 45 4C 46 02 01 01 00 41 55 4D 4F 56 49 4F 00  .ELF....AUMOVIO.',
    '00000010  45 33 5F 47 41 54 45 57 41 59 5F 56 43 55 00 00  E3_GATEWAY_VCU..',
  ];

  it('returns raw input when projection is empty', () => {
    expect(projectInput(sample, {})).toEqual(sample);
  });

  it('applies columnRanges per line', () => {
    const out = projectInput(sample, { columnRanges: [{ start: 0, end: 8 }] });
    expect(out).toEqual(['00000000', '00000010']);
  });

  it('concatenates multiple column ranges in order', () => {
    const out = projectInput(sample, {
      columnRanges: [
        { start: 0, end: 8 },
        { start: 59, end: 75 },
      ],
    });
    expect(out).toEqual([
      '00000000.ELF....AUMOVIO.',
      '00000010E3_GATEWAY_VCU..',
    ]);
  });

  it('clamps out-of-range column ends safely', () => {
    const out = projectInput(['abc'], { columnRanges: [{ start: 1, end: 999 }] });
    expect(out).toEqual(['bc']);
  });

  it('selects a line range, end-exclusive', () => {
    const out = projectInput(sample, { lineRange: { start: 1, end: 2 } });
    expect(out).toEqual([sample[1]]);
  });

  it('decodes hex-bytes after column slicing', () => {
    const out = projectInput([sample[0]], {
      columnRanges: [{ start: 10, end: 57 }],
      decode: 'hex-bytes',
    });
    expect(out).toEqual(['\x7FELF\x02\x01\x01\x00AUMOVIO\x00']);
  });

  it('mergeLines joins with given joiner', () => {
    const out = projectInput(['ab', 'cd'], { mergeLines: true, joiner: '|' });
    expect(out).toEqual(['ab|cd']);
  });

  it('hex decode + merge concatenates byte stream across lines', () => {
    const out = projectInput(sample, {
      columnRanges: [{ start: 10, end: 57 }],
      decode: 'hex-bytes',
      mergeLines: true,
      joiner: '',
    });
    expect(out).toEqual(['\x7FELF\x02\x01\x01\x00AUMOVIO\x00E3_GATEWAY_VCU\x00\x00']);
  });

  it('trims each segment when requested', () => {
    const out = projectInput(['  hello  '], {
      columnRanges: [{ start: 0 }],
      trimEachSegment: true,
    });
    expect(out).toEqual(['hello']);
  });
});
