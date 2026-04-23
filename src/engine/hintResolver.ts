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
}

/**
 * Resolve which hints to show based on the level's hint arrays and
 * the player's fail count for that level.
 *
 * hints:       unlocked from fail #2 onward  (index = failCount - 2)
 * promptHints: unlocked from fail #1 onward  (index = failCount - 1)
 */
export function resolveHints(level: Level, failCount: number, previousFailCount?: number): HintData {
  const totalHints = level.hints.length;
  const totalPromptHints = level.promptHints.length;

  const hintIndex = failCount >= 2
    ? Math.min(failCount - 2, totalHints - 1)
    : -1;

  const promptHintIndex = failCount >= 1
    ? Math.min(failCount - 1, totalPromptHints - 1)
    : -1;

  const prevHintIndex = (previousFailCount ?? failCount) >= 2
    ? Math.min((previousFailCount ?? failCount) - 2, totalHints - 1)
    : -1;

  const prevPromptHintIndex = (previousFailCount ?? failCount) >= 1
    ? Math.min((previousFailCount ?? failCount) - 1, totalPromptHints - 1)
    : -1;

  return {
    hints: hintIndex >= 0 ? level.hints.slice(0, hintIndex + 1) : [],
    promptHints: promptHintIndex >= 0 ? level.promptHints.slice(0, promptHintIndex + 1) : [],
    totalHints,
    totalPromptHints,
    hasNewHint: hintIndex >= 0 && hintIndex > prevHintIndex,
    hasNewPromptHint: promptHintIndex >= 0 && promptHintIndex > prevPromptHintIndex,
  };
}
