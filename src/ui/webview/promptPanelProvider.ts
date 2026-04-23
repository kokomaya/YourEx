import * as vscode from 'vscode';
import { getWebviewContent, getVisualConfigFromSettings } from './webviewHelper';
import type { IAIProvider } from '../../ai/IAIProvider';
import type { GameStateManager } from '../../state/gameState';
import type { Level, WebViewMessage, ExtensionMessage } from '../../types';
import type { Locale } from '../../i18n/types';
import { getLevelById, loadChapterLevels, shouldUnlockNextChapter, getNextChapter, shouldUnlockHiddenChapter, HIDDEN_CHAPTER } from '../../engine/levelLoader';
import { runDecryptionPipeline, runManualJudge } from '../../engine/decryptionPipeline';
import { getFeedbackText } from '../feedback';
import { showJudgeFeedback, showAchievementUnlocked } from '../feedback';
import { calculateXpGain } from '../../engine/xpTracker';
import { incrementCombo, resetCombo } from '../../engine/comboTracker';
import { computeDecryptPercent } from '../../engine/xpTracker';
import { getAllLevels } from '../../engine/levelLoader';
import { checkAchievements } from '../../engine/achievementManager';
import { getRexSignal } from '../../story/dialogues';
import { buildRewardData } from '../../engine/rewardBuilder';
import type { IHintTracker } from '../../engine/hintTracker';
import { resolveHints, getPeekPenalty } from '../../engine/hintResolver';

export class PromptPanelProvider {
  private _panel: vscode.WebviewPanel | undefined;
  private _currentLevel: Level | undefined;
  private _aiProvider: IAIProvider | undefined;
  private _gameState: GameStateManager | undefined;
  private _hintTracker: IHintTracker | undefined;
  private _devMode = false;
  private _locale: Locale = 'zh-CN';
  private _onDidUpdate = new vscode.EventEmitter<void>();
  readonly onDidUpdate = this._onDidUpdate.event;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  setHintTracker(tracker: IHintTracker): void {
    this._hintTracker = tracker;
  }

  setLocale(locale: Locale): void {
    this._locale = locale;
  }

  broadcastLocale(locale: Locale): void {
    this._locale = locale;
    this.postMessage({ command: 'localeChanged', locale });
    // Reload current level in the new locale so content text updates
    if (this._currentLevel) {
      const reloaded = getLevelById(this._currentLevel.id);
      if (reloaded) {
        this._currentLevel = reloaded;
        this.postMessage({ command: 'loadLevel', level: reloaded });
      }
    }
  }

  setDependencies(aiProvider: IAIProvider, gameState: GameStateManager, devMode?: boolean): void {
    this._aiProvider = aiProvider;
    this._gameState = gameState;
    this._devMode = devMode ?? false;
  }

  setDevMode(devMode: boolean): void {
    this._devMode = devMode;
  }

  show(levelId?: string): void {
    if (this._panel) {
      this._panel.reveal();
    } else {
      this._panel = vscode.window.createWebviewPanel(
        'yourex-prompt-panel',
        'YourEx — Signal Decryption',
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
        'promptPanel',
        getVisualConfigFromSettings(),
        this._locale
      );

      this._panel.webview.onDidReceiveMessage((msg: WebViewMessage) => {
        this.handleMessage(msg);
      });

      this._panel.onDidDispose(() => {
        this._panel = undefined;
      });
    }

    if (levelId) {
      this.loadLevel(levelId);
    }
  }

  private loadLevel(levelId: string): void {
    const level = getLevelById(levelId);
    if (!level) return;
    this._currentLevel = level;
    this.postMessage({ command: 'loadLevel', level });
    this.sendHintState(level);
  }

  private sendHintState(level: Level, isNewFail = false): void {
    if (!this._hintTracker) return;
    const failCount = this._hintTracker.getFailCount(level.id);
    const peeked = this._hintTracker.hasPeeked(level.id);
    const previousFailCount = isNewFail ? failCount - 1 : failCount;
    const hintData = resolveHints(level, failCount, previousFailCount, peeked);
    this.postMessage({ command: 'updateHints', hintData });
  }

  private handlePeekHint(levelId: string): void {
    if (!this._hintTracker) return;
    if (this._hintTracker.hasPeeked(levelId)) return; // already peeked
    const level = getLevelById(levelId);
    if (!level) return;

    this._hintTracker.markPeeked(levelId);
    this.sendHintState(level);
  }

  private async handleMessage(msg: WebViewMessage): Promise<void> {
    switch (msg.command) {
      case 'ready':
        if (this._currentLevel) {
          this.postMessage({ command: 'loadLevel', level: this._currentLevel });
          this.sendHintState(this._currentLevel);
        }
        break;

      case 'requestLevel':
        this.loadLevel(msg.levelId);
        break;

      case 'executePrompt':
        await this.handleExecutePrompt(msg.prompt, msg.levelId);
        break;

      case 'manualMode':
        await this.handleManualMode(msg.levelId);
        break;

      case 'nextLevel':
        this.handleNextLevel();
        break;

      case 'replayLevel':
        this.loadLevel(msg.levelId);
        break;

      case 'viewLeaderboard':
        vscode.commands.executeCommand('yourex.showLeaderboard');
        break;

      case 'switchLanguage':
        vscode.commands.executeCommand('yourex.switchLanguage', msg.locale);
        break;

      case 'peekHint':
        this.handlePeekHint(msg.levelId);
        break;

      case 'openCodex':
        vscode.commands.executeCommand('yourex.openCodex');
        break;
    }
  }

  private async handleExecutePrompt(prompt: string, levelId: string): Promise<void> {
    if (!this._aiProvider || !this._gameState) return;

    const level = getLevelById(levelId);
    if (!level) {
      this.postMessage({ command: 'showError', message: 'Level not found' });
      return;
    }

    this.postMessage({ command: 'setLoading', loading: true });

    try {
      const attemptNumber = this._gameState.getLevelAttempts(levelId).length + 1;
      const peekPenalty = this._hintTracker?.hasPeeked(levelId)
        ? getPeekPenalty(level.difficulty)
        : 0;

      // Dev mode: skip AI, fake a perfect result
      const result = this._devMode
        ? {
            judgeResult: {
              status: 'perfect' as const,
              matched: [...level.expected],
              expected: [...level.expected],
              rawRegexString: '/dev-auto-pass/',
              regex: null,
            },
            promptScore: { total: 95, brevityScore: 25, firstTryScore: 25, eleganceScore: 20, regexQualityScore: 25 },
            rawRegex: '/dev-auto-pass/',
          }
        : await runDecryptionPipeline(prompt, level, this._aiProvider, attemptNumber, peekPenalty);

      const feedback = getFeedbackText(result.judgeResult, level, 'prompt');
      const passed = result.judgeResult.status === 'perfect' || result.judgeResult.status === 'pass';
      const wasAlreadyCompleted = this._gameState.isLevelCompleted(levelId);

      // Record attempt
      this._gameState.recordAttempt({
        levelId,
        mode: 'prompt',
        prompt,
        regex: result.rawRegex,
        judgeResult: { ...result.judgeResult, regex: null }, // strip non-serializable
        promptScore: result.promptScore,
        timestamp: Date.now(),
        attemptNumber,
      });

      // XP + combo on success
      if (passed) {
        const rewardInfo = this.applySuccessRewards(
          attemptNumber,
          'prompt',
          result.judgeResult.status === 'perfect',
          result.promptScore.total,
          prompt.length,
          levelId
        );

        const reward = buildRewardData(
          this._gameState,
          level,
          result.judgeResult.status === 'perfect',
          result.promptScore,
          rewardInfo.xpGained,
          rewardInfo.combo,
          rewardInfo.newAchievementIds,
          wasAlreadyCompleted,
        );

        showJudgeFeedback(result.judgeResult, feedback);

        this.postMessage({
          command: 'showResult',
          result: { ...result.judgeResult, regex: null },
          score: result.promptScore,
          feedback,
          rawRegex: result.rawRegex,
          reward,
        });
      } else {
        // reset combo on fail
        const newState = resetCombo(this._gameState.state as any);
        this._gameState.setCombo(newState.combo);

        // track failure for hint system
        if (this._hintTracker) {
          this._hintTracker.recordFail(levelId);
        }

        showJudgeFeedback(result.judgeResult, feedback);

        this.postMessage({
          command: 'showResult',
          result: { ...result.judgeResult, regex: null },
          score: result.promptScore,
          feedback,
          rawRegex: result.rawRegex,
        });

        // send updated hints after fail
        if (level) {
          this.sendHintState(level, true);
        }
      }

      this._onDidUpdate.fire();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.postMessage({ command: 'showError', message: msg });
      this.postMessage({ command: 'setLoading', loading: false });
    }
  }

  private handleNextLevel(): void {
    if (!this._currentLevel) return;
    const chapter = this._currentLevel.chapter;
    const chapterLevels = loadChapterLevels(chapter);
    const currentIndex = chapterLevels.findIndex(l => l.id === this._currentLevel!.id);

    // Next level in current chapter
    if (currentIndex >= 0 && currentIndex < chapterLevels.length - 1) {
      this.loadLevel(chapterLevels[currentIndex + 1].id);
      this._onDidUpdate.fire();
      return;
    }

    // Next chapter's first level
    const nextCh = chapter + 1;
    const nextChapterLevels = loadChapterLevels(nextCh);
    if (nextChapterLevels.length > 0 && this._gameState?.isChapterUnlocked(nextCh)) {
      this.loadLevel(nextChapterLevels[0].id);
      this._onDidUpdate.fire();
      return;
    }
  }

  private async handleManualMode(levelId: string): Promise<void> {
    const level = getLevelById(levelId);
    if (!level) return;

    // Create a temporary file for manual regex writing
    const content = [
      `// 📡 Signal — ${level.title}`,
      `// ${level.story}`,
      '//',
      `// Expected: ${level.expected.map(e => `"${e}"`).join(', ')}`,
      '//',
      '// ⚔️ 写下你的正则（保存文件自动验证）:',
      '',
      'export const regex = /你的规则/;',
      '',
    ].join('\n');

    const fileName = `signal_${level.chapter}-${level.id.replace('level_', '')}.regex.js`;
    const uri = vscode.Uri.joinPath(this._extensionUri, '..', '.yourex', fileName);

    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(this._extensionUri, '..', '.yourex'));
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));

    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
  }

  /** Handle manual mode file save */
  handleFileSave(document: vscode.TextDocument): void {
    if (!this._gameState) return;

    const fileName = document.fileName;
    if (!fileName.endsWith('.regex.js')) return;

    const text = document.getText();
    const match = text.match(/export\s+const\s+regex\s*=\s*(\/.*?\/[gimsuy]*)\s*;/);
    if (!match) return;

    const rawRegex = match[1];
    // Extract levelId from filename: signal_1-01.regex.js → level_01
    const fileMatch = fileName.match(/signal_\d+-(\d+)\.regex\.js/);
    if (!fileMatch) return;

    const levelId = `level_${fileMatch[1]}`;
    const level = getLevelById(levelId);
    if (!level) return;

    const judgeResult = runManualJudge(rawRegex, level);
    const feedback = getFeedbackText(judgeResult, level, 'manual');
    const passed = judgeResult.status === 'perfect' || judgeResult.status === 'pass';
    const wasAlreadyCompleted = this._gameState.isLevelCompleted(levelId);
    const attemptNumber = this._gameState.getLevelAttempts(levelId).length + 1;

    this._gameState.recordAttempt({
      levelId,
      mode: 'manual',
      regex: rawRegex,
      judgeResult: { ...judgeResult, regex: null },
      timestamp: Date.now(),
      attemptNumber,
    });

    if (passed) {
      const rewardInfo = this.applySuccessRewards(attemptNumber, 'manual', judgeResult.status === 'perfect', 0, 0, levelId);

      const reward = buildRewardData(
        this._gameState,
        level,
        judgeResult.status === 'perfect',
        undefined,
        rewardInfo.xpGained,
        rewardInfo.combo,
        rewardInfo.newAchievementIds,
        wasAlreadyCompleted,
      );

      // Also send result to webview if open
      if (this._panel) {
        this.postMessage({
          command: 'showResult',
          result: { ...judgeResult, regex: null },
          feedback,
          rawRegex,
          reward,
        });
      }
    } else {
      const newState = resetCombo(this._gameState.state as any);
      this._gameState.setCombo(newState.combo);

      // track failure for hint system
      if (this._hintTracker) {
        this._hintTracker.recordFail(levelId);
      }

      // Also send result to webview if open
      if (this._panel) {
        this.postMessage({
          command: 'showResult',
          result: { ...judgeResult, regex: null },
          feedback,
          rawRegex,
        });

        // send updated hints after fail
        this.sendHintState(level, true);
      }
    }

    showJudgeFeedback(judgeResult, feedback);

    this._onDidUpdate.fire();
  }

  private applySuccessRewards(
    attemptNumber: number,
    mode: 'prompt' | 'manual',
    isPerfect: boolean,
    promptScore: number,
    promptLength: number,
    levelId: string
  ): { xpGained: number; combo: number; newAchievementIds: string[] } {
    if (!this._gameState) return { xpGained: 0, combo: 0, newAchievementIds: [] };

    // Increment combo
    const comboState = incrementCombo(this._gameState.state as any);
    this._gameState.setCombo(comboState.combo);

    // Calculate and add XP
    const xp = calculateXpGain(attemptNumber, mode, isPerfect, promptScore, promptLength, comboState.combo);
    this._gameState.addXp(xp);

    // Check chapter unlock
    const level = getLevelById(levelId);
    if (level) {
      const completed = this._gameState.getCompletedLevelIds();
      if (shouldUnlockNextChapter(completed, level.chapter)) {
        const next = getNextChapter(level.chapter);
        if (next !== null) {
          this._gameState.unlockChapter(next);
          vscode.window.showInformationMessage(`🔓 [Chapter ${next} Unlocked] 新的信号频段已解锁！`);
        }
      }
    }

    // Check achievements
    const newAchievements = checkAchievements(this._gameState.state);
    const newAchievementIds: string[] = [];
    for (const achievement of newAchievements) {
      this._gameState.unlockAchievement(achievement.id);
      newAchievementIds.push(achievement.id);
      showAchievementUnlocked(achievement.name, achievement.description);
    }

    // rEx easter egg signal (4.9)
    const rexMsg = getRexSignal(this._gameState.state);
    if (rexMsg) {
      setTimeout(() => {
        vscode.window.showInformationMessage(`[Incoming Signal…] ${rexMsg}`);
      }, 2000);
    }

    // Hidden chapter unlock detection (4.10)
    if (!this._gameState.isChapterUnlocked(HIDDEN_CHAPTER) &&
        shouldUnlockHiddenChapter(this._gameState.state.completedLevels)) {
      this._gameState.unlockChapter(HIDDEN_CHAPTER);
      vscode.window.showInformationMessage('🌙 [Incoming Signal…] rEx 开始回应你了。隐藏章节已解锁。');
    }

    return { xpGained: xp, combo: comboState.combo, newAchievementIds };
  }

  getDecryptPercent(): number {
    if (!this._gameState) return 0;
    const total = getAllLevels().length;
    const completed = this._gameState.getCompletedLevelIds().length;
    return computeDecryptPercent(completed, total);
  }

  getCurrentLevelId(): string | null {
    return this._currentLevel?.id ?? null;
  }

  private postMessage(msg: ExtensionMessage): void {
    this._panel?.webview.postMessage(msg);
  }

  dispose(): void {
    this._panel?.dispose();
  }
}
