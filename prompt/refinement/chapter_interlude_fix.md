# Chapter Interlude 触发 & 过渡修复计划

## 问题描述

### 问题 1：剧情重复触发（已通过 globalState 解决，但需确认）

设计意图：每个 chapter interlude 只在**首次进入该章第一关**时触发一次。之后再进入同一关不再触发。

当前实现已通过 `globalState` key `yourex.ch{N}InterludeSeen` 标记。逻辑正确，无需修改。

回顾剧情的方式：
- 重置进度（清除所有 seen 标记）
- 命令面板 `YourEx: Show Chapter Interlude`（传入 chapterId 参数）

### 问题 2：剧情完成后 Map 和主界面未跳转到新章节

**现象**：Ch1 最后一关（level_05）完成后，玩家触发 Ch2 interlude，点击「接受测试」按钮。此时：
- interlude 面板关闭
- promptPanel 加载了 level_06
- **但 Mission Map 侧边栏仍高亮 level_05**
- **sidebar tree 没有刷新为 Ch2 状态**

**根因**：`onDidComplete` 回调中只调用了 `promptPanel.show(levelId)`，没有调用 `refreshUI()` 来同步侧边栏和 Mission Map 的状态。

---

## 修复方案

### Fix 1：onDidComplete 后调用 refreshUI()

在 `src/extension.ts` 中，chapter interlude 的 `onDidComplete` 回调和 ch6 interlude 的 `onDidComplete` 回调中，都需要在 `promptPanel.show(levelId)` 之后调用 `refreshUI()`。

```typescript
// Chapter 2-5 interlude gate
const disposable = chapterInterludeProvider.onDidComplete(() => {
  disposable.dispose();
  void context.globalState.update(key, true);
  gameState.startTimer();
  promptPanel.show(levelId);
  refreshUI();  // <-- 新增：同步 sidebar + map
});

// Chapter 6 interlude gate
const disposable = ch6InterludeProvider.onDidComplete(() => {
  disposable.dispose();
  void context.globalState.update('yourex.ch6InterludeSeen', true);
  gameState.startTimer();
  promptPanel.show(levelId);
  refreshUI();  // <-- 新增：同步 sidebar + map
});
```

### Fix 2：确保 refreshUI 在 promptPanel.show 之后能拿到正确的 currentLevelId

`refreshUI()` 调用 `missionMapProvider.setActiveLevel(promptPanel.getCurrentLevelId())`。由于 `promptPanel.show(levelId)` 内部同步调用 `loadLevel`（同步设置 `this._currentLevel`），所以紧跟其后的 `refreshUI()` 能正确读到新 level。无需额外处理。

---

## 实施清单

- [x] 确认 globalState seen 标记逻辑正确（已正确）
- [x] `src/extension.ts`：Ch2-5 interlude `onDidComplete` 回调添加 `refreshUI()`
- [x] `src/extension.ts`：Ch6 interlude `onDidComplete` 回调添加 `refreshUI()`
- [x] 验证编译通过
