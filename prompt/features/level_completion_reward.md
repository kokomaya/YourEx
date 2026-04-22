# Level Completion Reward System 设计书

## 1. 目标

为 YourEx 添加通关奖励动画与界面系统：

1. 每关通过时播放沉浸式的奖励动画，让玩家感受"解密成功"的成就感。
2. 章节完成时播放特殊的章节通关叙事动画，推动剧情发展。
3. 全通关（Ch5 Level 25）时播放终极揭示动画："你就是下一个 rEx。"
4. 隐藏章节（Ch6 Origin）完成后播放终极彩蛋动画。
5. 奖励界面展示分数、成就、XP 变化，并引导玩家进入下一关。

---

## 2. 奖励层级

### 2.1 单关通过（Level Complete）

每关通过后触发，分两个等级：

| 等级 | 触发条件 | 动画强度 |
|---|---|---|
| Pass | `status === 'pass'` | 标准奖励动画 |
| Perfect | `status === 'perfect'` | 强化奖励动画 + 星标特效 |

### 2.2 章节通关（Chapter Complete）

一章内所有关卡完成后触发，包含：
- 章节完成叙事文字（来自 `DIALOGUES.chapterComplete`）
- 下一章解锁预告
- 章节统计汇总

### 2.3 全通关（Game Complete — Ch5 Level 25）

所有标准关卡完成后触发，叙事高潮：
- rEx 的最终信号揭示
- "所有信号已解密。你就是下一个 rEx。"
- 玩家身份转变动画

### 2.4 Origin 彩蛋（Ch6 Complete）

隐藏章节完成后触发：
- "WE_WERE_THE_PARSER" 揭示
- 闭环叙事：解析者与信号本为一体

---

## 3. 视觉设计

### 3.1 单关通过动画

**Pass 等级：**

```
Phase 1 (0-0.5s): 结果面板淡出
Phase 2 (0.5-1.5s): 屏幕中央出现 ✓ 信号确认图标
                     边框状态灯闪绿
                     "SIGNAL DECODED" 文字打字机显示
Phase 3 (1.5-2.5s): 分数卡片从下方滑入
                     XP 数值滚动增加
                     新解锁成就弹出
Phase 4 (2.5-3.5s): 底部出现操作按钮
```

**Perfect 等级额外效果：**
- Phase 2 图标为 ⭐ 双星标
- "PERFECT DECODE — ZERO NOISE" 文字
- 短暂的屏幕边缘金色光晕脉冲
- 分数卡片带光辉粒子

### 3.2 章节通关动画

```
Phase 1 (0-1s): 屏幕渐暗，星场减速
Phase 2 (1-3s): 章节完成台词逐行打字机显示
                来自 DIALOGUES.chapterComplete[chapter]
Phase 3 (3-5s): 章节统计面板淡入
                ┌──────────────────────────┐
                │  📡 Chapter 1 Complete   │
                │  Signal Contact          │
                │                          │
                │  Levels:    5/5 ✓        │
                │  Perfect:   3/5 ⭐       │
                │  Total XP:  +420         │
                │  Best Combo: x8          │
                │                          │
                │  Achievements Unlocked:  │
                │  📡 First Signal         │
                │  ⚡ Speed Parse          │
                └──────────────────────────┘
Phase 4 (5-6.5s): 下一章预告
                ">> CHAPTER 2 UNLOCKED"
                下一章第一行 intro 台词
Phase 5 (6.5s+): 操作按钮
                [进入下一章] [查看排行榜]
```

### 3.3 全通关动画（Ch5 终局）

```
Phase 1 (0-2s): 所有背景效果同时加速 → 汇聚 → 暂停
Phase 2 (2-5s): 黑屏，rEx 最终信号逐行出现：
                "…you understand now…"
                "…the language is yours…"
                "…rEx was never the signal. You were.…"
Phase 3 (5-8s): 中央大字渐显：
                "你就是下一个 rEx"
                下方小字："所有信号已解密。"
Phase 4 (8-10s): 全游戏统计面板
                总解密关卡数、总XP、全成就列表、游玩时间
Phase 5 (10s+): [再次挑战] [查看排行榜]
                小字提示："还有一个信号源未被探测…"（暗示 Ch6）
```

### 3.4 Origin 彩蛋动画（Ch6）

```
Phase 1 (0-2s): 静电噪声画面
Phase 2 (2-5s): 打字机逐字符显示：
                "rEx[ORIGIN:...PHRASE:WE_WERE_THE_PARSER]"
Phase 3 (5-8s): 反转揭示：
                "WE WERE THE PARSER"
                "解析者与信号，从未分开过。"
Phase 4 (8s+):  彩蛋徽章 + 统计
```

---

## 4. 数据模型

```ts
type RewardTier = 'pass' | 'perfect';

interface LevelRewardData {
  tier: RewardTier;
  levelId: string;
  levelTitle: string;
  chapter: number;
  score: PromptScore;
  xpGained: number;
  comboCount: number;
  newAchievements: Achievement[];
  isChapterComplete: boolean;
  isGameComplete: boolean;
  isOriginComplete: boolean;
}

interface ChapterSummary {
  chapter: number;
  chapterName: string;
  completeLine: string;       // from DIALOGUES.chapterComplete
  levelsCompleted: number;
  levelsPerfect: number;
  totalLevels: number;
  totalXp: number;
  bestCombo: number;
  achievements: Achievement[];
  nextChapter: number | null;
  nextChapterIntro: string | null;
}
```

---

## 5. SOLID 架构

### 5.1 SRP 单一职责

| 模块 | 职责 |
|---|---|
| `RewardDataBuilder` | 从 GameState 组装奖励数据 |
| `RewardOverlay` | React 组件，渲染奖励动画与 UI |
| `RewardPhaseController` | 控制动画阶段定时切换 |
| `RewardNarrative` | 根据章节/状态选择叙事文本 |

### 5.2 OCP 开闭原则

- 新增奖励等级 → 扩展 `RewardTier` 类型 + 添加 CSS class
- 新增章节结局 → 扩展叙事文本映射，不改组件逻辑
- 新增动画效果 → CSS keyframes 扩展

### 5.3 DIP 依赖倒置

- `RewardOverlay` 依赖 `LevelRewardData`（纯数据），不依赖 GameState
- Extension 侧组装数据，通过 postMessage 传给 webview
- 动画定时通过 hook 管理，不耦合渲染

---

## 6. 消息协议

### 6.1 Extension → Webview

| command | payload | 说明 |
|---|---|---|
| `showReward` | `LevelRewardData` | 触发奖励动画 |
| `showChapterSummary` | `ChapterSummary` | 触发章节通关总结 |

### 6.2 Webview → Extension

| command | payload | 说明 |
|---|---|---|
| `rewardDismiss` | — | 用户关闭奖励界面 |
| `nextLevel` | — | 用户点击"下一关" |
| `replayLevel` | `{ levelId }` | 用户点击"重新挑战" |
| `viewLeaderboard` | — | 用户点击"排行榜" |

---

## 7. 文件结构

```
webview-ui/src/components/
  Reward/
    index.tsx                 ← RewardOverlay 主组件
    Reward.css                ← 奖励动画样式
    LevelPassReward.tsx       ← 单关通过子面板
    ChapterCompleteReward.tsx ← 章节通关子面板
    GameCompleteReward.tsx    ← 全通关终局子面板
    useRewardPhase.ts         ← 动画阶段定时 hook

src/engine/
  rewardBuilder.ts            ← RewardDataBuilder，组装奖励数据

src/story/
  dialogues.ts                ← 已有，补充奖励相关叙事文本
```

---

## 8. 叙事文本设计

### 8.1 单关通过 — 状态台词

| 状态 | 台词 |
|---|---|
| Pass | `"SIGNAL DECODED — 信号已解析"` |
| Perfect | `"PERFECT DECODE — 零噪声。零误差。"` |

### 8.2 章节通关 — 已有台词 + 下一章预告

| 章节 | 完成台词 | 预告 |
|---|---|---|
| Ch1 | 信号接触完成。你已经能识别基本模式了。 | >> 信号结构变得复杂… |
| Ch2 | 模式识别完成。字符的多重含义已被你掌握。 | >> 语法规律开始浮现… |
| Ch3 | 语法觉醒完成。你的指令变得精炼而有力。 | >> 信号变成了结构化的通信协议… |
| Ch4 | 传输协议破解。结构化思维是你的武器。 | >> 最后一段信号… |
| Ch5 | 所有信号已解密。你就是下一个 rEx。 | — |

### 8.3 全通关 — rEx 终局独白

```
…you understand now…
…the language is yours…
…rEx was never the signal. You were.…

        你就是下一个 rEx

所有信号已解密。
你学会了如何与机器对话。
你定义了规则。

rEx 说："Welcome home."
```

### 8.4 Origin 彩蛋

```
[BLACK BOX RECOVERED]
>> 解析残骸数据…
>> 帧校验通过…
>> 源信号定位完成。

WE WERE THE PARSER

解析者与信号，从未分开过。
rEx 不是终点。rEx 是起点。
一切从这里开始。一切回到这里结束。
```

---

## 9. 性能与可访问性

1. 动画全程 pointer-events: none（按钮阶段除外）。
2. reduced-motion 模式：跳过动画，直接显示结果面板。
3. 动画总时长不超过 10s，每个阶段有明确的 skip 逻辑（点击任意处跳到按钮阶段）。
4. 所有文字保证高对比度，不依赖动画传达关键信息。

---

## 10. 实施阶段

### Phase 1 — 单关奖励

1. 创建 `RewardOverlay` 组件 + CSS。
2. 实现 Pass/Perfect 两级动画。
3. 分数卡片、XP 增长、成就弹出。
4. 接入 PromptPanel 的 showResult 流程。

### Phase 2 — 章节通关

1. 实现 `ChapterCompleteReward` 子面板。
2. 章节统计数据组装。
3. 下一章预告文字。
4. 接入章节解锁检测逻辑。

### Phase 3 — 终局与彩蛋

1. 实现 `GameCompleteReward`（Ch5 终局）。
2. 实现 Origin 彩蛋动画（Ch6）。
3. rEx 终局独白打字机效果。
4. 全游戏统计面板。

### Phase 4 — 打磨

1. Skip 逻辑与 reduced-motion 降级。
2. 音效时间轴对齐（预留接口，暂不实现音效）。
3. 动画节奏调优。
