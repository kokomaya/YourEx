# Hint System 设计书

## 1. 目标

为 YourEx 添加提示系统，帮助玩家在解密失败时获得渐进式指引，降低挫败感的同时保持挑战性：

1. **失败触发提示**：玩家解密失败时，根据已失败次数自动解锁并显示下一条 `hints` 提示。
2. **主动查看提示**：在 PromptPanel 的合适位置放置一个科幻风格的"扫描之眼"按钮，玩家可主动点击查看已解锁的 `promptHints`（Prompt 编写指引）。
3. **付费解密**：玩家可一次性解锁所有锁定的 `promptHints`，代价是根据关卡难度扣除少量评分（easy: -1, medium: -2, hard: -5）。
4. 提示系统会影响评分（仅在使用付费解密时），但不影响判定、奖励、XP、连击等已有逻辑。

---

## 2. 数据来源

关卡 JSON 中已有两组提示字段：

| 字段 | 用途 | 触发方式 |
|---|---|---|
| `hints: string[]` | 解密方向提示（关于正则/匹配目标） | 失败时自动逐条解锁 |
| `promptHints: string[]` | Prompt 编写技巧（如何描述意图） | 玩家点击"扫描之眼"主动查看 |

两组提示均为有序数组，按索引从易到难渐进解锁。

---

## 3. 提示解锁规则

### 3.1 hints（失败自动解锁）

| 失败次数 | 解锁行为 |
|---|---|
| 第 1 次失败 | 显示反馈文字，不解锁 hint |
| 第 2 次失败 | 解锁 `hints[0]`，结果面板下方出现提示区域 |
| 第 3 次失败 | 解锁 `hints[1]` |
| 第 N+1 次失败 | 解锁 `hints[N-1]`（直至全部解锁） |

规则：`unlockedHintIndex = Math.min(failCount - 2, hints.length - 1)`，仅当 `failCount >= 2` 时显示。

### 3.2 promptHints（主动查看）

| 条件 | 解锁行为 |
|---|---|
| 关卡加载 | 眼睛按钮可见，但所有 promptHints 锁定 |
| 第 1 次失败 | 解锁 `promptHints[0]` |
| 第 2 次失败 | 解锁 `promptHints[1]` |
| 第 N 次失败 | 解锁 `promptHints[N-1]` |

规则：`unlockedPromptHintIndex = Math.min(failCount - 1, promptHints.length - 1)`，仅当 `failCount >= 1` 时有可查看内容。

**设计意图**：hints 比 promptHints 晚一轮解锁——先让玩家自行思考 prompt 写法（通过 promptHints），再给出更直接的解题方向（hints）。

### 3.3 付费解密（一次性解锁所有 promptHints）

玩家可在 HintPanel 中点击「⚡ 全部解密 [-N pts]」按钮，一次性解锁当前关卡所有锁定的 promptHints。

| 关卡难度 | 扣分 |
|---|---|
| easy | -1 |
| medium | -2 |
| hard | -5 |

规则：
- 每个关卡只能使用一次付费解密（`hasPeeked` 布尔标记，不可重复）
- 解密后所有 promptHints 立即全部显示
- 扣分在过关时从 `promptScore.total` 中扣除，最低保底 1 分
- HintPanel header 显示 `-N pts` 标签提醒已使用
- 付费解密按钮仅在存在锁定项且未使用过时显示

---

## 4. 视觉设计

### 4.1 扫描之眼按钮（Scan Eye）

位置：prompt 输入区（`section.prompt-input`）标题栏右侧，与「✍️ Your Prompt」标题同行。

```
┌─ prompt-input ────────────────────────────┐
│ ✍️ Your Prompt       [👁 📡 SIGNAL GUIDANCE] │
│                                            │
│  [textarea]                                │
│                                    12 chars │
└────────────────────────────────────────────┘
```

按钮形态：药丸形（`border-radius: 13px`），包含眼睛 SVG 图标 + 文字标签。

视觉风格：
- 默认态：半透明青色边框 + 图标，Courier 字体大写文字标签
- 有新提示解锁时：发出呼吸脉冲光晕（`@keyframes eyeBreathe`），通知圆点闪烁
- 无可用提示时：灰暗禁用态（`opacity: 0.4`）
- Hover：图标放大 + 边框发光 + 阴影扩散

CSS class 命名：`.scan-eye-btn`，`.scan-eye-btn--pulse`，`.scan-eye-btn--disabled`

布局：`.prompt-input__header` 使用 `display: flex; justify-content: space-between` 实现标题与按钮的左右对齐。

### 4.2 promptHints 弹出面板（Scan Eye Panel）

点击扫描之眼后，在输入区下方展开一个面板：

```
┌─ 📡 SIGNAL GUIDANCE ──────────── -2 pts ─┐
│                                           │
│  ▸ 直接告诉 AI 你要匹配什么内容            │
│  ▸ 提示 AI 区分大小写                      │
│  ▹ ░░░░░░░░░░░░░░░░  [LOCKED]            │
│  ▹ ░░░░░░░░░░░░  [LOCKED]                │
│                                           │
│         [⚡ 全部解密 [-2 pts]]             │
│                                           │
└───────────────────────────────────────────┘
```

- 已解锁项：正常显示文字，带 `▸` 前缀
- 未解锁项：显示扫描线遮罩（`░░░` 占位 + `[LOCKED]` 标签），暗色处理
- 付费解密按钮：居中显示于锁定项下方，点击后一次性解锁所有 promptHints
- 已使用付费解密后：按钮消失，header 右侧显示 `-N pts` 扣分标签
- 展开/收起使用 slide-down 动画
- 面板边框使用与驾驶舱监视器一致的风格（`border-color` 跟随章节主题色）

### 4.3 失败提示区域（Hint Alert）

位置：结果面板（`section.result-panel`）底部，反馈文字之后。

```
┌─ result-panel [status: fail] ────────────┐
│  ✗ [Parse Failed]                         │
│  信号未捕获。检查你的指令是否精确描述了目标。 │
│                                           │
│  ┌─ ⚠ INTERCEPTED SIGNAL ──────────────┐ │
│  │ [Hint] 信号中的关键词是小写的         │ │
│  │ [Hint] 你需要精确匹配 "hello" 这个词  │ │
│  └──────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

- 首次出现时使用打字机动画逐字显示（typewriter effect）
- 新解锁的 hint 带闪烁高亮，已显示过的 hint 为常亮
- 标题文字：`⚠ INTERCEPTED SIGNAL`（截获的信号——符合游戏叙事：提示是从信号中截获的碎片）

---

## 5. SOLID 架构

### 5.1 SRP 单一职责

| 模块 | 职责 | 层级 |
|---|---|---|
| `HintTracker` | 跟踪每个关卡的失败次数和付费解密状态 | Extension（`src/engine/`） |
| `HintResolver` | 根据 `HintTracker` 状态 + `Level` 数据，生成当前可显示的提示列表 | Extension（`src/engine/`） |
| `ScanEyeButton` | 扫描之眼 UI 组件（按钮 + 脉冲动画 + 点击事件） | Webview（`webview-ui/src/components/PromptPanel/`） |
| `HintPanel` | promptHints 弹出面板 UI 组件 | Webview（`webview-ui/src/components/PromptPanel/`） |
| `HintAlert` | 失败时的 hints 提示区域 UI 组件 | Webview（`webview-ui/src/components/PromptPanel/`） |

### 5.2 OCP 开闭原则

- `HintTracker` 通过接口 `IHintTracker` 抽象，未来可替换为更复杂的解锁策略（如根据匹配率动态选择 hint）而不修改消费方。
- 提示数据完全来自关卡 JSON，新增/修改提示只需编辑 JSON 文件，不涉及代码改动。

### 5.3 LSP 里氏替换

- `IHintTracker` 的任何实现（简单计数器 / 智能分析器）都可被 `HintResolver` 无差别使用。

### 5.4 ISP 接口隔离

- Webview 组件只接收已解析的提示数据（`HintData`），不依赖 `Level` 完整结构或 `GameState`。
- `HintTracker` 不依赖 UI 层，`HintResolver` 不依赖持久化层。

### 5.5 DIP 依赖反转

- `PromptPanelProvider` 依赖 `IHintTracker` 接口而非具体实现。
- Webview 通过消息协议接收提示数据，不直接依赖 Extension 内部模块。

---

## 6. 接口与类型定义

### 6.1 Extension 侧

```ts
// src/engine/hintTracker.ts
export interface IHintTracker {
  /** 记录一次失败 */
  recordFail(levelId: string): void;
  /** 当前关卡失败次数 */
  getFailCount(levelId: string): number;
  /** 标记为已使用付费解密（一次性，解锁所有锁定的 promptHints） */
  markPeeked(levelId: string): void;
  /** 是否已使用付费解密 */
  hasPeeked(levelId: string): boolean;
}

export class HintTracker implements IHintTracker {
  private failCounts: Map<string, number> = new Map();
  private peeked: Set<string> = new Set();
  // ...
}
```

```ts
// src/engine/hintResolver.ts
export interface HintData {
  /** 已解锁的 hints（失败自动解锁） */
  hints: string[];
  /** 已解锁的 promptHints（主动查看 + 付费解密） */
  promptHints: string[];
  /** hints 总数 */
  totalHints: number;
  /** promptHints 总数 */
  totalPromptHints: number;
  /** 是否有新解锁的 hint（用于触发动画） */
  hasNewHint: boolean;
  /** 是否有新解锁的 promptHint（用于触发扫描之眼脉冲） */
  hasNewPromptHint: boolean;
  /** 是否已使用付费解密 */
  hasPeeked: boolean;
  /** 扣分数值（基于难度，始终返回） */
  peekPenalty: number;
}

/** 难度 → 扣分映射 */
const DIFFICULTY_PEEK_PENALTY: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 5,
};

export function getPeekPenalty(difficulty: string): number;
export function resolveHints(level: Level, failCount: number, previousFailCount?: number, peeked?: boolean): HintData;
```

### 6.2 消息协议扩展

```ts
// ExtensionMessage 新增：
| { command: 'updateHints'; hintData: HintData }

// WebViewMessage 新增：
| { command: 'peekHint'; levelId: string }
```

触发时机：
- `updateHints`：`showResult` 且 `status` 为 `fail` / `partial` / `error` 时，紧随 `showResult` 之后发送；关卡加载时发送初始状态；`peekHint` 处理后发送
- `peekHint`：玩家在 HintPanel 中点击「全部解密」按钮时发送

### 6.3 Webview 侧

```tsx
// ScanEyeButton props
interface ScanEyeButtonProps {
  hasNewHint: boolean;       // 是否有新解锁的提示（触发脉冲）
  disabled: boolean;         // 无可用提示时禁用
  onClick: () => void;
}

// HintPanel props
interface HintPanelProps {
  promptHints: string[];     // 已解锁的 promptHints
  totalCount: number;        // 总数（用于显示锁定占位）
  hasPeeked: boolean;        // 是否已使用付费解密
  peekPenalty: number;       // 扣分数值（基于难度）
  visible: boolean;          // 展开/收起状态
  onPeek: () => void;        // 付费解密回调
}

// HintAlert props
interface HintAlertProps {
  hints: string[];           // 已解锁的 hints
  hasNewHint: boolean;       // 最新一条是否为新解锁（触发打字机动画）
}
```

---

## 7. 数据流

```
┌──────────────────────────────────────────────────────────┐
│ Extension                                                │
│                                                          │
│  Player fails                                            │
│      │                                                   │
│      ▼                                                   │
│  PromptPanelProvider.handleExecutePrompt()               │
│      │                                                   │
│      ├──▶ hintTracker.recordFail(levelId)                │
│      │                                                   │
│      ├──▶ postMessage({ command: 'showResult', ... })    │
│      │                                                   │
│      ├──▶ hintData = resolveHints(level, failCount,      │
│      │                  prevFailCount, hasPeeked)         │
│      │                                                   │
│      └──▶ postMessage({ command: 'updateHints', ...})    │
│                                                          │
│  Player peeks (付费解密)                                  │
│      │                                                   │
│      ▼                                                   │
│  PromptPanelProvider.handlePeekHint(levelId)             │
│      │                                                   │
│      ├──▶ hintTracker.markPeeked(levelId)                │
│      │                                                   │
│      └──▶ sendHintState(level) → updateHints             │
│                                                          │
│  Player passes (scoring with penalty)                    │
│      │                                                   │
│      ▼                                                   │
│  runDecryptionPipeline(prompt, level, ai, attempt,       │
│      peekPenalty = hasPeeked ? getPeekPenalty(diff) : 0)  │
│      └──▶ scorePrompt(..., peekPenalty)                  │
│           total = max(1, rawTotal - peekPenalty)          │
│                                                          │
│  Player loads level                                      │
│      │                                                   │
│      ▼                                                   │
│  PromptPanelProvider.loadLevel()                         │
│      │                                                   │
│      ├──▶ postMessage({ command: 'loadLevel', ... })     │
│      │                                                   │
│      └──▶ postMessage({ command: 'updateHints',          │
│              hints: resolveHints(level, failCount) })     │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          │
                    postMessage
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ Webview (PromptPanel)                                    │
│                                                          │
│  useMessageListener                                      │
│      │                                                   │
│      ├── 'updateHints' ──▶ setHintData(msg.hints)        │
│      │                                                   │
│      └── 'loadLevel' ──▶ reset hint panel visibility     │
│                                                          │
│  Render:                                                 │
│    ┌───────────────────────────────────────────┐         │
│    │  prompt-input section                     │         │
│    │                          [ScanEyeButton]  │         │
│    └───────────────────────────────────────────┘         │
│    ┌───────────────────────────────────────────┐         │
│    │  [HintPanel] (toggle by ScanEyeButton)    │         │
│    └───────────────────────────────────────────┘         │
│    ┌───────────────────────────────────────────┐         │
│    │  result-panel                             │         │
│    │    feedback text                          │         │
│    │    [HintAlert] (on fail, if hints exist)  │         │
│    └───────────────────────────────────────────┘         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 8. 文件变更清单

### 新增文件

| 文件 | 说明 |
|---|---|
| `src/engine/hintTracker.ts` | `IHintTracker` 接口 + `HintTracker` 实现 |
| `src/engine/hintResolver.ts` | `resolveHints()` 纯函数 + `HintData` 类型 |
| `webview-ui/src/components/PromptPanel/ScanEyeButton.tsx` | 扫描之眼按钮组件 |
| `webview-ui/src/components/PromptPanel/ScanEyeButton.css` | 扫描之眼样式（呼吸光效、脉冲动画） |
| `webview-ui/src/components/PromptPanel/HintPanel.tsx` | promptHints 弹出面板组件 |
| `webview-ui/src/components/PromptPanel/HintPanel.css` | 面板样式（slide-down、锁定占位） |
| `webview-ui/src/components/PromptPanel/HintAlert.tsx` | 失败 hints 提示区域组件 |
| `webview-ui/src/components/PromptPanel/HintAlert.css` | 提示区域样式（打字机动画、高亮） |

### 修改文件

| 文件 | 变更 |
|---|---|
| `src/types/messages.ts` | `ExtensionMessage` 新增 `updateHints`；`WebViewMessage` 新增 `peekHint`；`HintData` 新增 `hasPeeked` / `peekPenalty` |
| `webview-ui/src/types/messages.ts` | 同步上述类型变更 |
| `src/ui/webview/promptPanelProvider.ts` | 注入 `IHintTracker`，失败时发送 hint 数据，加载关卡时发送初始 hint 状态，处理 `peekHint` 消息，过关时传递 `peekPenalty` 给 pipeline |
| `src/extension.ts` | 创建 `HintTracker` 实例，传入 `PromptPanelProvider` |
| `webview-ui/src/components/PromptPanel/index.tsx` | 新增 `hintData` state，渲染 `ScanEyeButton`、`HintPanel`、`HintAlert` |
| `webview-ui/src/i18n/locales/zh-CN.json` | 新增 hint 相关 UI 文案 key |
| `webview-ui/src/i18n/locales/en.json` | 新增 hint 相关 UI 文案 key |

### 不变文件

| 文件 | 原因 |
|---|---|
| `src/engine/xpTracker.ts` | XP 计算不变 |
| `src/engine/comboTracker.ts` | 连击逻辑不变 |
| `src/data/levels/**/*.json` | hints/promptHints 字段已存在，无需修改 |

### 受影响文件（评分扣分）

| 文件 | 变更 |
|---|---|
| `src/engine/promptScorer.ts` | `scorePrompt()` 新增 `peekPenalty` 参数，`total = max(1, rawTotal - peekPenalty)` |
| `src/engine/decryptionPipeline.ts` | `runDecryptionPipeline()` 新增 `peekPenalty` 参数，透传给 `scorePrompt()` |

---

## 9. i18n 文案 Key

```json
{
  "hint.interceptedSignal": "⚠ INTERCEPTED SIGNAL",
  "hint.scanGuidance": "📡 SIGNAL GUIDANCE",
  "hint.locked": "[LOCKED]",
  "hint.scanEyeTooltip": "Signal Scanner — View decoded guidance",
  "hint.noHintsYet": "No intercepted signals yet…",
  "hint.peekButton": "全部解密 / DECRYPT ALL",
  "hint.peekTooltip": "强制解密所有信号。扣分取决于关卡难度。"
}
```

---

## 10. 测试策略

### 10.1 单元测试

| 测试文件 | 覆盖内容 |
|---|---|
| `test/engine/hintTracker.test.ts` | `recordFail` 计数递增、多关卡独立计数、`markPeeked` / `hasPeeked` 状态 |
| `test/engine/hintResolver.test.ts` | 各失败次数下的解锁索引计算、边界情况（空数组、超出范围）、`hasNewHint` 标记、`peeked=true` 时全部解锁、`peekPenalty` 难度映射 |

### 10.2 验收场景

| 场景 | 预期 |
|---|---|
| 首次失败 | 无 hint 显示，扫描之眼可点击但面板显示 `promptHints[0]` |
| 第二次失败 | `hints[0]` 出现在结果面板底部（打字机动画），扫描之眼脉冲 |
| 第三次失败 | `hints[0]` + `hints[1]` 均显示，新的带高亮 |
| 点击扫描之眼 | 弹出面板显示已解锁的 promptHints，未解锁项显示锁定遮罩，底部显示「全部解密」按钮 |
| 点击全部解密 | 所有锁定的 promptHints 立即显示，按钮消失，header 显示 `-N pts` 标签 |
| 全部解密后过关 | 评分 `total` 扣除对应难度的分数（easy: -1, medium: -2, hard: -5），最低 1 分 |
| 切换关卡 | hint 面板收起，hintData 重置为该关卡的当前状态 |
| 通关后重玩 | 失败计数不重置（已解锁的提示保持可见） |
| hints 为空数组 | HintAlert 不渲染，扫描之眼仅展示 promptHints |
| 两组均为空 | 扫描之眼不渲染 |
