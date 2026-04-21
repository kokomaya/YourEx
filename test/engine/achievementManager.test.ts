import { describe, it, expect } from 'vitest';
import { checkAchievements, getAchievements } from '../../src/engine/achievementManager';
import { DEFAULT_GAME_STATE } from '../../src/types';
import type { GameState, LevelAttempt } from '../../src/types';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...structuredClone(DEFAULT_GAME_STATE), ...overrides };
}

function makeAttempt(overrides: Partial<LevelAttempt> = {}): LevelAttempt {
  return {
    levelId: 'level_01',
    mode: 'prompt',
    prompt: 'test prompt',
    regex: '/test/',
    judgeResult: { status: 'perfect', matched: ['a'], expected: ['a'], regex: null, rawRegexString: '/a/' },
    promptScore: { total: 80, brevityScore: 80, firstTryScore: 100, eleganceScore: 60, regexQualityScore: 80 },
    timestamp: Date.now(),
    attemptNumber: 1,
    ...overrides,
  };
}

describe('achievementManager', () => {
  describe('getAchievements', () => {
    it('returns 12 achievements', () => {
      const achievements = getAchievements();
      expect(achievements).toHaveLength(12);
    });

    it('all achievements are initially unlocked=false', () => {
      const achievements = getAchievements();
      expect(achievements.every(a => a.unlocked === false)).toBe(true);
    });
  });

  describe('checkAchievements', () => {
    it('returns empty array for default state', () => {
      const state = makeState();
      const result = checkAchievements(state);
      expect(result).toEqual([]);
    });

    it('returns first_signal when first level passed on attempt 1 in prompt mode', () => {
      const state = makeState({
        completedLevels: {
          level_01: [makeAttempt({ attemptNumber: 1, mode: 'prompt' })],
        },
      });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).toContain('first_signal');
    });

    it('does not return first_signal if attempt > 1', () => {
      const state = makeState({
        completedLevels: {
          level_01: [
            makeAttempt({ attemptNumber: 1, judgeResult: { status: 'fail', matched: [], expected: ['a'], regex: null, rawRegexString: '/a/' } }),
            makeAttempt({ attemptNumber: 2 }),
          ],
        },
      });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).not.toContain('first_signal');
    });

    it('returns minimal_instruction for short prompt pass', () => {
      const state = makeState({
        completedLevels: {
          level_01: [makeAttempt({ prompt: 'match digits', mode: 'prompt' })],
        },
      });
      // "match digits" is 12 chars, <= 15
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).toContain('minimal_instruction');
    });

    it('returns noise_overflow for long prompt that fails', () => {
      const state = makeState({
        completedLevels: {
          level_01: [makeAttempt({
            prompt: 'a'.repeat(201),
            mode: 'prompt',
            judgeResult: { status: 'fail', matched: [], expected: ['a'], regex: null, rawRegexString: '/a/' },
          })],
        },
      });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).toContain('noise_overflow');
    });

    it('returns manual_override for manual mode pass', () => {
      const state = makeState({
        completedLevels: {
          level_01: [makeAttempt({ mode: 'manual' })],
        },
      });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).toContain('manual_override');
    });

    it('returns chain_decode when maxCombo >= 10', () => {
      const state = makeState({ maxCombo: 10 });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).toContain('chain_decode');
    });

    it('does not return chain_decode when maxCombo < 10', () => {
      const state = makeState({ maxCombo: 9 });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).not.toContain('chain_decode');
    });

    it('returns persistent_parser for 10+ attempts on same level with a pass', () => {
      const attempts = Array.from({ length: 9 }, (_, i) =>
        makeAttempt({
          attemptNumber: i + 1,
          judgeResult: { status: 'fail', matched: [], expected: ['a'], regex: null, rawRegexString: '/a/' },
        })
      );
      attempts.push(makeAttempt({ attemptNumber: 10 }));

      const state = makeState({
        completedLevels: { level_01: attempts },
      });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).toContain('persistent_parser');
    });

    it('returns human_machine_sync when same level passed in both modes', () => {
      const state = makeState({
        completedLevels: {
          level_01: [
            makeAttempt({ mode: 'prompt' }),
            makeAttempt({ mode: 'manual' }),
          ],
        },
      });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).toContain('human_machine_sync');
    });

    it('returns multi_vector when 3 different prompts pass same level', () => {
      const state = makeState({
        completedLevels: {
          level_01: [
            makeAttempt({ prompt: 'approach 1', attemptNumber: 1 }),
            makeAttempt({ prompt: 'approach 2', attemptNumber: 2 }),
            makeAttempt({ prompt: 'approach 3', attemptNumber: 3 }),
          ],
        },
      });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).toContain('multi_vector');
    });

    it('skips already unlocked achievements', () => {
      const state = makeState({
        completedLevels: {
          level_01: [makeAttempt({ attemptNumber: 1, mode: 'prompt' })],
        },
        unlockedAchievements: ['first_signal'],
      });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).not.toContain('first_signal');
    });

    it('returns speed_parse when completed within 30 seconds of startTime', () => {
      const now = Date.now();
      const state = makeState({
        startTime: now - 10_000, // started 10s ago
        completedLevels: {
          level_01: [makeAttempt({ timestamp: now })],
        },
      });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).toContain('speed_parse');
    });

    it('does not return speed_parse when completed after 30 seconds', () => {
      const now = Date.now();
      const state = makeState({
        startTime: now - 60_000, // started 60s ago
        completedLevels: {
          level_01: [makeAttempt({ timestamp: now })],
        },
      });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).not.toContain('speed_parse');
    });

    it('returns night_shift for completion between 2-5 AM', () => {
      const nightTime = new Date();
      nightTime.setHours(3, 0, 0, 0);
      const state = makeState({
        completedLevels: {
          level_01: [makeAttempt({ timestamp: nightTime.getTime() })],
        },
      });
      const result = checkAchievements(state);
      const ids = result.map(a => a.id);
      expect(ids).toContain('night_shift');
    });
  });
});
