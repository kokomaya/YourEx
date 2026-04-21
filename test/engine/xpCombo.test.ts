import { describe, it, expect } from 'vitest';
import { calculateXpGain, applyXp, computeDecryptPercent } from '../../src/engine/xpTracker';
import { incrementCombo, resetCombo } from '../../src/engine/comboTracker';
import { DEFAULT_GAME_STATE } from '../../src/types';

describe('xpTracker', () => {
  describe('calculateXpGain', () => {
    it('returns 18 for first prompt attempt', () => {
      expect(calculateXpGain(1, 'prompt', false, 50, 30, 0)).toBe(18);
    });

    it('returns 12 for second prompt attempt', () => {
      expect(calculateXpGain(2, 'prompt', false, 50, 30, 0)).toBe(12);
    });

    it('returns 5 for third+ prompt attempt', () => {
      expect(calculateXpGain(3, 'prompt', false, 50, 30, 0)).toBe(5);
      expect(calculateXpGain(5, 'prompt', false, 50, 30, 0)).toBe(5);
    });

    it('returns 25 for manual mode', () => {
      expect(calculateXpGain(1, 'manual', false, 0, 0, 0)).toBe(25);
    });

    it('adds combo bonus', () => {
      const base = calculateXpGain(1, 'prompt', false, 50, 30, 0);
      const withCombo = calculateXpGain(1, 'prompt', false, 50, 30, 3);
      expect(withCombo).toBe(base + 15); // 5 * 3
    });

    it('adds perfect bonus', () => {
      const base = calculateXpGain(1, 'prompt', false, 50, 30, 0);
      const withPerfect = calculateXpGain(1, 'prompt', true, 50, 30, 0);
      expect(withPerfect).toBe(base + 8);
    });

    it('adds high score bonus when score >= 90', () => {
      const base = calculateXpGain(1, 'prompt', false, 89, 30, 0);
      const withHighScore = calculateXpGain(1, 'prompt', false, 90, 30, 0);
      expect(withHighScore).toBe(base + 5);
    });

    it('adds minimal prompt bonus when length <= 20', () => {
      const base = calculateXpGain(1, 'prompt', false, 50, 21, 0);
      const withMinimal = calculateXpGain(1, 'prompt', false, 50, 20, 0);
      expect(withMinimal).toBe(base + 5);
    });

    it('does not add minimal bonus for manual mode', () => {
      const result = calculateXpGain(1, 'manual', false, 0, 10, 0);
      expect(result).toBe(25); // no minimal bonus for manual
    });
  });

  describe('applyXp', () => {
    it('adds xp to state', () => {
      const state = { ...DEFAULT_GAME_STATE, xp: 10 };
      const result = applyXp(state, 18);
      expect(result.xp).toBe(28);
    });

    it('does not mutate original state', () => {
      const state = { ...DEFAULT_GAME_STATE, xp: 10 };
      applyXp(state, 18);
      expect(state.xp).toBe(10);
    });
  });

  describe('computeDecryptPercent', () => {
    it('returns 0 for 0 completed', () => {
      expect(computeDecryptPercent(0, 25)).toBe(0);
    });

    it('returns 100 for all completed', () => {
      expect(computeDecryptPercent(25, 25)).toBe(100);
    });

    it('returns correct percentage', () => {
      expect(computeDecryptPercent(5, 25)).toBe(20);
    });

    it('returns 0 for 0 total', () => {
      expect(computeDecryptPercent(0, 0)).toBe(0);
    });
  });
});

describe('comboTracker', () => {
  it('increments combo', () => {
    const state = { ...DEFAULT_GAME_STATE, combo: 2, maxCombo: 3 };
    const result = incrementCombo(state);
    expect(result.combo).toBe(3);
  });

  it('updates maxCombo when exceeded', () => {
    const state = { ...DEFAULT_GAME_STATE, combo: 3, maxCombo: 3 };
    const result = incrementCombo(state);
    expect(result.maxCombo).toBe(4);
  });

  it('does not lower maxCombo', () => {
    const state = { ...DEFAULT_GAME_STATE, combo: 1, maxCombo: 5 };
    const result = incrementCombo(state);
    expect(result.maxCombo).toBe(5);
  });

  it('resets combo to 0', () => {
    const state = { ...DEFAULT_GAME_STATE, combo: 5, maxCombo: 5 };
    const result = resetCombo(state);
    expect(result.combo).toBe(0);
    expect(result.maxCombo).toBe(5); // maxCombo preserved
  });

  it('does not mutate original state', () => {
    const state = { ...DEFAULT_GAME_STATE, combo: 2 };
    incrementCombo(state);
    expect(state.combo).toBe(2);
  });
});
