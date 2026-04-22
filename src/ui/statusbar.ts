import * as vscode from 'vscode';
import type { RunMode } from '../mode/runMode';

export class StatusBarManager {
  private _item: vscode.StatusBarItem;

  constructor() {
    this._item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this._item.command = 'yourex.signalProgress';
  }

  update(xp: number, combo: number, decryptPercent: number, mode: RunMode = 'user'): void {
    const comboText = combo > 0 ? ` | $(zap) x${combo}` : '';
    const modeText = mode === 'developer' ? ' [DEV]' : '';
    this._item.text = `$(radio-tower) XP: ${xp}${comboText} | Decrypt: ${decryptPercent}%${modeText}`;
    this._item.tooltip = mode === 'developer'
      ? 'YourEx — Signal Progress (Developer Mode)'
      : 'YourEx — Signal Progress';
    this._item.show();
  }

  dispose(): void {
    this._item.dispose();
  }
}
