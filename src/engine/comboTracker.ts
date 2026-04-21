import type { GameState } from '../types';

export function incrementCombo(state: GameState): GameState {
  const newCombo = state.combo + 1;
  return {
    ...state,
    combo: newCombo,
    maxCombo: Math.max(state.maxCombo, newCombo),
  };
}

export function resetCombo(state: GameState): GameState {
  return { ...state, combo: 0 };
}
