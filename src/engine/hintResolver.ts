import type { Level } from '../types';

export interface HintData {
  /** Unlocked hints (auto-shown on fail) */
  hints: string[];
  /** Unlocked prompt hints (shown via scan eye) */
  promptHints: string[];
  /** Total hint count */
  totalHints: number;
  /** Total prompt hint count */
  totalPromptHints: number;
  /** Whether the latest hint was just unlocked */
  hasNewHint: boolean;
  /** Whether the latest prompt hint was just unlocked */
  hasNewPromptHint: boolean;
  /** Whether the player has used the one-time peek for this level */
  hasPeeked: boolean;
  /** The score penalty applied for peeking (0 if not peeked) */
  peekPenalty: number;
}

/** Difficulty → score penalty for peeking */
const DIFFICULTY_PEEK_PENALTY: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 5,
};

/** Get the peek penalty for a level based on its difficulty or hintConfig override */
export function getPeekPenalty(level: Level): number {
  if (level.hintConfig?.peekPenalty !== undefined) {
    return level.hintConfig.peekPenalty;
  }
  return DIFFICULTY_PEEK_PENALTY[level.difficulty] ?? 3;
}

/**
 * Resolve which hints to show based on the level's hint arrays and
 * the player's fail count for that level.
 *
 * Unlock thresholds are configurable via level.hintConfig:
 *   hintStartFail (default 2):       fail count to unlock the first hint
 *   promptHintStartFail (default 1):  fail count to unlock the first promptHint
 *   showExpectedInHints (default true):        append expected as the last hint
 *   showExpectedInPromptHints (default true):   append expected as the last promptHint
 *
 * If peeked, ALL promptHints (including expected) are revealed regardless of fail count.
 */
export function resolveHints(
  level: Level,
  failCount: number,
  previousFailCount?: number,
  peeked: boolean = false,
): HintData {
  const cfg = level.hintConfig;
  const hintStartFail = cfg?.hintStartFail ?? 2;
  const promptHintStartFail = cfg?.promptHintStartFail ?? 1;
  const showExpectedInHints = cfg?.showExpectedInHints !== false;
  const showExpectedInPromptHints = cfg?.showExpectedInPromptHints !== false;

  // Build extended arrays: regular items + expected as the final entry
  const expectedHint = `[Expected] ${level.expected.map(e => `"${e}"`).join(', ')}`;
  const extendedHints = showExpectedInHints
    ? [...level.hints, expectedHint]
    : [...level.hints];
  const extendedPromptHints = showExpectedInPromptHints
    ? [...level.promptHints, expectedHint]
    : [...level.promptHints];

  const totalHints = extendedHints.length;
  const totalPromptHints = extendedPromptHints.length;

  const hintIndex = failCount >= hintStartFail
    ? Math.min(failCount - hintStartFail, totalHints - 1)
    : -1;

  // If peeked, reveal ALL promptHints; otherwise fail-based unlock
  const promptHintIndex = peeked
    ? totalPromptHints - 1
    : (failCount >= promptHintStartFail
      ? Math.min(failCount - promptHintStartFail, totalPromptHints - 1)
      : -1);

  const prevFail = previousFailCount ?? failCount;
  const prevHintIndex = prevFail >= hintStartFail
    ? Math.min(prevFail - hintStartFail, totalHints - 1)
    : -1;

  const prevPromptHintIndex = prevFail >= promptHintStartFail
    ? Math.min(prevFail - promptHintStartFail, totalPromptHints - 1)
    : -1;

  return {
    hints: hintIndex >= 0 ? extendedHints.slice(0, hintIndex + 1) : [],
    promptHints: promptHintIndex >= 0 ? extendedPromptHints.slice(0, promptHintIndex + 1) : [],
    totalHints,
    totalPromptHints,
    hasNewHint: hintIndex >= 0 && hintIndex > prevHintIndex,
    hasNewPromptHint: promptHintIndex >= 0 && promptHintIndex > prevPromptHintIndex,
    hasPeeked: peeked,
    peekPenalty: getPeekPenalty(level),
  };
}
