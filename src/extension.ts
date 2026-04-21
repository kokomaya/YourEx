import * as vscode from 'vscode';
import { SidebarProvider } from './ui/sidebar/sidebarProvider';
import { PromptPanelProvider } from './ui/webview/promptPanelProvider';
import { WelcomeProvider } from './ui/webview/welcomeProvider';
import { LeaderboardProvider } from './ui/webview/leaderboardProvider';
import { StatusBarManager } from './ui/statusbar';
import { GameStateManager } from './state/gameState';
import { MockProvider } from './ai/mockProvider';
import { CopilotProvider } from './ai/copilotProvider';
import type { IAIProvider } from './ai/IAIProvider';
import { setDataRoot } from './engine/levelLoader';

export function activate(context: vscode.ExtensionContext) {
  console.log('[YourEx] System Booting…');

  // --- Data root ---
  const dataRoot = vscode.Uri.joinPath(context.extensionUri, 'out', 'data', 'levels').fsPath;
  setDataRoot(dataRoot);

  // --- Dependency assembly ---
  const gameState = new GameStateManager();
  gameState.bindStorage(
    (key, value) => context.globalState.update(key, value),
    (key) => context.globalState.get<string>(key)
  );

  // AI Provider: prefer Copilot, fallback to Mock
  const aiProvider: IAIProvider = new CopilotProvider();
  const mockFallback = new MockProvider();

  const sidebarProvider = new SidebarProvider();
  sidebarProvider.setGameState(gameState);

  const promptPanel = new PromptPanelProvider(context.extensionUri);
  promptPanel.setDependencies(aiProvider, gameState);

  const welcomeProvider = new WelcomeProvider(context.extensionUri);
  const leaderboardProvider = new LeaderboardProvider(context.extensionUri);
  const statusBar = new StatusBarManager();

  // --- UI refresh helper ---
  function refreshUI() {
    sidebarProvider.refresh();
    const percent = promptPanel.getDecryptPercent();
    statusBar.update(gameState.state.xp, gameState.state.combo, percent);
  }

  // Listen to prompt panel updates (level completed, etc.)
  promptPanel.onDidUpdate(() => refreshUI());

  // --- TreeView ---
  const treeView = vscode.window.createTreeView('yourex-levels', {
    treeDataProvider: sidebarProvider,
    showCollapseAll: true,
  });

  // --- Commands ---
  context.subscriptions.push(
    treeView,

    vscode.commands.registerCommand('yourex.startDecryption', () => {
      gameState.startTimer();
      promptPanel.show();
    }),

    vscode.commands.registerCommand('yourex.openLevel', (levelId: string) => {
      gameState.startTimer();
      promptPanel.show(levelId);
    }),

    vscode.commands.registerCommand('yourex.signalProgress', () => {
      const percent = promptPanel.getDecryptPercent();
      const completed = gameState.getCompletedLevelIds().length;
      vscode.window.showInformationMessage(
        `[YourEx] XP: ${gameState.state.xp} | Combo: x${gameState.state.combo} | Levels: ${completed} | Decrypt: ${percent}%`
      );
    }),

    vscode.commands.registerCommand('yourex.leaderboard', () => {
      leaderboardProvider.show();
    }),

    vscode.commands.registerCommand('yourex.promptReplay', () => {
      // TODO: Phase 4 - Task 4.7
      vscode.window.showInformationMessage('[YourEx] Prompt Replay — coming soon');
    }),
  );

  // --- Manual mode: auto-judge on file save (Task 3.6) ---
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      promptPanel.handleFileSave(document);
    })
  );

  // --- First activation: show welcome if never played ---
  if (gameState.state.startTime === null) {
    welcomeProvider.show();
  }

  // --- Status bar init ---
  refreshUI();

  // --- Cleanup ---
  context.subscriptions.push({
    dispose() {
      promptPanel.dispose();
      welcomeProvider.dispose();
      leaderboardProvider.dispose();
      statusBar.dispose();
    },
  });

  console.log('[YourEx] All systems online.');
}

export function deactivate() {
  console.log('[YourEx] Signal Lost.');
}
