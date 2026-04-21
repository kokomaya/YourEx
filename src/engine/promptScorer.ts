import type { PromptScore } from '../types';

const WEIGHT_BREVITY = 0.3;
const WEIGHT_FIRST_TRY = 0.3;
const WEIGHT_ELEGANCE = 0.2;
const WEIGHT_REGEX_QUALITY = 0.2;

export function scorePrompt(
  prompt: string,
  attemptNumber: number,
  regexLength: number,
  passed: boolean
): PromptScore {
  if (!passed) {
    return { total: 0, brevityScore: 0, firstTryScore: 0, eleganceScore: 0, regexQualityScore: 0 };
  }

  const brevityScore = computeBrevity(prompt);
  const firstTryScore = computeFirstTry(attemptNumber);
  const eleganceScore = computeElegance(prompt);
  const regexQualityScore = computeRegexQuality(regexLength);

  const total = Math.round(
    brevityScore * WEIGHT_BREVITY +
    firstTryScore * WEIGHT_FIRST_TRY +
    eleganceScore * WEIGHT_ELEGANCE +
    regexQualityScore * WEIGHT_REGEX_QUALITY
  );

  return { total, brevityScore, firstTryScore, eleganceScore, regexQualityScore };
}

// Brevity: shorter prompt = higher score. ≤15 chars → 100, ≥200 chars → 0
function computeBrevity(prompt: string): number {
  const len = prompt.length;
  if (len <= 15) return 100;
  if (len >= 200) return 0;
  return Math.round(100 * (1 - (len - 15) / (200 - 15)));
}

// First try: attempt 1 → 100, attempt 2 → 70, attempt 3 → 40, 4+ → 10
function computeFirstTry(attemptNumber: number): number {
  if (attemptNumber <= 1) return 100;
  if (attemptNumber === 2) return 70;
  if (attemptNumber === 3) return 40;
  return 10;
}

// Elegance: structural features in prompt give points
function computeElegance(prompt: string): number {
  let score = 40; // baseline

  // Has constraints / negative conditions
  if (/不[要能该包含匹配]|排除|不包括|except|exclude|not\s+match/i.test(prompt)) {
    score += 20;
  }
  // Has examples / few-shot
  if (/例如|比如|如|example|e\.g\.|such as/i.test(prompt)) {
    score += 15;
  }
  // Has structure markers (numbered steps, bullets, clear sections)
  if (/[1-9][.、)]|[•\-]\s|步骤|step/i.test(prompt)) {
    score += 15;
  }
  // Has explicit format requirement
  if (/格式|format|返回|return|输出|output/i.test(prompt)) {
    score += 10;
  }

  return Math.min(100, score);
}

// Regex quality: shorter regex = higher quality. ≤10 chars → 100, ≥80 chars → 10
function computeRegexQuality(regexLength: number): number {
  if (regexLength <= 10) return 100;
  if (regexLength >= 80) return 10;
  return Math.round(100 - (regexLength - 10) * (90 / 70));
}
