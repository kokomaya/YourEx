import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Level } from '../../src/types';
import { judgeWithConfig } from '../../src/engine/judge';
import { projectInput } from '../../src/engine/inputProjection';

function loadLevel(rel: string): Level {
  const p = path.join(__dirname, '..', '..', 'src', 'data', 'levels', rel);
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as Level;
}

const TARGET_FRAME =
  'rEx[BEACON:STARHOLD-PLANT7|UNIT:E3-GLIDER|NODE:CORE_GATE|BUILD:20260422|SEED:7FA19C2D|PHRASE:WE_WERE_THE_SIGNAL]';

function toHexBytes(value: string): string {
  return Array.from(value, ch => ch.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

const TARGET_FRAME_HEX = toHexBytes(TARGET_FRAME);
const TRUNCATED_FRAME_HEX = toHexBytes(
  'rEx[BEACON:STARHOLD-PLANT7|UNIT:E3-GLIDER|NODE:CORE_GATE|BUILD:2026042|SEED:7FA19C2D|PHRASE:WE_WERE_THE_SIGNAL]',
);

const TARGET_FRAME_ADDRESSED_TAIL_ROWS = [
  ['000001D0', '45 78 5B 42 45 41 43 4F 4E 3A 53 54 41 52 48 4F'],
  ['000001E0', '4C 44 2D 50 4C 41 4E 54 37 7C 55 4E 49 54 3A 45'],
  ['000001F0', '33 2D 47 4C 49 44 45 52 7C 4E 4F 44 45 3A 43 4F'],
  ['00000200', '52 45 5F 47 41 54 45 7C 42 55 49 4C 44 3A 32 30'],
  ['00000210', '32 36 30 34 32 32 7C 53 45 45 44 3A 37 46 41 31'],
  ['00000220', '39 43 32 44 7C 50 48 52 41 53 45 3A 57 45 5F 57'],
  ['00000230', '45 52 45 5F 54 48 45 5F 53 49 47 4E 41 4C 5D'],
] as const;

function buildDataOnlyRegex(hexBytes: string): RegExp {
  return new RegExp(hexBytes.split(' ').join('\\s+'), 'g');
}

function buildAddressedRegex(rows: readonly (readonly [string, string])[]): RegExp {
  return new RegExp(
    `72\\s*\\n\\s*${rows
      .map(([address, bytes]) => `${address}\\s{2}${bytes.split(' ').join('\\s+')}`)
      .join('\\s*\\n\\s*')}`,
    'g',
  );
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

const LOCALES = [
  'ch6-origin/level_26.json',
  'en/ch6-origin/level_26.json',
  'zh-CN/ch6-origin/level_26.json',
];

describe('level_26 (Origin Frame) — judgeConfig integration', () => {
  for (const rel of LOCALES) {
    describe(rel, () => {
      const level = loadLevel(rel);

      it('declares raw-hexdump profiles for both data-only and addressed matching', () => {
        expect(level.judgeConfig).toBeDefined();
        expect(level.judgeConfig!.profiles).toHaveLength(2);

        const [dataOnly, addressed] = level.judgeConfig!.profiles;

        expect(dataOnly.id).toBe('hex-data-only');
        expect(dataOnly.source.columnRanges).toEqual([{ start: 10, end: 57 }]);
        expect(dataOnly.source.decode).toBeUndefined();
        expect(dataOnly.source.mergeLines).toBe(true);
        expect(dataOnly.source.joiner).toBe('\n');
        expect(dataOnly.match.scope).toBe('whole-input');
        expect(dataOnly.match.resultMode).toBe('matched-substrings');
        expect(dataOnly.expected).toEqual([TARGET_FRAME_HEX]);

        expect(addressed.id).toBe('hex-addressed-data');
        expect(addressed.source.columnRanges).toEqual([{ start: 0, end: 57 }]);
        expect(addressed.source.decode).toBeUndefined();
        expect(addressed.source.mergeLines).toBe(true);
        expect(addressed.source.joiner).toBe('\n');
        expect(addressed.match.scope).toBe('whole-input');
        expect(addressed.match.resultMode).toBe('matched-substrings');
        expect(addressed.expected).toEqual([TARGET_FRAME_HEX]);
        expect(addressed.normalizeMatches?.[0]).toEqual({
          pattern: '^[0-9A-Fa-f]{8}\\s{2}',
          flags: 'gm',
          replacement: '',
        });
      });

      it('expected list is the single canonical Beacon Frame', () => {
        expect(level.expected).toEqual([TARGET_FRAME]);
      });

      it('projects raw hex bytes without the ASCII preview and still contains two valid copies', () => {
        const [dataOnly, addressed] = level.judgeConfig!.profiles;
        const dataStream = projectInput(level.input, dataOnly.source)[0];
        const addressedStream = projectInput(level.input, addressed.source)[0];

        expect(dataStream).not.toContain(TARGET_FRAME);
        expect(addressedStream).not.toContain(TARGET_FRAME);
        expect(addressedStream).toContain('000001D0  45 78 5B 42');

        const normalizedData = collapseWhitespace(dataStream);
        expect(countOccurrences(normalizedData, TARGET_FRAME_HEX)).toBe(2);
      });

      it('raw byte stream still embeds corruption variants that strict regexes must reject', () => {
        const dataStream = collapseWhitespace(projectInput(level.input, level.judgeConfig!.profiles[0].source)[0]);

        expect(dataStream).toContain('32 30 32 36 30 34 32 7C 53 45 45 44');
        expect(dataStream).toContain('37 46 41 31 39 43 32 47');
        expect(dataStream).toContain('57 45 5F 57 45 52 45 2D 54 48 45 5F 53 49 47 4E 41 4C');
        expect(dataStream).toContain('72 45 78 5B 42 45 41 43 4F 4E 3A 53 54 41 52 48 4F 4C 44 7C 55 4E 49 54 3A 45 33');
      });

      it('a strict data-only byte regex judges as perfect', () => {
        const result = judgeWithConfig(buildDataOnlyRegex(TARGET_FRAME_HEX), level);
        expect(result.status).toBe('perfect');
        expect(result.matched).toEqual([TARGET_FRAME_HEX]);
        expect(result.profileId).toBe('hex-data-only');
      });

      it('a strict addressed hexdump regex also judges as perfect', () => {
        const result = judgeWithConfig(buildAddressedRegex(TARGET_FRAME_ADDRESSED_TAIL_ROWS), level);

        expect(result.status).toBe('perfect');
        expect(result.matched).toEqual([TARGET_FRAME_HEX]);
        expect(result.profileId).toBe('hex-addressed-data');
      });

      it('a too-loose byte regex that catches Beacon-like noise is not perfect', () => {
        const loose = new RegExp(
          [
            '72\\s+45\\s+78\\s+5B\\s+42\\s+45\\s+41\\s+43\\s+4F\\s+4E\\s+3A',
            '[\\s\\S]*?',
            '7C\\s+55\\s+4E\\s+49\\s+54\\s+3A',
            '[\\s\\S]*?',
            '7C\\s+4E\\s+4F\\s+44\\s+45\\s+3A',
            '[\\s\\S]*?',
            '7C\\s+42\\s+55\\s+49\\s+4C\\s+44\\s+3A',
            '[\\s\\S]*?',
            '7C\\s+53\\s+45\\s+45\\s+44\\s+3A',
            '[\\s\\S]*?',
            '7C\\s+50\\s+48\\s+52\\s+41\\s+53\\s+45\\s+3A',
            '[\\s\\S]*?',
            '5D',
          ].join(''),
          'g',
        );
        const result = judgeWithConfig(loose, level);

        expect(result.status).not.toBe('perfect');
        expect(['partial', 'pass', 'fail']).toContain(result.status);
        expect(result.matched.length).toBeGreaterThan(1);
        expect(result.matched).toContain(TARGET_FRAME_HEX);
      });

      it('a regex that matches only the truncated BUILD fake is not perfect', () => {
        const result = judgeWithConfig(buildDataOnlyRegex(TRUNCATED_FRAME_HEX), level);

        expect(result.status).not.toBe('perfect');
        expect(result.matched).toEqual([TRUNCATED_FRAME_HEX]);
      });

      it('legacy per-line judging cannot reach the cross-line frame; falls back without throwing', () => {
        const onlyLegacyVisible = /^impossible-line$/;
        const result = judgeWithConfig(onlyLegacyVisible, level);
        expect(['fail', 'error']).toContain(result.status);
      });
    });
  }

  it('all three locales share identical input/expected and judging structure (label/description may be localized)', () => {
    const [base, en, zh] = LOCALES.map(loadLevel);
    expect(en.input).toEqual(base.input);
    expect(zh.input).toEqual(base.input);
    expect(en.expected).toEqual(base.expected);
    expect(zh.expected).toEqual(base.expected);

    const structural = (l: Level) =>
      l.judgeConfig!.profiles.map(p => ({
        id: p.id,
        expected: p.expected,
        source: p.source,
        match: p.match,
        normalizeMatches: p.normalizeMatches,
      }));
    expect(structural(en)).toEqual(structural(base));
    expect(structural(zh)).toEqual(structural(base));
  });
});
