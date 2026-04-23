import * as vscode from 'vscode';
import type { JudgeResult, Level } from '../types';
import { t } from '../i18n';

export function getFeedbackText(result: JudgeResult, level: Level, mode: 'prompt' | 'manual'): string {
  if (mode === 'manual' && (result.status === 'perfect' || result.status === 'pass')) {
    return level.feedback.onDirectWrite;
  }
  switch (result.status) {
    case 'perfect': return level.feedback.onPerfect;
    case 'pass': return level.feedback.onPass;
    case 'error': return result.errorMessage ?? t('feedback.systemError');
    default: return level.feedback.onFail;
  }
}

export function showJudgeFeedback(result: JudgeResult, feedback: string): void {
  if (result.status === 'perfect' || result.status === 'pass') {
    vscode.window.showInformationMessage(`✅ ${feedback}`);
  } else if (result.status === 'error') {
    vscode.window.showErrorMessage(`🚫 ${feedback}`);
  } else {
    vscode.window.showWarningMessage(`❌ ${feedback}`);
  }
}

export function showAchievementUnlocked(name: string, description: string): void {
  vscode.window.showInformationMessage(`🏅 ${name} — ${description}`);
}

export function showError(message: string): void {
  vscode.window.showErrorMessage(`[YourEx] ${message}`);
}
