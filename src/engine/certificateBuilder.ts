import * as os from 'os';
import type { GameStateManager } from '../state/gameState';
import type {
  AttemptRecord,
  CertificateAchievement,
  ChapterJourney,
  JourneyCertificateData,
  Level,
  LevelAttempt,
  LevelJourney,
  LevelJourneyStatus,
} from '../types';
import { loadChapterLevels, TOTAL_CHAPTERS, HIDDEN_CHAPTER } from './levelLoader';
import { getAchievements } from './achievementManager';
import { DIALOGUES } from '../story/dialogues';
import { t } from '../i18n/t';

const DEFAULT_PLAYER_NAME = 'PARSER';
const MAX_PLAYER_NAME_LEN = 24;
/** Pattern allows letters/digits/CJK and a small set of separators. */
const PLAYER_NAME_RE = /^[\p{L}\p{N}\-_·\s.]+$/u;

/**
 * Aggregate the player's GameState into the immutable JourneyCertificateData
 * payload that the PDF renderer consumes. Critical rule (doc §3.2): failed
 * attempts contribute count + timestamp ONLY. The prompt/regex bodies of fail
 * attempts must never appear in the produced data.
 */
export function buildJourneyCertificateData(
  gameState: GameStateManager,
  certificateId: string,
): JourneyCertificateData {
  const state = gameState.state;

  const playerName = sanitizePlayerName(state.certificatePlayerName) ?? defaultPlayerName();

  let totalAttempts = 0;
  let totalPromptLength = 0;
  let perfectCount = 0;
  let passCount = 0;
  let failCount = 0;
  let totalCompletedStandardLevels = 0;
  let totalStandardLevels = 0;

  const chapters: ChapterJourney[] = [];

  const standardChapterCount = TOTAL_CHAPTERS;
  const allChapterIndices = [
    ...Array.from({ length: standardChapterCount }, (_, i) => i + 1),
    HIDDEN_CHAPTER,
  ];

  for (const chapter of allChapterIndices) {
    const levels = loadChapterLevels(chapter);
    if (levels.length === 0) continue;

    const isHidden = chapter === HIDDEN_CHAPTER;
    if (!isHidden) {
      totalStandardLevels += levels.length;
    }

    const levelJourneys: LevelJourney[] = levels.map((level, idx) =>
      buildLevelJourney(level, idx + 1, state.completedLevels[level.id] ?? [], isHidden)
    );

    for (const lj of levelJourneys) {
      totalAttempts += lj.totalAttempts;
      perfectCount += lj.attempts.filter(a => a.status === 'perfect').length;
      passCount += lj.attempts.filter(a => a.status === 'pass').length;
      failCount += lj.failCount;
      for (const a of lj.attempts) {
        if (a.prompt) totalPromptLength += a.prompt.length;
      }
      if (!isHidden && (lj.status === 'pass' || lj.status === 'perfect')) {
        totalCompletedStandardLevels += 1;
      }
    }

    const isComplete = levelJourneys.every(
      lj => lj.status === 'pass' || lj.status === 'perfect'
    );

    chapters.push({
      chapter,
      chapterTitle: getChapterName(chapter),
      chapterCompleteLine: DIALOGUES.chapterComplete[chapter] ?? '',
      isComplete,
      levels: levelJourneys,
    });
  }

  const allAchievements = getAchievements();
  const achievements: CertificateAchievement[] = allAchievements.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    unlocked: state.unlockedAchievements.includes(a.id),
  }));

  const originChapter = chapters.find(c => c.chapter === HIDDEN_CHAPTER);
  const isOriginUnlocked = (state.completedLevels[originChapter?.levels[0]?.levelId ?? ''] ?? []).length > 0
    || (originChapter?.levels.some(l => l.status !== 'skipped') ?? false);
  const isOriginComplete = originChapter?.isComplete ?? false;

  return {
    certificateId,
    generatedAt: Date.now(),
    playerName,
    totalPlayTime: gameState.getElapsedMs(),
    totalAttempts,
    totalPromptLength,
    perfectCount,
    passCount,
    failCount,
    totalXp: state.xp,
    maxCombo: state.maxCombo,
    achievements,
    unlockedAchievementIds: [...state.unlockedAchievements],
    chapters,
    totalStandardLevels,
    totalCompletedStandardLevels,
    isOriginUnlocked,
    isOriginComplete,
  };
}

function buildLevelJourney(
  level: Level,
  levelOrder: number,
  rawAttempts: LevelAttempt[],
  isHidden: boolean,
): LevelJourney {
  const sortedAttempts = [...rawAttempts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  const attempts: AttemptRecord[] = sortedAttempts.map(a => sanitizeAttempt(a));

  const successCount = attempts.filter(a => a.status === 'perfect' || a.status === 'pass').length;
  const failCount = attempts.filter(a => a.status === 'fail').length;

  let status: LevelJourneyStatus;
  if (attempts.some(a => a.status === 'perfect')) {
    status = 'perfect';
  } else if (attempts.some(a => a.status === 'pass')) {
    status = 'pass';
  } else if (attempts.length > 0) {
    status = 'attempted';
  } else {
    // No attempts: hidden chapter renders this as 'skipped'; standard chapters
    // shouldn't reach the certificate without completion, but tolerate it.
    status = isHidden ? 'skipped' : 'attempted';
  }
  if (isHidden && attempts.length === 0) {
    status = 'skipped';
  }

  const passingAttempts = sortedAttempts.filter(
    a => a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass'
  );
  const bestRaw = passingAttempts.sort(
    (a, b) => (b.promptScore?.total ?? 0) - (a.promptScore?.total ?? 0)
  )[0];

  return {
    levelId: level.id,
    levelOrder,
    levelTitle: level.title,
    levelStory: extractStoryLine(level.story),
    status,
    attempts,
    bestScore: bestRaw?.promptScore,
    totalAttempts: attempts.length,
    failCount,
    successCount,
  };
}

/**
 * Strip prompt/regex from failed attempts. Successes keep their full content.
 */
function sanitizeAttempt(a: LevelAttempt): AttemptRecord {
  const status = a.judgeResult.status;
  const isSuccess = status === 'perfect' || status === 'pass';
  const normalized: 'perfect' | 'pass' | 'fail' = isSuccess
    ? (status as 'perfect' | 'pass')
    : 'fail';

  if (!isSuccess) {
    return {
      attemptNumber: a.attemptNumber,
      timestamp: a.timestamp,
      mode: a.mode,
      status: 'fail',
    };
  }

  return {
    attemptNumber: a.attemptNumber,
    timestamp: a.timestamp,
    mode: a.mode,
    prompt: a.mode === 'prompt' ? a.prompt : undefined,
    regex: a.judgeResult.rawRegexString || a.regex,
    status: normalized,
    scoreTotal: a.promptScore?.total,
  };
}

function extractStoryLine(story: string): string {
  if (!story) return '';
  const firstNonEmpty = story
    .split(/\r?\n/)
    .map(s => s.trim())
    .find(s => s.length > 0);
  return firstNonEmpty ?? '';
}

function getChapterName(ch: number): string {
  const key = `reward.chapterName.${ch}`;
  const v = t(key);
  return v !== key ? v : `Chapter ${ch}`;
}

function defaultPlayerName(): string {
  try {
    const raw = os.userInfo().username || DEFAULT_PLAYER_NAME;
    const cleaned = raw.replace(/[^\p{L}\p{N}\-_·.]/gu, '').toUpperCase();
    return cleaned.length > 0 ? cleaned.slice(0, MAX_PLAYER_NAME_LEN) : DEFAULT_PLAYER_NAME;
  } catch {
    return DEFAULT_PLAYER_NAME;
  }
}

function sanitizePlayerName(input: string | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_PLAYER_NAME_LEN) return null;
  if (!PLAYER_NAME_RE.test(trimmed)) return null;
  return trimmed;
}

/**
 * Generate a stable certificate ID. Format: REX-YYYY-MMDD-XXXX
 * (XXXX = 4 uppercase hex chars).
 */
export function generateCertificateId(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `REX-${yyyy}-${mm}${dd}-${rand}`;
}

/** Public alias for the sanitizer so callers can validate proposed names. */
export function validatePlayerName(input: string): string | null {
  return sanitizePlayerName(input);
}
