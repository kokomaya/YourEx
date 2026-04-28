# Level Answer Recall 设计书

## 1. 目标

当玩家**回头打开一个已通关（pass / perfect）的关卡**时，自动恢复并展示当时使用的 prompt（或手动模式 regex），让玩家可以：

1. **回顾自己的解法** — 不必为了想起当年的答案重新破题。
2. **基于历史答案微调** — 用之前的 prompt 当起点继续优化分数。
3. **作为证书来源** — 旅程证书里展示的"Final Prompt / Final Regex"已经依赖最佳尝试的内容，但这次让它在游戏内 PromptPanel 也可见。

如果某一关从未通关，或玩家执行了"重置进度"，再次进入该关时显示空的输入（与首次进入完全一致）。这条对偶规则保证：**面板里看到的内容永远和当前存档的真相一致**。

---

## 2. 范围与非目标

### 2.1 范围

- 扩展 `loadLevel` 消息：携带"该关最佳通关尝试"的 prompt / regex / 模式 / 分数。
- 在 PromptPanel 的 prompt 输入框预填该答案；如果是手动模式通关，显示 regex 而非 prompt 输入框预填。
- 视觉上加一行轻量的"上次解法 · 最高 980 分"小字提示，让玩家明白这是历史值，不是占位提示。
- 提供一个"清空 / 重新作答"小按钮，一键把输入框清空回空白态（不删除存档）。

### 2.2 非目标

- 不展示**所有历史尝试**（这是 `yourex.promptReplay` 命令的职责，已存在）。
- 不影响首次访问、未通关重试、错误尝试等流程 — 只在"已经有 pass 或 perfect 的最佳尝试"时触发。
- 不修改 hint / decryption / 分数计算逻辑。
- 不持久化任何**新**字段；现有 `LevelAttempt[]` 已包含所需数据。

---

## 3. 数据流

### 3.1 已有数据

`GameStateManager.getBestAttempt(levelId)` 已实现并返回最佳通关尝试：

```ts
getBestAttempt(levelId: string): LevelAttempt | undefined {
  const attempts = this.getLevelAttempts(levelId);
  return attempts
    .filter(a => a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass')
    .sort((a, b) => (b.promptScore?.total ?? 0) - (a.promptScore?.total ?? 0))[0];
}
```

直接复用，零额外存储。

### 3.2 新增 payload 字段

扩展 `loadLevel` 消息，附带一个可选的 `recall` 字段：

```ts
// src/types/messages.ts (Extension → WebView)
| { command: 'loadLevel'; level: Level; recall?: LevelRecall }

interface LevelRecall {
  /** Mode of the best previous attempt. */
  mode: 'prompt' | 'manual';
  /** The prompt text used (only present for mode === 'prompt'). */
  prompt?: string;
  /** Final regex (raw source string, e.g. "/SIG-\\w+/g"). */
  regex: string;
  /** Score total of the best attempt (for the inline hint). */
  scoreTotal?: number;
  /** Status — used to color the hint (perfect = gold, pass = cyan). */
  status: 'perfect' | 'pass';
  /** Total number of attempts on this level so far (success + fail). */
  totalAttempts: number;
}
```

构建位置：在 `promptPanelProvider.loadLevel(levelId)` 中调用 `gameState.getBestAttempt(levelId)`，把结果映射进 `recall`。

如果没有最佳尝试 → `recall` 字段不附带（undefined）。Webview 侧没有这个字段就保持空白态。

---

## 4. Webview 行为

### 4.1 PromptPanel 收到 `loadLevel`

```ts
case 'loadLevel':
  setLevel(data.level);
  setResult(null);
  setReward(null);
  setSignalFragment(null);
  setHintData(null);
  setHintPanelOpen(false);
  setRecall(data.recall ?? null);
  setPrompt(data.recall?.prompt ?? '');
  // Manual-mode recall does not pre-fill the prompt input;
  // instead a small "Last regex" panel is shown beneath the actions.
  break;
```

### 4.2 视觉呈现

#### Prompt-模式通关回访

输入框预填上次的 prompt 文本。
紧挨输入框上方加一行 chip 风格的小字：

```
↺  RECALL · LAST PROMPT — score 980 (PERFECT) · 2 attempts                [清空]
```

- 左侧 `↺` 图标 + `RECALL · LAST PROMPT`（等宽字体）
- 中间显示分数 + status（perfect 用金色 `#ffd27a`，pass 用青色 `#34f5c5`）
- 右侧 `[清空]` 文字按钮 → 把输入框置空，关掉 chip（**不删除存档**）

#### Manual-模式通关回访

输入框保持空白（玩家若再次提交，需要重新走 prompt 流程）。
输入框下方加一个折叠卡片：

```
┌─ LAST MANUAL REGEX (PASS · 720) ──────────┐
│  /SIG-[A-Z0-9]+/g                         │
└────────────────────────────────────────────┘
```

折叠后只显示一行标题，可点击展开查看 regex 全文。

### 4.3 "清空"按钮的语义

- 仅清空输入框 + 隐藏 recall chip 的本次会话。
- **不**修改 `globalState`、不删除任何尝试记录。
- 切换到其它关卡再切回，recall 仍然出现（数据驱动）。
- 唯一让 recall 永久消失的方式是 `yourex.resetProgress`。

### 4.4 重新提交后的行为

如果玩家基于 recall 微调后再次提交：
- 走和首次提交一样的判定流程
- 新尝试照常 `recordAttempt` 入库
- 下次再回这关时 `getBestAttempt` 会自动选出新的最高分；recall chip 会更新

---

## 5. 与已有功能的关系

| 模块 | 现状 | 本特性影响 |
|---|---|---|
| `gameState.getBestAttempt(levelId)` | 已存在 | 直接复用，0 改动 |
| `yourex.promptReplay` 命令 | 列出**所有**历史尝试 | 不变；本特性只显示**最高分**尝试 |
| 旅程证书 `Final Prompt / Final Regex` | 已展示最佳尝试的 prompt/regex | 不变 — 同源数据，自动一致 |
| Hint 系统 | 与失败计数相关 | 不变 |
| Reset Progress | 清空 `gameState.completedLevels` | 自动让 recall 消失 — 不需要额外清理 |
| Reward Overlay | 通关后显示分数 | 不变 |
| 自动跳到下一关（`autoAdvanceTimer`） | 通关后 2.2s 自动 next | 不变 |

**重要：当玩家通过 `nextLevel` 自动跳到新关时，新关的 `loadLevel` 也会带 `recall`**。这是符合直觉的（如果新关其实之前来过并通关过，恢复历史；否则空白）。

---

## 6. 实现位置

```
src/types/messages.ts                    ← 在 ExtensionMessage 的 'loadLevel' variant 上新增 recall?: LevelRecall
src/ui/webview/promptPanelProvider.ts    ← loadLevel(levelId) 中：从 getBestAttempt 构建 recall, 附在消息里
webview-ui/src/types/messages.ts         ← 镜像新增 LevelRecall 与字段
webview-ui/src/components/PromptPanel/
  index.tsx                              ← 接收 recall, 预填 prompt, 渲染 chip / manual 卡片
  PromptPanel.css                        ← chip & manual 卡片样式（cockpit / 终端风格）
src/data/ui/{en,zh-CN}.json              ← 新增 promptPanel.recall.* keys
webview-ui/src/i18n/locales/{en,zh-CN}.json  ← 同步上述 keys
```

---

## 7. i18n Keys

| Key | 英文 | 中文 |
|---|---|---|
| `promptPanel.recall.label` | `RECALL · LAST PROMPT` | `回放 · 上次 PROMPT` |
| `promptPanel.recall.scoreSuffix` | `score {score} ({status})` | `得分 {score}（{status}）` |
| `promptPanel.recall.attemptsSuffix` | `{n} attempts` | `共 {n} 次尝试` |
| `promptPanel.recall.clearButton` | `Clear` | `清空` |
| `promptPanel.recall.statusPerfect` | `PERFECT` | `完美` |
| `promptPanel.recall.statusPass` | `PASS` | `通过` |
| `promptPanel.recall.manualHeader` | `LAST MANUAL REGEX ({status} · {score})` | `上次手动 REGEX（{status} · {score}）` |
| `promptPanel.recall.manualExpandHint` | `click to view` | `点击查看` |

---

## 8. 边界情况

| 情况 | 处理 |
|---|---|
| 关卡从未通关（只有 fail） | `recall = undefined` → 输入框空白；不显示 chip |
| 关卡完全没有任何尝试 | 同上 — 空白 |
| 玩家执行 reset progress 后回到该关 | `getBestAttempt` 返回 undefined → 空白（自然行为，无需特别处理） |
| 玩家用空 prompt 通关（理论上不可能，但兜底） | `recall.prompt = ''` → 输入框空，chip 仍显示分数与"manual mode"提示 |
| 玩家在 manual 模式下通关 | 输入框不预填；显示折叠的"LAST MANUAL REGEX"卡片 |
| 上次 prompt 包含特殊字符（换行、emoji） | 直接 setValue 到 textarea，浏览器正常处理；不做任何转义 |
| 上次 prompt 比 textarea 高度长很多 | textarea 自适应高度（已有 CSS 行为），无额外处理 |
| 上次 prompt 的语言与当前 UI 语言不同 | 仍按原文显示（这是玩家自己写的内容，不应被翻译/改动） |
| 玩家修改 recall 内容后未提交就切换关卡 | 修改丢失；下次回来再恢复到 best 答案。这是符合直觉的"回放视图"语义 |
| 同一关有多次 perfect | 取分数最高的；分数相同时取最早的（`getBestAttempt` 现有行为） |

---

## 9. 测试要点

| 测试项 | 验证 |
|---|---|
| 通关 level_01 后再次打开 | 输入框预填上次 prompt；上方显示 RECALL chip + 分数 |
| 通关 level_01 (perfect) 后切到 level_02 再切回 | recall 仍展示（数据驱动，非会话状态） |
| 同一关多次提交，每次分数更高 | recall 始终展示最高分那次的内容 |
| 关卡只有 fail 尝试 | 输入框空白；不显示 chip |
| 点击"清空"按钮 | 输入框清空、chip 消失；切走再切回 chip 重新出现 |
| Manual 模式通关 | 输入框不预填；折叠卡片显示 regex；展开后能看到全文 |
| reset progress 后回到关卡 | recall 不出现（与首次访问一致） |
| 在已通关的关卡基于 recall 提交得到更高分 | 下次再来 recall 显示新最高分 |
| 在已通关的关卡基于 recall 提交得到更低分 | recall 仍显示历史最高分 |
| 在已通关的关卡基于 recall 提交失败 | recall 不变；走正常 fail 流程 |
| 中英文 prompt 混排 | 完整保留显示，无乱码 |
| 切换语言 | recall chip 文案随之切换；prompt 内容（玩家原文）不变 |

---

## 10. 实施阶段

### Phase 1 — 数据通道（P0）

1. 扩展 `LevelRecall` 类型 + `loadLevel` 消息字段（extension + webview-ui 两端 `messages.ts`）。
2. `promptPanelProvider.loadLevel()` 注入 recall。
3. PromptPanel 接收并 setState。

### Phase 2 — 视觉（P0）

1. RECALL chip 组件 + 样式（cockpit-amber 风格）。
2. Manual-mode 折叠卡片。
3. "清空"按钮逻辑。
4. i18n keys。

### Phase 3 — 打磨（P2，可选）

1. recall chip 出现时的小型 "decoded" 动画（0.3s 字符闪现）。
2. 当 best 尝试是 perfect 时，输入框边框微金色高光。
3. 长 prompt（>200 字符）的折叠展开。

初版实现 Phase 1 + Phase 2 即可。

---

## 11. 与玩家心智模型的契合

| 玩家直觉 | 设计如何匹配 |
|---|---|
| "我之前通过了这关，应该能看到当时怎么做的" | 自动展示最佳答案 |
| "我重置了进度，所有东西都应该归零" | 数据源就是 `gameState`，重置后 `getBestAttempt` 自然返回 undefined |
| "我想再尝试一次但不要被旧答案干扰" | 一键"清空" |
| "我想看完整尝试历史" | 已有命令 `YourEx: Prompt Replay` |
| "证书上的最终答案是哪一次提交" | 与 PromptPanel recall 同源 — 完全一致 |

> **核心原则**：UI 是 GameState 的直接投影；不引入隐藏会话状态。

