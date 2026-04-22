import { beforeEach, describe, expect, it } from 'vitest';
import * as path from 'path';
import { setDataRoot } from '../../src/engine/levelLoader';
import { GameStateManager } from '../../src/state/gameState';
import { UserAccessPolicy } from '../../src/access/userAccessPolicy';
import { DeveloperAccessPolicy } from '../../src/access/developerAccessPolicy';
import { createAccessPolicy } from '../../src/access/accessPolicyFactory';

const DATA_ROOT = path.join(__dirname, '..', '..', 'src', 'data', 'levels');

beforeEach(() => {
  setDataRoot(DATA_ROOT);
});

describe('Access policies', () => {
  it('user policy respects unlocked chapters', () => {
    const gameState = new GameStateManager();
    const policy = new UserAccessPolicy(gameState);

    expect(policy.isChapterUnlocked(1)).toBe(true);
    expect(policy.isChapterUnlocked(2)).toBe(false);
    expect(policy.canOpenLevel('level_01')).toBe(true);
    expect(policy.canOpenLevel('level_06')).toBe(false);

    gameState.unlockChapter(2);
    expect(policy.canOpenLevel('level_06')).toBe(true);
  });

  it('developer policy bypasses unlock checks', () => {
    const policy = new DeveloperAccessPolicy();

    expect(policy.isChapterUnlocked(1)).toBe(true);
    expect(policy.isChapterUnlocked(5)).toBe(true);
    expect(policy.canOpenLevel('level_01')).toBe(true);
    expect(policy.canOpenLevel('level_25')).toBe(true);
    expect(policy.canOpenLevel('does_not_exist')).toBe(false);
  });

  it('factory returns policy by mode', () => {
    const gameState = new GameStateManager();

    const userPolicy = createAccessPolicy('user', gameState);
    const devPolicy = createAccessPolicy('developer', gameState);

    expect(userPolicy.mode).toBe('user');
    expect(devPolicy.mode).toBe('developer');
  });
});
