import { parseRunMode, type RunMode } from './runMode';

const STORAGE_KEY = 'yourex.runMode';

export interface IModeService {
  getMode(): RunMode;
  setMode(mode: RunMode): Promise<void>;
  onDidChangeMode(listener: (mode: RunMode) => void): { dispose(): void };
}

export class ModeService implements IModeService {
  private _mode: RunMode;
  private _persist: ((key: string, value: string) => PromiseLike<void> | void) | null = null;
  private _load: ((key: string) => string | undefined) | null = null;
  private readonly _listeners = new Set<(mode: RunMode) => void>();

  constructor(private readonly _defaultMode: RunMode = 'user') {
    this._mode = _defaultMode;
  }

  bindStorage(
    persist: (key: string, value: string) => PromiseLike<void> | void,
    load: (key: string) => string | undefined
  ): void {
    this._persist = persist;
    this._load = load;
    this.restore();
  }

  getMode(): RunMode {
    return this._mode;
  }

  async setMode(mode: RunMode): Promise<void> {
    if (mode === this._mode) {
      return;
    }

    this._mode = mode;
    await this.save();
    this.emit();
  }

  onDidChangeMode(listener: (mode: RunMode) => void): { dispose(): void } {
    this._listeners.add(listener);
    return {
      dispose: () => {
        this._listeners.delete(listener);
      },
    };
  }

  private emit(): void {
    for (const listener of this._listeners) {
      listener(this._mode);
    }
  }

  private async save(): Promise<void> {
    if (!this._persist) {
      return;
    }
    await this._persist(STORAGE_KEY, this._mode);
  }

  private restore(): void {
    if (!this._load) {
      return;
    }

    const raw = this._load(STORAGE_KEY);
    this._mode = parseRunMode(raw, this._defaultMode);
  }
}
