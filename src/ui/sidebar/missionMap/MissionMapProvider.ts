import * as vscode from 'vscode';
import type { IMapDataSource } from './IMapDataSource';
import type { MapWebviewToExt } from './mapMessages';

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
    this._view.webview.postMessage({ command: 'loadMap', chapters });
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
`;

/* ─── Inline JS ─── */
const MAP_JS = `
(function() {
  const vscode = acquireVsCodeApi();
  let chapters = [];
  let activeChapter = 1;

  const tabsEl = document.getElementById('chapter-tabs');
  const panelEl = document.getElementById('chapter-panel');

  window.addEventListener('message', (e) => {
    const msg = e.data;
    switch (msg.command) {
      case 'loadMap':
        chapters = msg.chapters;
        if (!chapters.find(c => c.chapter === activeChapter)) {
          activeChapter = chapters[0]?.chapter ?? 1;
        }
        renderTabs();
        renderPanel();
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
