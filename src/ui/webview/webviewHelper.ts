import * as vscode from 'vscode';
import type { WebViewType } from '../../types';
import type { Locale } from '../../i18n/types';

export interface VisualConfigPayload {
  effectsEnabled: boolean;
  motionLevel: 'off' | 'low' | 'medium' | 'high';
  blurEnabled: boolean;
  backgroundIntensity: number;
  chapterThemeOverride: number;
  cockpitOverlayOpacity: number;
  starfieldSpeedMultiplier: number;
}

export function getVisualConfigFromSettings(): VisualConfigPayload {
  const config = vscode.workspace.getConfiguration('yourex.visual');
  return {
    effectsEnabled: config.get<boolean>('effectsEnabled', true),
    motionLevel: config.get<'off' | 'low' | 'medium' | 'high'>('motionLevel', 'medium'),
    blurEnabled: config.get<boolean>('blurEnabled', true),
    backgroundIntensity: config.get<number>('backgroundIntensity', 60),
    chapterThemeOverride: config.get<number>('chapterThemeOverride', 0),
    cockpitOverlayOpacity: config.get<number>('cockpitOverlayOpacity', 55),
    starfieldSpeedMultiplier: config.get<number>('starfieldSpeedMultiplier', 1),
  };
}

export interface WebviewBootContext {
  /** Whether the player has any persisted progress. Drives optional UI like the Welcome reset link. */
  hasProgress?: boolean;
  /** Chapter ID for chapter interlude screens. */
  chapterId?: number;
}

export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  viewType: WebViewType,
  visualConfig: VisualConfigPayload = getVisualConfigFromSettings(),
  locale: Locale = 'zh-CN',
  bootContext: WebviewBootContext = {},
): string {
  const distUri = vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist');
  // Certificate has its own Vite entry so the heavy @react-pdf/renderer chunk
  // never loads in the main game webviews (it depends on Node-style globals
  // that crash plain webviews at module-evaluation time).
  const isCertificate = viewType === 'certificate';
  const scriptName = isCertificate ? 'certificate.js' : 'index.js';
  const styleName = isCertificate ? 'certificate.css' : 'index.css';
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(distUri, 'assets', scriptName)
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(distUri, 'assets', styleName)
  );
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data: blob:;">
  <link rel="stylesheet" href="${styleUri}">
  <title>YourEx</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.__YOUREX_VIEW_TYPE__ = '${viewType}';
    window.__YOUREX_VISUAL_CONFIG__ = ${JSON.stringify(visualConfig)};
    window.__YOUREX_LOCALE__ = '${locale}';
    window.__YOUREX_BOOT_CONTEXT__ = ${JSON.stringify(bootContext)};
  </script>
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
