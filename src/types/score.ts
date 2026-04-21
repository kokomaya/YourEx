import type { JudgeResult } from './judge';

export interface PromptScore {
  total: number;
  brevityScore: number;
  firstTryScore: number;
  eleganceScore: number;
  regexQualityScore: number;
}

export interface LevelAttempt {
  levelId: string;
  mode: 'prompt' | 'manual';
  prompt?: string;
  regex: string;
  judgeResult: JudgeResult;
  promptScore?: PromptScore;
  timestamp: number;
  attemptNumber: number;
}
