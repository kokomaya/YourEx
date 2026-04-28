# Reset Game Progress 设计书

## 1. 目标

为 YourEx 增加"重置游戏进度"功能：玩家可以从设置/菜单/命令面板中清除全部本地游玩记录（关卡完成、XP、连击、成就、解锁状态、证书状态、玩家名等），让游戏回到首次安装时的初始状态。

核心价值：

1. **可重玩性** — 老玩家想重新体验完整剧情（包括 Welcome → Ch1 → Ch6）时不必卸载重装。
2. **数据补救** — 当历史存档因为旧版本字段缺失（例如老存档没有 `certificateUnlocked` 字段）导致解锁判定失效时，可以一键重置后重新通关解锁。
3. **多人共用** — 同一台机器换玩家、调试、演示时快速清场。
4. **隐私** — 玩家可以彻底清除本地存留的 prompt 历史等。

---

## 2. 触发与入口

### 2.1 入口位置

| 位置 | 显示条件 | 文案 | 优先级 |
|---|---|---|---|
| 命令面板 | 始终可用 | `YourEx: Reset Game Progress` | P0 |
| Mission Map 侧边栏底部 | `gameState.totalAttempts > 0`（即玩过游戏） | 小图标按钮 `🗑️ 重置进度` | P0 |
| Welcome 界面 | 仅当 `state.startTime !== null`（已经初始化过游戏） | 次级链接 `重置存档并重新开始` | P1 |
| 设置（VS Code Settings） | 始终 | 仅作为说明文字提示玩家从命令面板执行（VS Code 不支持配置项触发命令） | — |

为什么不放进游戏内的 PromptPanel：会让"破解关卡"的核心心流被破坏；重置是低频高破坏性操作，应该放在工具/菜单类入口。

### 2.2 命令注册

在 `package.json` 的 `contributes.commands` 新增：

```json
{
  "command": "yourex.resetProgress",
  "title": "Reset Game Progress",
  "category": "YourEx"
}
```

---

## 3. 二次确认（Two-step Confirm）

重置是**不可恢复**的破坏性操作，必须强制二次确认。

### 3.1 第一步：警示对话框

使用 `vscode.window.showWarningMessage` 弹出模态对话框：

| 字段 | 中文 | 英文 |
|---|---|---|
| 标题 | "⚠️ 重置游戏进度？" | "⚠️ Reset Game Progress?" |
| 详情 | "这会**永久删除**所有关卡记录、XP、成就、证书与玩家名等本地数据。此操作不可恢复。" | "This will **permanently erase** all level records, XP, achievements, certificate state, and the saved player name. This cannot be undone." |
| 按钮 1（破坏性） | `重置` | `Reset` |
| 按钮 2 | `取消` | `Cancel` |

VS Code API：

```ts
const confirmed = await vscode.window.showWarningMessage(
  t('reset.confirmTitle'),
  { modal: true, detail: t('reset.confirmDetail') },
  t('reset.confirmButton'),
);
if (confirmed !== t('reset.confirmButton')) return;
```

### 3.2 第二步：输入确认（仅当玩家有重要进度时）

只有当玩家通关数 `getCompletedLevelIds().length >= 5`（即至少完成第一章），才追加一道输入确认，避免重要进度因误点丢失：

```ts
const typed = await vscode.window.showInputBox({
  prompt: t('reset.typePrompt'),                 // "输入 RESET 以确认"
  placeHolder: 'RESET',
  validateInput: (v) => v === 'RESET' ? null : t('reset.typeError'),
});
if (typed !== 'RESET') return;
```

进度低于 5 关时跳过这一步——新手很可能只是想清场重玩，强制输入会显得过度。

---

## 4. 重置范围

### 4.1 清除内容（必须）

| 数据 | 存储位置 | 处理 |
|---|---|---|
| `gameState`（完整 GameState） | `globalState['yourex.gameState']` | 调用 `gameState.reset()`，回到 `DEFAULT_GAME_STATE` |
| Ch6 过场已观看标记 | `globalState['yourex.ch6InterludeSeen']` | 设为 `undefined` |
| 证书 ID（`state.certificateId`） | `gameState` 内部字段 | 随 `reset()` 一并清除 |
| 证书玩家名（`state.certificatePlayerName`） | `gameState` 内部字段 | 随 `reset()` 一并清除 |
| 证书解锁标记（`state.certificateUnlocked`） | `gameState` 内部字段 | 随 `reset()` 一并清除 |
| 提示系统的"已查看提示"记录 | `HintTracker` 内存状态 + 持久化（如有） | 重新实例化 `HintTracker` |

### 4.2 不清除的内容（保留）

| 数据 | 理由 |
|---|---|
| `yourex.language`（语言设置） | 这是**用户偏好**，不是游戏进度。重置不应改变界面语言。 |
| `yourex.mode.*`（运行模式） | 同上，开发者模式开关属于偏好。 |
| `yourex.visual.*`（视觉效果偏好） | 同上。 |
| 任何 `vscode.workspace.getConfiguration()` 下的设置 | 同上。 |

判断准则：**只清除 `globalState` 里属于游戏进度的 key，不动 VS Code Settings**。

---

## 5. 重置后的副作用

完成重置后，按顺序执行：

1. **关闭所有打开的游戏 Webview** — PromptPanel、Reward 弹层、Leaderboard、Codex、Ch6Interlude、Certificate。理由：它们持有的 React 状态可能还引用旧数据，强制重新打开能避免显示错乱。
   ```ts
   promptPanel.dispose();
   leaderboardProvider.dispose();
   codexProvider.dispose();
   ch6InterludeProvider.dispose();
   certificateProvider.dispose();
   ```
2. **刷新侧边栏** — `refreshUI()`，让 Mission Map 立刻反映清零后的状态（所有节点回到锁定/可用初始态）。
3. **更新状态栏** — XP/Combo/Decrypt 全部归零。
4. **弹出 Welcome 界面** — `welcomeProvider.show()`。让玩家立即看到"从头开始"的视觉提示，与首次安装的体验一致。
5. **显示成功通知**：
   ```
   [YourEx] 游戏进度已重置。准备好开启新的旅程了吗？
   ```

---

## 6. 边界情况

| 情况 | 处理 |
|---|---|
| 玩家正在某关 PromptPanel 中点击重置 | 按 §5 关闭面板，不弹出 prompt 失败提示。 |
| 玩家在 Reward 完成动画中点击重置 | 同上，强制 dispose。 |
| 玩家点 "取消" 后再点重置 | 重新走完整 §3 二次确认流程。 |
| 输入框第二步输错（如 `reset` 小写） | 用 `validateInput` 实时报错；玩家可以继续修改而不会立即清除。 |
| 重置过程中扩展崩溃 | `gameState.reset()` 内部已经持久化清空状态；下次启动从空白开始，不会留半残数据。 |
| 玩家用开发者模式重置 | 模式不变（保留偏好），但所有进度清零。 |
| 在禁用 modal 弹窗的 CI/远程环境 | `showWarningMessage({modal:true})` 会自动降级为普通通知；这是 VS Code API 的默认行为，可接受。 |

---

## 7. i18n Keys

新增到 `src/data/ui/{en,zh-CN}.json`：

| Key | 英文 | 中文 |
|---|---|---|
| `reset.commandTitle` | `Reset Game Progress` | `重置游戏进度` |
| `reset.confirmTitle` | `⚠️ Reset Game Progress?` | `⚠️ 重置游戏进度？` |
| `reset.confirmDetail` | `This will permanently erase all level records, XP, achievements, certificate state, and the saved player name. This cannot be undone.` | `这会永久删除所有关卡记录、XP、成就、证书与玩家名等本地数据。此操作不可恢复。` |
| `reset.confirmButton` | `Reset` | `重置` |
| `reset.cancelButton` | `Cancel` | `取消` |
| `reset.typePrompt` | `Type RESET to confirm.` | `输入 RESET 以确认` |
| `reset.typeError` | `Type RESET (uppercase) to confirm.` | `请输入大写 RESET 以确认` |
| `reset.successNotification` | `[YourEx] Game progress reset. Ready for a new journey?` | `[YourEx] 游戏进度已重置。准备好开启新的旅程了吗？` |
| `reset.sidebarButton` | `🗑️ Reset Progress` | `🗑️ 重置进度` |
| `reset.sidebarTooltip` | `Erase all local game data and start over` | `清除全部本地游戏数据，重新开始` |
| `reset.welcomeLink` | `Reset save and start over` | `重置存档并重新开始` |

---

## 8. 技术实现位置（仅说明，**不做实现**）

```
src/state/gameState.ts          ← 已有 reset()，可能需要新增 clearTransientPersistence() 清理 ch6InterludeSeen 等
src/extension.ts                ← 注册 yourex.resetProgress 命令；编排副作用（dispose 所有 provider、刷新 UI、显示 Welcome）
src/ui/sidebar/missionMap/
  MissionMapProvider.ts         ← 在底部添加 🗑️ 按钮（与证书按钮风格相近，但更克制——使用次级颜色而非渐变）
  mapMessages.ts                ← 新增 webview→ext 消息 'requestResetProgress'
webview-ui/src/components/
  Welcome/index.tsx             ← 在 Welcome 页底部添加 "重置存档" 链接（仅当 state.startTime !== null）
package.json                    ← 新增命令注册
src/data/ui/{en,zh-CN}.json     ← 新增 reset.* keys
```

---

## 9. 用户流程

```
[玩家点 "🗑️ 重置进度"（侧边栏 / 命令面板 / Welcome 链接）]
       │
       ▼
[第一步：模态警示对话框 "⚠️ 重置游戏进度？"]
       │
       ├─ 取消 → 结束
       │
       ▼
[（仅当通关数 ≥ 5）第二步：输入框 "输入 RESET 以确认"]
       │
       ├─ 输入错误 / 取消 → 结束
       │
       ▼
[执行 gameState.reset() + 清理 ch6InterludeSeen + 重新实例化 HintTracker]
       │
       ▼
[关闭所有游戏 Webview（promptPanel / reward / certificate / etc.）]
       │
       ▼
[refreshUI()：侧边栏归零、状态栏归零、证书入口隐藏]
       │
       ▼
[弹出 Welcome 界面]
       │
       ▼
[显示成功通知 "[YourEx] 游戏进度已重置。"]
```

---

## 10. 测试要点

| 测试项 | 验证 |
|---|---|
| 命令面板执行 → 弹出确认 → 取消 | 进度不变 |
| 命令面板执行 → 确认 → 输入 RESET → 完成 | `gameState.state` 等于 `DEFAULT_GAME_STATE`，`ch6InterludeSeen` 已清除 |
| 通关数 < 5 时不弹出第二步输入确认 | UX 简化生效 |
| 重置后侧边栏 Mission Map 显示初始锁定状态 | 解锁状态归零 |
| 重置后状态栏 XP / 连击 / 解密率全部为 0 | 状态栏 hook 收到刷新 |
| 重置后证书入口（侧边栏 📜 按钮）隐藏 | `certificateUnlocked` 已清除 |
| 重置后再次进入 Ch6 触发 Ch6 过场（首次效果） | `ch6InterludeSeen` 已清除 |
| 重置后语言/视觉/模式偏好保留 | VS Code Settings 未被改动 |
| PromptPanel 打开时执行重置 | 面板被关闭，无残留 React 状态 |
| 重置后 `os.userInfo().username` 默认玩家名重新生效 | 自定义玩家名已清除 |
| 重置后再次通关 level_25 → 证书入口重新出现 | 整套触发链路与首次通关一致 |

---

## 11. 实施阶段（建议）

### Phase 1 — 命令 + 二次确认（P0）

1. 注册 `yourex.resetProgress` 命令
2. 实现 `gameState.reset()` 之外需要清理的额外 globalState key（如 `ch6InterludeSeen`）
3. 编排副作用：dispose 所有 provider、`refreshUI()`、显示 Welcome、通知
4. i18n keys 添加

### Phase 2 — 入口扩展（P1）

1. Mission Map 侧边栏底部 "🗑️" 按钮 + 消息
2. Welcome 页底部 "重置存档" 链接

### Phase 3 — 打磨（P2）

1. 在通知中附加 "撤销" 按钮（30 秒内可还原）——可选高级特性，需要在重置前快照旧 `gameState` 到内存
2. 在重置前导出存档为 JSON（`yourex.exportSave`，作为单独命令；与重置无强耦合）

Phase 3 为可选，初版只做 Phase 1 + Phase 2 即可满足核心诉求。

---

## 12. 与现有功能的关系

| 现有功能 | 重置后行为 |
|---|---|
| Journey Certificate（数据驱动解锁） | `certificateUnlocked = false`，证书入口立即隐藏，再次通关 level_25 后重新解锁。证书 ID 也会重新生成。 |
| Ch6 Interlude | 过场重新可见。 |
| Achievement Manager | 全部解锁记录清空。 |
| Hint Tracker | 失败计数 / 已查看提示清零，与全新关卡一致。 |
| Mode Service（用户/开发者模式） | 不受影响，保留当前模式。 |
| Leaderboard | 排行榜来源是当前 `gameState`，重置后自动变空。 |

这种设计保证了"重置 = 时光倒流到未玩过的状态"这一直觉模型。
