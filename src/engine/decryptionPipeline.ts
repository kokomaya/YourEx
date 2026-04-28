import type { IAIProvider } from '../ai/IAIProvider';
import type { JudgeResult, PromptScore, Level } from '../types';
import { extractRegex, extractRegexWithMeta } from './regexExtractor';
import { judgeWithConfig, judgeFromStringWithConfig } from './judge';
import { scorePrompt } from './promptScorer';

export interface DecryptionResult {
  aiResponse: string;
  judgeResult: JudgeResult;
  promptScore: PromptScore;
  regex: RegExp | null;
  rawRegex: string;
}

export async function runDecryptionPipeline(
  prompt: string,
  level: Level,
  aiProvider: IAIProvider,
  attemptNumber: number,
  peekPenalty: number = 0
): Promise<DecryptionResult> {
  const aiResponse = await aiProvider.generate(prompt);

  const extracted = extractRegexWithMeta(aiResponse);
  if (!extracted) {
    return {
      aiResponse,
      judgeResult: {
        status: 'error',
        matched: [],
        expected: level.expected,
        regex: null,
        rawRegexString: '',
        errorMessage: 'Failed to extract regex from AI response',
      },
      promptScore: { total: 0, brevityScore: 0, firstTryScore: 0, eleganceScore: 0, regexQualityScore: 0 },
      regex: null,
      rawRegex: '',
    };
  }

  const judgeResult = judgeWithConfig(extracted.regex, level);

  const passed = judgeResult.status === 'perfect' || judgeResult.status === 'pass';
  const promptScore = scorePrompt(prompt, attemptNumber, extracted.raw.length, passed, peekPenalty);

  return {
    aiResponse,
    judgeResult: { ...judgeResult, regex: extracted.regex, rawRegexString: extracted.raw },
    promptScore,
    regex: extracted.regex,
    rawRegex: extracted.raw,
  };
}

export function runManualJudge(
  rawRegex: string,
  level: Level
): JudgeResult {
  return judgeFromStringWithConfig(rawRegex, level);
}
