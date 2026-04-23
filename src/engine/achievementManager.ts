import type { Achievement, GameState } from '../types';
import { getAllLevels } from './levelLoader';
import { type Locale, DEFAULT_LOCALE } from '../i18n/types';
import { ACHIEVEMENT_TEXTS_ZH_CN } from '../data/achievements/zh-CN';
import { ACHIEVEMENT_TEXTS_EN } from '../data/achievements/en';

const ACHIEVEMENT_TEXTS: Record<Locale, Record<string, { name: string; description: string }>> = {
  'zh-CN': ACHIEVEMENT_TEXTS_ZH_CN,
  'en': ACHIEVEMENT_TEXTS_EN,
};

let currentLocale: Locale = DEFAULT_LOCALE;

export function setAchievementLocale(locale: Locale): void {
  currentLocale = locale;
}

function getAchievementText(id: string): { name: string; description: string } {
  const texts = ACHIEVEMENT_TEXTS[currentLocale] ?? ACHIEVEMENT_TEXTS[DEFAULT_LOCALE];
  return texts[id] ?? { name: id, description: '' };
}

function defineAchievements(): Achievement[] {
  return [
    {
      id: 'first_signal',
      ...getAchievementText('first_signal'),
      condition: (state) =>
        Object.values(state.completedLevels).some(attempts =>
          attempts.some(a =>
            a.mode === 'prompt' && a.attemptNumber === 1 &&
            (a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass')
          )
        ),
      unlocked: false,
    },
    {
      id: 'speed_parse',
      ...getAchievementText('speed_parse'),
      condition: (state) => {
        if (!state.startTime) return false;
        return Object.values(state.completedLevels).some(attempts =>
          attempts.some(a =>
            (a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass') &&
            a.timestamp >= state.startTime! &&
            (a.timestamp - state.startTime!) < 30_000
          )
        );
      },
      unlocked: false,
    },
    {
      id: 'minimal_instruction',
      ...getAchievementText('minimal_instruction'),
      condition: (state) =>
        Object.values(state.completedLevels).some(attempts =>
          attempts.some(a =>
            a.mode === 'prompt' && a.prompt !== undefined && a.prompt.length <= 15 &&
            (a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass')
          )
        ),
      unlocked: false,
    },
    {
      id: 'noise_overflow',
      ...getAchievementText('noise_overflow'),
      condition: (state) =>
        Object.values(state.completedLevels).some(attempts =>
          attempts.some(a =>
            a.mode === 'prompt' && a.prompt !== undefined && a.prompt.length > 200 &&
            a.judgeResult.status === 'fail'
          )
        ),
      unlocked: false,
    },
    {
      id: 'manual_override',
      ...getAchievementText('manual_override'),
      condition: (state) =>
        Object.values(state.completedLevels).some(attempts =>
          attempts.some(a =>
            a.mode === 'manual' &&
            (a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass')
          )
        ),
      unlocked: false,
    },
    {
      id: 'full_manual',
      ...getAchievementText('full_manual'),
      condition: (state) => {
        const levels = getAllLevels();
        if (levels.length === 0) return false;
        return levels.every(level => {
          const attempts = state.completedLevels[level.id];
          return attempts?.some(a =>
            a.mode === 'manual' &&
            (a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass')
          );
        });
      },
      unlocked: false,
    },
    {
      id: 'chain_decode',
      ...getAchievementText('chain_decode'),
      condition: (state) => state.maxCombo >= 10,
      unlocked: false,
    },
    {
      id: 'persistent_parser',
      ...getAchievementText('persistent_parser'),
      condition: (state) =>
        Object.values(state.completedLevels).some(attempts =>
          attempts.length >= 10 &&
          attempts.some(a =>
            a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass'
          )
        ),
      unlocked: false,
    },
    {
      id: 'night_shift',
      ...getAchievementText('night_shift'),
      condition: (state) =>
        Object.values(state.completedLevels).some(attempts =>
          attempts.some(a => {
            if (a.judgeResult.status !== 'perfect' && a.judgeResult.status !== 'pass') return false;
            const hour = new Date(a.timestamp).getHours();
            return hour >= 2 && hour < 5;
          })
        ),
      unlocked: false,
    },
    {
      id: 'human_machine_sync',
      ...getAchievementText('human_machine_sync'),
      condition: (state) =>
        Object.values(state.completedLevels).some(attempts => {
          const hasPromptPass = attempts.some(a =>
            a.mode === 'prompt' && (a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass')
          );
          const hasManualPass = attempts.some(a =>
            a.mode === 'manual' && (a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass')
          );
          return hasPromptPass && hasManualPass;
        }),
      unlocked: false,
    },
    {
      id: 'multi_vector',
      ...getAchievementText('multi_vector'),
      condition: (state) =>
        Object.values(state.completedLevels).some(attempts => {
          const passingPrompts = new Set(
            attempts
              .filter(a =>
                a.mode === 'prompt' && a.prompt !== undefined &&
                (a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass')
              )
              .map(a => a.prompt!)
          );
          return passingPrompts.size >= 3;
        }),
      unlocked: false,
    },
    {
      id: 'perfect_engineer',
      ...getAchievementText('perfect_engineer'),
      condition: (state) => {
        const levels = getAllLevels();
        if (levels.length === 0) return false;
        return levels.every(level => {
          const attempts = state.completedLevels[level.id];
          if (!attempts) return false;
          return attempts.some(a =>
            a.mode === 'prompt' && a.promptScore !== undefined && a.promptScore.total >= 90
          );
        });
      },
      unlocked: false,
    },
  ];
}

export function getAchievements(): Achievement[] {
  return defineAchievements();
}

export function checkAchievements(state: GameState): Achievement[] {
  const achievements = defineAchievements();
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of achievements) {
    if (state.unlockedAchievements.includes(achievement.id)) continue;
    if (achievement.condition(state)) {
      newlyUnlocked.push({ ...achievement, unlocked: true });
    }
  }

  return newlyUnlocked;
}
