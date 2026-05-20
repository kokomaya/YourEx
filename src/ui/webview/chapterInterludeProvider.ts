import * as vscode from 'vscode';
import { getWebviewContent, getVisualConfigFromSettings } from './webviewHelper';
import type { Locale } from '../../i18n/types';

export class ChapterInterludeProvider {
  private _panel: vscode.WebviewPanel | undefined;
  private _locale: Locale = 'zh-CN';
  private _onDidComplete = new vscode.EventEmitter<number>();
  /** Fires with the chapterId when the player clicks the proceed button. */
  readonly onDidComplete = this._onDidComplete.event;

  /** Direct callback invoked when the player clicks proceed (bypasses EventEmitter). */
  private _directCallback: ((chapterId: number) => void) | undefined;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  setLocale(locale: Locale): void { this._locale = locale; }

  broadcastLocale(locale: Locale): void {
    this._locale = locale;
    this._panel?.webview.postMessage({ command: 'localeChanged', locale });
  }

  /**
   * Show the chapter interlude screen.
   * @param chapterId Chapter to display
   * @param onComplete Optional direct callback invoked when user proceeds (more reliable than onDidComplete event)
   */
  show(chapterId: number, onComplete?: (chapterId: number) => void): void {
    this._directCallback = onComplete;

    if (this._panel) { this._panel.reveal(); return; }

    const titles: Record<number, string> = {
      2: 'YourEx — Response',
      3: 'YourEx — Awakening',
      4: 'YourEx — Transmit',
      5: 'YourEx — Contact',
    };

    this._panel = vscode.window.createWebviewPanel(
      'yourex-chapter-interlude', titles[chapterId] ?? 'YourEx — Interlude', vscode.ViewColumn.One,
      { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist')] }
    );

    this._panel.webview.html = getWebviewContent(
      this._panel.webview, this._extensionUri, 'chapterInterlude',
      getVisualConfigFromSettings(), this._locale, { chapterId }
    );

    this._panel.webview.onDidReceiveMessage((message: { command: string; chapterId?: number; locale?: string }) => {
      if (message.command === 'beginChapter') {
        const resolvedId = message.chapterId ?? chapterId;
        // Invoke callback BEFORE disposing to avoid any lifecycle issues
        const cb = this._directCallback;
        this._directCallback = undefined;
        if (cb) {
          cb(resolvedId);
        }
        this._onDidComplete.fire(resolvedId);
        this._panel?.dispose();
      } else if (message.command === 'switchLanguage' && message.locale) {
        vscode.commands.executeCommand('yourex.switchLanguage', message.locale);
      }
    });

    this._panel.onDidDispose(() => { this._panel = undefined; });
  }

  dispose(): void { this._panel?.dispose(); this._onDidComplete.dispose(); }
}
