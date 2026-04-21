import type { GameState } from '../types';

const XP_TABLE = {
  prompt: { attempt1: 18, attempt2: 12, attempt3plus: 5 },
  manual: 25,
  perfectBonus: 8,
  highScoreBonus: 5,   // promptScore >= 90
  minimalBonus: 5,     // prompt <= 20 chars
  hintPenalty: -3,
} as const;

export function calculateXpGain(
  attemptNumber: number,
  mode: 'prompt' | 'manual',
  isPerfect: boolean,
  promptScore: number,
  promptLength: number,
  combo: number
): number {
  let xp: number;

  if (mode === 'manual') {
    xp = XP_TABLE.manual;
  } else if (attemptNumber <= 1) {
    xp = XP_TABLE.prompt.attempt1;
  } else if (attemptNumber === 2) {
    xp = XP_TABLE.prompt.attempt2;
  } else {
    xp = XP_TABLE.prompt.attempt3plus;
  }

  // combo bonus: +5 per combo level
  if (combo > 0) {
    xp += 5 * combo;
  }

  // perfect bonus
  if (isPerfect) {
    xp += XP_TABLE.perfectBonus;
  }

  // high score bonus
  if (promptScore >= 90) {
    xp += XP_TABLE.highScoreBonus;
  }

  // minimal prompt bonus
  if (mode === 'prompt' && promptLength <= 20) {
    xp += XP_TABLE.minimalBonus;
  }

  return xp;
}

export function applyXp(state: GameState, xpGain: number): GameState {
  return { ...state, xp: state.xp + xpGain };
}

export function computeDecryptPercent(completedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((completedCount / totalCount) * 100);
}
