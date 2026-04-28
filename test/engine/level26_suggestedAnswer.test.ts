import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Level } from '../../src/types';
import { judgeWithConfig } from '../../src/engine/judge';

function loadLevel(rel: string): Level {
  const p = path.join(__dirname, '..', '..', 'src', 'data', 'levels', rel);
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as Level;
}

// Mirrors the v2 suggested answer published in src/data/answers/suggested answer.md
// for Level 26 — see the "v2（推荐 / 纯数据列）" entry.
const TARGET_FRAME =
  'rEx[BEACON:STARHOLD-PLANT7|UNIT:E3-GLIDER|NODE:CORE_GATE|BUILD:20260422|SEED:7FA19C2D|PHRASE:WE_WERE_THE_SIGNAL]';

const TARGET_FRAME_HEX = Array.from(
  TARGET_FRAME,
  ch => ch.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase(),
).join(' ');

const SUGGESTED = new RegExp(TARGET_FRAME_HEX.split(' ').join('\\s+'), 'g');

const LOCALES = [
  'ch6-origin/level_26.json',
  'en/ch6-origin/level_26.json',
  'zh-CN/ch6-origin/level_26.json',
];

describe('level_26 — suggested answer (v2) verification', () => {
  for (const rel of LOCALES) {
    it(`achieves perfect on ${rel}`, () => {
      const level = loadLevel(rel);
      const result = judgeWithConfig(SUGGESTED, level);
      expect(result.status).toBe('perfect');
      expect(result.matched).toEqual([TARGET_FRAME_HEX]);
      expect(result.profileId).toBe('hex-data-only');
    });

    it(`rejects every fake/noise variant in the fixture for ${rel}`, () => {
      const level = loadLevel(rel);
      const result = judgeWithConfig(SUGGESTED, level);
      expect(result.matched).toHaveLength(1);
      expect(result.matched[0]).toBe(TARGET_FRAME_HEX);
      expect(result.matched[0]).not.toContain('37 46 41 31 39 43 32 47');
      expect(result.matched[0]).not.toContain('57 45 5F 57 45 52 45 2D 54 48 45 5F 53 49 47 4E 41 4C');
      expect(result.matched[0]).not.toContain('32 30 32 36 30 34 32 7C');
    });
  }
});
