import * as vscode from 'vscode';
import type { JudgeResult } from '../types';

export function showJudgeFeedback(result: JudgeResult, feedback: string): void {
  // TODO: Phase 3 - Task 3.7
  if (result.status === 'perfect' || result.status === 'pass') {
    vscode.window.showInformationMessage(feedback);
  } else if (result.status === 'error') {
    vscode.window.showErrorMessage(feedback);
  } else {
    vscode.window.showWarningMessage(feedback);
  }
}

export function showAchievementUnlocked(name: string, description: string): void {
  // TODO: Phase 4 - Task 4.3
  vscode.window.showInformationMessage(`🏅 ${name} — ${description}`);
}

export function showError(message: string): void {
  vscode.window.showErrorMessage(`[YourEx] ${message}`);
}
