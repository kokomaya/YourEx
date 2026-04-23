import type { GameState } from '../types';
import type { Locale } from '../i18n/types';
import { DEFAULT_LOCALE } from '../i18n/types';
import type { Dialogue, DialogueSet } from '../data/dialogues/types';
import { DIALOGUES_ZH_CN } from '../data/dialogues/zh-CN';
import { DIALOGUES_EN } from '../data/dialogues/en';

export type { Dialogue, DialogueSet };

const DIALOGUE_MAP: Record<Locale, DialogueSet> = {
  'zh-CN': DIALOGUES_ZH_CN,
  'en': DIALOGUES_EN,
};

let currentLocale: Locale = DEFAULT_LOCALE;

export function setDialogueLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getDialogues(locale?: Locale): DialogueSet {
  const l = locale ?? currentLocale;
  return DIALOGUE_MAP[l] ?? DIALOGUE_MAP[DEFAULT_LOCALE];
}

// Keep backward-compatible DIALOGUES reference (points to current locale)
export const DIALOGUES = {
  get welcome() { return getDialogues().welcome; },
  get chapterIntro() { return getDialogues().chapterIntro as Record<number, Dialogue>; },
  get chapterComplete() { return getDialogues().chapterComplete as Record<number, string>; },
};

/**
 * Get a dialogue for the current game state context.
 * Returns chapter intro dialogue if a new chapter was just unlocked.
 */
export function getChapterDialogue(chapter: number): Dialogue | undefined {
  return DIALOGUES.chapterIntro[chapter];
}

/**
 * Get a rEx easter egg signal message.
 * Appears with probability after chapter 3+ completion.
 */
export function getRexSignal(state: GameState): string | null {
  const completedCount = Object.keys(state.completedLevels).filter(id => {
    const attempts = state.completedLevels[id];
    return attempts?.some(a => a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass');
  }).length;

  // Only trigger after chapter 3 (level 15+)
  if (completedCount < 15) return null;

  // 20% chance to show
  if (Math.random() > 0.2) return null;

  const dialogues = getDialogues();

  // Use final signals if XP >= 400
  if (state.xp >= 400) {
    return dialogues.rexFinalSignals[Math.floor(Math.random() * dialogues.rexFinalSignals.length)];
  }

  return dialogues.rexSignals[Math.floor(Math.random() * dialogues.rexSignals.length)];
}

/**
 * Check if all levels have been completed with Perfect status.
 */
export function isAllPerfect(state: GameState, totalLevels: number): boolean {
  const perfectIds = Object.keys(state.completedLevels).filter(id => {
    const attempts = state.completedLevels[id];
    return attempts?.some(a => a.judgeResult.status === 'perfect');
  });
  return perfectIds.length >= totalLevels;
}
