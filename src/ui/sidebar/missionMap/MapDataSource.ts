import type { IMapDataSource } from './IMapDataSource';
import type { ChapterMapData, MapNode } from './mapMessages';
import type { GameStateManager } from '../../../state/gameState';
import type { IAccessPolicy } from '../../../access/IAccessPolicy';
import { loadChapterLevels, TOTAL_CHAPTERS, HIDDEN_CHAPTER, getAllLevels } from '../../../engine/levelLoader';
import { t } from '../../../i18n/t';
import { isCertificateUnlocked as checkCertificateUnlocked } from '../../../engine/certificateUnlockChecker';

const CHAPTER_COLORS: Record<number, string> = {
  1: '#22d3ee',
  2: '#34d399',
  3: '#60a5fa',
  4: '#fbbf24',
  5: '#c084fc',
  6: '#22d3ee',
};

export class MapDataSource implements IMapDataSource {
  constructor(
    private gameState: GameStateManager,
    private accessPolicy: IAccessPolicy,
  ) {}

  setAccessPolicy(policy: IAccessPolicy): void {
    this.accessPolicy = policy;
  }

  getChapters(): ChapterMapData[] {
    const chapters: ChapterMapData[] = [];
    const isDeveloper = this.accessPolicy.mode === 'developer';

    const chapterNumbers = Array.from({ length: TOTAL_CHAPTERS }, (_, i) => i + 1);
    if (isDeveloper || this.gameState.isChapterUnlocked(HIDDEN_CHAPTER)) {
      chapterNumbers.push(HIDDEN_CHAPTER);
    }

    for (const ch of chapterNumbers) {
      const unlocked = this.accessPolicy.isChapterUnlocked(ch);
      const levels = loadChapterLevels(ch);
      const completedIds = this.gameState.getCompletedLevelIds();

      const nodes: MapNode[] = levels.map((level, index) => {
        const best = this.gameState.getBestAttempt(level.id);
        const completed = this.gameState.isLevelCompleted(level.id);

        let status: MapNode['status'] = 'locked';
        if (!unlocked) {
          status = 'locked';
        } else if (completed && best?.judgeResult.status === 'perfect') {
          status = 'perfect';
        } else if (completed) {
          status = 'passed';
        } else {
          status = 'available';
        }

        return {
          id: level.id,
          title: level.title,
          chapter: ch,
          index,
          difficulty: level.difficulty,
          status,
          score: best?.promptScore?.total ?? null,
          promptChallenge: level.promptChallenge,
        };
      });

      const progress = nodes.filter(n => n.status === 'passed' || n.status === 'perfect').length;

      chapters.push({
        chapter: ch,
        name: t(`sidebar.chapter.${ch}`) || `Chapter ${ch}`,
        unlocked,
        progress,
        total: nodes.length,
        themeColor: CHAPTER_COLORS[ch] ?? '#22d3ee',
        nodes,
      });
    }

    return chapters;
  }

  isCertificateUnlocked(): boolean {
    return checkCertificateUnlocked(this.gameState.state, getAllLevels());
  }
}
