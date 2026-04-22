import * as vscode from 'vscode';
import { loadChapterLevels, TOTAL_CHAPTERS, HIDDEN_CHAPTER } from '../../engine/levelLoader';
import type { GameStateManager } from '../../state/gameState';
import type { IAccessPolicy } from '../../access/IAccessPolicy';

const CHAPTER_NAMES: Record<number, string> = {
  1: '📡 Signal Contact',
  2: '🔍 Pattern Recognition',
  3: '⚡ Syntax Awakening',
  4: '🛰️ Transmission',
  5: '🌌 rEx',
  6: '👁️ Origin Frame',
};

export class SidebarProvider implements vscode.TreeDataProvider<SidebarItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SidebarItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _gameState: GameStateManager | null = null;
  private _accessPolicy: IAccessPolicy | null = null;

  setGameState(gameState: GameStateManager): void {
    this._gameState = gameState;
  }

  setAccessPolicy(policy: IAccessPolicy): void {
    this._accessPolicy = policy;
  }

  getTreeItem(element: SidebarItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SidebarItem): SidebarItem[] {
    if (!this._gameState || !this._accessPolicy) return [];

    // Root: show chapters
    if (!element) {
      return this.getChapters();
    }

    // Chapter node: show levels
    if (element.contextValue === 'chapter') {
      return this.getLevelsForChapter(element.chapterNumber!);
    }

    return [];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  private getChapters(): SidebarItem[] {
    const items: SidebarItem[] = [];
    const isDeveloperMode = this._accessPolicy!.mode === 'developer';
    const chapterNumbers = Array.from({ length: TOTAL_CHAPTERS }, (_, index) => index + 1);
    if (isDeveloperMode || this._gameState!.isChapterUnlocked(HIDDEN_CHAPTER)) {
      chapterNumbers.push(HIDDEN_CHAPTER);
    }

    for (const ch of chapterNumbers) {
      const unlocked = this._accessPolicy!.isChapterUnlocked(ch);
      const name = CHAPTER_NAMES[ch] ?? `Chapter ${ch}`;
      const baseLabel = `Ch.${ch} ${name}`;
      const label = isDeveloperMode ? `🛠️ ${baseLabel}` : baseLabel;

      const item = new SidebarItem(
        unlocked ? label : `🔒 Ch.${ch} ${name}`,
        unlocked
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.None
      );
      item.contextValue = 'chapter';
      item.chapterNumber = ch;

      if (!unlocked) {
        item.tooltip = '完成前一章以解锁';
      }

      items.push(item);
    }
    return items;
  }

  private getLevelsForChapter(chapter: number): SidebarItem[] {
    const levels = loadChapterLevels(chapter);
    return levels.map(level => {
      const completed = this._gameState!.isLevelCompleted(level.id);
      const best = this._gameState!.getBestAttempt(level.id);
      const scoreText = best?.promptScore ? ` (${best.promptScore.total})` : '';

      const icon = completed ? '✅' : '🔓';
      const label = `${icon} ${level.title}${scoreText}`;

      const item = new SidebarItem(label, vscode.TreeItemCollapsibleState.None);
      item.contextValue = 'level';
      item.levelId = level.id;
      item.tooltip = level.promptChallenge;
      item.command = {
        command: 'yourex.openLevel',
        title: 'Open Level',
        arguments: [level.id],
      };

      return item;
    });
  }
}

class SidebarItem extends vscode.TreeItem {
  chapterNumber?: number;
  levelId?: string;
}
