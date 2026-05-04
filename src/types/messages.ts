import type { Level } from './level';
import type { JudgeResult } from './judge';
import type { PromptScore, LevelAttempt } from './score';
import type { JourneyCertificateData } from './certificate';

export interface LeaderboardEntry {
  dimension: string;
  label: string;
  value: number | string;
  rank: number;
}

export type WebViewType = 'promptPanel' | 'welcome' | 'leaderboard' | 'scoreDetail' | 'codex' | 'ch6Interlude' | 'chapterInterlude' | 'certificate';

// WebView → Extension
export type WebViewMessage =
  | { command: 'executePrompt'; prompt: string; levelId: string }
  | { command: 'manualMode'; levelId: string }
  | { command: 'requestLevel'; levelId: string }
  | { command: 'startDecryption' }
  | { command: 'nextLevel' }
  | { command: 'replayLevel'; levelId: string }
  | { command: 'viewLeaderboard' }
  | { command: 'switchLanguage'; locale: string }
  | { command: 'peekHint'; levelId: string }
  | { command: 'openCodex' }
  | { command: 'openJourneyCertificate' }
  | { command: 'generateCertificateImage'; imageBytes: number[]; fileName: string }
  | { command: 'setCertificatePlayerName'; name: string }
  | { command: 'closeCertificate' }
  | { command: 'ready' };

export interface AchievementInfo {
  id: string;
  name: string;
  description: string;
}

export interface LevelRewardData {
  tier: 'pass' | 'perfect';
  levelId: string;
  levelTitle: string;
  chapter: number;
  score?: PromptScore;
  xpGained: number;
  comboCount: number;
  newAchievements: AchievementInfo[];
  isChapterComplete: boolean;
  isGameComplete: boolean;
  isOriginComplete: boolean;
  /** True iff this attempt JUST flipped the certificate-unlock flag on. */
  certificateJustUnlocked?: boolean;
  /** Mirror of trigger.autoPrompt: surface the entry button automatically when true. */
  certificateAutoPrompt?: boolean;
  chapterSummary?: ChapterSummary;
}

export interface ChapterSummary {
  chapter: number;
  chapterName: string;
  completeLine: string;
  levelsCompleted: number;
  levelsPerfect: number;
  totalLevels: number;
  totalXp: number;
  bestCombo: number;
  achievements: AchievementInfo[];
  nextChapter: number | null;
  nextChapterIntro: string | null;
  totalCompletedLevels?: number;
  totalStandardLevels?: number;
  elapsedMs?: number;
}

export interface HintData {
  hints: string[];
  promptHints: string[];
  totalHints: number;
  totalPromptHints: number;
  hasNewHint: boolean;
  hasNewPromptHint: boolean;
  /** Whether the player has used the one-time peek for this level */
  hasPeeked: boolean;
  /** Score penalty for peeking (0 if not peeked) */
  peekPenalty: number;
}

/**
 * Snapshot of a player's best previous attempt on a level. Sent inside
 * `loadLevel` so the prompt panel can pre-fill the input with their
 * historical solution AND restore the result/score panel that was shown
 * the moment they cleared it. Built from `gameState.getBestAttempt(levelId)`;
 * absent when no passing attempt exists.
 */
export interface LevelRecall {
  mode: 'prompt' | 'manual';
  prompt?: string;
  regex: string;
  scoreTotal?: number;
  status: 'perfect' | 'pass';
  totalAttempts: number;
  /** Full breakdown so the result panel renders identically to first clear. */
  score?: PromptScore;
  /** Stored matched lines from the winning attempt (extras stripped at build). */
  matched: string[];
  /** Localized feedback string (the `onPerfect`/`onPass` text shown originally). */
  feedback: string;
  /** Timestamp of the winning attempt, for the optional "cleared on …" footnote. */
  timestamp: number;
}

// Extension → WebView
export type ExtensionMessage =
  | { command: 'loadLevel'; level: Level; recall?: LevelRecall }
  | { command: 'showResult'; result: JudgeResult; score?: PromptScore; feedback: string; rawRegex?: string; reward?: LevelRewardData }
  | { command: 'showError'; message: string }
  | { command: 'setLoading'; loading: boolean }
  | { command: 'showScoreDetail'; levelTitle: string; attempts: Omit<LevelAttempt, 'judgeResult'> & { judgeResult: Omit<JudgeResult, 'regex'> }[]; bestScore?: PromptScore }
  | { command: 'showLeaderboard'; entries: LeaderboardEntry[] }
  | { command: 'updateHints'; hintData: HintData }
  | { command: 'localeChanged'; locale: string }
  | { command: 'loadCertificateData'; data: JourneyCertificateData }
  | { command: 'certificateSaved'; filePath: string }
  | { command: 'certificateSaveFailed'; error: string };
