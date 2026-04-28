import { describe, it, expect } from 'vitest';
import {
  evaluateUnlockOnAttempt,
  isCertificateUnlocked,
} from '../../src/engine/certificateUnlockChecker';
import type { GameState, Level, LevelAttempt } from '../../src/types';
import { DEFAULT_GAME_STATE } from '../../src/types';

function makeLevel(overrides: Partial<Level>): Level {
  return {
    id: 'level_x',
    title: 'Test',
    chapter: 1,
    story: '',
    difficulty: 'easy',
    promptChallenge: '',
    input: [],
    expected: [],
    hints: [],
    promptHints: [],
    feedback: { onPass: '', onFail: '', onPerfect: '', onDirectWrite: '' },
    ...overrides,
  };
}

function makeAttempt(
  status: 'perfect' | 'pass' | 'fail',
  levelId = 'level_x',
  attemptNumber = 1,
): LevelAttempt {
  return {
    levelId,
    mode: 'prompt',
    prompt: 'p',
    regex: '/.*/',
    judgeResult: {
      status,
      matched: [],
      expected: [],
      regex: null,
      rawRegexString: '/.*/',
    },
    timestamp: 1,
    attemptNumber,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...DEFAULT_GAME_STATE, ...overrides };
}

describe('evaluateUnlockOnAttempt', () => {
  it('returns false when level has no certificateTrigger', () => {
    expect(evaluateUnlockOnAttempt(makeLevel({}), makeAttempt('perfect'))).toBe(false);
  });

  it('triggers on pass when requireStatus is "pass" (default)', () => {
    const lv = makeLevel({ certificateTrigger: { type: 'journey' } });
    expect(evaluateUnlockOnAttempt(lv, makeAttempt('pass'))).toBe(true);
    expect(evaluateUnlockOnAttempt(lv, makeAttempt('perfect'))).toBe(true);
    expect(evaluateUnlockOnAttempt(lv, makeAttempt('fail'))).toBe(false);
  });

  it('triggers only on perfect when requireStatus is "perfect"', () => {
    const lv = makeLevel({ certificateTrigger: { type: 'journey', requireStatus: 'perfect' } });
    expect(evaluateUnlockOnAttempt(lv, makeAttempt('perfect'))).toBe(true);
    expect(evaluateUnlockOnAttempt(lv, makeAttempt('pass'))).toBe(false);
    expect(evaluateUnlockOnAttempt(lv, makeAttempt('fail'))).toBe(false);
  });
});

describe('isCertificateUnlocked', () => {
  const triggerLevel = makeLevel({
    id: 'level_25',
    certificateTrigger: { type: 'journey', requireStatus: 'pass' },
  });
  const otherLevel = makeLevel({ id: 'level_01' });

  it('sticky: returns true when state.certificateUnlocked already set', () => {
    const s = makeState({ certificateUnlocked: true });
    expect(isCertificateUnlocked(s, [])).toBe(true);
  });

  it('returns false when no level has trigger', () => {
    const s = makeState({
      completedLevels: { level_01: [makeAttempt('perfect', 'level_01')] },
    });
    expect(isCertificateUnlocked(s, [otherLevel])).toBe(false);
  });

  it('returns true when any triggered level has a satisfying attempt', () => {
    const s = makeState({
      completedLevels: { level_25: [makeAttempt('pass', 'level_25')] },
    });
    expect(isCertificateUnlocked(s, [otherLevel, triggerLevel])).toBe(true);
  });

  it('returns false when triggered level has only fail attempts', () => {
    const s = makeState({
      completedLevels: { level_25: [makeAttempt('fail', 'level_25')] },
    });
    expect(isCertificateUnlocked(s, [triggerLevel])).toBe(false);
  });

  it('OR semantic: any of multiple triggered levels suffices', () => {
    const a = makeLevel({ id: 'level_25', certificateTrigger: { type: 'journey' } });
    const b = makeLevel({ id: 'level_26', certificateTrigger: { type: 'journey' } });
    const s = makeState({
      completedLevels: { level_26: [makeAttempt('pass', 'level_26')] },
    });
    expect(isCertificateUnlocked(s, [a, b])).toBe(true);
  });
});
