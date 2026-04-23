import * as vscode from 'vscode';
import { getWebviewContent, getVisualConfigFromSettings } from './webviewHelper';
import type { GameStateManager } from '../../state/gameState';
import { computeLeaderboard } from '../../engine/leaderboard';
import type { Locale } from '../../i18n/types';

export class LeaderboardProvider {
  private _panel: vscode.WebviewPanel | undefined;
  private _gameState: GameStateManager | undefined;
  private _locale: Locale = 'zh-CN';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  setLocale(locale: Locale): void {
    this._locale = locale;
  }

  broadcastLocale(locale: Locale): void {
    this._locale = locale;
    this._panel?.webview.postMessage({ command: 'localeChanged', locale });
  }

  setGameState(gameState: GameStateManager): void {
    this._gameState = gameState;
  }

  show(): void {
    if (this._panel) {
      this._panel.reveal();
      return;
    }

    this._panel = vscode.window.createWebviewPanel(
      'yourex-leaderboard',
      'YourEx — Leaderboard',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist'),
        ],
      }
    );

    this._panel.webview.html = getWebviewContent(
      this._panel.webview,
      this._extensionUri,
      'leaderboard',
      getVisualConfigFromSettings(),
      this._locale
    );

    this._panel.webview.onDidReceiveMessage((msg) => {
      if (msg.command === 'ready') {
        this.sendLeaderboardData();
      }
    });

    this._panel.onDidDispose(() => {
      this._panel = undefined;
    });
  }

  private sendLeaderboardData(): void {
    if (!this._panel || !this._gameState) return;
    const entries = computeLeaderboard(this._gameState.state);
    this._panel.webview.postMessage({ command: 'showLeaderboard', entries });
  }

  dispose(): void {
    this._panel?.dispose();
  }
}
