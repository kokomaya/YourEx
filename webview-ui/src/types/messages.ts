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

export type WebViewType = 'promptPanel' | 'welcome' | 'leaderboard' | 'scoreDetail' | 'codex' | 'ch6Interlude' | 'certificate';

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
  certificateJustUnlocked?: boolean;
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

// Journey certificate types (mirror src/types/certificate.ts)
export interface AttemptRecordView {
  attemptNumber: number;
  timestamp: number;
  mode: 'prompt' | 'manual';
  prompt?: string;
  regex?: string;
  status: 'perfect' | 'pass' | 'fail';
  scoreTotal?: number;
}

export type LevelJourneyStatus = 'perfect' | 'pass' | 'attempted' | 'skipped';

export interface LevelJourneyView {
  levelId: string;
  levelOrder: number;
  levelTitle: string;
  levelStory: string;
  status: LevelJourneyStatus;
  attempts: AttemptRecordView[];
  bestScore?: PromptScore;
  totalAttempts: number;
  failCount: number;
  successCount: number;
}

export interface ChapterJourneyView {
  chapter: number;
  chapterTitle: string;
  chapterCompleteLine: string;
  isComplete: boolean;
  levels: LevelJourneyView[];
}

export interface CertificateAchievementView {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface JourneyCertificateData {
  certificateId: string;
  generatedAt: number;
  playerName: string;
  totalPlayTime: number;
  totalAttempts: number;
  totalPromptLength: number;
  perfectCount: number;
  passCount: number;
  failCount: number;
  totalXp: number;
  maxCombo: number;
  achievements: CertificateAchievementView[];
  unlockedAchievementIds: string[];
  chapters: ChapterJourneyView[];
  totalStandardLevels: number;
  totalCompletedStandardLevels: number;
  isOriginUnlocked: boolean;
  isOriginComplete: boolean;
}

/**
 * Mirror of src/types/messages.ts LevelRecall. The best previous passing
 * attempt for a level, used to pre-fill the prompt panel and restore the
 * full result/score panel that was originally shown on clear.
 */
export interface LevelRecall {
  mode: 'prompt' | 'manual';
  prompt?: string;
  regex: string;
  scoreTotal?: number;
  status: 'perfect' | 'pass';
  totalAttempts: number;
  score?: PromptScore;
  matched: string[];
  feedback: string;
  timestamp: number;
}

// Extension → WebView
export type ExtensionMessage =
  | { command: 'loadLevel'; level: Level; recall?: LevelRecall }
  | { command: 'showResult'; result: JudgeResult; score?: PromptScore; feedback: string; rawRegex?: string; reward?: LevelRewardData }
  | { command: 'showError'; message: string }
  | { command: 'setLoading'; loading: boolean }
  | { command: 'showScoreDetail'; levelTitle: string; attempts: LevelAttemptView[]; bestScore?: PromptScore }
  | { command: 'showLeaderboard'; entries: LeaderboardEntry[] }
  | { command: 'updateHints'; hintData: HintData }
  | { command: 'localeChanged'; locale: string }
  | { command: 'loadCertificateData'; data: JourneyCertificateData }
  | { command: 'certificateSaved'; filePath: string }
  | { command: 'certificateSaveFailed'; error: string };
