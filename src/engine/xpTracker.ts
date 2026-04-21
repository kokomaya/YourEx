import type { GameState } from '../types';

export function calculateXpGain(
  _attemptNumber: number,
  _mode: 'prompt' | 'manual',
  _isPerfect: boolean,
  _promptScore: number,
  _promptLength: number,
  _combo: number
): number {
  // TODO: Phase 3 - Task 3.10
  return 0;
}

export function applyXp(state: GameState, _xpGain: number): GameState {
  // TODO: Phase 3 - Task 3.10
  return { ...state };
}
