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

export type WebViewType = 'promptPanel' | 'welcome' | 'leaderboard' | 'scoreDetail';

// WebView → Extension
export type WebViewMessage =
  | { command: 'executePrompt'; prompt: string; levelId: string }
  | { command: 'manualMode'; levelId: string }
  | { command: 'requestLevel'; levelId: string }
  | { command: 'startDecryption' }
  | { command: 'ready' };

// Extension → WebView
export type ExtensionMessage =
  | { command: 'loadLevel'; level: Level }
  | { command: 'showResult'; result: JudgeResult; score?: PromptScore; feedback: string; rawRegex?: string }
  | { command: 'showError'; message: string }
  | { command: 'setLoading'; loading: boolean }
  | { command: 'showScoreDetail'; levelTitle: string; attempts: LevelAttemptView[]; bestScore?: PromptScore }
  | { command: 'showLeaderboard'; entries: LeaderboardEntry[] };
