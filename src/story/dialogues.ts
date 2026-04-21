import type { GameState } from '../types';

export interface Dialogue {
  title: string;
  lines: string[];
}

export const DIALOGUES = {
  welcome: {
    title: '[System Booting…]',
    lines: [
      '>> 接入未知信号源…',
      '>> 协议识别失败…',
      '>> 语言结构：未知',
      '',
      '所有异常数据中，都出现同一个标记：',
      '',
      '            r E x',
      '',
      '它不是代码，也不是攻击。',
      '它是一种语言。',
      '',
      '你被选中参与这次解析任务。',
      '原因只有一个：你能够定义规则。',
    ],
  },

  chapterIntro: {
    1: {
      title: '[📡 Signal Contact]',
      lines: [
        '>> 信号源已锁定。',
        '>> 噪声中隐藏着模式。',
        '>> 你的第一个任务：从混沌中找到秩序。',
      ],
    },
    2: {
      title: '[🔍 Pattern Recognition]',
      lines: [
        '>> 信号结构变得复杂。',
        '>> 每个字符都有多重含义。',
        '>> 你的指令需要更精确的约束。',
      ],
    },
    3: {
      title: '[⚡ Syntax Awakening]',
      lines: [
        '>> 语法规律开始浮现。',
        '>> 但你的指令太冗余了。',
        '>> 精简。再精简。',
      ],
    },
    4: {
      title: '[🛰️ Transmission]',
      lines: [
        '>> 信号变成了结构化的通信协议。',
        '>> 复杂数据需要结构化指令。',
        '>> 分步。举例。模板。',
      ],
    },
    5: {
      title: '[🌌 rEx]',
      lines: [
        '>> 最后一段信号。',
        '>> 所有规律汇聚于此。',
        '>> 一条指令，完成终极解密。',
      ],
    },
  } as Record<number, Dialogue>,

  chapterComplete: {
    1: '信号接触完成。你已经能识别基本模式了。',
    2: '模式识别完成。字符的多重含义已被你掌握。',
    3: '语法觉醒完成。你的指令变得精炼而有力。',
    4: '传输协议破解。结构化思维是你的武器。',
    5: '所有信号已解密。你就是下一个 rEx。',
  } as Record<number, string>,
} as const;

const REX_SIGNALS = [
  '…you are parsing…',
  '…pattern detected…',
  '…signal accepted…',
  '…you are close…',
  '…syntax recognized…',
  '…transmission received…',
];

const REX_FINAL_SIGNALS = [
  '…you understand now…',
  '…the language is yours…',
  '…rEx was never the signal. You were.…',
];

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

  // Use final signals if XP >= 400
  if (state.xp >= 400) {
    return REX_FINAL_SIGNALS[Math.floor(Math.random() * REX_FINAL_SIGNALS.length)];
  }

  return REX_SIGNALS[Math.floor(Math.random() * REX_SIGNALS.length)];
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
