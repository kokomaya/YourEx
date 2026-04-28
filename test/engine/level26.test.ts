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

describe('level_26 (Origin Frame) — judgeConfig integration', () => {
  const locales = [
    'ch6-origin/level_26.json',
    'en/ch6-origin/level_26.json',
    'zh-CN/ch6-origin/level_26.json',
  ];

  for (const rel of locales) {
    describe(rel, () => {
      const level = loadLevel(rel);

      it('has hex-decoded-whole profile', () => {
        expect(level.judgeConfig).toBeDefined();
        expect(level.judgeConfig?.profiles[0].id).toBe('hex-decoded-whole');
      });

      it('decodes the hex column into a stream containing the target Origin Frame', () => {
        const profile = level.judgeConfig!.profiles[0];
        const projected = projectInput(level.input, profile.source);
        expect(projected).toHaveLength(1);
        expect(projected[0]).toContain(level.expected[0]);
      });

      it('a strict regex over the decoded stream judges as perfect', () => {
        // expected = rEx[ORIGIN:AUMOVIO-PLANT7|VEHICLE:E3-SUV|ECU:VCU_GATEWAY|BUILD:20260422|SEED:7FA19C2D|PHRASE:WE_WERE_THE_PARSER]
        const strict = /rEx\[ORIGIN:AUMOVIO-PLANT7\|VEHICLE:E3-SUV\|ECU:VCU_GATEWAY\|BUILD:\d{8}\|SEED:[0-9A-F]{8}\|PHRASE:WE_WERE_THE_PARSER\]/g;
        const result = judgeWithConfig(strict, level);
        expect(result.status).toBe('perfect');
        expect(result.matched).toEqual(level.expected);
        expect(result.profileId).toBe('hex-decoded-whole');
      });

      it('a too-loose regex that also catches noise://… frames is not perfect', () => {
        const loose = /rEx\[ORIGIN:[^\]]+\|VEHICLE:[^\]]+\|ECU:[^\]]+\|BUILD:[^\]]+\|SEED:[^\]]+\|PHRASE:[^\]]+\]/g;
        const result = judgeWithConfig(loose, level);
        // It should not be perfect because it matches the broken `noise://` frame and the err.log frame too.
        expect(result.status).not.toBe('perfect');
      });

      it('legacy regex on raw input still judges (legacy fallback active)', () => {
        // The original ASCII-column-tail "rEx[ORIGIN:AUMOV" appears as a substring of one raw line,
        // but legacy `judge` requires line-equality. It should naturally fail without breaking.
        const r = /^impossible$/;
        const result = judgeWithConfig(r, level);
        expect(['fail', 'error']).toContain(result.status);
      });
    });
  }
});
