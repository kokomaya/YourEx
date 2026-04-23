/**
 * Tracks per-level fail counts and peek state for the hint unlock system.
 * Does NOT reset on level replay — unlocked hints stay visible.
 */
export interface IHintTracker {
  /** Record one failure for a level */
  recordFail(levelId: string): void;
  /** Get current fail count for a level */
  getFailCount(levelId: string): number;
  /** Mark this level as peeked (one-time, reveals all locked hints) */
  markPeeked(levelId: string): void;
  /** Whether the player has peeked for this level */
  hasPeeked(levelId: string): boolean;
}

export class HintTracker implements IHintTracker {
  private failCounts = new Map<string, number>();
  private peeked = new Set<string>();

  recordFail(levelId: string): void {
    this.failCounts.set(levelId, (this.failCounts.get(levelId) ?? 0) + 1);
  }

  getFailCount(levelId: string): number {
    return this.failCounts.get(levelId) ?? 0;
  }

  markPeeked(levelId: string): void {
    this.peeked.add(levelId);
  }

  hasPeeked(levelId: string): boolean {
    return this.peeked.has(levelId);
  }
}
