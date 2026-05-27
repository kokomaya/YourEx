# First-Time Tutorial（新手引导系统）设计书

## 1. 目标

让任何"从零开始"的新玩家第一次进入 `level_01` 时，自动进入聚光灯式（spotlight + floating tooltip，driver.js 风格）的强引导流程：

1. **完整覆盖第一关 UI**：依次介绍剧情、任务说明、测试数据、Prompt 输入框、Scan Eye/Hint 面板、Regex 输入框、Execute/Manual 按钮、Result 面板、Score 拆分、Mission Map（侧边栏）章节列表/节点/玩家状态/其他入口。
2. **给出正确答案**：走到 Prompt 输入框时，tooltip 内直接展示参考 prompt，并提供「📋 自动填入」按钮（用户也可手动抄写）。
3. **要求真实执行**：Execute 那一步不能用 Next 跳过，必须用户实际点 Execute 按钮才推进。
4. **过关后继续引导**：禁用 `level_01` 通过后的 2.2s 自动跳关，wizard 继续介绍 Result 面板与评分细则，最后点 Finish 才正常进入 `level_02`（保留原 `nextLevel` 流程）。
5. **可被跳过**：任何步骤的 Skip Tutorial 立即终止 wizard 并标记为完成（普通用户不再重触发）。
6. **可被重触发**：
   - 普通用户：只能通过「重置游戏进度」重新看到。
   - 开发者：可用 `yourex.restartTutorial` 命令重置 wizard 状态（保留关卡进度），命令会自动加载 `level_01` 后启动 wizard。

---

## 2. 触发与持久化

### 2.1 状态字段

在 `GameState`（`src/types/gameState.ts`）新增：

```ts
/**
 * Whether the first-time tutorial has been completed (Skip or Finish).
 * Reset to false by gameState.reset(). The tutorial only auto-launches when
 * this is false AND the player is loading level_01.
 */
tutorialCompleted: boolean;
```

`DEFAULT_GAME_STATE.tutorialCompleted = false`。

`GameStateManager` 暴露 `markTutorialCompleted()` / `isTutorialCompleted()`。`reset()` 内部把 `tutorialCompleted` 重新置为 `false`（结构来自 `DEFAULT_GAME_STATE`，无需特殊处理）。

### 2.2 触发条件

唯一触发点位于 `PromptPanelProvider.show(levelId)`：当且仅当

- `levelId === 'level_01'`
- `!gameState.isTutorialCompleted()`

时，向 webview 发送一个新的 `startTutorial` 消息（消息细节见 §6）。其他任何关卡、任何时机都不会自动启动 wizard。

### 2.3 三种触发路径

| 路径 | 行为 |
|---|---|
| 全新玩家首次打开 | `yourex.startDecryption` 自动加载 `level_01` → 触发 wizard |
| 普通用户使用「重置进度」(`yourex.resetProgress`) | `gameState.reset()` 把 `tutorialCompleted` 置回 false；reset 流程末尾会 `welcomeProvider.show()`；下次玩家从 Welcome 点 Start，加载 `level_01` 时再次触发 |
| 开发者运行 `yourex.restartTutorial` | 仅在 dev 模式可见/可执行；调用 `gameState.update({ tutorialCompleted: false })` → `promptPanel.show('level_01')` → 自动触发 |

> **开发者命令的权限校验**：`yourex.restartTutorial` 注册时不带 `when`；执行回调内 `if (getEffectiveMode(modeService.getMode()) !== 'developer') { showInformationMessage('only available in Developer Mode'); return; }`。这与 `yourex.switchMode` 的现有 dev-only 判断一致。

### 2.4 不触发的场景

- 玩家已在 `level_01` 之外的任何关卡（包括 `level_02`+）。
- 玩家已完成 wizard（`tutorialCompleted === true`）。
- Welcome / Codex / Leaderboard 等其他 webview。
- 章节过场（Chapter Interlude / Ch6 Interlude）期间。

---

## 3. UI 形态

### 3.1 视觉

采用聚光灯遮罩 + 浮动 tooltip。和现有"驾驶舱监视器"风格保持一致：

- **遮罩层**：覆盖整个 webview viewport 的半透明黑色（`rgba(0, 0, 0, 0.72)`），使用 SVG `<mask>` 或 CSS `clip-path: polygon(...)` 在目标元素位置开一个矩形/圆角矩形挖孔。
- **挖孔区**：完全透明 + 一圈青色发光描边（`box-shadow: 0 0 24px var(--theme-color, #22d3ee), inset 0 0 12px var(--theme-color, #22d3ee)`），与 chapter 主题色变量保持一致。
- **Tooltip 卡片**：定位在挖孔旁边（基于可用空间自动选择上/下/左/右），含：
  - 头部：`📡 STEP n/N — <step title>`，右上角小 `×` = Skip Tutorial
  - 正文：富文本 markdown（支持 `**bold**` 与 `<code>`），可包含示例代码块
  - 可选的 action 区：如「📋 Fill Prompt」按钮、或「等待你点击 Execute」提示
  - 底部：`[Skip Tutorial]                [◄ Prev] [Next ►]`
- **过渡动画**：tooltip 卡片淡入 + 挖孔位置 200ms `cubic-bezier(.4,0,.2,1)` 平滑迁移。
- **滚动**：进入新步骤时若目标元素不在可视区，先 `scrollIntoView({ behavior: 'smooth', block: 'center' })`，等滚动稳定后再渲染挖孔/tooltip。

```
┌────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░ ╔══════════════╗ ░░░░░░░░░░ │   ← spotlight cutout
│ ░░ ║ Prompt Input ║◄─┐ ░░░░░░░ │
│ ░░ ╚══════════════╝  │ ░░░░░░░ │
│ ░░░░░░░░  ┌──────────┴───────┐ │
│ ░░░░░░░░  │ 📡 STEP 4/12     │ │   ← floating tooltip
│ ░░░░░░░░  │ 在这里写指令...   │ │
│ ░░░░░░░░  │ [📋 Fill Prompt] │ │
│ ░░░░░░░░  │ [Skip][◄][Next ►]│ │
│ ░░░░░░░░  └──────────────────┘ │
└────────────────────────────────┘
```

### 3.2 行为约束

- **遮罩拦截点击**：默认遮罩层 `pointer-events: all`，挖孔区 `pointer-events: none`（穿透到底层），从而：
  - 用户**只能**与当前高亮元素交互。
  - 想点其他按钮（如关闭面板、切换语言）必须先 Skip。
- **键盘**：Esc = Skip；Enter / → = Next；← = Prev。
- **CSP**：所有样式走类名（CSS 文件），不内联，无需放宽现有 webview 的 CSP。

---

## 4. 步骤序列

### 4.1 主面板（PromptPanel）部分

| # | 锚点（CSS 选择器） | 标题 | 文案要点 | 推进方式 |
|---|---|---|---|---|
| 1 | `header.signal-header` + `section.signal-story` 联合（取两者外接矩形） | 信号档案 & 剧情 | 编号/章节/难度三件套 + 每关都有一段背景故事，**通常藏着线索** | Next |
| 2 | `section.signal-challenge` + `section.test-data` 联合 | 任务 & 测试数据 | 任务行告诉 AI 要做什么；下面的样本是评分的依据，过关后命中项带 ✓ | Next |
| 3 | `section.prompt-input:not(.regex-input)` | Prompt 输入 | 用自然语言告诉 AI 你要匹配什么。**示例**：`匹配所有包含小写单词 hello 的行`。下方有 [📋 自动填入] 帮你抄进去 | Next（按钮不强制） |
| 4 | `.prompt-input__header .scan-eye-btn` + `section.regex-input` 联合 | 辅助工具 | 失败时 Scan Eye 会逐步解锁 hint；高手也可直接在下方写正则（两个框只能同时填一个） | Next |
| 5 | `.action-buttons .btn-primary` | Execute | **请按 Execute 真正提交一次。** | **必须实际点 Execute** |
| 6 | `.result-panel`（含其中的 `.score-breakdown`） | 结果与评分 | AI 返回的正则在这里；评分由简洁性 / 首次通过 / 优雅性 / 正则质量四项加权 | Next（提交成功后才进入此步） |

> 第 5 步的"必须点 Execute"由 wizard runtime 监听 `showResult` 消息推进（见 §6）。Skip Tutorial 始终可用。

### 4.2 侧边栏（Mission Map）部分

> 触发：第 6 步 Next 后，extension 端调用 `tutorialController.handOff()` 切到 sidebar wizard。

| # | 锚点 | 标题 | 文案要点 |
|---|---|---|---|
| 7 | `#chapter-tabs` + 第一个 `.node-btn` 联合 | 章节 & 关卡 | 旅程分 6 章逐章解锁；每章下面的节点就是关卡，点击即可跳关 |
| 8 | `#cert-footer` + `#sys-ops` 联合（fallback：viewport 底部） | 其他入口 | Journey Certificate 在底部；SYS_OPS 折叠区放的是危险操作（重置） |
| 9 | viewport 中央（无锚点） | 你准备好了 | "已了解全部基本操作。祝你旅途愉快，新人。" + `[Finish 🎖]` 按钮，点击 → `tutorialFinish` → extension 端 `gameState.markTutorialCompleted()` → 触发 `nextLevel` 跳到 `level_02` |

---

## 5. SOLID 与跨 Webview 协调

### 5.1 模块划分

| 模块 | 职责 | 层 | 文件 |
|---|---|---|---|
| `ITutorialController` | 接口：决定何时启动 / 推进 / 结束 wizard | Extension | `src/engine/tutorial/ITutorialController.ts` |
| `TutorialController` | 实现：根据 GameState 决定触发，向 PromptPanel/MissionMap 派发消息，监听 Execute → showResult 实现"必须真正提交" | Extension | `src/engine/tutorial/tutorialController.ts` |
| `tutorialSteps` | 步骤序列纯数据（id / target / titleKey / bodyKey / actions / advance），按 area 分组 `prompt` & `map` | Extension（共享） | `src/engine/tutorial/tutorialSteps.ts` |
| `TutorialOverlay` | Webview React 组件：spotlight + tooltip + 键盘绑定 | Webview | `webview-ui/src/components/Tutorial/TutorialOverlay.tsx` |
| `useTutorial` | Webview hook：接收 `startTutorial` / `advanceTutorial` 消息，管理本地步进，回发 `tutorialEvent` | Webview | `webview-ui/src/components/Tutorial/useTutorial.ts` |
| `TutorialOverlay.css` | 遮罩 + 挖孔 + tooltip 样式 | Webview | `webview-ui/src/components/Tutorial/TutorialOverlay.css` |
| `mapTutorialRuntime` | Mission Map 的 plain-JS wizard runtime（沿用 MissionMap 当前的 inline `<script>` 风格） | Extension（inline JS） | 嵌入 `MissionMapProvider.ts` 内的 `MAP_JS` |

### 5.2 协调时序

```
GameState                Extension                            PromptPanel WV               MissionMap WV
─────────                ─────────                            ──────────────               ──────────────
                         show('level_01')
                          ├─ postMessage(loadLevel)
                          ├─ if !tutorialCompleted:
                          │   tutorialCtrl.start('prompt')
                          │     └─ postMessage(startTutorial,
                          │            area='prompt', steps[1..11])
                          ▼
                                                              renders <TutorialOverlay>
                                                              user clicks Next / Prev / Skip
                                                              ◄── (steps 1-7, 9-11) local advance, no IPC
                                                              user clicks Execute on step 8
                                                              ──► executePrompt (existing)
                          handleExecutePrompt
                          ├─ … score / judge …
                          ├─ postMessage(showResult, suppressAutoAdvance=true)
                          ├─ tutorialCtrl.notifyExecuted()
                          │   └─ postMessage(advanceTutorial,
                          │          to=stepId 'result-panel')
                                                              wizard moves to step 9
                                                              user clicks Next…Next…Next
                                                              ──► tutorialEvent(type='requestSidebar')
                          tutorialCtrl.handOff()
                          ├─ postMessage(promptPanel: endTutorial)
                          ├─ postMessage(missionMap: startTutorial,
                          │     area='map', steps[12..16])
                                                                                            renders sidebar wizard
                                                                                            user clicks Finish on step 16
                                                                                            ──► tutorialEvent(type='finish')
                          tutorialCtrl.complete()
                          ├─ gameState.markTutorialCompleted()
                          ├─ postMessage(missionMap: endTutorial)
                          └─ promptPanel.postMessage({ command:'advanceLevel' })
                                                              normal nextLevel pipeline
                                                              loads level_02
```

任何一步收到 `tutorialEvent(type='skip')` 时：`tutorialCtrl.skip()` → `markTutorialCompleted()` → 关闭所有 area 的 wizard，**不**自动跳关（玩家停留在当前关卡，可继续自由操作）。

### 5.3 抗 race 与稳健性

- **Anchor 不存在**：webview hook 用 `MutationObserver` 等待最多 1000ms；超时则跳过该步骤（在 dev 控制台打 warning）。Mission Map 的"状态条"步骤没有专门 DOM 时，回退为"viewport 顶部居中"无锚点提示。
- **suppressAutoAdvance**：`PromptPanelProvider.handleExecutePrompt` 在 wizard 激活期间，把 `showResult` 消息附带 `suppressAutoAdvance: true`；PromptPanel webview 拿到此标志后**不**启动 2200ms 跳关定时器、**不**显示 signalFragment。Wizard 完成后由 `tutorialController.complete()` 触发跳关。
- **语言切换**：wizard 激活期间禁用顶部 LanguageSwitcher（遮罩天然拦截了）。切换语言需先 Skip。
- **关卡切换**：wizard 激活期间侧边栏点击节点的请求被 extension 拦截 —— `MissionMapProvider.onDidSelectLevel` 在 wizard 阶段 1（prompt area）时忽略，并向用户提示一次 toast「请先完成或跳过教程」。阶段 2（map area）时，第 13 步显式让用户点高亮节点也只是"教学性高亮"，不真的导航。

---

## 6. 消息协议

### 6.1 Extension → Webview（共用）

```ts
// 启动某个 area 的 wizard
| { command: 'startTutorial'; area: 'prompt' | 'map'; steps: TutorialStep[]; locale: string }
// 主动推进到指定 stepId（用于 Execute 后跨 IPC 推进）
| { command: 'advanceTutorial'; toStepId: string }
// 立即结束当前 area 的 wizard
| { command: 'endTutorial' }
```

`TutorialStep` 类型（在 `src/types/messages.ts` 导出，webview 同步）：

```ts
export interface TutorialStep {
  id: string;
  /** CSS selector relative to webview document. May be null for centered viewport. */
  anchor: string | null;
  /** Translation key, resolved on extension side using current locale. */
  title: string;
  /** Translation key. Markdown allowed: **bold**, `code`, code blocks. */
  body: string;
  /** Optional action button shown under body. */
  action?:
    | { kind: 'fillPrompt'; text: string }
    | { kind: 'waitFor'; event: 'executePrompt' };
  /** Where to anchor the tooltip relative to spotlight. 'auto' = best fit. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** If true, hide Next button — only advance is via wizard runtime / action. */
  blockingNext?: boolean;
}
```

### 6.2 Webview → Extension

```ts
| { command: 'tutorialEvent'; type: 'ready' | 'skip' | 'finish' | 'requestSidebar' | 'stepShown'; stepId?: string }
```

- `ready`：webview 启动 wizard 完毕。
- `stepShown`：每次步骤切换；extension 可在此时埋遥测或决定下一动作（目前仅日志）。
- `requestSidebar`：主面板部分完成后 webview 通知 extension 该切到 sidebar wizard。
- `skip` / `finish`：终止流程，extension 据此调用 `complete()` / `skipAll()`。

### 6.3 `showResult` 扩展

```ts
| { command: 'showResult';
    result: JudgeResult; score?: PromptScore; feedback: string;
    rawRegex?: string; reward?: LevelRewardData;
    suppressAutoAdvance?: boolean;          // ← NEW
  }
```

仅在 wizard 期间为 true；webview 据此决定是否启动 `autoAdvanceTimer.current`。

---

## 7. 文案与"正确答案"

第 5 步使用 `level_01` 的现有内容硬编码示例 prompt：

| Locale | 示例 prompt 文本 |
|---|---|
| `zh-CN` | `匹配所有包含小写单词 hello 的行` |
| `en` | `Match every line that contains the lowercase word "hello"` |

> 该 prompt 同时由 `MockProvider` 与 Copilot 都能稳定生成 `/hello/` 这一类满足 `level_01.expected` 的正则；新增一个 vitest 用例保证当 MockProvider 收到该 prompt 时返回的正则能让 `level_01` 进入 `pass`/`perfect` 状态（防止文案漂移）。

`tutorialSteps.ts` 不内联文案，只引 i18n key（如 `tutorial.step.prompt-input.body`）；示例 prompt 文本由 extension 端从当前 locale 的 `level_01` JSON 之外的一个 `tutorial.fillPrompt.level_01` key 读取。

---

## 8. 文件变更清单

### 新增

| 文件 | 说明 |
|---|---|
| `src/engine/tutorial/ITutorialController.ts` | 接口 |
| `src/engine/tutorial/tutorialController.ts` | 协调器实现 |
| `src/engine/tutorial/tutorialSteps.ts` | 步骤数据（prompt area + map area） |
| `webview-ui/src/components/Tutorial/TutorialOverlay.tsx` | 遮罩 + tooltip 组件 |
| `webview-ui/src/components/Tutorial/TutorialOverlay.css` | 样式 |
| `webview-ui/src/components/Tutorial/useTutorial.ts` | 状态 hook |
| `test/engine/tutorialController.test.ts` | 触发条件 / skip / complete 单测 |
| `test/engine/tutorialMockPrompt.test.ts` | 保证 wizard 示例 prompt 仍能通过 level_01 |

### 修改

| 文件 | 变更 |
|---|---|
| `src/types/gameState.ts` | 加 `tutorialCompleted: boolean`，默认 false |
| `src/state/gameState.ts` | `markTutorialCompleted()` / `isTutorialCompleted()`；`normalizeState` 给老存档默认 false |
| `src/types/messages.ts` | 加 `TutorialStep`、`startTutorial` / `advanceTutorial` / `endTutorial` / `tutorialEvent`；`showResult` 加 `suppressAutoAdvance` |
| `webview-ui/src/types/messages.ts` | 同步类型 |
| `src/ui/webview/promptPanelProvider.ts` | 注入 `TutorialController`；`show(levelId)` 内判断启动；`handleExecutePrompt` wizard 期间传 `suppressAutoAdvance` 并 `notifyExecuted`；`handleWebviewMessage` 加 `tutorialEvent` 分发；新增 `advanceLevel` 内部方法 |
| `src/ui/sidebar/missionMap/MissionMapProvider.ts` | inline `MAP_JS` 中加 wizard runtime（与 React overlay 风格一致的简化 plain JS 实现）；onDidSelectLevel 在 prompt-area wizard 期间被忽略 |
| `src/extension.ts` | 创建 `TutorialController` 注入到两个 provider；注册 `yourex.restartTutorial`（dev only）；`resetProgress` 流程依赖 `gameState.reset()` 把 tutorial flag 清零（无需额外代码） |
| `webview-ui/src/components/PromptPanel/index.tsx` | 渲染 `<TutorialOverlay>`；`showResult` 收到 `suppressAutoAdvance` 时不启 timer、不显示 signalFragment；保留对 `loadLevel.recall` 的现有逻辑 |
| `webview-ui/src/App.tsx` | 不变（overlay 只在 PromptPanel 内部使用） |
| `webview-ui/src/i18n/locales/zh-CN.json` & `en.json` | 加 `tutorial.*` key（步骤标题/正文、按钮文案、示例 prompt） |
| `package.json` | 注册 `yourex.restartTutorial` 命令 |

### 不变

- `runDecryptionPipeline` / `scorePrompt` / `HintTracker` / 关卡 JSON — 教学只通过 UI 层叠加。

---

## 9. i18n 文案 Key（节选）

```json
{
  "tutorial.skip": "Skip Tutorial",
  "tutorial.next": "Next ▶",
  "tutorial.prev": "◀ Prev",
  "tutorial.finish": "Finish 🎖",
  "tutorial.stepCounter": "📡 STEP {n}/{total}",

  "tutorial.fillPrompt.button": "📋 Auto-Fill",
  "tutorial.fillPrompt.level_01": "匹配所有包含小写单词 hello 的行",

  "tutorial.step.story.title": "信号档案",
  "tutorial.step.story.body": "每一关都有一段背景剧情，它通常藏着解题线索。",

  "tutorial.step.testData.title": "测试数据",
  "tutorial.step.testData.body": "这些是你需要分类的样本。过关后命中的会带上 ✓。",

  "tutorial.step.promptInput.title": "Prompt 输入",
  "tutorial.step.promptInput.body": "用自然语言告诉 AI 你要匹配什么。示例：\n`匹配所有包含小写单词 hello 的行`",

  "tutorial.step.execute.title": "执行",
  "tutorial.step.execute.body": "**请按 Execute 按钮真正提交一次。**",

  "tutorial.step.resultPanel.title": "结果面板",
  "tutorial.step.resultPanel.body": "AI 返回的正则、命中数与评分都在这里。",

  "tutorial.step.scoreBreakdown.title": "评分维度",
  "tutorial.step.scoreBreakdown.body": "评分由简洁性、首次通过、优雅性、正则质量四项加权。",

  "tutorial.step.chapterTabs.title": "章节",
  "tutorial.step.chapterTabs.body": "整段旅程分成 6 章，逐章解锁。",

  "tutorial.step.finish.title": "你准备好了",
  "tutorial.step.finish.body": "已了解全部基本操作。祝你旅途愉快，新人。"
}
```

---

## 10. 验收场景

| 场景 | 预期 |
|---|---|
| 全新安装第一次进入 | Welcome → Start → level_01 加载后**自动**显示 wizard 第一步 |
| 第 5 步点 [📋 Auto-Fill] | Prompt textarea 立即填入对应 locale 的示例文本，wizard 推进到下一步 |
| 第 8 步硬点 Next | Next 按钮不存在；只有 Skip 与"等待点 Execute"提示 |
| 第 8 步实际点 Execute | `executePrompt` 正常走管线；wizard 跳到 step 9（result panel） |
| 第 8 步通关后等 3s | **不**触发自动跳 level_02，**不**显示 signal fragment |
| 第 11 步 Next | 主面板 wizard 结束，侧边栏 wizard 启动 |
| 第 16 步 Finish | `tutorialCompleted=true`，`nextLevel` 跳到 level_02，第二关正常 |
| 任意步骤 Skip / Esc | wizard 立即关闭，`tutorialCompleted=true`，玩家停留在当前关卡 |
| 已完成后重开 VS Code 进 level_01 | 不再触发 |
| 普通用户运行 `yourex.restartTutorial` | 提示「Developer Mode only」，无效果 |
| 开发者运行 `yourex.restartTutorial`（在 level_03） | 自动加载 level_01 → wizard 启动；关卡进度保留 |
| 普通用户「重置进度」后从 Welcome 进入 | wizard 再次自动触发（进度已清空） |
| wizard 期间切换语言 / 点侧边栏其他关卡 | 主面板的遮罩拦截；侧边栏的 `selectLevel` 被 extension 忽略并提示 toast |
| 老存档（无 `tutorialCompleted` 字段）首次升级到本版本 | `normalizeState` 兜底为 `true`（不打扰老玩家）—— **注意此处与新人相反**：见 §11 |

---

## 11. 升级兼容性 ⚠

`normalizeState` 加一条：

```ts
// Existing players who already have progress should not be forced through
// the tutorial. Only treat the flag as "false" when this looks like a brand
// new save (no completed levels AND no startTime).
const looksFresh =
  Object.keys(state.completedLevels ?? {}).length === 0 &&
  (state.startTime == null);
return {
  ...state,
  tutorialCompleted: state.tutorialCompleted ?? !looksFresh,
  unlockedChapters: ...,
};
```

> 新存档默认 `false`（触发 wizard）；老存档默认 `true`（不打扰）。`reset()` 走的是 `DEFAULT_GAME_STATE`，所以重置后回到 `false` —— 符合 §2.3 的设计。

---

## 12. 测试策略

### 单元测试

- `tutorialController.test.ts`：
  - 仅 level_01 + flag=false 时 `shouldStart()` 返回 true，其他组合返回 false
  - `notifyExecuted()` 只在 prompt-area 当前步是 `execute` 时推进
  - `skip()` / `complete()` 都把 flag 置 true
- `tutorialMockPrompt.test.ts`：使用 `MockProvider` 喂入 `tutorial.fillPrompt.level_01` 对应文本，断言判定 `pass` 或 `perfect`
- `gameState.test.ts`：`normalizeState` 对老存档（有 completedLevels）保留 true、对全新存档置 false

### 手动验收

按 §10 表逐项跑一遍，重点关注：

1. 第一步 wizard 出现前 `loadLevel` 是否完全渲染（避免锚点未就绪）
2. 第 8→9 步跨 IPC 推进的时延（应 < 200ms 视感无卡顿）
3. 主面板 → 侧边栏 handoff 时焦点不会跳错 viewport
4. Skip 后玩家仍能正常完成 level_01 并跳 level_02
