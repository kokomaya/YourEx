import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
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

      case 'generateCertificateImage':
        await this.handleSaveRequest(message);
        return;
    }
  }

  /**
   * Persist the rendered image straight into the user's Documents folder
   * so the export feels one-click. We pick a non-colliding filename, write,
   * and offer "Open File" / "Show in Explorer" as a follow-up toast.
   */
  private async handleSaveRequest(
    message: { imageBytes?: number[]; fileName?: string },
  ): Promise<void> {
    if (!message.imageBytes || !this._panel) return;

    const buf = Buffer.from(Uint8Array.from(message.imageBytes));
    const baseName = (message.fileName || 'YourEx_Journey_Certificate.png').replace(/[\\/:*?"<>|]+/g, '_');
    const targetDir = resolveDocumentsDir();
    const targetPath = uniquePath(targetDir, baseName);
    const targetUri = vscode.Uri.file(targetPath);

    try {
      // Ensure the directory exists (Documents is always present on stock
      // installs, but be defensive — locked-down profiles vary).
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(targetDir));
      await vscode.workspace.fs.writeFile(targetUri, buf);

      this._panel.webview.postMessage({
        command: 'certificateSaved',
        filePath: targetPath,
      });

      const open = t('certificate.openFile');
      const reveal = t('certificate.revealInExplorer');
      const choice = await vscode.window.showInformationMessage(
        t('certificate.savedNotification', { path: targetPath }),
        open,
        reveal,
      );
      if (choice === open) {
        await vscode.env.openExternal(targetUri);
      } else if (choice === reveal) {
        await vscode.commands.executeCommand('revealFileInOS', targetUri);
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
  | { command: 'generateCertificateImage'; imageBytes?: number[]; fileName?: string };

/**
 * Resolve a user-friendly Documents directory across platforms.
 * Honors XDG_DOCUMENTS_DIR on Linux when set, otherwise falls back to
 * the conventional ~/Documents path.
 */
function resolveDocumentsDir(): string {
  const home = os.homedir();
  // Linux respects XDG_DOCUMENTS_DIR if defined; otherwise default.
  const xdg = process.env.XDG_DOCUMENTS_DIR;
  if (xdg && xdg.trim().length > 0) return xdg;
  return path.join(home, 'Documents');
}

/**
 * Avoid clobbering an existing certificate with the same name. Append
 * "(2)", "(3)", ... before the extension until the path is free.
 */
function uniquePath(dir: string, baseName: string): string {
  const ext = path.extname(baseName);
  const stem = baseName.slice(0, baseName.length - ext.length);
  let candidate = path.join(dir, baseName);
  let i = 1;
  // Sync existsSync-equivalent via require('fs') to avoid an async dance
  // for what is just a name-collision check.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs: typeof import('fs') = require('fs');
  while (fs.existsSync(candidate)) {
    i += 1;
    candidate = path.join(dir, `${stem} (${i})${ext}`);
    if (i > 999) break;
  }
  return candidate;
}
