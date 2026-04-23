// Shared message types between Extension and WebView
// Keep in sync with src/types/messages.ts

export interface Level {
  id: string;
  title: string;
  chapter: number;
  story: string;
  difficulty: 'easy' | 'medium' | 'hard';
  promptChallenge: string;
  input: string[];
  expected: string[];
  hints: string[];
  promptHints: string[];
  feedback: {
    onPass: string;
    onFail: string;
    onPerfect: string;
    onDirectWrite: string;
  };
}

export interface JudgeResult {
  status: 'perfect' | 'pass' | 'partial' | 'fail' | 'error';
  matched: string[];
  expected: string[];
  rawRegexString: string;
  errorMessage?: string;
}

export interface PromptScore {
  total: number;
  brevityScore: number;
  firstTryScore: number;
  eleganceScore: number;
  regexQualityScore: number;
}

export interface LevelAttemptView {
  levelId: string;
  mode: 'prompt' | 'manual';
  prompt?: string;
  regex: string;
  judgeResult: JudgeResult;
  promptScore?: PromptScore;
  timestamp: number;
  attemptNumber: number;
}

export interface LeaderboardEntry {
  dimension: string;
  label: string;
  value: number | string;
  rank: number;
}

export type WebViewType = 'promptPanel' | 'welcome' | 'leaderboard' | 'scoreDetail' | 'codex';

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

// Extension → WebView
export type ExtensionMessage =
  | { command: 'loadLevel'; level: Level }
  | { command: 'showResult'; result: JudgeResult; score?: PromptScore; feedback: string; rawRegex?: string; reward?: LevelRewardData }
  | { command: 'showError'; message: string }
  | { command: 'setLoading'; loading: boolean }
  | { command: 'showScoreDetail'; levelTitle: string; attempts: LevelAttemptView[]; bestScore?: PromptScore }
  | { command: 'showLeaderboard'; entries: LeaderboardEntry[] }
  | { command: 'updateHints'; hintData: HintData }
  | { command: 'localeChanged'; locale: string };
