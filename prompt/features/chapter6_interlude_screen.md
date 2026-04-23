# Chapter 6 Interlude Screen 设计书

## 1. 目标

在第五章全部通关（level_25 完成）后、第六章（ch6-origin）打开之前，插入一个过场环境界面。

该界面承接第五章结局剧情（引擎损毁、rEx 提供新动力），并为第六章（协议适配、回家）埋下伏笔，形成完整叙事弧线。

---

## 2. 触发逻辑

| 事件 | 行为 |
|---|---|
| Ch5 全部关卡完成，玩家首次触发 Ch6 | 自动弹出过场界面 |
| 已看过过场界面后触发 Ch6 | 直接打开 level_26，跳过过场 |
| 命令面板手动调出 | `YourEx: Show Chapter 6 Interlude`，任何时候可手动重新查看 |

触发检测逻辑：使用 `globalState` 存储布尔 key `yourex.ch6InterludeSeen`，首次展示后设置为 `true`。

---

## 3. 剧情内容

### 3.1 故事脉络承接

- **前情（level_25 onPerfect）**：
  > "rEx 空间站向 Meridian-7 张开了臂膀。燃料补充中……但引擎已彻底损毁。rEx 说：'我们可以给你一颗新的心脏——但你需要让它跳动。'"

- **过场剧情**：你已完全解译 rEx 的语言。rEx 星球的工程师们拆下了一颗来自深空的外星动力晶核，将它嵌入 Meridian-7 的核心舱。引擎重新跳动——但飞船的人类操作系统无法读取外星模块的通信协议。所有启动日志都是 rEx 帧格式，诊断总线、点火序列、系统自检全部静默。你必须在出发前完成最后一次协议适配——让人类飞船与外星引擎真正同步。

- **后续（level_26 story）**：
  > "rEx 空间站为 Meridian-7 更换了外星动力模块，但飞船的人类系统无法与之通信。启动日志中充斥着来自外星硬件的 rEx 协议帧……你必须从这堆混杂的日志中提取出唯一合法的起源帧，完成协议适配，让人类飞船与外星引擎同步。这是回家前的最后一步。"

---

### 3.2 Boot Lines（逐行打字机）

共 10 行，模拟飞船系统日志输出：

```
> [SYS] Meridian-7 core systems online.
> [NAV] Plotting course: HOME — distance 4.7 light-hours.
> [ENG] Primary drive: CRITICAL FAILURE — combustion core destroyed.
> [rEx-LINK] Station handshake accepted.
> [rEx-LINK] Alien power module XT-CORE/77 received.
> [ENG] Installing XT-CORE/77 to drive bay... done.
> [ENG] Ignition sequence initiated.
> [ENG] Drive online. Output: 118% nominal. ✓
> [SYS] Warning: alien-human protocol mismatch detected.
> [DIAG] All diagnostic buses reporting rEx frame format. Adaptation required.
```

---

### 3.3 核心揭示文字（REX_REVEAL 风格）

```
  A L I G N M E N T   R E Q U I R E D
```

大标题，打字机淡入，居中。

---

### 3.4 Story Lines（剧情段落）

共 5 行，叙事感强：

```
你解译了所有信号。
rEx 星球回馈了它最深处的礼物——一颗外星引擎的心脏。
它在跳动。但它不说人类的语言。
协议帧在日志中涌动，等待被读懂。
最后一次对齐，然后——回家。
```

---

### 3.5 按钮

| 按钮 | 文字 | 行为 |
|---|---|---|
| 主按钮 | `BEGIN ADAPTATION` | 关闭过场界面，打开 level_26 |

---

## 4. 视觉设计

仿照欢迎界面（`Welcome/index.tsx`），复用同一套组件体系：

| 元素 | 设置建议 |
|---|---|
| `chapterId` | `6`（触发第六章视觉主题） |
| `flightPhase` | `cruise`（引擎已重启，飞行中） |
| `cockpitAlert` | `warning`（协议不匹配警告状态） |
| `stateHint` | `loading`（适配进行中） |
| 主色调 | 深橙/琥珀，区别于欢迎界面的蓝绿冷调，暗示「陌生、过渡」 |

CSS 类可直接复用 `Welcome.css`，组件命名为 `Ch6Interlude`。

---

## 5. 文件结构

```
webview-ui/src/components/Ch6Interlude/
  index.tsx          — React 组件（仿 Welcome/index.tsx，仅替换台词与视觉参数）
  Ch6Interlude.css   — 样式（可直接 @import Welcome.css 或复制一份）

src/ui/webview/
  ch6InterludeProvider.ts  — Extension 端 WebviewPanel 管理（仿 welcomeProvider.ts）

src/extension.ts
  — 注册命令 yourex.showCh6Interlude
  — 修改 yourex.openLevel('level_26') 逻辑：首次触发时先展示过场，再打开关卡
```

---

## 6. i18n Keys

新增 key 位于 `webview-ui/src/i18n/locales/en.json` 与 `zh-CN.json` 的 `ch6Interlude` 命名空间：

| Key | 英文 | 中文 |
|---|---|---|
| `ch6Interlude.title` | `MERIDIAN-7 SYSTEM LOG` | `MERIDIAN-7 系统日志` |
| `ch6Interlude.boot.line1` | `[SYS] Meridian-7 core systems online.` | `[SYS] Meridian-7 核心系统上线。` |
| `ch6Interlude.boot.line2` | `[NAV] Plotting course: HOME — 4.7 light-hours.` | `[NAV] 导航计算中：HOME — 4.7 光时。` |
| `ch6Interlude.boot.line3` | `[ENG] Primary drive: CRITICAL FAILURE.` | `[ENG] 主引擎：严重故障——燃烧核心已损毁。` |
| `ch6Interlude.boot.line4` | `[rEx-LINK] Station handshake accepted.` | `[rEx-LINK] 空间站握手成功。` |
| `ch6Interlude.boot.line5` | `[rEx-LINK] Alien power module XT-CORE/77 received.` | `[rEx-LINK] 外星动力模块 XT-CORE/77 已接收。` |
| `ch6Interlude.boot.line6` | `[ENG] Installing XT-CORE/77 to drive bay... done.` | `[ENG] 安装 XT-CORE/77 至驱动舱……完成。` |
| `ch6Interlude.boot.line7` | `[ENG] Ignition sequence initiated.` | `[ENG] 点火序列启动。` |
| `ch6Interlude.boot.line8` | `[ENG] Drive online. Output: 118% nominal. ✓` | `[ENG] 引擎上线。输出：额定值 118%。✓` |
| `ch6Interlude.boot.line9` | `[SYS] Warning: alien-human protocol mismatch detected.` | `[SYS] 警告：检测到外星-人类协议不兼容。` |
| `ch6Interlude.boot.line10` | `[DIAG] All diagnostic buses reporting rEx frame format.` | `[DIAG] 所有诊断总线均报告 rEx 帧格式。需适配。` |
| `ch6Interlude.reveal` | `A L I G N M E N T   R E Q U I R E D` | `A L I G N M E N T   R E Q U I R E D` |
| `ch6Interlude.story.line1` | `You have decoded every signal.` | `你解译了所有信号。` |
| `ch6Interlude.story.line2` | `The rEx planet gave back its deepest gift — an alien engine core.` | `rEx 星球回馈了它最深处的礼物——一颗外星引擎的心脏。` |
| `ch6Interlude.story.line3` | `It beats. But it does not speak human.` | `它在跳动。但它不说人类的语言。` |
| `ch6Interlude.story.line4` | `Protocol frames surge through the logs, waiting to be understood.` | `协议帧在日志中涌动，等待被读懂。` |
| `ch6Interlude.story.line5` | `One final alignment — then home.` | `最后一次对齐，然后——回家。` |
| `ch6Interlude.startButton` | `BEGIN ADAPTATION` | `开始协议适配` |

---

## 7. 状态持久化

- `globalState` key：`yourex.ch6InterludeSeen: boolean`
- 过场界面关闭（点击按钮或主动关闭面板）时设为 `true`
- 手动命令 `yourex.showCh6Interlude` 无视此标志，强制展示

---

## 8. 开发优先级

| 任务 | 优先级 |
|---|---|
| React 组件 + CSS | P0 |
| ch6InterludeProvider.ts | P0 |
| openLevel 逻辑修改（首次触发判断） | P0 |
| i18n key 添加 | P0 |
| 命令注册（手动调出） | P1 |
| 视觉主题精调 | P2 |
