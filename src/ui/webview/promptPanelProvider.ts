import * as vscode from 'vscode';
import { getWebviewContent } from './webviewHelper';

export class PromptPanelProvider {
  private _panel: vscode.WebviewPanel | undefined;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  show(levelId?: string): void {
    if (this._panel) {
      this._panel.reveal();
    } else {
      this._panel = vscode.window.createWebviewPanel(
        'yourex-prompt-panel',
        'YourEx — Signal Decryption',
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
        'promptPanel'
      );

      this._panel.webview.onDidReceiveMessage((message) => {
        // TODO: Phase 3 - Task 3.4
        console.log('[YourEx] WebView message:', message);
      });

      this._panel.onDidDispose(() => {
        this._panel = undefined;
      });
    }

    if (levelId) {
      // TODO: Phase 3 - Task 3.4: Send level data to webview
    }
  }

  dispose(): void {
    this._panel?.dispose();
  }
}
