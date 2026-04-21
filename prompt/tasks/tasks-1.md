# 📋 YourEx — 实现任务分解 & 状态追踪

> 基于 plan.md 的 MVP 开发计划（Day 1–4），按 SOLID 原则拆解为可执行的原子任务。
> 每个任务独立可验证，减少上下文依赖，便于 AI 辅助实现时控制 token 消耗。

---

## 📐 架构原则

| 原则 | 落地方式 |
|------|----------|
| **S** — 单一职责 | 每个模块只做一件事：judge 只判题、promptScorer 只评分、aiProvider 只调 AI |
| **O** — 开放封闭 | AI Provider 通过接口扩展新后端，不改已有代码 |
| **L** — 里氏替换 | 所有 AI Provider 实现同一接口，可互换 |
| **I** — 接口隔离 | UI 层只依赖 Engine 层的接口，不直接访问数据层 |
| **D** — 依赖倒置 | Engine 依赖抽象接口（IAIProvider），不依赖具体实现 |

### 目录结构约定

```
/yourex-vscode/
├── package.json              # 插件清单
├── tsconfig.json
├── src/                      # Extension 実体（Node.js 侧）
│   ├── extension.ts          # 激活入口（薄层，只注册命令和组装依赖）
│   ├── types/
│   │   ├── level.ts          # 关卡数据类型定义
│   │   ├── judge.ts          # 判题结果类型
│   │   ├── score.ts          # 评分类型
│   │   └── achievement.ts    # 成就类型
│   ├── engine/
│   │   ├── levelLoader.ts    # 关卡加载（纯函数，读 JSON → Level[]）
│   │   ├── judge.ts          # 判题引擎（纯函数）
│   │   ├── regexExtractor.ts # 从 AI 文本中提取正则（纯函数）
│   │   ├── promptScorer.ts   # Prompt 评分（纯函数）
│   │   ├── xpTracker.ts      # XP / 解密进度
│   │   ├── comboTracker.ts   # 连击追踪
│   │   └── achievementManager.ts # 成就系统
│   ├── ai/
│   │   ├── IAIProvider.ts    # AI 接口定义
│   │   ├── copilotProvider.ts # Copilot 实现
│   │   └── mockProvider.ts   # 测试/离线用 Mock 实现
│   ├── ui/
│   │   ├── sidebar/
│   │   │   └── sidebarProvider.ts  # TreeView（非 React，VS Code 原生）
│   │   ├── webview/
│   │   │   ├── promptPanelProvider.ts  # WebView 宿主（加载 React 构建产物 + 消息桥）
│   │   │   ├── welcomeProvider.ts
│   │   │   └── leaderboardProvider.ts
│   │   ├── statusbar.ts
│   │   └── feedback.ts       # 反馈通知
│   ├── story/
│   │   └── dialogues.ts      # 文案常量
│   ├── state/
│   │   └── gameState.ts      # 全局游戏状态（持久化到 globalState）
│   └── data/
│       └── levels/
│           ├── ch1-signal-contact/
│           │   ├── level_01.json
│           │   ├── level_02.json
│           │   └── ...
│           └── ...
├── webview-ui/               # React 前端（独立 Vite 项目）
│   ├── package.json
│   ├── vite.config.ts        # 构建配置（输出到 dist/，插件端加载此产物）
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx          # React 入口
│       ├── App.tsx           # 路由：根据 WebView type 渲染不同页面
│       ├── hooks/
│       │   └── useVSCode.ts  # acquireVsCodeApi() 封装 + postMessage
│       ├── components/
│       │   ├── PromptPanel/  # 指令终端主页面
│       │   ├── Welcome/      # 开场白页面
│       │   ├── Leaderboard/  # 排行榜页面
│       │   ├── ScoreDetail/  # 评分详情页面
│       │   └── shared/       # 通用组件（Button、Terminal 文字效果等）
│       ├── types/
│       │   └── messages.ts   # WebView ↔ Extension 消息类型（与 src/types/ 共享）
│       └── styles/
│           └── global.css    # 科技感主题样式
└── test/
    ├── engine/
    │   ├── judge.test.ts
    │   ├── regexExtractor.test.ts
    │   └── promptScorer.test.ts
    └── ai/
        └── mockProvider.test.ts
```

### 关键设计决策

| 决策 | 理由 |
|------|------|
| Engine 层全部为纯函数/无副作用 | 可单独单元测试，不依赖 VS Code API |
| 类型定义独立到 `types/` | 各模块共享，避免循环依赖 |
| AI Provider 用接口抽象 | 方便切换 Copilot/OpenAI/Mock，活动时统一指定 |
| 游戏状态集中管理 | 一个 GameState 对象持久化到 `context.globalState` |
| **WebView 用 React + Vite 构建** | **组件化开发、状态管理方便、HMR 加速调试；构建产物由插件端加载** |
| **Sidebar 用 VS Code 原生 TreeView** | **无需 React，TreeView API 足够，减少 bundle 体积** |
| 关卡数据用 JSON 文件 | 非程序员也能编辑关卡，易于扩展 |

---

## 状态图例

| 标记 | 含义 |
|------|------|
| ⬜ | 未开始 |
| 🔵 | 进行中 |
| ✅ | 已完成 |
| ❌ | 阻塞/需重做 |
| ⏭️ | 跳过（低优先级） |

---

## Phase 0: 项目初始化

| # | 任务 | 状态 | 产出文件 | 验证方式 |
|---|------|------|----------|----------|
| 0.1 | 用 `yo code` 生成 VS Code Extension 脚手架（TypeScript） | ✅ | `package.json`, `tsconfig.json`, `src/extension.ts` | `npm run compile` 通过 |
| 0.2 | 配置项目：启用 strict TS，配置 ESLint，添加 `.vscodeignore` | ✅ | `tsconfig.json`, `.eslintrc.json` | 无 lint 报错 |
| 0.3 | 在 `package.json` 中注册命令和 Sidebar 视图容器 | ✅ | `package.json` contributes 字段 | F5 运行后命令面板能看到 `YourEx:` 命令 |
| 0.4 | 创建 `src/types/` 目录，定义核心类型 | ✅ | `level.ts`, `judge.ts`, `score.ts`, `achievement.ts` | TS 编译通过 |
| 0.5 | 创建空壳模块文件（所有 .ts 导出空函数/接口） | ✅ | 所有 `src/**/*.ts` | 整体编译通过，无循环依赖 |
| 0.6 | 配置测试框架（Mocha + ts-node 或 Vitest） | ✅ | `test/` 目录, 测试配置 | `npm test` 能跑通一个空测试 |
| 0.7 | 初始化 `webview-ui/` React 项目（Vite + React 18 + TS） | ✅ | `webview-ui/package.json`, `vite.config.ts`, `main.tsx`, `App.tsx` | `cd webview-ui && npm run build` 输出 `dist/` |
| 0.8 | 配置 Vite 构建产物路径，实现 WebView Provider 加载 React 构建产物 | ✅ | `webview-ui/vite.config.ts`, `src/ui/webview/promptPanelProvider.ts` | F5 运行后 WebView 能显示 React 页面 |
| 0.9 | 实现 `useVSCode` hook — 封装 `acquireVsCodeApi()` + postMessage | ✅ | `webview-ui/src/hooks/useVSCode.ts` | React 组件可与 Extension 双向通信 |

### 0.4 类型定义详情

```typescript
// types/level.ts
interface Level {
  id: string;
  title: string;
  chapter: number;
  story: string;
  difficulty: 'easy' | 'medium' | 'hard';
  promptChallenge: string;
  input: string[];
  expected: string[];
  hints: string[];
  promptHints: string[];
  feedback: {
    onPass: string;
    onFail: string;
    onPerfect: string;
    onDirectWrite: string;
  };
}

// types/judge.ts
interface JudgeResult {
  status: 'perfect' | 'pass' | 'partial' | 'fail' | 'error';
  matched: string[];
  expected: string[];
  regex: RegExp | null;
  rawRegexString: string;
  errorMessage?: string;
}

// types/score.ts
interface PromptScore {
  total: number;           // 0-100
  brevityScore: number;    // 简洁度 30%
  firstTryScore: number;   // 一次性 30%
  eleganceScore: number;   // 优雅度 20%
  regexQualityScore: number; // regex 质量 20%
}

interface LevelAttempt {
  levelId: string;
  mode: 'prompt' | 'manual';
  prompt?: string;
  regex: string;
  judgeResult: JudgeResult;
  promptScore?: PromptScore;
  timestamp: number;
  attemptNumber: number;
}

// types/achievement.ts
interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (state: GameState) => boolean;
  unlocked: boolean;
}
```

---

## Phase 1: 数据层 — 关卡系统 (Day 1)

| # | 任务 | 状态 | 产出文件 | 验证方式 |
|---|------|------|----------|----------|
| 1.1 | 编写第一章 5 个关卡 JSON 数据文件 | ✅ | `data/levels/ch1-signal-contact/level_01~05.json` | JSON 合法，符合 `Level` 类型 |
| 1.2 | 实现 `levelLoader.ts` — 加载指定章节关卡 | ✅ | `engine/levelLoader.ts` | 单测：加载 ch1 返回 5 个 Level 对象 |
| 1.3 | 实现 `levelLoader.ts` — 获取关卡列表（含解锁状态） | ✅ | 同上 | 单测：第一章默认解锁，第二章锁定 |
| 1.4 | 实现 `gameState.ts` — 全局状态管理（内存版） | ✅ | `state/gameState.ts` | 单测：读写关卡完成状态、XP、combo |
| 1.5 | 实现 `gameState.ts` — 持久化到 `context.globalState` | ✅ | 同上 | F5 运行后关闭再打开，状态保留 |

### 1.1 关卡数据设计参考

```
Level 1 "Hello, rEx"    — 匹配 "hello"（字面量）
Level 2 "Signal in Noise" — 匹配含数字的行（\d）
Level 3 "Fragment Found"  — 匹配邮箱格式
Level 4 "Echo Pattern"    — 匹配重复单词（\b\w+\b）
Level 5 "Still There?"    — 匹配以特定后缀结尾的行（$）
```

---

## Phase 2: 引擎层 — 判题 & 评分 (Day 2)

| # | 任务 | 状态 | 产出文件 | 验证方式 |
|---|------|------|----------|----------|
| 2.1 | 实现 `regexExtractor.ts` — 从 AI 回复文本中提取正则 | ⬜ | `engine/regexExtractor.ts` | 单测：各种 AI 回复格式均能正确提取 |
| 2.2 | 实现 `judge.ts` — 纯 regex 判题（输入 regex + testCases + expected → JudgeResult） | ⬜ | `engine/judge.ts` | 单测：perfect/pass/partial/fail/error 五种情况 |
| 2.3 | 实现 `promptScorer.ts` — Prompt 评分（输入 prompt + attemptNumber + regexLength → PromptScore） | ⬜ | `engine/promptScorer.ts` | 单测：短 prompt 高分、长 prompt 低分、多次尝试扣分 |
| 2.4 | 定义 `IAIProvider.ts` 接口 | ⬜ | `ai/IAIProvider.ts` | TS 编译通过 |
| 2.5 | 实现 `mockProvider.ts` — 返回预设正则（开发测试用） | ⬜ | `ai/mockProvider.ts` | 单测：输入任意 prompt 返回预设 regex |
| 2.6 | 实现 `copilotProvider.ts` — 对接 VS Code Copilot Chat API | ⬜ | `ai/copilotProvider.ts` | F5 运行：发 prompt 能收到 AI 回复 |
| 2.7 | 串联：prompt → AIProvider → regexExtractor → judge → promptScorer 完整流程 | ⬜ | 可在 extension.ts 中临时调用验证 | F5 运行：输入 prompt，能看到完整 JudgeResult + PromptScore |

### 2.1 regexExtractor 需覆盖的 AI 回复格式

```
格式1: ```regex\n/pattern/flags\n```
格式2: ```\n/pattern/flags\n```
格式3: 正则表达式为：/pattern/flags
格式4: `/pattern/flags`
格式5: 直接回复 /pattern/flags（无其他文字）
格式6: 代码块中 new RegExp("pattern", "flags")
```

### 2.4 IAIProvider 接口定义

```typescript
interface IAIProvider {
  readonly name: string;
  generate(prompt: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}
```

---

## Phase 3: UI 层 — 核心交互 (Day 3)

| # | 任务 | 状态 | 产出文件 | 验证方式 |
|---|------|------|----------|----------|
| 3.1 | 实现 Sidebar TreeView — 章节+关卡树（含锁定/解锁/完成状态图标） | ⬜ | `ui/sidebar/sidebarProvider.ts` | F5：侧边栏显示 5 章关卡树，第一章展开 |
| 3.2 | Sidebar 点击关卡 → 打开 Prompt Panel WebView | ⬜ | 同上 + `ui/webview/promptPanelProvider.ts` | F5：点击关卡打开 React WebView 面板 |
| 3.3 | 实现 PromptPanel React 组件 — 信号描述 + 测试数据 + prompt 输入框 + 两个按钮 | ⬜ | `webview-ui/src/components/PromptPanel/` | F5：WebView 正确渲染关卡信息 |
| 3.4 | PromptPanel — "Execute Parse" 按钮 → postMessage → Extension 调 AI → 判题 → 回传结果 | ⬜ | 同上 + `ui/webview/promptPanelProvider.ts` | F5：输入 prompt，点击按钮，看到判题结果 |
| 3.5 | PromptPanel — "Manual" 按钮 → postMessage → Extension 打开 .regex.js 文件 | ⬜ | 同上 | F5：点击按钮，编辑器打开关卡文件 |
| 3.6 | 手写模式 — 保存 .regex.js 文件 → 自动判题 → 显示结果 | ⬜ | `extension.ts` 中注册 onDidSaveTextDocument | F5：保存文件触发判题 |
| 3.7 | 实现 feedback.ts — 通关/失败/错误三种反馈通知（VS Code Notification） | ⬜ | `ui/feedback.ts` | F5：判题后弹出对应反馈 |
| 3.8 | 实现 Status Bar — 等级 + XP + combo + 解密进度 | ⬜ | `ui/statusbar.ts` | F5：状态栏显示信息，通关后更新 |
| 3.9 | 实现 Welcome React 组件 — 首次启动显示开场白 WebView | ⬜ | `webview-ui/src/components/Welcome/`, `ui/webview/welcomeProvider.ts` | F5：首次启动展示开场白 |
| 3.10 | 实现 XP 系统 — 通关后更新 XP + 解密进度 + combo | ⬜ | `engine/xpTracker.ts`, `engine/comboTracker.ts` | 单测 + F5：通关后 XP 变化正确 |
| 3.11 | 实现关卡解锁逻辑 — 通关当前章最后一关 → 解锁下一章 | ⬜ | `engine/levelLoader.ts` 扩展 | F5：通关第 5 关后第二章解锁 |

### 3.3 Prompt Panel WebView 通信协议

React 组件通过 `useVSCode` hook 调用 `postMessage`，Extension 端通过 `webview.onDidReceiveMessage` 监听。
消息类型定义在 `webview-ui/src/types/messages.ts`，与 `src/types/` 共享相同接口。

```typescript
// WebView → Extension
type WebViewMessage =
  | { command: 'executePrompt'; prompt: string; levelId: string }
  | { command: 'manualMode'; levelId: string }
  | { command: 'requestLevel'; levelId: string };

// Extension → WebView
type ExtensionMessage =
  | { command: 'loadLevel'; level: Level }
  | { command: 'showResult'; result: JudgeResult; score?: PromptScore; feedback: string }
  | { command: 'showError'; message: string };
```

---

## Phase 4: 竞赛功能 & 内容完善 (Day 4)

| # | 任务 | 状态 | 产出文件 | 验证方式 |
|---|------|------|----------|----------|
| 4.1 | 编写第 2-5 章关卡 JSON 数据（每章 5 关，共 20 关） | ⬜ | `data/levels/ch2~ch5/*.json` | JSON 合法，difficulty 递进 |
| 4.2 | 实现成就系统 — 定义 12 个成就 + 检测逻辑 | ⬜ | `engine/achievementManager.ts` | 单测：满足条件时触发成就 |
| 4.3 | 成就解锁通知 — 弹窗 + Sidebar 展示 | ⬜ | `ui/feedback.ts` 扩展 | F5：触发成就后弹窗 |
| 4.4 | 实现 ScoreDetail React 组件 — 通关后展示 4 维评分 | ⬜ | `webview-ui/src/components/ScoreDetail/` | F5：通关后看到评分雷达图/详情 |
| 4.5 | 实现排行榜（本地版）— 读写 JSON，按维度排序 | ⬜ | 新建 `engine/leaderboard.ts` | 单测：多用户数据排序正确 |
| 4.6 | 排行榜 UI — Leaderboard React 组件 + WebView Provider | ⬜ | `webview-ui/src/components/Leaderboard/`, `ui/webview/leaderboardProvider.ts` | F5：排行榜页面正确渲染 |
| 4.7 | 实现 Prompt 回放 — 存储每关所有 prompt 历史 | ⬜ | `state/gameState.ts` 扩展 | F5：能查看某关的 prompt 迭代历史 |
| 4.8 | 实现剧情文案系统 — 根据状态返回对应台词 | ⬜ | `story/dialogues.ts` | 单测：不同状态返回不同文案 |
| 4.9 | 实现 rEx 彩蛋 — 中后期通关后概率触发 incoming signal | ⬜ | `story/dialogues.ts` 扩展 | F5：通关第三章后偶尔出现彩蛋 |
| 4.10 | 实现隐藏章节解锁检测 | ⬜ | `engine/levelLoader.ts` 扩展 | 单测：全 Perfect → 解锁隐藏章节 |

---

## Phase 5: 活动部署 & 大屏幕 (可选/加分)

| # | 任务 | 状态 | 产出文件 | 验证方式 |
|---|------|------|----------|----------|
| 5.1 | 实现在线排行榜 API（WebSocket 服务端） | ⬜ | 独立服务 `server/` | 服务启动，能接收推送 |
| 5.2 | 插件端上报成绩到排行榜 API | ⬜ | `engine/leaderboard.ts` 扩展 | F5：通关后服务端收到数据 |
| 5.3 | 大屏幕播报页面（纯前端 HTML） | ⬜ | `dashboard/index.html` | 浏览器打开，实时显示播报 |
| 5.4 | Instruction Duel 对决模式 | ⬜ | 新建 `engine/duel.ts` + UI | 两个客户端同时对决 |
| 5.5 | 全场事件系统（全场解密进度 100% 触发彩蛋等） | ⬜ | 服务端逻辑 | 大屏幕显示全场事件 |

---

## 🔗 任务依赖关系

```
Phase 0 (初始化)
  │
  ├── Phase 1 (数据层)
  │     │
  │     └── Phase 2 (引擎层)
  │           │
  │           └── Phase 3 (UI 层)
  │                 │
  │                 └── Phase 4 (竞赛 & 内容)
  │                       │
  │                       └── Phase 5 (活动部署, 可选)
  │
  └── 0.4 类型定义 ←── 被所有后续 Phase 依赖
```

### 关键路径（最小可用版本）

```
0.1 → 0.3 → 0.4 → 0.7 → 0.8 → 1.1 → 1.2 → 1.4 → 2.2 → 2.4 → 2.5 → 2.7 → 3.3 → 3.4 → 3.7
```

完成以上 15 个任务即可得到：**能打开关卡、输入 prompt、AI 生成 regex、判题、看到结果的 MVP**。

### 并行可能

| 可并行的任务组 | 说明 |
|---------------|------|
| 1.1 (关卡数据) 与 1.2-1.4 (加载逻辑) | 一人写数据，一人写代码 |
| 2.1-2.3 (纯函数引擎) | 三个纯函数互相独立，可并行 |
| 3.1 (Sidebar) 与 3.3 (Prompt Panel) | 两个 UI 独立开发 |
| 4.1 (关卡数据) 与 4.2-4.9 (功能) | 数据与逻辑分离 |

---

## 📝 实现注意事项

### Token 优化策略

| 策略 | 说明 |
|------|------|
| **类型先行** | 先实现 `types/`，后续每个模块实现时 AI 只需看类型定义 + 当前模块 |
| **纯函数优先** | engine 层全是纯函数，实现时无需 VS Code API 上下文 |
| **单文件单职责** | 每个文件 < 150 行，AI 实现时只需读一个文件 |
| **接口驱动** | 依赖接口而非实现，mock 可立即使用 |
| **测试即文档** | 单测描述了期望行为，减少重复解释 |

### 排查效率策略

| 策略 | 说明 |
|------|------|
| **分层隔离** | engine 层问题 → 跑单测；UI 层问题 → F5 调试；AI 层问题 → 换 mock |
| **Mock Provider** | AI 不可用时切 mock，确保其他层可独立开发 |
| **WebView 消息日志** | 所有 WebView ↔ Extension 消息打日志，便于调试通信问题 |
| **状态快照** | gameState 支持导出/导入 JSON，便于复现问题 |

### 每个任务的实现 Prompt 模板

实现具体任务时，可用以下格式给 AI 下达指令，最大化效率：

```
请实现 [任务编号] [任务名]。

上下文：
- 类型定义见 src/types/[相关文件].ts
- 依赖接口见 src/[相关文件].ts
- 关卡数据样例见 data/levels/ch1-signal-contact/level_01.json

要求：
- 遵循已有类型定义
- 纯函数/无副作用（engine 层）
- 附带单元测试
- 文件 < 150 行

不需要：
- 不需要修改其他文件
- 不需要添加注释（类型自解释）
- 不需要错误处理（除非在系统边界）
```

---

## 📊 进度总览

| Phase | 任务数 | 完成 | 进度 |
|-------|--------|------|------|
| Phase 0: 初始化 | 9 | 9 | █████ 100% |
| Phase 1: 数据层 | 5 | 5 | █████ 100% |
| Phase 2: 引擎层 | 7 | 0 | ░░░░░ 0% |
| Phase 3: UI 层 | 11 | 0 | ░░░░░ 0% |
| Phase 4: 竞赛 | 10 | 0 | ░░░░░ 0% |
| Phase 5: 活动 | 5 | 0 | ░░░░░ 0% |
| **合计** | **47** | **14** | **█░░░░ 30%** |
