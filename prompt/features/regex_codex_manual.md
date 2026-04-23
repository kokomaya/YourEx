# Regex Codex 手册设计书

## 1. 目标

为活动场景提供一份单页、快速查阅的正则表达式参考手册（Codex），降低用户在限时活动中的查询负担。

## 2. 交互方式

- **入口**：PromptPanel 中的 `Manual` 按钮
- **打开位置**：在主面板右侧并排打开（`ViewColumn.Beside`），焦点保留在 PromptPanel，不打断答题
- **复用面板**：已打开时点击 Manual 只 reveal 不重复创建
- **命令面板**：`YourEx: Regex Codex` 也可直接打开

## 3. 页面结构

单页滚动，无 tab 切换。内容以紧凑三列表格（模式 / 说明 / 示例）分 8 个区块展示：

| 区块 | 内容 |
|---|---|
| 基础模式 | `.` `\d` `\D` `\w` `\W` `\s` `\S` |
| 锚点 | `^` `$` `\b` `\B` |
| 量词 | `*` `+` `?` `{n}` `{n,}` `{n,m}` 非贪婪 |
| 字符类 | `[abc]` `[^abc]` `[a-z]` |
| 分组与引用 | `()` `(?:)` `(?<name>)` `\1` `\k<name>` |
| 环视断言 | `(?=)` `(?!)` `(?<=)` `(?<!)` |
| 修饰符 | `i` `g` `m` `s` |
| 高级语法 | `(?R)` 条件匹配 `\K` |

## 4. 文件结构

```
webview-ui/src/components/Codex/
  index.tsx        — React 组件，数据定义 + 渲染
  Codex.css        — 科幻风格样式

src/ui/webview/
  codexProvider.ts — Extension 端 WebviewPanel 管理
```

## 5. 关键实现

| 模块 | 说明 |
|---|---|
| `CodexProvider` | 管理 WebviewPanel 生命周期，`ViewColumn.Beside` + `preserveFocus: true` |
| `Codex` 组件 | 纯展示，所有 section 一次性渲染，无状态 |
| `WebViewType` | 新增 `'codex'` 类型，`App.tsx` 路由到 `<Codex />` |
| i18n | 中英双语，约 50 个翻译 key（区块标题 + 每条说明） |
| Manual 按钮 | 发送 `openCodex` 消息，`promptPanelProvider` 转发 `yourex.openCodex` 命令 |

## 6. 视觉风格

与游戏整体科幻主题一致：深色背景、扫描线动画、青色/琥珀色配色、Courier 等宽字体、半透明边框。窄屏时隐藏示例列保持可读性。
