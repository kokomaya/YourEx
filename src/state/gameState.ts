import type { GameState } from '../types';
import { DEFAULT_GAME_STATE } from '../types';

export class GameStateManager {
  private _state: GameState;

  constructor() {
    this._state = { ...DEFAULT_GAME_STATE };
  }

  get state(): Readonly<GameState> {
    return this._state;
  }

  update(partial: Partial<GameState>): void {
    this._state = { ...this._state, ...partial };
  }

  reset(): void {
    this._state = { ...DEFAULT_GAME_STATE };
  }

  // TODO: Phase 1 - Task 1.5: persistence to context.globalState
  toJSON(): string {
    return JSON.stringify(this._state);
  }

  fromJSON(json: string): void {
    this._state = { ...DEFAULT_GAME_STATE, ...JSON.parse(json) };
  }
}
