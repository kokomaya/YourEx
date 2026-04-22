import { describe, it, expect } from 'vitest';
import { getRexSignal, isAllPerfect, getChapterDialogue, DIALOGUES } from '../../src/story/dialogues';
import { DEFAULT_GAME_STATE } from '../../src/types';
import type { GameState } from '../../src/types';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...structuredClone(DEFAULT_GAME_STATE), ...overrides };
}

describe('dialogues', () => {
  describe('DIALOGUES', () => {
    it('has welcome dialogue with lines', () => {
      expect(DIALOGUES.welcome.title).toBeTruthy();
      expect(DIALOGUES.welcome.lines.length).toBeGreaterThan(0);
    });

    it('has chapter intros for all 5 chapters', () => {
      for (let ch = 1; ch <= 5; ch++) {
        expect(DIALOGUES.chapterIntro[ch]).toBeDefined();
        expect(DIALOGUES.chapterIntro[ch].title).toBeTruthy();
        expect(DIALOGUES.chapterIntro[ch].lines.length).toBeGreaterThan(0);
      }
    });

    it('has chapter complete messages for all 5 chapters', () => {
      for (let ch = 1; ch <= 5; ch++) {
        expect(DIALOGUES.chapterComplete[ch]).toBeTruthy();
      }
    });
  });

  describe('getChapterDialogue', () => {
    it('returns dialogue for valid chapter', () => {
      const d = getChapterDialogue(1);
      expect(d).toBeDefined();
      expect(d?.title).toContain('信号接触');
    });

    it('returns undefined for invalid chapter', () => {
      expect(getChapterDialogue(99)).toBeUndefined();
    });
  });

  describe('getRexSignal', () => {
    it('returns null when fewer than 15 levels completed', () => {
      const state = makeState();
      // Call 100 times - should always be null
      for (let i = 0; i < 100; i++) {
        expect(getRexSignal(state)).toBeNull();
      }
    });

    it('can return a signal after 15+ levels completed', () => {
      const completedLevels: GameState['completedLevels'] = {};
      for (let i = 1; i <= 16; i++) {
        const id = `level_${String(i).padStart(2, '0')}`;
        completedLevels[id] = [{
          levelId: id, mode: 'prompt', prompt: 'test', regex: '/a/',
          judgeResult: { status: 'perfect', matched: ['a'], expected: ['a'], regex: null, rawRegexString: '/a/' },
          timestamp: Date.now(), attemptNumber: 1,
        }];
      }
      const state = makeState({ completedLevels });

      // With 20% chance, run many times and check at least one non-null
      let gotSignal = false;
      for (let i = 0; i < 200; i++) {
        if (getRexSignal(state) !== null) {
          gotSignal = true;
          break;
        }
      }
      expect(gotSignal).toBe(true);
    });
  });

  describe('isAllPerfect', () => {
    it('returns false for empty state', () => {
      const state = makeState();
      expect(isAllPerfect(state, 25)).toBe(false);
    });

    it('returns true when all levels are perfect', () => {
      const completedLevels: GameState['completedLevels'] = {};
      for (let i = 1; i <= 3; i++) {
        completedLevels[`level_${i}`] = [{
          levelId: `level_${i}`, mode: 'prompt', prompt: 'test', regex: '/a/',
          judgeResult: { status: 'perfect', matched: ['a'], expected: ['a'], regex: null, rawRegexString: '/a/' },
          timestamp: Date.now(), attemptNumber: 1,
        }];
      }
      const state = makeState({ completedLevels });
      // only 3 levels exist in completedLevels, and totalLevels = 3
      expect(isAllPerfect(state, 3)).toBe(true);
    });

    it('returns false when not all levels are perfect', () => {
      const completedLevels: GameState['completedLevels'] = {};
      completedLevels['level_1'] = [{
        levelId: 'level_1', mode: 'prompt', prompt: 'test', regex: '/a/',
        judgeResult: { status: 'perfect', matched: ['a'], expected: ['a'], regex: null, rawRegexString: '/a/' },
        timestamp: Date.now(), attemptNumber: 1,
      }];
      completedLevels['level_2'] = [{
        levelId: 'level_2', mode: 'prompt', prompt: 'test', regex: '/b/',
        judgeResult: { status: 'pass', matched: ['b'], expected: ['b'], regex: null, rawRegexString: '/b/' },
        timestamp: Date.now(), attemptNumber: 1,
      }];
      const state = makeState({ completedLevels });
      expect(isAllPerfect(state, 3)).toBe(false);
    });
  });
});
