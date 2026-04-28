import type { GameState, Level, LevelAttempt } from '../types';

/**
 * Pure check: does the given level + attempt satisfy a `certificateTrigger`
 * such that completing this attempt unlocks the journey certificate?
 *
 * Used at reward-build time to detect "newly unlocked" transitions.
 */
export function evaluateUnlockOnAttempt(level: Level, attempt: LevelAttempt): boolean {
  const trigger = level.certificateTrigger;
  if (!trigger || trigger.type !== 'journey') {
    return false;
  }
  const required = trigger.requireStatus ?? 'pass';
  const status = attempt.judgeResult.status;
  if (required === 'perfect') {
    return status === 'perfect';
  }
  return status === 'perfect' || status === 'pass';
}

/**
 * Data-driven unlock judgment over the entire state. Persisted unlock wins
 * (sticky), otherwise scan every level for a satisfied `certificateTrigger`.
 *
 * OR-semantic across levels: any level meeting its own trigger unlocks.
 */
export function isCertificateUnlocked(state: GameState, levels: Level[]): boolean {
  if (state.certificateUnlocked) {
    return true;
  }
  for (const level of levels) {
    const trigger = level.certificateTrigger;
    if (!trigger || trigger.type !== 'journey') continue;
    const required = trigger.requireStatus ?? 'pass';
    const attempts = state.completedLevels[level.id] ?? [];
    const hit = attempts.some(a =>
      required === 'perfect'
        ? a.judgeResult.status === 'perfect'
        : a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass'
    );
    if (hit) return true;
  }
  return false;
}

/**
 * Returns the autoPrompt flag of the trigger that most recently fired on
 * `level` for `attempt`. Defaults to true. Caller decides what to do with it.
 */
export function shouldAutoPrompt(level: Level): boolean {
  const trigger = level.certificateTrigger;
  if (!trigger) return false;
  return trigger.autoPrompt !== false;
}
