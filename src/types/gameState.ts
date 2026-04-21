import type { LevelAttempt } from './score';

export interface GameState {
  completedLevels: Record<string, LevelAttempt[]>;
  unlockedChapters: number[];
  currentLevelId: string | null;
  xp: number;
  combo: number;
  maxCombo: number;
  unlockedAchievements: string[];
  totalPromptLength: number;
  totalAttempts: number;
  startTime: number | null;
}

export const DEFAULT_GAME_STATE: GameState = {
  completedLevels: {},
  unlockedChapters: [1],
  currentLevelId: null,
  xp: 0,
  combo: 0,
  maxCombo: 0,
  unlockedAchievements: [],
  totalPromptLength: 0,
  totalAttempts: 0,
  startTime: null,
};
