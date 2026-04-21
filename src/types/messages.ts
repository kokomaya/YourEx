import type { Level } from './level';
import type { JudgeResult } from './judge';
import type { PromptScore } from './score';

export type WebViewType = 'promptPanel' | 'welcome' | 'leaderboard' | 'scoreDetail';

// WebView → Extension
export type WebViewMessage =
  | { command: 'executePrompt'; prompt: string; levelId: string }
  | { command: 'manualMode'; levelId: string }
  | { command: 'requestLevel'; levelId: string }
  | { command: 'ready' };

// Extension → WebView
export type ExtensionMessage =
  | { command: 'loadLevel'; level: Level }
  | { command: 'showResult'; result: JudgeResult; score?: PromptScore; feedback: string; rawRegex?: string }
  | { command: 'showError'; message: string }
  | { command: 'setLoading'; loading: boolean };
