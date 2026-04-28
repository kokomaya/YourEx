import type { GameStateManager } from '../state/gameState';
import type { Level, LevelAttempt } from '../types';
import type { PromptScore } from '../types/score';
import { loadChapterLevels, TOTAL_CHAPTERS, HIDDEN_CHAPTER } from './levelLoader';
import { getAchievements } from './achievementManager';
import { DIALOGUES } from '../story/dialogues';
import { t } from '../i18n';
import { evaluateUnlockOnAttempt, shouldAutoPrompt } from './certificateUnlockChecker';

function getChapterName(ch: number): string {
  return t(`reward.chapterName.${ch}`);
}

function getChapterPreview(ch: number): string | null {
  const key = `reward.chapterPreview.${ch}`;
  const val = t(key);
  return val !== key ? val : null;
}

export interface AchievementInfo {
  id: string;
  name: string;
  description: string;
}

export interface LevelRewardData {
  tier: 'pass' | 'perfect';
  levelId: string;
  levelTitle: string;
  chapter: number;
  score?: PromptScore;
  xpGained: number;
  comboCount: number;
  newAchievements: AchievementInfo[];
  isChapterComplete: boolean;
  isGameComplete: boolean;
  isOriginComplete: boolean;
  certificateJustUnlocked?: boolean;
  certificateAutoPrompt?: boolean;
  chapterSummary?: ChapterSummary;
}

export interface ChapterSummary {
  chapter: number;
  chapterName: string;
  completeLine: string;
  levelsCompleted: number;
  levelsPerfect: number;
  totalLevels: number;
  totalXp: number;
  bestCombo: number;
  achievements: AchievementInfo[];
  nextChapter: number | null;
  nextChapterIntro: string | null;
  // Game complete extras
  totalCompletedLevels?: number;
  totalStandardLevels?: number;
  elapsedMs?: number;
}

export function buildRewardData(
  gameState: GameStateManager,
  level: Level,
  isPerfect: boolean,
  score: PromptScore | undefined,
  xpGained: number,
  combo: number,
  newAchievementIds: string[],
  wasAlreadyCompleted?: boolean,
  attempt?: LevelAttempt,
): LevelRewardData {
  const chapter = level.chapter;
  const completedIds = gameState.getCompletedLevelIds();

  // Only flag chapter complete if THIS level is what newly completes it
  const chapterLevels = loadChapterLevels(chapter);
  const allChapterDone = chapterLevels.length > 0 &&
    chapterLevels.every(l => completedIds.includes(l.id));
  const isChapterComplete = allChapterDone && !wasAlreadyCompleted;

  // Check if all standard chapters are complete
  let allStandardComplete = false;
  if (isChapterComplete) {
    allStandardComplete = Array.from({ length: TOTAL_CHAPTERS }, (_, i) => i + 1)
      .every(ch => {
        const levels = loadChapterLevels(ch);
        return levels.every(l => completedIds.includes(l.id));
      });
  }

  const isGameComplete = allStandardComplete && chapter === 5;
  const isOriginComplete = isChapterComplete && chapter === HIDDEN_CHAPTER;

  // Map achievement ids to info
  const allAchievements = getAchievements();
  const achievementMap = new Map(allAchievements.map(a => [a.id, a]));

  const newAchievements: AchievementInfo[] = newAchievementIds
    .map(id => achievementMap.get(id))
    .filter((a): a is NonNullable<typeof a> => a !== undefined)
    .map(a => ({ id: a.id, name: a.name, description: a.description }));

  let chapterSummary: ChapterSummary | undefined;
  if (isChapterComplete) {
    const state = gameState.state;

    const levelsPerfect = chapterLevels.filter(l => {
      const attempts = state.completedLevels[l.id];
      return attempts?.some(a => a.judgeResult.status === 'perfect');
    }).length;

    const nextChapter = chapter < TOTAL_CHAPTERS ? chapter + 1 : null;
    const nextIntroDialogue = nextChapter ? DIALOGUES.chapterIntro[nextChapter] : undefined;

    const unlockedAchievements: AchievementInfo[] = state.unlockedAchievements
      .map(id => achievementMap.get(id))
      .filter((a): a is NonNullable<typeof a> => a !== undefined)
      .map(a => ({ id: a.id, name: a.name, description: a.description }));

    chapterSummary = {
      chapter,
      chapterName: getChapterName(chapter),
      completeLine: DIALOGUES.chapterComplete[chapter] ?? '',
      levelsCompleted: chapterLevels.length,
      levelsPerfect,
      totalLevels: chapterLevels.length,
      totalXp: state.xp,
      bestCombo: state.maxCombo,
      achievements: unlockedAchievements,
      nextChapter,
      nextChapterIntro: nextIntroDialogue?.lines[0] ?? getChapterPreview(nextChapter ?? 0),
    };

    // Game/Origin complete extras
    if (isGameComplete || isOriginComplete) {
      let totalStandard = 0;
      for (let ch = 1; ch <= TOTAL_CHAPTERS; ch++) {
        totalStandard += loadChapterLevels(ch).length;
      }
      chapterSummary.totalCompletedLevels = completedIds.length;
      chapterSummary.totalStandardLevels = totalStandard;
      chapterSummary.elapsedMs = gameState.getElapsedMs();
    }
  }

  // Certificate unlock detection: data-driven via Level.certificateTrigger.
  // Sticky flag lives on GameState; auto-prompt info comes from the trigger.
  let certificateJustUnlocked = false;
  let certificateAutoPrompt: boolean | undefined;
  if (attempt && evaluateUnlockOnAttempt(level, attempt)) {
    certificateJustUnlocked = gameState.markCertificateUnlocked();
    certificateAutoPrompt = shouldAutoPrompt(level);
  }

  return {
    tier: isPerfect ? 'perfect' : 'pass',
    levelId: level.id,
    levelTitle: level.title,
    chapter,
    score,
    xpGained,
    comboCount: combo,
    newAchievements,
    isChapterComplete,
    isGameComplete,
    isOriginComplete,
    certificateJustUnlocked,
    certificateAutoPrompt,
    chapterSummary,
  };
}
