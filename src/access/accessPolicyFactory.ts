import type { GameStateManager } from '../state/gameState';
import type { RunMode } from '../mode/runMode';
import type { IAccessPolicy } from './IAccessPolicy';
import { UserAccessPolicy } from './userAccessPolicy';
import { DeveloperAccessPolicy } from './developerAccessPolicy';

export function createAccessPolicy(mode: RunMode, gameState: GameStateManager): IAccessPolicy {
  if (mode === 'developer') {
    return new DeveloperAccessPolicy();
  }
  return new UserAccessPolicy(gameState);
}
