import { getLevelById } from '../engine/levelLoader';
import type { IAccessPolicy } from './IAccessPolicy';

export class DeveloperAccessPolicy implements IAccessPolicy {
  readonly mode = 'developer' as const;

  isChapterUnlocked(_chapter: number): boolean {
    return true;
  }

  canOpenLevel(levelId: string): boolean {
    return Boolean(getLevelById(levelId));
  }
}
