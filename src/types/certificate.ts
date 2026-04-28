import type { PromptScore } from './score';

export interface JourneyCertificateData {
  // --- Metadata ---
  certificateId: string;
  generatedAt: number;
  playerName: string;
  totalPlayTime: number;

  // --- Global stats ---
  totalAttempts: number;
  totalPromptLength: number;
  perfectCount: number;
  passCount: number;
  failCount: number;
  totalXp: number;
  maxCombo: number;
  achievements: CertificateAchievement[];
  unlockedAchievementIds: string[];

  // --- Chapters ---
  chapters: ChapterJourney[];
  totalStandardLevels: number;
  totalCompletedStandardLevels: number;
  isOriginUnlocked: boolean;
  isOriginComplete: boolean;
}

export interface CertificateAchievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface ChapterJourney {
  chapter: number;
  chapterTitle: string;
  chapterCompleteLine: string;
  isComplete: boolean;
  levels: LevelJourney[];
}

export type LevelJourneyStatus = 'perfect' | 'pass' | 'attempted' | 'skipped';

export interface LevelJourney {
  levelId: string;
  levelOrder: number;
  levelTitle: string;
  levelStory: string;
  status: LevelJourneyStatus;
  attempts: AttemptRecord[];
  bestScore?: PromptScore;
  totalAttempts: number;
  failCount: number;
  successCount: number;
}

/**
 * One attempt as it appears on the certificate. Critical rule: failed attempts
 * carry no prompt/regex content — only the count and timestamp. See doc §3.2.
 */
export interface AttemptRecord {
  attemptNumber: number;
  timestamp: number;
  mode: 'prompt' | 'manual';
  /** Only present when status is 'pass' or 'perfect'. */
  prompt?: string;
  /** Only present when status is 'pass' or 'perfect'. */
  regex?: string;
  status: 'perfect' | 'pass' | 'fail';
  scoreTotal?: number;
}
