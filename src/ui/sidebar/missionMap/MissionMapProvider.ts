import * as vscode from 'vscode';
import type { IMapDataSource } from './IMapDataSource';
import type { MapWebviewToExt } from './mapMessages';
import { t } from '../../../i18n/t';

export class MissionMapProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'yourex-levels';

  private _view?: vscode.WebviewView;
  private _dataSource: IMapDataSource | null = null;
  private _activeLevelId: string | null = null;
  private _onDidSelectLevel = new vscode.EventEmitter<string>();
  readonly onDidSelectLevel = this._onDidSelectLevel.event;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  setDataSource(ds: IMapDataSource): void {
    this._dataSource = ds;
  }

  refresh(): void {
    if (!this._view || !this._dataSource) return;
    const chapters = this._dataSource.getChapters();
    const certificateUnlocked = this._dataSource.isCertificateUnlocked();
    const hasProgress = this._dataSource.hasAnyProgress();
    this._view.webview.postMessage({
      command: 'loadMap',
      chapters,
      certificateUnlocked,
      hasProgress,
      resetLabel: t('reset.sidebarButton'),
      resetTooltip: t('reset.sidebarTooltip'),
    });
    if (this._activeLevelId) {
      this._view.webview.postMessage({ command: 'highlightLevel', levelId: this._activeLevelId });
    }
  }

  setActiveLevel(levelId: string | null): void {
    this._activeLevelId = levelId;
    if (this._view && levelId) {
      this._view.webview.postMessage({ command: 'highlightLevel', levelId });
    }
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg: MapWebviewToExt) => {
      switch (msg.command) {
        case 'ready':
          this.refresh();
          break;
        case 'selectLevel':
          this._onDidSelectLevel.fire(msg.levelId);
          break;
        case 'openJourneyCertificate':
          vscode.commands.executeCommand('yourex.openJourneyCertificate');
          break;
        case 'resetProgress':
          // Sidebar already enforced its own hold-to-confirm; skip the modal.
          vscode.commands.executeCommand('yourex.resetProgress', { skipConfirm: true });
          break;
      }
    });
  }

  private _getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<title>Mission Map</title>
<style>${MAP_CSS}</style>
</head>
<body>
<div id="map-root">
  <div id="chapter-tabs" role="tablist"></div>
  <div id="chapter-panel"></div>
  <div id="cert-footer" hidden>
    <button id="cert-footer-btn" type="button" title="Generate Journey Certificate">
      <span class="cert-footer-icon">📜</span>
      <span class="cert-footer-label">Journey Certificate</span>
    </button>
  </div>
  <div id="sys-ops" hidden>
    <button id="sys-ops-toggle" type="button" aria-expanded="false" aria-controls="sys-ops-panel">
      <span class="sys-ops__bracket">[</span>
      <span class="sys-ops__chevron">+</span>
      <span class="sys-ops__bracket">]</span>
      <span class="sys-ops__label">SYS_OPS</span>
      <span class="sys-ops__rule" aria-hidden="true"></span>
    </button>
    <div id="sys-ops-panel" hidden>
      <button id="reset-footer-btn" type="button" data-state="idle">
        <span class="reset-footer__chevron">&gt;&gt;</span>
        <span class="reset-footer__label">PURGE_TIMELINE</span>
        <span class="reset-footer__hint">[HOLD]</span>
        <span class="reset-footer__progress" aria-hidden="true"></span>
        <span class="reset-footer__scanline" aria-hidden="true"></span>
      </button>
      <div class="reset-footer__status" aria-live="polite"></div>
    </div>
  </div>
</div>
<script nonce="${nonce}">${MAP_JS}</script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) text += chars.charAt(Math.floor(Math.random() * chars.length));
  return text;
}

/* ─── Inline CSS ─── */
const MAP_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: transparent;
  color: var(--vscode-foreground, #ccc);
  font-family: var(--vscode-font-family, monospace);
  font-size: 12px;
  overflow-x: hidden;
}

/* ── Chapter tabs ── */
#chapter-tabs {
  display: flex;
  gap: 2px;
  padding: 4px 6px;
  border-bottom: 1px solid var(--vscode-panel-border, #333);
  overflow-x: auto;
  flex-shrink: 0;
}
.chapter-tab {
  padding: 4px 8px;
  border: none;
  border-radius: 4px 4px 0 0;
  background: transparent;
  color: var(--vscode-foreground, #ccc);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
  opacity: 0.6;
  transition: opacity 0.2s, background 0.2s;
}
.chapter-tab:hover { opacity: 0.85; }
.chapter-tab[data-active="true"] {
  opacity: 1;
  background: var(--vscode-list-activeSelectionBackground, #094771);
  color: var(--vscode-list-activeSelectionForeground, #fff);
}
.chapter-tab[data-locked="true"] { opacity: 0.35; }

/* ── Chapter panel ── */
#chapter-panel { padding: 8px; }

.chapter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.chapter-header__name {
  font-size: 13px;
  font-weight: 600;
}
.chapter-header__progress {
  font-size: 11px;
  opacity: 0.6;
  margin-left: auto;
}

.progress-bar {
  width: 100%;
  height: 3px;
  background: var(--vscode-progressBar-background, #222);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}
.progress-bar__fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}

/* ── Nodes ── */
.node-list { display: flex; flex-direction: column; gap: 0; }

.node-row {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

/* Connector line between nodes */
.node-connector {
  width: 2px;
  height: 14px;
  margin-left: 15px;
  border-radius: 1px;
}
.node-connector[data-line="solid"] { background: var(--theme-color, #22d3ee); opacity: 0.5; }
.node-connector[data-line="dashed"] {
  background: repeating-linear-gradient(
    180deg,
    var(--theme-color, #22d3ee) 0 3px,
    transparent 3px 6px
  );
  opacity: 0.35;
}
.node-connector[data-line="locked"] { background: #444; opacity: 0.25; }

.node-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.node-btn:hover:not([disabled]) {
  background: var(--vscode-list-hoverBackground, rgba(255,255,255,0.06));
}
.node-btn[data-active="true"] {
  background: var(--vscode-list-activeSelectionBackground, #094771);
  color: var(--vscode-list-activeSelectionForeground, #fff);
  border-radius: 6px;
}
.node-btn:focus-visible {
  outline: 1px solid var(--vscode-focusBorder, #007acc);
  outline-offset: -1px;
}
.node-btn[disabled] { cursor: default; opacity: 0.4; }

/* Node circle */
.node-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: 2px solid #444;
  background: transparent;
  transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
}

.node-circle[data-status="perfect"] {
  border-color: var(--theme-color, #22d3ee);
  background: var(--theme-color, #22d3ee);
  color: #000;
  box-shadow: 0 0 8px var(--theme-color, #22d3ee);
}
.node-circle[data-status="passed"] {
  border-color: var(--theme-color, #22d3ee);
  background: color-mix(in srgb, var(--theme-color, #22d3ee) 30%, transparent);
  color: var(--theme-color, #22d3ee);
}
.node-circle[data-status="available"] {
  border-color: var(--theme-color, #22d3ee);
  border-style: solid;
  animation: nodePulse 2s ease-in-out infinite;
}
.node-circle[data-status="locked"] {
  border-style: dashed;
  border-color: #555;
  color: #555;
}

/* Node info */
.node-info { flex: 1; min-width: 0; }
.node-title {
  font-size: 12px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.node-meta {
  display: flex;
  gap: 6px;
  font-size: 10px;
  opacity: 0.6;
  margin-top: 1px;
}
.node-score {
  color: var(--theme-color, #22d3ee);
  font-weight: 600;
  font-size: 11px;
  flex-shrink: 0;
}

.difficulty-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.difficulty-dot[data-d="easy"] { background: #34d399; }
.difficulty-dot[data-d="medium"] { background: #fbbf24; }
.difficulty-dot[data-d="hard"] { background: #f87171; }

/* Locked overlay */
.chapter-locked-overlay {
  text-align: center;
  padding: 24px 16px;
  opacity: 0.5;
}
.chapter-locked-overlay__icon { font-size: 32px; margin-bottom: 8px; }
.chapter-locked-overlay__text { font-size: 12px; }

/* Animations */
@keyframes nodePulse {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  50% { box-shadow: 0 0 10px color-mix(in srgb, var(--theme-color, #22d3ee) 40%, transparent); }
}

@media (prefers-reduced-motion: reduce) {
  .node-circle[data-status="available"] { animation: none; }
}

/* ── Journey certificate footer ── */
#cert-footer {
  margin-top: 14px;
  padding: 10px 8px 4px 8px;
  border-top: 1px solid var(--vscode-panel-border, #333);
}
#cert-footer-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid color-mix(in srgb, var(--vscode-foreground, #ccc) 25%, transparent);
  border-radius: 6px;
  background: linear-gradient(120deg, rgba(52,245,197,0.08), rgba(255,210,122,0.08));
  color: var(--vscode-foreground, #ccc);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s, transform 0.15s;
}
#cert-footer-btn:hover {
  background: linear-gradient(120deg, rgba(52,245,197,0.18), rgba(255,210,122,0.18));
  border-color: #34f5c5;
  transform: translateY(-1px);
}
#cert-footer-btn .cert-footer-icon { font-size: 14px; }
#cert-footer-btn .cert-footer-label {
  flex: 1;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* ── SYS_OPS collapsible drawer (hosts dangerous controls below the fold) ── */
#sys-ops {
  /* Push well clear of the chapter panel — large gap is the first
     misclick defense. The drawer is collapsed by default. */
  margin-top: 28px;
  padding: 0 8px 14px 8px;
}
#sys-ops-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: rgba(255, 143, 163, 0.55);
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 9.5px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  padding: 6px 4px;
  opacity: 0.75;
  transition: color 0.15s, opacity 0.15s;
}
#sys-ops-toggle:hover {
  color: #ff8fa3;
  opacity: 1;
}
#sys-ops-toggle .sys-ops__bracket { color: rgba(255, 92, 122, 0.7); }
#sys-ops-toggle .sys-ops__chevron {
  color: #ff5c7a;
  width: 8px;
  text-align: center;
  display: inline-block;
}
#sys-ops-toggle .sys-ops__rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(255,92,122,0.25) 0%, transparent 100%);
  margin-left: 6px;
}
#sys-ops-toggle[aria-expanded="true"] .sys-ops__chevron::before { content: ''; }
#sys-ops-toggle[aria-expanded="true"] .sys-ops__chevron {
  /* swap + → − when open */
}
#sys-ops-panel {
  margin-top: 8px;
  /* Subtle indent so the dangerous control reads as nested under SYS_OPS */
  padding-left: 6px;
  border-left: 1px dashed rgba(255, 92, 122, 0.22);
}

/* ── Reset progress: terminal-style PURGE_TIMELINE control ── */
#reset-footer-btn {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 92, 122, 0.28);
  border-radius: 3px;
  background:
    linear-gradient(180deg, rgba(255, 92, 122, 0.05) 0%, rgba(255, 92, 122, 0.02) 100%),
    repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 2px,
      rgba(255, 92, 122, 0.04) 2px,
      rgba(255, 92, 122, 0.04) 3px
    );
  color: #ff8fa3;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 1.2px;
  cursor: pointer;
  text-align: left;
  text-transform: uppercase;
  transition: border-color 0.18s, color 0.18s, background-color 0.18s, text-shadow 0.18s;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}
#reset-footer-btn:hover {
  border-color: #ff5c7a;
  color: #ffd5dd;
  text-shadow: 0 0 6px rgba(255, 92, 122, 0.55);
}
#reset-footer-btn:hover .reset-footer__scanline {
  transform: translateY(120%);
}
#reset-footer-btn .reset-footer__chevron {
  color: #ff5c7a;
  opacity: 0.85;
}
#reset-footer-btn .reset-footer__label {
  flex: 1;
}
#reset-footer-btn .reset-footer__hint {
  font-size: 9px;
  letter-spacing: 1.5px;
  color: rgba(255, 143, 163, 0.55);
  border: 1px solid rgba(255, 92, 122, 0.35);
  padding: 1px 4px;
  border-radius: 2px;
  flex-shrink: 0;
}
#reset-footer-btn .reset-footer__scanline {
  position: absolute;
  left: 0; right: 0; top: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #ff5c7a 50%, transparent 100%);
  opacity: 0.7;
  transform: translateY(-100%);
  transition: transform 1.6s cubic-bezier(0.45, 0, 0.55, 1);
  pointer-events: none;
}
#reset-footer-btn .reset-footer__progress {
  position: absolute;
  left: 0; bottom: 0; top: 0;
  width: 0%;
  background: linear-gradient(90deg, rgba(255,92,122,0.18), rgba(255,92,122,0.32));
  border-right: 1px solid #ff5c7a;
  transition: width 60ms linear;
  pointer-events: none;
  z-index: 0;
}
#reset-footer-btn > *:not(.reset-footer__progress):not(.reset-footer__scanline) {
  position: relative;
  z-index: 1;
}

/* Charging state: red intensifies, hint flips to ABORT */
#reset-footer-btn[data-state="charging"] {
  border-color: #ff5c7a;
  color: #ffd5dd;
  text-shadow: 0 0 8px rgba(255, 92, 122, 0.8);
  animation: resetPulse 0.6s ease-in-out infinite;
}
#reset-footer-btn[data-state="charging"] .reset-footer__hint::before {
  content: 'RELEASE TO ABORT';
}
#reset-footer-btn[data-state="charging"] .reset-footer__hint {
  color: #ff5c7a;
  border-color: #ff5c7a;
  font-size: 0; /* hide static [HOLD] text, show ::before only */
}
#reset-footer-btn[data-state="charging"] .reset-footer__hint::before {
  font-size: 9px;
}
#reset-footer-btn[data-state="charging"] .reset-footer__chevron {
  animation: resetBlink 0.4s steps(2) infinite;
}

/* Triggered: full red flash before command fires */
#reset-footer-btn[data-state="triggered"] {
  border-color: #ff5c7a;
  background: #ff5c7a;
  color: #05070d;
  text-shadow: none;
  animation: resetFlash 0.3s ease-out 1;
}
#reset-footer-btn[data-state="triggered"] .reset-footer__chevron,
#reset-footer-btn[data-state="triggered"] .reset-footer__hint {
  display: none;
}
#reset-footer-btn[data-state="triggered"] .reset-footer__label::before {
  content: 'TIMELINE PURGED · ';
  color: #05070d;
}

.reset-footer__status {
  margin-top: 4px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 9px;
  letter-spacing: 1px;
  color: rgba(255, 143, 163, 0.6);
  min-height: 11px;
  text-align: right;
  padding-right: 4px;
}

@keyframes resetPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 92, 122, 0); }
  50% { box-shadow: 0 0 12px 2px rgba(255, 92, 122, 0.35); }
}
@keyframes resetBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
@keyframes resetFlash {
  0% { background: #ffd5dd; }
  100% { background: #ff5c7a; }
}
@media (prefers-reduced-motion: reduce) {
  #reset-footer-btn[data-state="charging"] { animation: none; }
  #reset-footer-btn[data-state="charging"] .reset-footer__chevron { animation: none; }
  #reset-footer-btn .reset-footer__scanline { transition: none; }
}
`;

/* ─── Inline JS ─── */
const MAP_JS = `
(function() {
  const vscode = acquireVsCodeApi();
  let chapters = [];
  let activeChapter = 1;

  const tabsEl = document.getElementById('chapter-tabs');
  const panelEl = document.getElementById('chapter-panel');
  const footerEl = document.getElementById('cert-footer');
  const footerBtn = document.getElementById('cert-footer-btn');
  const sysOpsEl = document.getElementById('sys-ops');
  const sysOpsToggle = document.getElementById('sys-ops-toggle');
  const sysOpsPanel = document.getElementById('sys-ops-panel');
  const sysOpsChevron = sysOpsToggle ? sysOpsToggle.querySelector('.sys-ops__chevron') : null;
  const resetFooterBtn = document.getElementById('reset-footer-btn');
  const resetFooterLabel = resetFooterBtn ? resetFooterBtn.querySelector('.reset-footer__label') : null;
  const resetFooterProgress = resetFooterBtn ? resetFooterBtn.querySelector('.reset-footer__progress') : null;
  const resetFooterStatus = sysOpsPanel ? sysOpsPanel.querySelector('.reset-footer__status') : null;
  if (sysOpsToggle && sysOpsPanel) {
    sysOpsToggle.addEventListener('click', () => {
      const expanded = sysOpsToggle.getAttribute('aria-expanded') === 'true';
      const next = !expanded;
      sysOpsToggle.setAttribute('aria-expanded', String(next));
      if (next) {
        sysOpsPanel.removeAttribute('hidden');
      } else {
        sysOpsPanel.setAttribute('hidden', '');
      }
      if (sysOpsChevron) sysOpsChevron.textContent = next ? '−' : '+';
    });
  }
  if (footerBtn) {
    footerBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'openJourneyCertificate' });
    });
  }

  /* ─ Hold-to-purge interaction ──────────────────────────────────────────
   * Plain modal dialogs feel out of place in a cockpit UI. Instead the reset
   * control charges over HOLD_MS while held; releasing early aborts.
   * Reaching full charge fires the (still safety-gated) extension command. */
  const HOLD_MS = 1400;
  let holdStart = 0;
  let holdRaf = 0;
  let holdTriggered = false;

  function resetVisualReset() {
    if (resetFooterBtn) resetFooterBtn.dataset.state = 'idle';
    if (resetFooterProgress) resetFooterProgress.style.width = '0%';
  }
  function setStatus(text) {
    if (resetFooterStatus) resetFooterStatus.textContent = text || '';
  }
  function tickHold(now) {
    if (!holdStart) return;
    const elapsed = now - holdStart;
    const ratio = Math.min(1, elapsed / HOLD_MS);
    if (resetFooterProgress) resetFooterProgress.style.width = (ratio * 100).toFixed(1) + '%';
    const remaining = Math.max(0, HOLD_MS - elapsed);
    setStatus('CHARGING ' + (remaining / 1000).toFixed(1) + 's');
    if (ratio >= 1) {
      holdTriggered = true;
      holdStart = 0;
      if (resetFooterBtn) resetFooterBtn.dataset.state = 'triggered';
      setStatus('PURGE EXECUTED');
      vscode.postMessage({ command: 'resetProgress' });
      // Visual reset shortly after so the next mount looks clean.
      setTimeout(() => { resetVisualReset(); setStatus(''); }, 1100);
      return;
    }
    holdRaf = requestAnimationFrame(tickHold);
  }
  function startHold(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!resetFooterBtn || resetFooterBtn.dataset.state === 'triggered') return;
    holdTriggered = false;
    holdStart = performance.now();
    resetFooterBtn.dataset.state = 'charging';
    holdRaf = requestAnimationFrame(tickHold);
  }
  function endHold(reason) {
    if (holdTriggered) return; // already fired
    if (!holdStart) return;
    cancelAnimationFrame(holdRaf);
    holdStart = 0;
    if (resetFooterBtn) resetFooterBtn.dataset.state = 'idle';
    if (resetFooterProgress) resetFooterProgress.style.width = '0%';
    setStatus(reason === 'leave' ? 'POINTER LOST · ABORTED' : 'ABORTED');
    setTimeout(() => setStatus(''), 1400);
  }
  if (resetFooterBtn) {
    resetFooterBtn.addEventListener('pointerdown', startHold);
    resetFooterBtn.addEventListener('pointerup', () => endHold('release'));
    resetFooterBtn.addEventListener('pointercancel', () => endHold('cancel'));
    resetFooterBtn.addEventListener('pointerleave', () => endHold('leave'));
    // Keyboard accessibility: Space / Enter still triggers via the slow path
    // (extension's command palette confirm flow), since you can't "hold" a key
    // press with sane semantics here.
    resetFooterBtn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        vscode.postMessage({ command: 'resetProgress' });
      }
    });
  }
  function setCertFooter(visible) {
    if (!footerEl) return;
    if (visible) {
      footerEl.removeAttribute('hidden');
    } else {
      footerEl.setAttribute('hidden', '');
    }
  }
  function setResetFooter(visible, _label, tooltip) {
    if (!sysOpsEl) return;
    if (visible) {
      sysOpsEl.removeAttribute('hidden');
    } else {
      sysOpsEl.setAttribute('hidden', '');
      // Auto-collapse when hidden (e.g., after reset → no progress yet).
      if (sysOpsToggle) sysOpsToggle.setAttribute('aria-expanded', 'false');
      if (sysOpsPanel) sysOpsPanel.setAttribute('hidden', '');
      if (sysOpsChevron) sysOpsChevron.textContent = '+';
    }
    // Label is intentionally fixed ("PURGE_TIMELINE") — terminal-style identifier
    // shouldn't be translated. Only the tooltip carries the localized explanation.
    if (resetFooterBtn && typeof tooltip === 'string') resetFooterBtn.title = tooltip;
    void _label;
    void resetFooterLabel;
  }

  window.addEventListener('message', (e) => {
    const msg = e.data;
    switch (msg.command) {
      case 'loadMap':
        chapters = msg.chapters;
        setCertFooter(!!msg.certificateUnlocked);
        setResetFooter(!!msg.hasProgress, msg.resetLabel, msg.resetTooltip);
        if (!chapters.find(c => c.chapter === activeChapter)) {
          activeChapter = chapters[0]?.chapter ?? 1;
        }
        renderTabs();
        renderPanel();
        break;
      case 'setCertificateUnlocked':
        setCertFooter(!!msg.unlocked);
        break;
      case 'updateNode':
        updateNodeInPlace(msg.nodeId, msg.status, msg.score);
        break;
      case 'setActiveChapter':
        activeChapter = msg.chapterId;
        renderTabs();
        renderPanel();
        break;
      case 'highlightLevel':
        highlightActiveLevel(msg.levelId);
        break;
    }
  });

  function renderTabs() {
    tabsEl.innerHTML = '';
    chapters.forEach(ch => {
      const tab = document.createElement('button');
      tab.className = 'chapter-tab';
      tab.role = 'tab';
      tab.textContent = ch.unlocked ? 'Ch.' + ch.chapter : '🔒' + ch.chapter;
      tab.dataset.active = String(ch.chapter === activeChapter);
      tab.dataset.locked = String(!ch.unlocked);
      tab.setAttribute('aria-label', ch.name + (ch.unlocked ? '' : ' (locked)'));
      tab.onclick = () => {
        activeChapter = ch.chapter;
        renderTabs();
        renderPanel();
      };
      tabsEl.appendChild(tab);
    });
  }

  function renderPanel() {
    const ch = chapters.find(c => c.chapter === activeChapter);
    if (!ch) { panelEl.innerHTML = ''; return; }

    panelEl.style.setProperty('--theme-color', ch.themeColor);

    if (!ch.unlocked) {
      panelEl.innerHTML =
        '<div class="chapter-locked-overlay">' +
          '<div class="chapter-locked-overlay__icon">🔒</div>' +
          '<div class="chapter-locked-overlay__text">完成前一章以解锁</div>' +
        '</div>';
      return;
    }

    let html = '';

    // Header
    html += '<div class="chapter-header">' +
      '<span class="chapter-header__name">' + escHtml(ch.name) + '</span>' +
      '<span class="chapter-header__progress">' + ch.progress + '/' + ch.total + '</span>' +
    '</div>';

    // Progress bar
    const pct = ch.total > 0 ? Math.round(ch.progress / ch.total * 100) : 0;
    html += '<div class="progress-bar">' +
      '<div class="progress-bar__fill" style="width:' + pct + '%;background:' + ch.themeColor + '"></div>' +
    '</div>';

    // Node list
    html += '<div class="node-list">';
    ch.nodes.forEach((node, i) => {
      // Connector line (before every node except first)
      if (i > 0) {
        const prevStatus = ch.nodes[i - 1].status;
        let lineType = 'locked';
        if (prevStatus === 'passed' || prevStatus === 'perfect') {
          lineType = (node.status === 'passed' || node.status === 'perfect') ? 'solid' : 'dashed';
        }
        html += '<div class="node-connector" data-line="' + lineType + '"></div>';
      }

      const icon = node.status === 'perfect' ? '⭐'
        : node.status === 'passed' ? '✓'
        : node.status === 'available' ? (i + 1)
        : '🔒';

      const disabled = node.status === 'locked' ? ' disabled' : '';
      const ariaLabel = node.title + ' — ' + node.status + (node.score !== null ? ' (' + node.score + ')' : '');

      html += '<div class="node-row">' +
        '<button class="node-btn" role="treeitem" data-id="' + escAttr(node.id) + '"' +
          ' aria-label="' + escAttr(ariaLabel) + '"' +
          ' title="' + escAttr(node.promptChallenge) + '"' +
          disabled + '>' +
          '<div class="node-circle" data-status="' + node.status + '">' + icon + '</div>' +
          '<div class="node-info">' +
            '<div class="node-title">' + escHtml(node.title) + '</div>' +
            '<div class="node-meta">' +
              '<span class="difficulty-dot" data-d="' + node.difficulty + '"></span>' +
              '<span>' + node.difficulty + '</span>' +
            '</div>' +
          '</div>' +
          (node.score !== null ? '<span class="node-score">' + node.score + '</span>' : '') +
        '</button>' +
      '</div>';
    });
    html += '</div>';

    panelEl.innerHTML = html;

    // Bind clicks
    panelEl.querySelectorAll('.node-btn[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        vscode.postMessage({ command: 'selectLevel', levelId: btn.dataset.id });
      });
    });
  }

  function updateNodeInPlace(nodeId, status, score) {
    for (const ch of chapters) {
      const node = ch.nodes.find(n => n.id === nodeId);
      if (node) {
        node.status = status;
        if (score !== null && score !== undefined) node.score = score;
        ch.progress = ch.nodes.filter(n => n.status === 'passed' || n.status === 'perfect').length;
        if (ch.chapter === activeChapter) renderPanel();
        renderTabs();
        break;
      }
    }
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escAttr(s) {
    return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Signal ready
  vscode.postMessage({ command: 'ready' });

  function highlightActiveLevel(levelId) {
    // Switch to the correct chapter tab if needed
    for (const ch of chapters) {
      const node = ch.nodes.find(n => n.id === levelId);
      if (node && ch.chapter !== activeChapter) {
        activeChapter = ch.chapter;
        renderTabs();
        renderPanel();
        break;
      }
    }

    // Remove previous highlight
    panelEl.querySelectorAll('.node-btn[data-active]').forEach(el => {
      delete el.dataset.active;
    });

    // Apply highlight
    const btn = panelEl.querySelector('.node-btn[data-id="' + levelId + '"]');
    if (btn) {
      btn.dataset.active = 'true';
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
})();
`;
