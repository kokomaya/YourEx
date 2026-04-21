import { describe, it, expect } from 'vitest';
import { computeLeaderboard } from '../../src/engine/leaderboard';
import { DEFAULT_GAME_STATE } from '../../src/types';
import type { GameState } from '../../src/types';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...structuredClone(DEFAULT_GAME_STATE), ...overrides };
}

describe('leaderboard', () => {
  it('returns 7 entries for default state', () => {
    const state = makeState();
    const entries = computeLeaderboard(state);
    expect(entries).toHaveLength(7);
  });

  it('all entries have zero values for default state', () => {
    const state = makeState();
    const entries = computeLeaderboard(state);
    expect(entries.every(e => e.value === 0)).toBe(true);
  });

  it('totalXp reflects state xp', () => {
    const state = makeState({ xp: 150 });
    const entries = computeLeaderboard(state);
    const xpEntry = entries.find(e => e.dimension === 'totalXp');
    expect(xpEntry?.value).toBe(150);
  });

  it('maxCombo reflects state maxCombo', () => {
    const state = makeState({ maxCombo: 7 });
    const entries = computeLeaderboard(state);
    const comboEntry = entries.find(e => e.dimension === 'maxCombo');
    expect(comboEntry?.value).toBe(7);
  });

  it('achievements count reflects unlockedAchievements', () => {
    const state = makeState({ unlockedAchievements: ['first_signal', 'chain_decode'] });
    const entries = computeLeaderboard(state);
    const achEntry = entries.find(e => e.dimension === 'achievements');
    expect(achEntry?.value).toBe(2);
  });

  it('counts manual clears correctly', () => {
    const state = makeState({
      completedLevels: {
        level_01: [
          {
            levelId: 'level_01', mode: 'manual', regex: '/a/',
            judgeResult: { status: 'pass', matched: ['a'], expected: ['a'], regex: null, rawRegexString: '/a/' },
            timestamp: Date.now(), attemptNumber: 1,
          },
        ],
        level_02: [
          {
            levelId: 'level_02', mode: 'prompt', prompt: 'test', regex: '/b/',
            judgeResult: { status: 'perfect', matched: ['b'], expected: ['b'], regex: null, rawRegexString: '/b/' },
            promptScore: { total: 90, brevityScore: 90, firstTryScore: 100, eleganceScore: 80, regexQualityScore: 90 },
            timestamp: Date.now(), attemptNumber: 1,
          },
        ],
      },
    });
    const entries = computeLeaderboard(state);
    const manualEntry = entries.find(e => e.dimension === 'manualClears');
    expect(manualEntry?.value).toBe(1);
    const completedEntry = entries.find(e => e.dimension === 'levelsCompleted');
    expect(completedEntry?.value).toBe(2);
  });

  it('calculates average prompt score', () => {
    const state = makeState({
      completedLevels: {
        level_01: [
          {
            levelId: 'level_01', mode: 'prompt', prompt: 'test', regex: '/a/',
            judgeResult: { status: 'perfect', matched: ['a'], expected: ['a'], regex: null, rawRegexString: '/a/' },
            promptScore: { total: 80, brevityScore: 80, firstTryScore: 100, eleganceScore: 60, regexQualityScore: 80 },
            timestamp: Date.now(), attemptNumber: 1,
          },
        ],
        level_02: [
          {
            levelId: 'level_02', mode: 'prompt', prompt: 'test2', regex: '/b/',
            judgeResult: { status: 'pass', matched: ['b'], expected: ['b'], regex: null, rawRegexString: '/b/' },
            promptScore: { total: 60, brevityScore: 60, firstTryScore: 70, eleganceScore: 40, regexQualityScore: 60 },
            timestamp: Date.now(), attemptNumber: 1,
          },
        ],
      },
    });
    const entries = computeLeaderboard(state);
    const avgEntry = entries.find(e => e.dimension === 'avgScore');
    expect(avgEntry?.value).toBe(70); // (80 + 60) / 2
  });
});
