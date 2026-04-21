import * as vscode from 'vscode';
import { SidebarProvider } from './ui/sidebar/sidebarProvider';
import { PromptPanelProvider } from './ui/webview/promptPanelProvider';
import { WelcomeProvider } from './ui/webview/welcomeProvider';
import { LeaderboardProvider } from './ui/webview/leaderboardProvider';
import { StatusBarManager } from './ui/statusbar';
import { GameStateManager } from './state/gameState';

export function activate(context: vscode.ExtensionContext) {
  console.log('[YourEx] System Booting…');

  // --- Dependency assembly (thin layer) ---
  const gameState = new GameStateManager();
  const sidebarProvider = new SidebarProvider();
  const promptPanel = new PromptPanelProvider(context.extensionUri);
  const welcomeProvider = new WelcomeProvider(context.extensionUri);
  const leaderboardProvider = new LeaderboardProvider(context.extensionUri);
  const statusBar = new StatusBarManager();

  // --- TreeView ---
  const treeView = vscode.window.createTreeView('yourex-levels', {
    treeDataProvider: sidebarProvider,
    showCollapseAll: true,
  });

  // --- Commands ---
  context.subscriptions.push(
    treeView,

    vscode.commands.registerCommand('yourex.startDecryption', () => {
      promptPanel.show();
    }),

    vscode.commands.registerCommand('yourex.signalProgress', () => {
      // TODO: Phase 3 - show progress panel
      vscode.window.showInformationMessage(
        `[YourEx] Decrypt: ${gameState.state.xp} XP | Combo: x${gameState.state.combo}`
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

  // --- Status bar ---
  statusBar.update(gameState.state.xp, gameState.state.combo, 0);

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
