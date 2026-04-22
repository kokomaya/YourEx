import * as vscode from 'vscode';
import { getWebviewContent, getVisualConfigFromSettings } from './webviewHelper';
import type { IAIProvider } from '../../ai/IAIProvider';
import type { GameStateManager } from '../../state/gameState';
import type { Level, WebViewMessage, ExtensionMessage } from '../../types';
import { getLevelById, shouldUnlockNextChapter, getNextChapter, shouldUnlockHiddenChapter, HIDDEN_CHAPTER } from '../../engine/levelLoader';
import { runDecryptionPipeline, runManualJudge } from '../../engine/decryptionPipeline';
import { getFeedbackText } from '../feedback';
import { showJudgeFeedback, showAchievementUnlocked } from '../feedback';
import { calculateXpGain } from '../../engine/xpTracker';
import { incrementCombo, resetCombo } from '../../engine/comboTracker';
import { computeDecryptPercent } from '../../engine/xpTracker';
import { getAllLevels } from '../../engine/levelLoader';
import { checkAchievements } from '../../engine/achievementManager';
import { getRexSignal } from '../../story/dialogues';

export class PromptPanelProvider {
  private _panel: vscode.WebviewPanel | undefined;
  private _currentLevel: Level | undefined;
  private _aiProvider: IAIProvider | undefined;
  private _gameState: GameStateManager | undefined;
  private _onDidUpdate = new vscode.EventEmitter<void>();
  readonly onDidUpdate = this._onDidUpdate.event;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  setDependencies(aiProvider: IAIProvider, gameState: GameStateManager): void {
    this._aiProvider = aiProvider;
    this._gameState = gameState;
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
        getVisualConfigFromSettings()
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
  }

  private async handleMessage(msg: WebViewMessage): Promise<void> {
    switch (msg.command) {
      case 'ready':
        if (this._currentLevel) {
          this.postMessage({ command: 'loadLevel', level: this._currentLevel });
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
      const result = await runDecryptionPipeline(prompt, level, this._aiProvider, attemptNumber);

      const feedback = getFeedbackText(result.judgeResult, level, 'prompt');
      const passed = result.judgeResult.status === 'perfect' || result.judgeResult.status === 'pass';

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
        this.applySuccessRewards(
          attemptNumber,
          'prompt',
          result.judgeResult.status === 'perfect',
          result.promptScore.total,
          prompt.length,
          levelId
        );
      } else {
        // reset combo on fail
        const newState = resetCombo(this._gameState.state as any);
        this._gameState.setCombo(newState.combo);
      }

      showJudgeFeedback(result.judgeResult, feedback);

      this.postMessage({
        command: 'showResult',
        result: { ...result.judgeResult, regex: null },
        score: result.promptScore,
        feedback,
        rawRegex: result.rawRegex,
      });

      this._onDidUpdate.fire();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.postMessage({ command: 'showError', message: msg });
      this.postMessage({ command: 'setLoading', loading: false });
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
      this.applySuccessRewards(attemptNumber, 'manual', judgeResult.status === 'perfect', 0, 0, levelId);
    } else {
      const newState = resetCombo(this._gameState.state as any);
      this._gameState.setCombo(newState.combo);
    }

    showJudgeFeedback(judgeResult, feedback);

    // Also send result to webview if open
    if (this._panel) {
      this.postMessage({
        command: 'showResult',
        result: { ...judgeResult, regex: null },
        feedback,
        rawRegex,
      });
    }

    this._onDidUpdate.fire();
  }

  private applySuccessRewards(
    attemptNumber: number,
    mode: 'prompt' | 'manual',
    isPerfect: boolean,
    promptScore: number,
    promptLength: number,
    levelId: string
  ): void {
    if (!this._gameState) return;

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
    for (const achievement of newAchievements) {
      this._gameState.unlockAchievement(achievement.id);
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
  }

  getDecryptPercent(): number {
    if (!this._gameState) return 0;
    const total = getAllLevels().length;
    const completed = this._gameState.getCompletedLevelIds().length;
    return computeDecryptPercent(completed, total);
  }

  private postMessage(msg: ExtensionMessage): void {
    this._panel?.webview.postMessage(msg);
  }

  dispose(): void {
    this._panel?.dispose();
  }
}
