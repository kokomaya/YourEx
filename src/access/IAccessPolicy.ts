import type { RunMode } from '../mode/runMode';

export interface IAccessPolicy {
  readonly mode: RunMode;
  isChapterUnlocked(chapter: number): boolean;
  canOpenLevel(levelId: string): boolean;
}
