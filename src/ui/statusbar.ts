import * as vscode from 'vscode';
import type { RunMode } from '../mode/runMode';
import { t } from '../i18n';

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
    const comboText = combo > 0 ? t('statusbar.combo', { combo }) : '';
    const modeText = mode === 'developer' ? t('statusbar.devTag') : '';
    this._item.text = t('statusbar.progress', { xp, comboText, percent: decryptPercent, modeText });
    this._item.tooltip = mode === 'developer'
      ? t('statusbar.tooltip.dev')
      : t('statusbar.tooltip');
    this._item.show();
  }

  dispose(): void {
    this._item.dispose();
  }
}
