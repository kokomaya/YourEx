import * as path from 'path';
import * as fs from 'fs';
import type { Level } from '../types';

const CHAPTER_DIRS: Record<number, string> = {
  1: 'ch1-signal-contact',
  2: 'ch2-pattern-recognition',
  3: 'ch3-syntax-awakening',
  4: 'ch4-transmission',
  5: 'ch5-rex',
  6: 'ch6-origin',
};

const TOTAL_CHAPTERS = 5;
const LEVELS_PER_CHAPTER = 5;

let dataRoot: string | null = null;

export function setDataRoot(root: string): void {
  dataRoot = root;
}

function getDataRoot(): string {
  if (dataRoot) {
    return dataRoot;
  }
  return path.join(__dirname, '..', 'data', 'levels');
}

export function loadChapterLevels(chapter: number): Level[] {
  const dir = CHAPTER_DIRS[chapter];
  if (!dir) {
    return [];
  }

  const fullPath = path.join(getDataRoot(), dir);
  if (!fs.existsSync(fullPath)) {
    return [];
  }

  const files = fs.readdirSync(fullPath)
    .filter(f => f.endsWith('.json'))
    .sort();

  return files.map(f => {
    const content = fs.readFileSync(path.join(fullPath, f), 'utf-8');
    return JSON.parse(content) as Level;
  });
}

export function getAllLevels(): Level[] {
  const levels: Level[] = [];
  for (let ch = 1; ch <= TOTAL_CHAPTERS; ch++) {
    levels.push(...loadChapterLevels(ch));
  }
  return levels;
}

export function getLevelById(id: string): Level | undefined {
  const chapterIds = Object.keys(CHAPTER_DIRS).map(Number).sort((a, b) => a - b);
  for (const ch of chapterIds) {
    const levels = loadChapterLevels(ch);
    const found = levels.find(l => l.id === id);
    if (found) {
      return found;
    }
  }
  return undefined;
}

export function isChapterUnlocked(
  chapter: number,
  unlockedChapters: number[]
): boolean {
  return unlockedChapters.includes(chapter);
}

export function getChapterForLevel(levelId: string): number | undefined {
  const level = getLevelById(levelId);
  return level?.chapter;
}

export function shouldUnlockNextChapter(
  completedLevelIds: string[],
  currentChapter: number
): boolean {
  const levels = loadChapterLevels(currentChapter);
  if (levels.length === 0) {
    return false;
  }
  return levels.every(l => completedLevelIds.includes(l.id));
}

export function getNextChapter(currentChapter: number): number | null {
  const next = currentChapter + 1;
  return next <= TOTAL_CHAPTERS ? next : null;
}

export const HIDDEN_CHAPTER = 6;

/**
 * Check if the hidden chapter should be unlocked.
 * Condition: all standard levels completed with 'perfect' status.
 */
export function shouldUnlockHiddenChapter(
  completedLevels: Record<string, { judgeResult: { status: string } }[]>
): boolean {
  const allLevels = getAllLevels();
  if (allLevels.length === 0) return false;

  return allLevels.every(level => {
    const attempts = completedLevels[level.id];
    return attempts?.some(a => a.judgeResult.status === 'perfect');
  });
}

export { TOTAL_CHAPTERS, LEVELS_PER_CHAPTER };
