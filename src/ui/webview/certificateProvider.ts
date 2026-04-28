import * as vscode from 'vscode';
import { getWebviewContent, getVisualConfigFromSettings } from './webviewHelper';
import type { Locale } from '../../i18n/types';
import type { GameStateManager } from '../../state/gameState';
import { buildJourneyCertificateData, generateCertificateId, validatePlayerName } from '../../engine/certificateBuilder';
import { t } from '../../i18n';

export class CertificateProvider {
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
    if (this._gameState) {
      this.sendCertificateData();
    }
  }

  show(): void {
    if (!this._gameState) {
      vscode.window.showErrorMessage('[YourEx] Game state not initialized.');
      return;
    }

    if (this._panel) {
      this._panel.reveal(vscode.ViewColumn.One);
      this.sendCertificateData();
      return;
    }

    this._panel = vscode.window.createWebviewPanel(
      'yourex-journey-certificate',
      t('certificate.openWebviewTitle'),
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist'),
        ],
      }
    );

    this._panel.webview.html = getWebviewContent(
      this._panel.webview,
      this._extensionUri,
      'certificate',
      getVisualConfigFromSettings(),
      this._locale
    );

    this._panel.webview.onDidReceiveMessage((message: WebViewIncoming) => {
      void this.handleMessage(message);
    });

    this._panel.onDidDispose(() => {
      this._panel = undefined;
    });

    // Initial data push (after webview script likely loads — webview will also
    // send 'ready' which triggers a follow-up push).
    this.sendCertificateData();
  }

  private async handleMessage(message: WebViewIncoming): Promise<void> {
    switch (message.command) {
      case 'ready':
        this.sendCertificateData();
        return;

      case 'closeCertificate':
        this._panel?.dispose();
        return;

      case 'switchLanguage':
        if (message.locale) {
          await vscode.commands.executeCommand('yourex.switchLanguage', message.locale);
        }
        return;

      case 'setCertificatePlayerName':
        if (this._gameState && message.name) {
          const sanitized = validatePlayerName(message.name);
          if (sanitized) {
            this._gameState.setCertificatePlayerName(sanitized);
            this.sendCertificateData();
          }
        }
        return;

      case 'generateCertificatePdf':
        await this.handleSaveRequest(message);
        return;
    }
  }

  private async handleSaveRequest(
    message: { pdfBytes?: number[]; fileName?: string },
  ): Promise<void> {
    if (!message.pdfBytes || !this._panel) return;

    const buf = Buffer.from(Uint8Array.from(message.pdfBytes));
    const fileName = message.fileName || 'YourEx_Journey_Certificate.pdf';

    const defaultUri = vscode.Uri.file(
      vscode.workspace.workspaceFolders?.[0]
        ? `${vscode.workspace.workspaceFolders[0].uri.fsPath}/${fileName}`
        : fileName,
    );

    try {
      const target = await vscode.window.showSaveDialog({
        defaultUri,
        filters: { PDF: ['pdf'] },
        title: t('certificate.commandTitle'),
        saveLabel: t('certificate.downloadButton'),
      });
      if (!target) return;

      await vscode.workspace.fs.writeFile(target, buf);

      this._panel.webview.postMessage({
        command: 'certificateSaved',
        filePath: target.fsPath,
      });

      const action = await vscode.window.showInformationMessage(
        t('certificate.savedNotification', { path: target.fsPath }),
        t('certificate.openFile'),
      );
      if (action === t('certificate.openFile')) {
        await vscode.env.openExternal(target);
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e);
      this._panel.webview.postMessage({
        command: 'certificateSaveFailed',
        error,
      });
      vscode.window.showErrorMessage(t('certificate.saveFailed', { error }));
    }
  }

  private sendCertificateData(): void {
    if (!this._panel || !this._gameState) return;

    let id = this._gameState.state.certificateId;
    if (!id) {
      id = generateCertificateId();
      this._gameState.setCertificateId(id);
    }

    const data = buildJourneyCertificateData(this._gameState, id);
    this._panel.webview.postMessage({
      command: 'loadCertificateData',
      data,
    });
  }

  dispose(): void {
    this._panel?.dispose();
  }
}

type WebViewIncoming =
  | { command: 'ready' }
  | { command: 'closeCertificate' }
  | { command: 'switchLanguage'; locale?: string }
  | { command: 'setCertificatePlayerName'; name?: string }
  | { command: 'generateCertificatePdf'; pdfBytes?: number[]; fileName?: string };
