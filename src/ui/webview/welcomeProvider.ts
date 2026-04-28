import * as vscode from 'vscode';
import { getWebviewContent, getVisualConfigFromSettings } from './webviewHelper';
import type { Locale } from '../../i18n/types';
import type { GameStateManager } from '../../state/gameState';

export class WelcomeProvider {
  private _panel: vscode.WebviewPanel | undefined;
  private _locale: Locale = 'zh-CN';
  private _gameState: GameStateManager | undefined;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  setLocale(locale: Locale): void {
    this._locale = locale;
  }

  setGameState(gameState: GameStateManager): void {
    this._gameState = gameState;
  }

  broadcastLocale(locale: Locale): void {
    this._locale = locale;
    this._panel?.webview.postMessage({ command: 'localeChanged', locale });
  }

  show(): void {
    if (this._panel) {
      this._panel.reveal();
      return;
    }

    this._panel = vscode.window.createWebviewPanel(
      'yourex-welcome',
      'YourEx — System Booting…',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist'),
        ],
      }
    );

    const hasProgress =
      !!this._gameState &&
      (this._gameState.state.startTime !== null || this._gameState.state.totalAttempts > 0);

    this._panel.webview.html = getWebviewContent(
      this._panel.webview,
      this._extensionUri,
      'welcome',
      getVisualConfigFromSettings(),
      this._locale,
      { hasProgress }
    );

    this._panel.webview.onDidReceiveMessage((message: { command: string; locale?: string }) => {
      if (message.command === 'startDecryption') {
        this._panel?.dispose();
        vscode.commands.executeCommand('yourex.startDecryption');
      } else if (message.command === 'switchLanguage' && message.locale) {
        vscode.commands.executeCommand('yourex.switchLanguage', message.locale);
      } else if (message.command === 'resetProgress') {
        vscode.commands.executeCommand('yourex.resetProgress');
      }
    });

    this._panel.onDidDispose(() => {
      this._panel = undefined;
    });
  }

  dispose(): void {
    this._panel?.dispose();
  }
}
