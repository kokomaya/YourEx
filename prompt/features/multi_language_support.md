# Multi-Language Support (i18n) 设计书

## 1. 背景与目标

YourEx 当前所有用户可见文本（关卡剧情、对话、UI 标签、成就描述、反馈信息）均硬编码在源码与 JSON 中，主要语言为简体中文，部分 UI 标签为英文。这使得非中文用户无法理解剧情与指令，也限制了项目的受众范围。

本设计书规划一套多语言（i18n）架构，首期支持 **简体中文（zh-CN）** 与 **英文（en）**，并预留后续扩展其他语种的能力。

### 1.1 核心目标

1. 将所有用户可见文本从源码中提取为 **语言资源文件**。
2. 用户可在 VS Code 设置或游戏内选择语言，切换后即时生效。
3. 不破坏现有闯关、评分、排行榜、成就等业务逻辑。
4. 新增语种时只需添加翻译文件，无需修改业务代码。

### 1.2 不在本次范围内

1. 不修改关卡的 `input` / `expected` 数据（这些是纯技术测试数据，与语言无关）。
2. 不翻译 prompt 本身（用户的 prompt 语言自由）。
3. 不做自动翻译 / AI 翻译集成。
4. 不改变视觉主题或布局。

---

## 2. 文本盘点与分类

### 2.1 文本来源清单

| 来源 | 文件位置 | 文本字段 | 条目估算 | 当前语言 |
|------|---------|---------|---------|---------|
| 关卡 JSON | `src/data/levels/ch*/level_*.json` | `title`, `story`, `promptChallenge`, `hints[]`, `promptHints[]`, `feedback.*` | 26 关 × 10+ 字段 ≈ 300+ | 中文 |
| 对话系统 | `src/story/dialogues.ts` | `welcome`, `chapterIntro[1-6]`, `chapterComplete[1-6]`, `REX_SIGNALS`, `REX_FINAL_SIGNALS` | 80+ 行 | 中文 + 英文 |
| 成就系统 | `src/engine/achievementManager.ts` | `name`, `description` | 11+ × 2 ≈ 22 | 中文 + 英文 |
| 扩展主进程 UI | `src/extension.ts`, `src/ui/statusbar.ts`, `src/ui/feedback.ts` | 命令标签、通知消息、状态栏模板 | 15+ | 混合 |
| Sidebar | `src/ui/sidebar/sidebarProvider.ts` | 章节名称、解锁提示、节点标签 | 10+ | 混合 |
| Webview — Welcome | `webview-ui/src/components/Welcome/index.tsx` | `BOOT_LINES`, `REX_REVEAL`, `STORY_LINES`, 按钮文字 | 20+ | 中文 |
| Webview — PromptPanel | `webview-ui/src/components/PromptPanel/index.tsx` | 面板标题、按钮标签、等待提示 | 5+ | 英文 |
| Webview — Reward | `webview-ui/src/components/Reward/index.tsx` | 奖励标题、按钮、章节解锁文案 | 10+ | 混合 |
| Webview — Leaderboard | `webview-ui/src/components/Leaderboard/index.tsx` | 维度标签、标题、加载提示 | 10+ | 英文 |
| Webview — ScoreDetail | `webview-ui/src/components/ScoreDetail/index.tsx` | 维度名称与权重 | 4 | 英文 |

### 2.2 文本分类

将所有文本分为两大类，采用不同的 i18n 策略：

| 分类 | 说明 | 策略 |
|------|------|------|
| **游戏内容文本（Content）** | 关卡剧情、对话、成就、反馈——构成叙事体验的核心 | 按语言提供完整的内容文件副本 |
| **界面文本（UI）** | 按钮、标签、提示、状态栏——功能性文字 | 集中到 key-value 语言包 |

---

## 3. 关键原则

### 3.1 SOLID

1. **SRP**：语言管理（读取/切换/持久化）、文本解析（加载翻译资源）、UI 渲染各自独立。
2. **OCP**：新增语种只需添加翻译文件 + 注册 locale code，不修改加载器或渲染器。
3. **LSP**：所有语言包实现同一接口/结构，可互换。
4. **ISP**：Extension 侧和 Webview 侧各有独立的翻译接口，不共享胖接口。
5. **DIP**：业务代码依赖翻译抽象（`t(key)` / `getLocaleLevel()`），不依赖具体语言文件路径。

### 3.2 设计约束

1. **零业务入侵**：评分、正则提取、combo 追踪等引擎逻辑不感知语言。
2. **即时切换**：切换语言后，当前页面文本立即刷新，无需重启扩展。
3. **安全回退**：翻译缺失时回退到 `zh-CN`（当前默认语言），保证不出空白。
4. **最小外部依赖**：Extension 侧使用 VS Code 原生 `l10n` API 或轻量自研；Webview 侧可选 `react-i18next` 或同样轻量自研。

---

## 4. 目标架构

### 4.1 资源文件结构

```
src/
  i18n/
    index.ts                    # 公共入口：locale 类型定义、当前 locale 获取
    localeService.ts            # Extension 侧语言管理服务
    types.ts                    # Locale 枚举、翻译 key 类型

  data/
    levels/
      zh-CN/                    # 中文关卡内容（现有文件迁移至此）
        ch1-signal-contact/
          level_01.json
          ...
        ch2-pattern-recognition/
          ...
        ...ch6-origin/
      en/                       # 英文关卡内容（结构完全一致）
        ch1-signal-contact/
          level_01.json
          ...
        ...

    dialogues/
      zh-CN.ts                  # 中文对话
      en.ts                     # 英文对话

    achievements/
      zh-CN.ts                  # 中文成就名称与描述
      en.ts                     # 英文成就名称与描述

    ui/
      zh-CN.json                # Extension 侧 UI 字符串
      en.json                   # Extension 侧 UI 字符串

webview-ui/
  src/
    i18n/
      index.ts                  # Webview 侧 i18n 初始化
      locales/
        zh-CN.json              # Webview 中文 UI 字符串
        en.json                 # Webview 英文 UI 字符串
```

### 4.2 核心概念

| 概念 | 类型 | 职责 |
|------|------|------|
| `Locale` | `'zh-CN' \| 'en'` | 支持的语言枚举，后续可扩展 |
| `LocaleService` | Class | 管理当前语言状态、持久化、切换事件发射 |
| `LocaleLevelLoader` | Function | 根据当前 locale 加载对应语言的关卡 JSON |
| `LocaleDialogues` | Module | 根据当前 locale 返回对应语言的对话数据 |
| `t(key)` | Function | Extension 侧 UI 字符串翻译函数 |
| `useTranslation()` | Hook | Webview 侧 React 组件翻译 hook |

### 4.3 数据流

```
用户选择语言
    │
    ▼
VS Code Setting: yourex.language = "en" | "zh-CN"
    │
    ├──► LocaleService.setLocale()
    │       ├── 更新内存状态
    │       ├── 持久化到 VS Code configuration
    │       └── 发射 onLocaleChanged 事件
    │
    ├──► Extension 侧监听
    │       ├── levelLoader 重新加载对应语言关卡
    │       ├── sidebar 刷新章节/关卡名称
    │       ├── statusbar 刷新文本模板
    │       └── postMessage 通知 webview 语言变更
    │
    └──► Webview 侧监听 (onMessage)
            ├── i18n context 更新 locale
            ├── 所有组件通过 useTranslation() 响应式刷新
            └── 对话/奖励等内容从新 locale 数据渲染
```

---

## 5. 详细设计

### 5.1 Locale 类型与配置

```typescript
// src/i18n/types.ts
export type Locale = 'zh-CN' | 'en';
export const DEFAULT_LOCALE: Locale = 'en';
export const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en'];
```

```jsonc
// package.json — contributes.configuration
{
  "yourex.language": {
    "type": "string",
    "enum": ["zh-CN", "en"],
    "default": "zh-CN",
    "description": "Display language for YourEx game content and UI."
  }
}
```

### 5.2 LocaleService（Extension 侧）

```typescript
// src/i18n/localeService.ts
import { EventEmitter } from 'vscode';
import { Locale, DEFAULT_LOCALE } from './types';

export class LocaleService {
  private _locale: Locale;
  private _onLocaleChanged = new EventEmitter<Locale>();
  readonly onLocaleChanged = this._onLocaleChanged.event;

  constructor(initialLocale?: Locale) {
    this._locale = initialLocale ?? DEFAULT_LOCALE;
  }

  get locale(): Locale { return this._locale; }

  setLocale(locale: Locale): void {
    if (this._locale !== locale) {
      this._locale = locale;
      this._onLocaleChanged.fire(locale);
    }
  }
}
```

### 5.3 关卡内容加载（按语言）

当前 `levelLoader.ts` 从 `src/data/levels/ch*/` 加载 JSON。改造后：

```typescript
// levelLoader.ts 改造要点（伪码）
function getLevelPath(locale: Locale, chapter: string, levelFile: string): string {
  return path.join('data', 'levels', locale, chapter, levelFile);
}

// 加载时传入 locale
function loadLevels(locale: Locale): Level[] { ... }
```

**关卡 JSON 结构不变**，只是按语言放入不同目录。`input` 和 `expected` 字段在所有语言中保持一致（它们是技术测试数据）。

示例对比：

```jsonc
// src/data/levels/zh-CN/ch1-signal-contact/level_01.json
{
  "id": "level_01",
  "title": "你好，rEx",
  "story": "[Meridian-7 日志 #001] 传感器首次捕获可辨识信号...",
  "promptChallenge": "写一个 prompt，让 AI 生成正则表达式...",
  "hints": ["[提示] 信号中的关键词是小写的", ...],
  "feedback": {
    "onPass": "[信号锁定] \"hello\"——来自虚空的第一个词。",
    ...
  },
  // input / expected 不翻译
  "input": ["hello world", "HELLO WORLD", ...],
  "expected": ["hello"]
}

// src/data/levels/en/ch1-signal-contact/level_01.json
{
  "id": "level_01",
  "title": "Hello, rEx",
  "story": "[Meridian-7 Log #001] Sensors pick up the first recognizable signal...",
  "promptChallenge": "Write a prompt to make the AI generate a regex...",
  "hints": ["[Hint] The keyword in the signal is lowercase", ...],
  "feedback": {
    "onPass": "[Signal Locked] \"hello\" — the first word from the void.",
    ...
  },
  "input": ["hello world", "HELLO WORLD", ...],
  "expected": ["hello"]
}
```

### 5.4 对话系统

将 `src/story/dialogues.ts` 拆分为按语言的模块：

```typescript
// src/data/dialogues/zh-CN.ts
export const DIALOGUES_ZH_CN = {
  welcome: {
    title: "[Meridian-7 System Log]",
    lines: [
      ">> [Meridian-7 系统日志 — 第 47 周期]",
      ">> 燃料储备：2.3%",
      ...
    ]
  },
  chapterIntro: { 1: { title: "📡 第一章 — 信号接触", lines: [...] }, ... },
  chapterComplete: { 1: "信号源已确认。...", ... }
};

// src/data/dialogues/en.ts
export const DIALOGUES_EN = {
  welcome: {
    title: "[Meridian-7 System Log]",
    lines: [
      ">> [Meridian-7 System Log — Cycle 47]",
      ">> Fuel reserves: 2.3%",
      ...
    ]
  },
  chapterIntro: { 1: { title: "📡 Chapter 1 — Signal Contact", lines: [...] }, ... },
  chapterComplete: { 1: "Signal source confirmed. ...", ... }
};
```

原 `src/story/dialogues.ts` 改为一个路由层：

```typescript
// src/story/dialogues.ts（改造后）
import { DIALOGUES_ZH_CN } from '../data/dialogues/zh-CN';
import { DIALOGUES_EN } from '../data/dialogues/en';

const DIALOGUE_MAP = { 'zh-CN': DIALOGUES_ZH_CN, 'en': DIALOGUES_EN };

export function getDialogues(locale: Locale) {
  return DIALOGUE_MAP[locale] ?? DIALOGUE_MAP[DEFAULT_LOCALE];
}
```

### 5.5 成就系统

将成就的 `name` 与 `description` 提取到语言文件：

```typescript
// src/data/achievements/zh-CN.ts
export const ACHIEVEMENT_TEXTS_ZH_CN: Record<string, { name: string; description: string }> = {
  first_signal:        { name: "📡 First Signal",       description: "信号清晰。无需校准。" },
  speed_parse:         { name: "⚡ Speed Parse",        description: "解析速度超出预期" },
  minimal_instruction: { name: "📏 Minimal Instruction", description: "极简指令。极致效果。" },
  manual_override:     { name: "⚔️ Manual Override",    description: "你不需要协助系统。你就是规则。" },
  // ...
};

// src/data/achievements/en.ts
export const ACHIEVEMENT_TEXTS_EN: Record<string, { name: string; description: string }> = {
  first_signal:        { name: "📡 First Signal",       description: "Signal clear. No calibration needed." },
  speed_parse:         { name: "⚡ Speed Parse",        description: "Parse speed exceeded expectations." },
  minimal_instruction: { name: "📏 Minimal Instruction", description: "Minimal instruction. Maximum effect." },
  manual_override:     { name: "⚔️ Manual Override",    description: "You don't need the assist system. You are the rule." },
  // ...
};
```

### 5.6 Extension 侧 UI 字符串

使用 JSON key-value 格式：

```jsonc
// src/data/ui/zh-CN.json
{
  "statusbar.progress": "$(radio-tower) XP: {xp}$(zap) x{combo} | 解密: {percent}%{modeText}",
  "statusbar.tooltip": "YourEx — 信号进度",
  "statusbar.tooltip.dev": "YourEx — 信号进度（开发者模式）",
  "notification.levelLocked": "[YourEx] 该关卡在用户模式下锁定。切换到开发者模式以绕过锁定。",
  "notification.devDisabled": "[YourEx] 开发者模式已被配置禁用。",
  "notification.modeSwitched": "[YourEx] 已切换到 {mode}。",
  "notification.modeInfo": "[YourEx] 当前模式：{mode}。",
  "sidebar.chapterLocked": "完成前一章以解锁",
  "sidebar.chapter.1": "📡 信号接触",
  "sidebar.chapter.2": "🔍 模式识别",
  "sidebar.chapter.3": "⚡ 语法觉醒",
  "sidebar.chapter.4": "🛰️ 传输",
  "sidebar.chapter.5": "🌌 rEx",
  "sidebar.chapter.6": "👁️ 起源帧",
  "feedback.systemError": "[系统错误] 协助系统输出无效。优化你的指令。"
}

// src/data/ui/en.json
{
  "statusbar.progress": "$(radio-tower) XP: {xp}$(zap) x{combo} | Decrypt: {percent}%{modeText}",
  "statusbar.tooltip": "YourEx — Signal Progress",
  "statusbar.tooltip.dev": "YourEx — Signal Progress (Developer Mode)",
  "notification.levelLocked": "[YourEx] This level is locked in User Mode. Switch to Developer Mode to bypass locks.",
  "notification.devDisabled": "[YourEx] Developer Mode is disabled by configuration.",
  "notification.modeSwitched": "[YourEx] Switched to {mode}.",
  "notification.modeInfo": "[YourEx] Current mode: {mode}.",
  "sidebar.chapterLocked": "Complete previous chapter to unlock",
  "sidebar.chapter.1": "📡 Signal Contact",
  "sidebar.chapter.2": "🔍 Pattern Recognition",
  "sidebar.chapter.3": "⚡ Syntax Awakening",
  "sidebar.chapter.4": "🛰️ Transmission",
  "sidebar.chapter.5": "🌌 rEx",
  "sidebar.chapter.6": "👁️ Origin Frame",
  "feedback.systemError": "[System Error] Assist system output invalid. Refine your instructions."
}
```

### 5.7 Webview 侧 UI 字符串

```jsonc
// webview-ui/src/i18n/locales/zh-CN.json
{
  "welcome.title": "[Meridian-7 System Log]",
  "welcome.startButton": "🤖 启动信号解析",
  "promptPanel.title": "[Signal Decryption Terminal]",
  "promptPanel.executeButton": "Execute Prompt",
  "promptPanel.manualButton": "Manual Mode",
  "promptPanel.nextButton": "Next Level",
  "reward.perfect": "PERFECT DECODE — 零噪声。零误差。",
  "reward.pass": "SIGNAL DECODED — 信号已解析",
  "reward.xpLabel": "XP",
  "reward.nextLevel": "Next Level",
  "reward.replay": "Replay",
  "reward.viewLeaderboard": "View Leaderboard",
  "reward.achievementsUnlocked": "Achievements Unlocked:",
  "reward.chapterUnlocked": "> 第 {n} 章已解锁",
  "leaderboard.title": "[Decryption Rankings]",
  "leaderboard.loading": "Loading signal data…",
  "score.brevity": "简洁度",
  "score.firstTry": "首次尝试",
  "score.elegance": "优雅度",
  "score.regexQuality": "正则质量"
}

// webview-ui/src/i18n/locales/en.json
{
  "welcome.title": "[Meridian-7 System Log]",
  "welcome.startButton": "🤖 Initialize Signal Parser",
  "promptPanel.title": "[Signal Decryption Terminal]",
  "promptPanel.executeButton": "Execute Prompt",
  "promptPanel.manualButton": "Manual Mode",
  "promptPanel.nextButton": "Next Level",
  "reward.perfect": "PERFECT DECODE — Zero noise. Zero error.",
  "reward.pass": "SIGNAL DECODED — Signal parsed",
  "reward.xpLabel": "XP",
  "reward.nextLevel": "Next Level",
  "reward.replay": "Replay",
  "reward.viewLeaderboard": "View Leaderboard",
  "reward.achievementsUnlocked": "Achievements Unlocked:",
  "reward.chapterUnlocked": "> CHAPTER {n} UNLOCKED",
  "leaderboard.title": "[Decryption Rankings]",
  "leaderboard.loading": "Loading signal data…",
  "score.brevity": "Brevity",
  "score.firstTry": "First Try",
  "score.elegance": "Elegance",
  "score.regexQuality": "Regex Quality"
}
```

---

## 6. UI 与交互

### 6.1 语言选择入口

| 入口 | 方式 | 说明 |
|------|------|------|
| VS Code Setting | `yourex.language` 下拉 | 主要入口，跟随 VS Code 设置体系 |
| 命令面板 | `YourEx: Switch Language` | 快捷切换，弹出 QuickPick 选项 |
| Welcome 页面 | 语言切换按钮（可选） | 首次启动时引导用户选择 |

### 6.2 切换行为

1. 用户在 Setting 或命令面板中选择语言。
2. `LocaleService` 更新 locale 并触发 `onLocaleChanged` 事件。
3. Extension 侧：
   - `levelLoader` 重新从对应语言目录加载关卡数据。
   - `sidebarProvider` 刷新章节名称与关卡标题。
   - `statusbar` 刷新文本。
   - 向所有打开的 webview 发送 `{ type: 'localeChanged', locale }` 消息。
4. Webview 侧：
   - 收到消息后更新 i18n context。
   - React 组件通过 context 响应式刷新所有文本。
   - Welcome 页的启动动画文本切换（如果用户在 Welcome 页切换语言）。

### 6.3 默认语言检测

首次启动时，可选择跟随 VS Code 的 `vscode.env.language`：

```typescript
function detectDefaultLocale(): Locale {
  const vscodeLocale = vscode.env.language; // e.g. 'zh-cn', 'en'
  if (vscodeLocale.startsWith('zh')) return 'zh-CN';
  return 'en';
}
```

用户手动设置后，以用户设置为准。

---

## 7. 代码结构规划

### 7.1 新增文件

| 文件 | 层级 | 职责 |
|------|------|------|
| `src/i18n/types.ts` | Extension | Locale 类型、常量 |
| `src/i18n/localeService.ts` | Extension | 语言状态管理、事件 |
| `src/i18n/index.ts` | Extension | 公共导出 |
| `src/i18n/t.ts` | Extension | UI 翻译函数 `t(key, params?)` |
| `src/data/levels/zh-CN/` | Data | 中文关卡（迁移现有文件） |
| `src/data/levels/en/` | Data | 英文关卡（新翻译） |
| `src/data/dialogues/zh-CN.ts` | Data | 中文对话（从 dialogues.ts 提取） |
| `src/data/dialogues/en.ts` | Data | 英文对话 |
| `src/data/achievements/zh-CN.ts` | Data | 中文成就文本 |
| `src/data/achievements/en.ts` | Data | 英文成就文本 |
| `src/data/ui/zh-CN.json` | Data | Extension 侧中文 UI 串 |
| `src/data/ui/en.json` | Data | Extension 侧英文 UI 串 |
| `webview-ui/src/i18n/index.ts` | Webview | Webview i18n 初始化 |
| `webview-ui/src/i18n/locales/zh-CN.json` | Webview | Webview 中文 UI 串 |
| `webview-ui/src/i18n/locales/en.json` | Webview | Webview 英文 UI 串 |
| `webview-ui/src/hooks/useTranslation.ts` | Webview | 翻译 hook |

### 7.2 需改造的现有文件

| 文件 | 改动内容 |
|------|---------|
| `src/engine/levelLoader.ts` | 加载路径增加 locale 前缀 |
| `src/story/dialogues.ts` | 改为路由层，按 locale 返回对话 |
| `src/engine/achievementManager.ts` | 成就名称/描述从语言文件读取 |
| `src/extension.ts` | 初始化 `LocaleService`，注入各模块，注册切换命令 |
| `src/ui/statusbar.ts` | 文本模板改用 `t()` |
| `src/ui/feedback.ts` | 错误提示改用 `t()` |
| `src/ui/sidebar/sidebarProvider.ts` | 章节名称、提示改用 `t()` |
| `webview-ui/src/components/Welcome/index.tsx` | 硬编码文本改用 `useTranslation()` |
| `webview-ui/src/components/PromptPanel/index.tsx` | 按钮标签改用 `useTranslation()` |
| `webview-ui/src/components/Reward/index.tsx` | 奖励文案改用 `useTranslation()` |
| `webview-ui/src/components/Leaderboard/index.tsx` | 标签改用 `useTranslation()` |
| `webview-ui/src/components/ScoreDetail/index.tsx` | 维度名称改用 `useTranslation()` |
| `package.json` | 新增 `yourex.language` 配置项、`switchLanguage` 命令 |

### 7.3 不需改动的文件

以下模块与语言无关，无需修改：

- `src/engine/judge.ts` — 评分逻辑
- `src/engine/promptScorer.ts` — prompt 评分
- `src/engine/regexExtractor.ts` — 正则提取
- `src/engine/comboTracker.ts` — 连击追踪
- `src/engine/xpTracker.ts` — 经验值
- `src/engine/decryptionPipeline.ts` — 解密流水线
- `src/ai/` — AI provider 层
- `src/access/` — 权限策略
- `src/mode/` — 模式管理
- `src/state/gameState.ts` — 状态持久化（存储的是 id/分数等，无文本）

---

## 8. 实施阶段

### Phase 1：基础架构搭建

1. 新增 `src/i18n/` 模块（`types.ts`、`localeService.ts`、`t.ts`）。
2. 在 `package.json` 中注册 `yourex.language` 配置项。
3. 在 `extension.ts` 中初始化 `LocaleService`，监听配置变更。
4. 注册 `YourEx: Switch Language` 命令。

### Phase 2：游戏内容文本提取

1. 将 `src/data/levels/ch*/` 下现有 JSON 迁移到 `src/data/levels/zh-CN/ch*/`。
2. 创建 `src/data/levels/en/` 目录结构，翻译所有 26 个关卡文件。
3. 改造 `levelLoader.ts`，根据 locale 确定加载路径。
4. 拆分 `dialogues.ts` 为 `src/data/dialogues/zh-CN.ts` + `en.ts`，原文件改为路由。
5. 提取成就文本到 `src/data/achievements/zh-CN.ts` + `en.ts`。

### Phase 3：Extension 侧 UI 国际化

1. 创建 `src/data/ui/zh-CN.json` + `en.json`。
2. 实现 `t(key, params?)` 翻译函数。
3. 改造 `statusbar.ts`、`feedback.ts`、`sidebarProvider.ts`、`extension.ts` 中的硬编码文本。

### Phase 4：Webview 侧国际化

1. 创建 `webview-ui/src/i18n/` 模块及语言包。
2. 实现 `useTranslation()` hook（基于 React Context）。
3. 逐个改造 Welcome、PromptPanel、Reward、Leaderboard、ScoreDetail 组件。
4. 处理 Extension → Webview 的 locale 同步消息。

### Phase 5：验证与打磨

1. 全流程中英文切换测试：从 Welcome → 闯关 → 奖励 → 排行榜。
2. 边界测试：翻译缺失回退、切换语言后 sidebar 刷新、webview 重新打开后 locale 同步。
3. 关卡翻译审校：确保英文剧情保持叙事风格一致性。

---

## 9. 测试策略

| 层级 | 测试内容 | 方式 |
|------|---------|------|
| Unit | `LocaleService` 状态切换、事件触发 | vitest |
| Unit | `t()` 翻译函数：正常 key、缺失 key 回退、参数插值 | vitest |
| Unit | `levelLoader` 按 locale 加载正确路径 | vitest |
| Unit | 对话路由按 locale 返回正确内容 | vitest |
| Integration | 切换语言后 sidebar 刷新内容 | vitest + mock vscode API |
| Integration | Extension → Webview locale 消息传递 | vitest |
| E2E | 完整游戏流程中英文各走一遍 | 手动 |

---

## 10. 后续扩展

1. **新增语言**：只需在 `SUPPORTED_LOCALES` 中添加 locale code，然后提供对应的翻译文件即可。
2. **社区翻译**：可将翻译文件开放为独立 PR，降低贡献门槛。
3. **翻译完整度检查**：可编写脚本对比 `zh-CN` 和 `en` 的 key 集合，报告缺失翻译。
4. **package.nls.json**：VS Code 扩展原生支持 `package.nls.json` / `package.nls.zh-cn.json` 对 `package.json` 中的字符串做国际化（命令标题、配置描述等），可在 Phase 3 一并处理。
