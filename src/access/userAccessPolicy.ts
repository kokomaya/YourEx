import type { GameStateManager } from '../state/gameState';
import { getChapterForLevel } from '../engine/levelLoader';
import type { IAccessPolicy } from './IAccessPolicy';

export class UserAccessPolicy implements IAccessPolicy {
  readonly mode = 'user' as const;

  constructor(private readonly gameState: GameStateManager) {}

  isChapterUnlocked(chapter: number): boolean {
    return this.gameState.isChapterUnlocked(chapter);
  }

  canOpenLevel(levelId: string): boolean {
    const chapter = getChapterForLevel(levelId);
    if (!chapter) {
      return false;
    }
    return this.gameState.isChapterUnlocked(chapter);
  }
}
