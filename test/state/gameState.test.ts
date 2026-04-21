import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/state/gameState';
import type { LevelAttempt } from '../../src/types';

function makeAttempt(
  levelId: string,
  status: 'perfect' | 'pass' | 'fail' = 'pass',
  attemptNumber = 1
): LevelAttempt {
  return {
    levelId,
    mode: 'prompt',
    prompt: 'test prompt',
    regex: '/test/',
    judgeResult: {
      status,
      matched: [],
      expected: [],
      regex: null,
      rawRegexString: '/test/',
    },
    promptScore: { total: 80, brevityScore: 20, firstTryScore: 25, eleganceScore: 15, regexQualityScore: 20 },
    timestamp: Date.now(),
    attemptNumber,
  };
}

describe('GameStateManager', () => {
  let gsm: GameStateManager;

  beforeEach(() => {
    gsm = new GameStateManager();
  });

  it('should have default state', () => {
    expect(gsm.state.xp).toBe(0);
    expect(gsm.state.combo).toBe(0);
    expect(gsm.state.unlockedChapters).toEqual([1]);
    expect(gsm.state.startTime).toBeNull();
  });

  it('should record attempts', () => {
    gsm.recordAttempt(makeAttempt('level_01'));
    expect(gsm.getLevelAttempts('level_01')).toHaveLength(1);
    expect(gsm.state.totalAttempts).toBe(1);
  });

  it('should detect completed levels', () => {
    gsm.recordAttempt(makeAttempt('level_01', 'pass'));
    expect(gsm.isLevelCompleted('level_01')).toBe(true);
    expect(gsm.isLevelCompleted('level_02')).toBe(false);
  });

  it('failed attempt should not mark level complete', () => {
    gsm.recordAttempt(makeAttempt('level_01', 'fail'));
    expect(gsm.isLevelCompleted('level_01')).toBe(false);
  });

  it('should return completed level ids', () => {
    gsm.recordAttempt(makeAttempt('level_01', 'pass'));
    gsm.recordAttempt(makeAttempt('level_02', 'fail'));
    gsm.recordAttempt(makeAttempt('level_03', 'perfect'));
    expect(gsm.getCompletedLevelIds()).toEqual(['level_01', 'level_03']);
  });

  it('should get best attempt by score', () => {
    const a1 = makeAttempt('level_01', 'pass', 1);
    a1.promptScore!.total = 60;
    const a2 = makeAttempt('level_01', 'perfect', 2);
    a2.promptScore!.total = 95;
    gsm.recordAttempt(a1);
    gsm.recordAttempt(a2);
    expect(gsm.getBestAttempt('level_01')?.promptScore?.total).toBe(95);
  });

  it('should unlock chapters', () => {
    expect(gsm.isChapterUnlocked(2)).toBe(false);
    gsm.unlockChapter(2);
    expect(gsm.isChapterUnlocked(2)).toBe(true);
    expect(gsm.state.unlockedChapters).toEqual([1, 2]);
  });

  it('should not duplicate chapter unlock', () => {
    gsm.unlockChapter(1);
    expect(gsm.state.unlockedChapters).toEqual([1]);
  });

  it('should add XP', () => {
    gsm.addXp(18);
    gsm.addXp(12);
    expect(gsm.state.xp).toBe(30);
  });

  it('should track combo and max combo', () => {
    gsm.setCombo(3);
    expect(gsm.state.combo).toBe(3);
    expect(gsm.state.maxCombo).toBe(3);
    gsm.setCombo(1);
    expect(gsm.state.combo).toBe(1);
    expect(gsm.state.maxCombo).toBe(3);
  });

  it('should unlock achievements', () => {
    gsm.unlockAchievement('first_signal');
    gsm.unlockAchievement('first_signal'); // no dup
    expect(gsm.state.unlockedAchievements).toEqual(['first_signal']);
  });

  it('should start timer', () => {
    gsm.startTimer();
    expect(gsm.state.startTime).not.toBeNull();
    expect(gsm.getElapsedMs()).toBeGreaterThanOrEqual(0);
  });

  it('should not restart timer', () => {
    gsm.startTimer();
    const first = gsm.state.startTime;
    gsm.startTimer();
    expect(gsm.state.startTime).toBe(first);
  });

  it('should reset state', () => {
    gsm.addXp(100);
    gsm.unlockChapter(3);
    gsm.reset();
    expect(gsm.state.xp).toBe(0);
    expect(gsm.state.unlockedChapters).toEqual([1]);
  });

  it('should track total prompt length', () => {
    const a = makeAttempt('level_01');
    a.prompt = 'short prompt';
    gsm.recordAttempt(a);
    expect(gsm.state.totalPromptLength).toBe('short prompt'.length);
  });
});

describe('GameStateManager persistence', () => {
  it('should serialize and restore state', () => {
    const gsm1 = new GameStateManager();
    gsm1.addXp(50);
    gsm1.unlockChapter(2);
    gsm1.recordAttempt(makeAttempt('level_01', 'perfect'));
    const json = gsm1.toJSON();

    const gsm2 = new GameStateManager();
    gsm2.fromJSON(json);
    expect(gsm2.state.xp).toBe(50);
    expect(gsm2.isChapterUnlocked(2)).toBe(true);
    expect(gsm2.isLevelCompleted('level_01')).toBe(true);
  });

  it('should work with bindStorage', () => {
    const store: Record<string, string> = {};
    const gsm1 = new GameStateManager();
    gsm1.bindStorage(
      (key, value) => { store[key] = value; },
      (key) => store[key]
    );
    gsm1.addXp(42);
    gsm1.unlockChapter(3);

    const gsm2 = new GameStateManager();
    gsm2.bindStorage(
      (key, value) => { store[key] = value; },
      (key) => store[key]
    );
    expect(gsm2.state.xp).toBe(42);
    expect(gsm2.isChapterUnlocked(3)).toBe(true);
  });
});
