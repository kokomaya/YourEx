import type { PromptScore } from '../types';

export function scorePrompt(
  _prompt: string,
  _attemptNumber: number,
  _regexLength: number,
  _passed: boolean
): PromptScore {
  // TODO: Phase 2 - Task 2.3
  return {
    total: 0,
    brevityScore: 0,
    firstTryScore: 0,
    eleganceScore: 0,
    regexQualityScore: 0,
  };
}
