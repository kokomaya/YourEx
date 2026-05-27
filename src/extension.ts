import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SidebarProvider } from './ui/sidebar/sidebarProvider';
import { MissionMapProvider } from './ui/sidebar/missionMap/MissionMapProvider';
import { MapDataSource } from './ui/sidebar/missionMap/MapDataSource';
import { PromptPanelProvider } from './ui/webview/promptPanelProvider';
import { WelcomeProvider } from './ui/webview/welcomeProvider';
import { LeaderboardProvider } from './ui/webview/leaderboardProvider';
import { CodexProvider } from './ui/webview/codexProvider';
import { Ch6InterludeProvider } from './ui/webview/ch6InterludeProvider';
import { ChapterInterludeProvider } from './ui/webview/chapterInterludeProvider';
import { CertificateProvider } from './ui/webview/certificateProvider';
import { StatusBarManager } from './ui/statusbar';
import { GameStateManager } from './state/gameState';
import { MockProvider } from './ai/mockProvider';
import { CopilotProvider } from './ai/copilotProvider';
import type { IAIProvider } from './ai/IAIProvider';
import { setDataRoot, getAllLevels, getLevelById, setLevelLocale } from './engine/levelLoader';
import { ModeService } from './mode/modeService';
import { createAccessPolicy } from './access/accessPolicyFactory';
import { parseRunMode, getModeLabel, type RunMode } from './mode/runMode';
import { computeAllowDeveloperMode } from './mode/modeGuards';
import { LocaleService, readLocaleFromConfig, detectDefaultLocale } from './i18n/localeService';
import { initTranslations, t } from './i18n/t';
import { setDialogueLocale } from './story/dialogues';
import { setAchievementLocale } from './engine/achievementManager';
import { HintTracker } from './engine/hintTracker';
import { TutorialController } from './engine/tutorial/tutorialController';
import { type Locale, SUPPORTED_LOCALES, LOCALE_LABELS } from './i18n/types';

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

  // --- Locale initialization ---
  const initialLocale = readLocaleFromConfig() ?? detectDefaultLocale();
  const localeService = new LocaleService(initialLocale);
  initTranslations(initialLocale);
  setLevelLocale(initialLocale);
  setDialogueLocale(initialLocale);
  setAchievementLocale(initialLocale);

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
  const defaultMode =
    context.extensionMode === vscode.ExtensionMode.Development
      ? 'developer'
      : parseRunMode(modeConfig.get<string>('default', 'user'));
  const modeService = new ModeService(defaultMode);
  modeService.bindStorage(
    (key, value) => context.globalState.update(key, value),
    (key) => context.globalState.get<string>(key)
  );

  function allowDeveloperMode(): boolean {
    const configured =
      context.extensionMode === vscode.ExtensionMode.Development
        ? true
        : vscode.workspace.getConfiguration('yourex.mode').get<boolean>('allowDeveloper', false);
    return computeAllowDeveloperMode(configured, context.extensionMode);
  }

  function getEffectiveMode(mode: RunMode): RunMode {
    if (mode === 'developer' && !allowDeveloperMode()) {
      return 'user';
    }
    return mode;
  }

  const initialMode = getEffectiveMode(modeService.getMode());
  if (initialMode === 'developer' && modeService.getMode() !== 'developer') {
    void modeService.setMode('developer');
  }

  let accessPolicy = createAccessPolicy(initialMode, gameState);

  const sidebarProvider = new SidebarProvider();
  sidebarProvider.setGameState(gameState);
  sidebarProvider.setAccessPolicy(accessPolicy);

  const mapDataSource = new MapDataSource(gameState, accessPolicy);
  const missionMapProvider = new MissionMapProvider(context.extensionUri);
  missionMapProvider.setDataSource(mapDataSource);

  const promptPanel = new PromptPanelProvider(context.extensionUri);
  const isDevMode = getEffectiveMode(modeService.getMode()) === 'developer';
  promptPanel.setDependencies(aiProvider, gameState, isDevMode);
  promptPanel.setLocale(initialLocale);
  promptPanel.setHintTracker(new HintTracker());

  // First-time tutorial: dispatcher wires the controller to both webviews.
  const tutorialController = new TutorialController(gameState, {
    startPromptArea: (p) => promptPanel.startTutorial(p),
    advancePromptArea: (id) => promptPanel.advanceTutorial(id),
    endPromptArea: () => promptPanel.endTutorial(),
    startMapArea: (p) => missionMapProvider.startTutorial(p),
    endMapArea: () => missionMapProvider.endTutorial(),
    advanceLevel: () => promptPanel.triggerNextLevel(),
  });
  promptPanel.setTutorialController(tutorialController);
  // Sidebar interceptor returns true while the wizard is in any active area.
  // When that's the case, the cleanup callback runs first to skip-and-tear-down
  // the wizard so the player's click actually lands on the requested level.
  missionMapProvider.setSelectInterceptor(() => tutorialController.getActiveArea() !== null);
  missionMapProvider.setSidebarNavCleanup(() => tutorialController.skip());
  missionMapProvider.onDidTutorialEvent((evt) => {
    if (evt.type === 'skip') tutorialController.skip();
    else if (evt.type === 'finish') tutorialController.finish();
    // 'ready' / 'stepShown' on the sidebar are informational only.
  });

  const welcomeProvider = new WelcomeProvider(context.extensionUri);
  welcomeProvider.setLocale(initialLocale);
  welcomeProvider.setGameState(gameState);
  const leaderboardProvider = new LeaderboardProvider(context.extensionUri);
  leaderboardProvider.setGameState(gameState);
  leaderboardProvider.setLocale(initialLocale);
  const codexProvider = new CodexProvider(context.extensionUri);
  codexProvider.setLocale(initialLocale);
  const ch6InterludeProvider = new Ch6InterludeProvider(context.extensionUri);
  ch6InterludeProvider.setLocale(initialLocale);
  const chapterInterludeProvider = new ChapterInterludeProvider(context.extensionUri);
  chapterInterludeProvider.setLocale(initialLocale);
  const certificateProvider = new CertificateProvider(context.extensionUri);
  certificateProvider.setLocale(initialLocale);
  certificateProvider.setGameState(gameState);
  const statusBar = new StatusBarManager();

  // --- UI refresh helper ---
  function refreshUI() {
    accessPolicy = createAccessPolicy(getEffectiveMode(modeService.getMode()), gameState);
    promptPanel.setDevMode(getEffectiveMode(modeService.getMode()) === 'developer');
    sidebarProvider.setAccessPolicy(accessPolicy);
    sidebarProvider.refresh();
    mapDataSource.setAccessPolicy(accessPolicy);
    missionMapProvider.refresh();
    missionMapProvider.setActiveLevel(promptPanel.getCurrentLevelId());
    const percent = promptPanel.getDecryptPercent();
    statusBar.update(gameState.state.xp, gameState.state.combo, percent, accessPolicy.mode);
  }

  // Listen to prompt panel updates (level completed, etc.)
  promptPanel.onDidUpdate(() => refreshUI());

  // --- TreeView (classic, kept as fallback) ---
  const treeView = vscode.window.createTreeView('yourex-levels-tree', {
    treeDataProvider: sidebarProvider,
    showCollapseAll: true,
  });

  // --- Mission Map (webview sidebar) ---
  const mapViewDisposable = vscode.window.registerWebviewViewProvider(
    MissionMapProvider.viewType,
    missionMapProvider,
  );

  missionMapProvider.onDidSelectLevel((levelId: string) => {
    vscode.commands.executeCommand('yourex.openLevel', levelId);
  });

  // --- Commands ---
  context.subscriptions.push(
    treeView,
    mapViewDisposable,

    vscode.commands.registerCommand('yourex.startDecryption', () => {
      gameState.startTimer();
      // Auto-load the first level for new users instead of showing an empty panel
      const allLevels = getAllLevels();
      const firstLevelId = allLevels.length > 0 ? allLevels[0].id : undefined;
      promptPanel.show(firstLevelId);
    }),

    vscode.commands.registerCommand('yourex.openLevel', (levelId: string) => {
      if (!accessPolicy.canOpenLevel(levelId)) {
        vscode.window.showWarningMessage('[YourEx] This level is locked in User Mode. Switch to Developer Mode to bypass locks.');
        return;
      }

      // Chapter interlude gates: show once before the first level of each chapter
      const chapterFirstLevels: Record<string, number> = {
        'level_06': 2,
        'level_11': 3,
        'level_16': 4,
        'level_21': 5,
      };
      const interludeChapter = chapterFirstLevels[levelId];
      if (interludeChapter) {
        const key = `yourex.ch${interludeChapter}InterludeSeen`;
        const seen = context.globalState.get<boolean>(key, false);
        if (!seen) {
          chapterInterludeProvider.show(interludeChapter, () => {
            // Direct callback: runs synchronously inside onDidReceiveMessage
            // before the panel is disposed — no async, no EventEmitter indirection
            void context.globalState.update(key, true);
            gameState.startTimer();
            promptPanel.show(levelId);
            refreshUI();
          });
          return;
        }
      }

      // Show Ch6 interlude before opening level_26 for the first time
      if (levelId === 'level_26') {
        const seen = context.globalState.get<boolean>('yourex.ch6InterludeSeen', false);
        if (!seen) {
          ch6InterludeProvider.show();
          const disposable = ch6InterludeProvider.onDidComplete(() => {
            disposable.dispose();
            void context.globalState.update('yourex.ch6InterludeSeen', true);
            gameState.startTimer();
            promptPanel.show(levelId);
            refreshUI();
          });
          return;
        }
      }
      gameState.startTimer();
      promptPanel.show(levelId);
      refreshUI();
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

    vscode.commands.registerCommand('yourex.showWelcome', () => {
      welcomeProvider.show();
    }),

    vscode.commands.registerCommand('yourex.openCodex', () => {
      codexProvider.show();
    }),

    vscode.commands.registerCommand('yourex.showCh6Interlude', () => {
      ch6InterludeProvider.show();
    }),

    vscode.commands.registerCommand('yourex.showChapterInterlude', (chapterId: number) => {
      if (chapterId >= 2 && chapterId <= 5) {
        chapterInterludeProvider.show(chapterId);
      }
    }),

    vscode.commands.registerCommand('yourex.restartTutorial', () => {
      if (getEffectiveMode(modeService.getMode()) !== 'developer') {
        vscode.window.showInformationMessage(t('tutorial.restartDevOnly'));
        return;
      }
      tutorialController.hardResetInMemory();
      gameState.resetTutorial();
      // Always load level_01 — wizard is built for it specifically.
      vscode.commands.executeCommand('yourex.openLevel', 'level_01');
    }),

    vscode.commands.registerCommand('yourex.resetProgress', async (arg?: { skipConfirm?: boolean }) => {
      // Sidebar invokes with skipConfirm=true after its own hold-to-purge gesture
      // already provided deliberate confirmation. Command Palette / Welcome link
      // still go through the modal + typed-RESET flow because those entries have
      // no built-in friction of their own.
      const skipConfirm = arg && arg.skipConfirm === true;

      if (!skipConfirm) {
        // Step 1 — modal warning. Cancel here = no-op.
        const confirmed = await vscode.window.showWarningMessage(
          t('reset.confirmTitle'),
          { modal: true, detail: t('reset.confirmDetail') },
          t('reset.confirmButton'),
        );
        if (confirmed !== t('reset.confirmButton')) {
          return;
        }

        // Step 2 — typed confirmation, only when the player has meaningful progress
        // (>= 5 cleared levels = at least one full chapter). New players bypass this.
        const completedCount = gameState.getCompletedLevelIds().length;
        if (completedCount >= 5) {
          const typed = await vscode.window.showInputBox({
            prompt: t('reset.typePrompt'),
            placeHolder: 'RESET',
            ignoreFocusOut: true,
            validateInput: (v) => (v.length === 0 || v === 'RESET' ? null : t('reset.typeError')),
          });
          if (typed !== 'RESET') {
            return;
          }
        }
      }

      // Wipe persisted progress. gameState.reset() rewrites the storage with
      // DEFAULT_GAME_STATE; the auxiliary key (Ch6 interlude seen) lives outside
      // gameState and must be cleared separately.
      gameState.reset();
      await context.globalState.update('yourex.ch6InterludeSeen', undefined);
      await context.globalState.update('yourex.ch2InterludeSeen', undefined);
      await context.globalState.update('yourex.ch3InterludeSeen', undefined);
      await context.globalState.update('yourex.ch4InterludeSeen', undefined);
      await context.globalState.update('yourex.ch5InterludeSeen', undefined);

      // Re-seat in-memory trackers that don't persist to disk.
      promptPanel.setHintTracker(new HintTracker());
      tutorialController.hardResetInMemory();

      // Tear down any open game webviews so their React state can't reference
      // the now-stale data — they will re-create cleanly when reopened.
      promptPanel.dispose();
      welcomeProvider.dispose();
      leaderboardProvider.dispose();
      codexProvider.dispose();
      ch6InterludeProvider.dispose();
      chapterInterludeProvider.dispose();
      certificateProvider.dispose();

      // Mirror first-launch behavior: refresh sidebar/status bar and pop Welcome.
      refreshUI();
      welcomeProvider.show();

      vscode.window.showInformationMessage(t('reset.successNotification'));
    }),

    vscode.commands.registerCommand('yourex.openJourneyCertificate', () => {
      const allLevels = getAllLevels();
      const unlocked =
        gameState.state.certificateUnlocked ||
        allLevels.some((lv) => {
          const trigger = lv.certificateTrigger;
          if (!trigger || trigger.type !== 'journey') return false;
          const required = trigger.requireStatus ?? 'pass';
          const attempts = gameState.state.completedLevels[lv.id] ?? [];
          return attempts.some((a) =>
            required === 'perfect'
              ? a.judgeResult.status === 'perfect'
              : a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass',
          );
        });
      if (!unlocked) {
        vscode.window.showInformationMessage(
          '[YourEx] Complete the rEx final transmission (Ch5) to unlock the journey certificate.',
        );
        return;
      }
      certificateProvider.show();
    }),

    vscode.commands.registerCommand('yourex.switchLanguage', async (localeArg?: string) => {
      let targetLocale: Locale;

      if (localeArg && SUPPORTED_LOCALES.includes(localeArg as Locale)) {
        targetLocale = localeArg as Locale;
      } else {
        const items = SUPPORTED_LOCALES.map(code => ({
          label: LOCALE_LABELS[code],
          description: code === localeService.locale ? '(current)' : '',
          value: code,
        }));
        const picked = await vscode.window.showQuickPick(items, {
          placeHolder: `Current: ${LOCALE_LABELS[localeService.locale]}`,
        });
        if (!picked) return;
        targetLocale = picked.value;
      }

      if (targetLocale === localeService.locale) return;

      // Update all subsystems
      localeService.setLocale(targetLocale);
      initTranslations(targetLocale);
      setLevelLocale(targetLocale);
      setDialogueLocale(targetLocale);
      setAchievementLocale(targetLocale);

      // Persist to settings
      await vscode.workspace.getConfiguration('yourex').update('language', targetLocale, vscode.ConfigurationTarget.Global);

      // Broadcast to all webviews
      promptPanel.broadcastLocale(targetLocale);
      welcomeProvider.broadcastLocale(targetLocale);
      leaderboardProvider.broadcastLocale(targetLocale);
      codexProvider.broadcastLocale(targetLocale);
      ch6InterludeProvider.broadcastLocale(targetLocale);
      chapterInterludeProvider.broadcastLocale(targetLocale);
      certificateProvider.broadcastLocale(targetLocale);

      // Refresh extension-side UI
      refreshUI();
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
      ch6InterludeProvider.dispose();
      chapterInterludeProvider.dispose();
      certificateProvider.dispose();
      statusBar.dispose();
      localeService.dispose();
    },
  });

  console.log('[YourEx] All systems online.');
}

export function deactivate() {
  console.log('[YourEx] Signal Lost.');
}
