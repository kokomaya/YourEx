import * as vscode from 'vscode';
import type { WebViewType } from '../../types';

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

export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  viewType: WebViewType,
  visualConfig: VisualConfigPayload = getVisualConfigFromSettings()
): string {
  const distUri = vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist');
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(distUri, 'assets', 'index.js')
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(distUri, 'assets', 'index.css')
  );
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>YourEx</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.__YOUREX_VIEW_TYPE__ = '${viewType}';
    window.__YOUREX_VISUAL_CONFIG__ = ${JSON.stringify(visualConfig)};
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
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
