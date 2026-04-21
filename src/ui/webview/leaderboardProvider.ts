import * as vscode from 'vscode';
import { getWebviewContent } from './webviewHelper';
import type { GameStateManager } from '../../state/gameState';
import { computeLeaderboard } from '../../engine/leaderboard';

export class LeaderboardProvider {
  private _panel: vscode.WebviewPanel | undefined;
  private _gameState: GameStateManager | undefined;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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
      'leaderboard'
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
