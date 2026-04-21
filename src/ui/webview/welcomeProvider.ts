import * as vscode from 'vscode';
import { getWebviewContent } from './webviewHelper';

export class WelcomeProvider {
  private _panel: vscode.WebviewPanel | undefined;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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

    this._panel.webview.html = getWebviewContent(
      this._panel.webview,
      this._extensionUri,
      'welcome'
    );

    this._panel.webview.onDidReceiveMessage((message: { command: string }) => {
      if (message.command === 'startDecryption') {
        this._panel?.dispose();
        vscode.commands.executeCommand('yourex.startDecryption');
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
