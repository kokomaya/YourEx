import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';
import {
  loadChapterLevels,
  getLevelById,
  getAllLevels,
  isChapterUnlocked,
  shouldUnlockNextChapter,
  getNextChapter,
  setDataRoot,
} from '../../src/engine/levelLoader';

const DATA_ROOT = path.join(__dirname, '..', '..', 'src', 'data', 'levels');

beforeEach(() => {
  setDataRoot(DATA_ROOT);
});

describe('loadChapterLevels', () => {
  it('should load 5 levels for chapter 1', () => {
    const levels = loadChapterLevels(1);
    expect(levels).toHaveLength(5);
  });

  it('should return levels sorted by id', () => {
    const levels = loadChapterLevels(1);
    const ids = levels.map(l => l.id);
    expect(ids).toEqual(['level_01', 'level_02', 'level_03', 'level_04', 'level_05']);
  });

  it('should return empty array for non-existent chapter', () => {
    expect(loadChapterLevels(99)).toEqual([]);
  });

  it('each level should have required fields', () => {
    const levels = loadChapterLevels(1);
    for (const level of levels) {
      expect(level.id).toBeTruthy();
      expect(level.title).toBeTruthy();
      expect(level.chapter).toBe(1);
      expect(['easy', 'medium', 'hard']).toContain(level.difficulty);
      expect(level.input.length).toBeGreaterThan(0);
      expect(level.expected.length).toBeGreaterThan(0);
      expect(level.hints.length).toBeGreaterThan(0);
      expect(level.feedback.onPass).toBeTruthy();
      expect(level.feedback.onFail).toBeTruthy();
    }
  });
});

describe('getLevelById', () => {
  it('should find level_01', () => {
    const level = getLevelById('level_01');
    expect(level).toBeDefined();
    expect(level!.title).toBe('Hello, rEx');
  });

  it('should return undefined for non-existent id', () => {
    expect(getLevelById('nonexistent')).toBeUndefined();
  });
});

describe('getAllLevels', () => {
  it('should return at least chapter 1 levels', () => {
    const all = getAllLevels();
    expect(all.length).toBeGreaterThanOrEqual(5);
  });
});

describe('isChapterUnlocked', () => {
  it('chapter 1 should be unlocked by default', () => {
    expect(isChapterUnlocked(1, [1])).toBe(true);
  });

  it('chapter 2 should be locked by default', () => {
    expect(isChapterUnlocked(2, [1])).toBe(false);
  });

  it('multiple chapters can be unlocked', () => {
    expect(isChapterUnlocked(3, [1, 2, 3])).toBe(true);
  });
});

describe('shouldUnlockNextChapter', () => {
  it('should return true when all chapter 1 levels are completed', () => {
    const completed = ['level_01', 'level_02', 'level_03', 'level_04', 'level_05'];
    expect(shouldUnlockNextChapter(completed, 1)).toBe(true);
  });

  it('should return false when not all levels are completed', () => {
    const completed = ['level_01', 'level_02'];
    expect(shouldUnlockNextChapter(completed, 1)).toBe(false);
  });
});

describe('getNextChapter', () => {
  it('should return 2 for chapter 1', () => {
    expect(getNextChapter(1)).toBe(2);
  });

  it('should return null for the last chapter', () => {
    expect(getNextChapter(5)).toBeNull();
  });
});
