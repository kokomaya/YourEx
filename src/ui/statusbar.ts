import * as vscode from 'vscode';

export class StatusBarManager {
  private _item: vscode.StatusBarItem;

  constructor() {
    this._item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this._item.command = 'yourex.signalProgress';
  }

  update(xp: number, combo: number, decryptPercent: number): void {
    const comboText = combo > 0 ? ` | $(zap) x${combo}` : '';
    this._item.text = `$(radio-tower) XP: ${xp}${comboText} | Decrypt: ${decryptPercent}%`;
    this._item.tooltip = 'YourEx — Signal Progress';
    this._item.show();
  }

  dispose(): void {
    this._item.dispose();
  }
}
