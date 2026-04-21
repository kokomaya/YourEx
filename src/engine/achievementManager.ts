import type { Achievement, GameState } from '../types';
import { getAllLevels } from './levelLoader';

function defineAchievements(): Achievement[] {
  return [
    {
      id: 'first_signal',
      name: '📡 First Signal',
      description: '信号清晰。无需校准。',
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
      name: '⚡ Speed Parse',
      description: '解析速度超出预期',
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
      name: '📏 Minimal Instruction',
      description: '极简指令。极致效果。',
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
      name: '📖 Noise Overflow',
      description: '指令噪声过大。信号丢失。',
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
      name: '⚔️ Manual Override',
      description: '你不需要协助系统。你就是规则。',
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
      name: '🗡️ Full Manual',
      description: 'The system was never needed. You were the parser.',
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
      name: '🔥 Chain Decode',
      description: '解析链路稳定。零误差。',
      condition: (state) => state.maxCombo >= 10,
      unlocked: false,
    },
    {
      id: 'persistent_parser',
      name: '💀 Persistent Parser',
      description: '信号最终被解析。无论花了多久。',
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
      name: '🌙 Night Shift',
      description: '有些信号，只在深夜才清晰',
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
      name: '🤖 Human-Machine Sync',
      description: '人机协同。完美输出。',
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
      name: '🧪 Multi-Vector',
      description: '通往解密的路径不止一条',
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
      name: '📐 Perfect Engineer',
      description: '你的指令不是文字，是精密仪器',
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
