import type { GameState, LevelAttempt } from '../types';
import { DEFAULT_GAME_STATE } from '../types';

const STORAGE_KEY = 'yourex.gameState';

export class GameStateManager {
  private _state: GameState;
  private _persist: ((key: string, value: string) => void) | null = null;
  private _load: ((key: string) => string | undefined) | null = null;

  constructor() {
    this._state = structuredClone(DEFAULT_GAME_STATE);
  }

  /** Bind to VS Code context.globalState for persistence */
  bindStorage(
    persist: (key: string, value: string) => void,
    load: (key: string) => string | undefined
  ): void {
    this._persist = persist;
    this._load = load;
    this.restore();
  }

  get state(): Readonly<GameState> {
    return this._state;
  }

  update(partial: Partial<GameState>): void {
    this._state = { ...this._state, ...partial };
    this.save();
  }

  reset(): void {
    this._state = structuredClone(DEFAULT_GAME_STATE);
    this.save();
  }

  // --- Level completion ---

  recordAttempt(attempt: LevelAttempt): void {
    const prev = this._state.completedLevels[attempt.levelId] ?? [];
    this._state.completedLevels = {
      ...this._state.completedLevels,
      [attempt.levelId]: [...prev, attempt],
    };
    this._state.totalAttempts += 1;
    if (attempt.prompt) {
      this._state.totalPromptLength += attempt.prompt.length;
    }
    this.save();
  }

  isLevelCompleted(levelId: string): boolean {
    const attempts = this._state.completedLevels[levelId];
    if (!attempts) {
      return false;
    }
    return attempts.some(a =>
      a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass'
    );
  }

  getCompletedLevelIds(): string[] {
    return Object.keys(this._state.completedLevels).filter(id =>
      this.isLevelCompleted(id)
    );
  }

  getLevelAttempts(levelId: string): LevelAttempt[] {
    return this._state.completedLevels[levelId] ?? [];
  }

  getBestAttempt(levelId: string): LevelAttempt | undefined {
    const attempts = this.getLevelAttempts(levelId);
    return attempts
      .filter(a => a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass')
      .sort((a, b) => (b.promptScore?.total ?? 0) - (a.promptScore?.total ?? 0))[0];
  }

  // --- Chapter unlock ---

  unlockChapter(chapter: number): void {
    if (!this._state.unlockedChapters.includes(chapter)) {
      this._state.unlockedChapters = [...this._state.unlockedChapters, chapter].sort();
      this.save();
    }
  }

  isChapterUnlocked(chapter: number): boolean {
    return this._state.unlockedChapters.includes(chapter);
  }

  // --- XP & Combo ---

  addXp(amount: number): void {
    this._state.xp += amount;
    this.save();
  }

  setCombo(combo: number): void {
    this._state.combo = combo;
    if (combo > this._state.maxCombo) {
      this._state.maxCombo = combo;
    }
    this.save();
  }

  // --- Achievement ---

  unlockAchievement(achievementId: string): void {
    if (!this._state.unlockedAchievements.includes(achievementId)) {
      this._state.unlockedAchievements = [
        ...this._state.unlockedAchievements,
        achievementId,
      ];
      this.save();
    }
  }

  // --- Timer ---

  startTimer(): void {
    if (this._state.startTime === null) {
      this._state.startTime = Date.now();
      this.save();
    }
  }

  getElapsedMs(): number {
    if (this._state.startTime === null) {
      return 0;
    }
    return Date.now() - this._state.startTime;
  }

  // --- Persistence ---

  private save(): void {
    if (this._persist) {
      this._persist(STORAGE_KEY, JSON.stringify(this._state));
    }
  }

  private restore(): void {
    if (!this._load) {
      return;
    }
    const raw = this._load(STORAGE_KEY);
    if (raw) {
      try {
        this._state = { ...structuredClone(DEFAULT_GAME_STATE), ...JSON.parse(raw) };
      } catch {
        this._state = structuredClone(DEFAULT_GAME_STATE);
      }
    }
  }

  toJSON(): string {
    return JSON.stringify(this._state);
  }

  fromJSON(json: string): void {
    this._state = { ...structuredClone(DEFAULT_GAME_STATE), ...JSON.parse(json) };
    this.save();
  }
}
