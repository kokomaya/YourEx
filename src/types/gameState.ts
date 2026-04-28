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
  /** Sticky unlock for the journey certificate entry. Set true on first trigger; never auto-cleared. */
  certificateUnlocked: boolean;
  /** Stable certificate ID generated on first PDF export (e.g., REX-2026-0428-7A3F). */
  certificateId?: string;
  /** Custom display name for the certificate. Falls back to OS username if absent. */
  certificatePlayerName?: string;
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
  certificateUnlocked: false,
};
