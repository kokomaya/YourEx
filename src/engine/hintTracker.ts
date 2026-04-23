/**
 * Tracks per-level fail counts for the hint unlock system.
 * Does NOT reset on level replay — unlocked hints stay visible.
 */
export interface IHintTracker {
  /** Record one failure for a level */
  recordFail(levelId: string): void;
  /** Get current fail count for a level */
  getFailCount(levelId: string): number;
}

export class HintTracker implements IHintTracker {
  private failCounts = new Map<string, number>();

  recordFail(levelId: string): void {
    this.failCounts.set(levelId, (this.failCounts.get(levelId) ?? 0) + 1);
  }

  getFailCount(levelId: string): number {
    return this.failCounts.get(levelId) ?? 0;
  }
}
