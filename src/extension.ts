import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SidebarProvider } from './ui/sidebar/sidebarProvider';
import { PromptPanelProvider } from './ui/webview/promptPanelProvider';
import { WelcomeProvider } from './ui/webview/welcomeProvider';
import { LeaderboardProvider } from './ui/webview/leaderboardProvider';
import { StatusBarManager } from './ui/statusbar';
import { GameStateManager } from './state/gameState';
import { MockProvider } from './ai/mockProvider';
import { CopilotProvider } from './ai/copilotProvider';
import type { IAIProvider } from './ai/IAIProvider';
import { setDataRoot, getAllLevels, getLevelById } from './engine/levelLoader';
import { ModeService } from './mode/modeService';
import { createAccessPolicy } from './access/accessPolicyFactory';
import { parseRunMode, getModeLabel, type RunMode } from './mode/runMode';
import { computeAllowDeveloperMode } from './mode/modeGuards';

function resolveDataRoot(extensionRoot: string): string {
  const candidates = [
    path.join(extensionRoot, 'out', 'data', 'levels'),
    path.join(extensionRoot, 'data', 'levels'),
    path.join(extensionRoot, 'src', 'data', 'levels'),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  return found ?? candidates[candidates.length - 1];
}

export function activate(context: vscode.ExtensionContext) {
  console.log('[YourEx] System Booting…');

  // --- Data root ---
  const dataRoot = resolveDataRoot(context.extensionUri.fsPath);
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

  const modeConfig = vscode.workspace.getConfiguration('yourex.mode');
  const defaultMode = parseRunMode(modeConfig.get<string>('default', 'user'));
  const modeService = new ModeService(defaultMode);
  modeService.bindStorage(
    (key, value) => context.globalState.update(key, value),
    (key) => context.globalState.get<string>(key)
  );

  function allowDeveloperMode(): boolean {
    const configured = vscode.workspace.getConfiguration('yourex.mode').get<boolean>('allowDeveloper', false);
    return computeAllowDeveloperMode(configured, context.extensionMode);
  }

  function getEffectiveMode(mode: RunMode): RunMode {
    if (mode === 'developer' && !allowDeveloperMode()) {
      return 'user';
    }
    return mode;
  }

  let accessPolicy = createAccessPolicy(getEffectiveMode(modeService.getMode()), gameState);

  const sidebarProvider = new SidebarProvider();
  sidebarProvider.setGameState(gameState);
  sidebarProvider.setAccessPolicy(accessPolicy);

  const promptPanel = new PromptPanelProvider(context.extensionUri);
  promptPanel.setDependencies(aiProvider, gameState);

  const welcomeProvider = new WelcomeProvider(context.extensionUri);
  const leaderboardProvider = new LeaderboardProvider(context.extensionUri);
  leaderboardProvider.setGameState(gameState);
  const statusBar = new StatusBarManager();

  // --- UI refresh helper ---
  function refreshUI() {
    accessPolicy = createAccessPolicy(getEffectiveMode(modeService.getMode()), gameState);
    sidebarProvider.setAccessPolicy(accessPolicy);
    sidebarProvider.refresh();
    const percent = promptPanel.getDecryptPercent();
    statusBar.update(gameState.state.xp, gameState.state.combo, percent, accessPolicy.mode);
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
      if (!accessPolicy.canOpenLevel(levelId)) {
        vscode.window.showWarningMessage('[YourEx] This level is locked in User Mode. Switch to Developer Mode to bypass locks.');
        return;
      }
      gameState.startTimer();
      promptPanel.show(levelId);
    }),

    vscode.commands.registerCommand('yourex.switchMode', async () => {
      if (!allowDeveloperMode()) {
        vscode.window.showInformationMessage('[YourEx] Developer Mode is disabled by configuration.');
        return;
      }

      const current = getEffectiveMode(modeService.getMode());
      const picked = await vscode.window.showQuickPick(
        [
          { label: 'User Mode', description: 'Normal progression with chapter locks', value: 'user' as RunMode },
          { label: 'Developer Mode', description: 'Bypass chapter and level locks', value: 'developer' as RunMode },
        ],
        {
          placeHolder: `Current: ${getModeLabel(current)}`,
        }
      );

      if (!picked) return;
      await modeService.setMode(picked.value);
      refreshUI();
      vscode.window.showInformationMessage(`[YourEx] Switched to ${getModeLabel(picked.value)}.`);
    }),

    vscode.commands.registerCommand('yourex.showCurrentMode', () => {
      const mode = getEffectiveMode(modeService.getMode());
      vscode.window.showInformationMessage(`[YourEx] Current mode: ${getModeLabel(mode)}.`);
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

    vscode.commands.registerCommand('yourex.promptReplay', async () => {
      const completedIds = gameState.getCompletedLevelIds();
      if (completedIds.length === 0) {
        vscode.window.showInformationMessage('[YourEx] No completed levels yet.');
        return;
      }

      const items = completedIds.map(id => {
        const level = getLevelById(id);
        const attempts = gameState.getLevelAttempts(id);
        return {
          label: level ? `${level.title}` : id,
          description: `${attempts.length} attempts`,
          levelId: id,
        };
      });

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a level to view prompt history',
      });
      if (!picked) return;

      const attempts = gameState.getLevelAttempts(picked.levelId);
      const lines = attempts.map((a, i) => {
        const status = a.judgeResult.status;
        const icon = status === 'perfect' ? '✨' : status === 'pass' ? '✅' : status === 'partial' ? '⚠️' : '❌';
        const prompt = a.prompt ? `"${a.prompt}"` : '(manual mode)';
        const score = a.promptScore ? ` [${a.promptScore.total}pts]` : '';
        return `${icon} #${i + 1} ${a.mode} — ${prompt}${score} → ${status}`;
      });

      const doc = await vscode.workspace.openTextDocument({
        content: `[Prompt Replay] ${picked.label}\n${'='.repeat(40)}\n\n${lines.join('\n')}`,
        language: 'plaintext',
      });
      await vscode.window.showTextDocument(doc, { preview: true });
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
  if (modeService.getMode() === 'developer' && !allowDeveloperMode()) {
    void modeService.setMode('user');
  }
  context.subscriptions.push(modeService.onDidChangeMode(() => refreshUI()));
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
