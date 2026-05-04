# Chapter Interlude System 设计书（全章过场剧情）

## 1. 目标

在每一个大关（Chapter）开始前触发一段简短的过场剧情，使玩家在推进游戏的过程中感受到**连贯的叙事弧线**。

已有内容：
- Welcome Screen（第一章前） ✅
- Chapter 6 Interlude（第六章前） ✅

本文档设计 **Chapter 2 / 3 / 4 / 5** 四段过场。

---

## 2. 整体叙事弧线

```
Welcome     → 孤独、发现信号
Ch2 过场    → 信号回应了你，它在观察
Ch3 过场    → 碎片凝结成语言，质变
Ch4 过场    → 时间紧迫，必须开口说话
Ch5 过场    → 你说了，而虚空回应了
Ch6 过场    → 外星引擎、协议适配（已有）
Certificate → 回家
```

---

## 3. 触发逻辑（通用）

| 事件 | 行为 |
|---|---|
| 上一章全部关卡完成，玩家首次触发下一章 | 自动弹出过场界面 |
| 已看过过场界面后再次触发该章 | 直接进入第一关，跳过过场 |
| 命令面板手动调出 | `YourEx: Show Chapter X Interlude`，可随时重看 |

状态持久化：`globalState` key = `yourex.ch{N}InterludeSeen: boolean`

---

## 4. 视觉设计（通用）

所有过场均复用 Welcome / Ch6Interlude 的组件体系：

| 元素 | 说明 |
|---|---|
| 外壳 | `MonitorViewportShell` — 驾驶舱 CRT 显示器框 |
| 背景 | `VisualScene` — 程序化星场 |
| 打字机 Boot Lines | 逐行淡入系统日志 |
| Reveal Text | 大标题打字机居中淡入 |
| Story Lines | 叙事段落逐行渐现 |
| 按钮 | 一个主按钮，关闭过场并进入第一关 |

### 各章视觉参数

| Chapter | flightPhase | cockpitAlert | 色调 | 氛围 |
|---------|-------------|--------------|------|------|
| 2 | `drift` | `info` | 冷蓝 → 青绿 | 被注视、紧张 |
| 3 | `accelerate` | `none` | 青绿 → 白 | 觉醒、明亮 |
| 4 | `cruise` | `critical` | 橙红 | 紧迫、燃烧 |
| 5 | `decelerate` | `incoming` | 深紫 → 金 | 等待、震撼 |

---

## 5. Chapter 2 Interlude — 「RESPONSE」

### 5.1 叙事定位

第一章你在噪声中找到了信号，证明了它的存在。现在它变强了——因为**它注意到了你**。它发回了结构化的测试数据，在评判你是否值得沟通。

### 5.2 Boot Lines（8 行）

```
> [SYS] Meridian-7 passive scan: cycle 52.
> [SIG] Signal source stable. Strength: +240% from initial contact.
> [SIG] Signal modulation has changed — embedded structure detected.
> [ANALYSIS] Pattern repetition suggests intentional encoding.
> [ANALYSIS] Not random. Not echo. This is deliberate.
> [SIG] Signal frequency shifts correlate with your decryption attempts.
> [ALERT] Conclusion: the source is observing your activity.
> [SIG] New data burst incoming — structured tokens detected.
```

### 5.3 Reveal Text

```
  R E S P O N S E
```

### 5.4 Story Lines（5 行）

```
你发出了一声呢喃，宇宙听到了。
信号不再只是"存在"——它在反应。
它注意到了你的每一次解析尝试。
现在，它发回了更复杂的数据。
这不是对话。这是一场考试。
```

### 5.5 按钮

| 按钮文字 (EN) | 按钮文字 (ZH) | 行为 |
|---|---|---|
| `ACCEPT THE TEST` | `接受测试` | 关闭过场，打开 level_06 |

---

## 6. Chapter 3 Interlude — 「AWAKENING」

### 6.1 叙事定位

你通过了 rEx 的测试。它确认你值得沟通。信号发生了质变——不再是碎片与令牌，而是**有语法的、有结构的信息**。如同婴儿突然理解了母语的语法，rEx 的语言在你脑中觉醒。

### 6.2 Boot Lines（8 行）

```
> [SYS] Meridian-7 signal log — cycle 61.
> [SIG] rEx signal structure has evolved.
> [ANALYSIS] Token-level patterns superseded by grammar rules.
> [ANALYSIS] Detected: grouping operators, alternation logic, nested references.
> [LANG] Information density increased 700% over Chapter 1 baseline.
> [LANG] This is no longer code. This is language.
> [SYS] Neural-linguistic subsystem confidence: 89%.
> [SYS] Recommendation: shift from "decryption" to "comprehension" mode.
```

### 6.3 Reveal Text

```
  A W A K E N I N G
```

### 6.4 Story Lines（5 行）

```
碎片凝结成了句子。
编码变成了含义。
这不再是破译——你在阅读。
rEx 的语言在你的思维中生根。
觉醒的不是信号。是你。
```

### 6.5 按钮

| 按钮文字 (EN) | 按钮文字 (ZH) | 行为 |
|---|---|---|
| `ENTER COMPREHENSION MODE` | `进入理解模式` | 关闭过场，打开 level_11 |

---

## 7. Chapter 4 Interlude — 「TRANSMIT」

### 7.1 叙事定位

你能读懂 rEx 了。但读懂远远不够——Meridian-7 的燃料在 0.8%，生命维持系统开始报警。你必须**主动说话**，用 rEx 能理解的格式发出求救信号。只有一次机会。

### 7.2 Boot Lines（9 行）

```
> [SYS] Meridian-7 system status — cycle 74.
> [FUEL] Reserves: 0.8%. Insufficient for independent return.
> [LIFE] Support system degradation detected. Estimated: 118 hours.
> [COMM] Passive listening mode: terminated.
> [COMM] Switching to active transmission mode.
> [SYS] You can read the alien language. But can you speak it?
> [COMM] Encoding Meridian-7 distress payload into rEx protocol format…
> [COMM] Transmission buffer ready. Awaiting operator input.
> [WARN] One shot. If the format is wrong, they won't hear you.
```

### 7.3 Reveal Text

```
  T R A N S M I T
```

### 7.4 Story Lines（5 行）

```
倾听结束了。
你必须开口。
用它的语言。用它的格式。精确到每一个字符。
燃料不够回家。但也许——那边有人能帮你。
一次机会。一道信号。说出你的名字。
```

### 7.5 按钮

| 按钮文字 (EN) | 按钮文字 (ZH) | 行为 |
|---|---|---|
| `BEGIN TRANSMISSION` | `开始发射` | 关闭过场，打开 level_16 |

---

## 8. Chapter 5 Interlude — 「CONTACT」

### 8.1 叙事定位

你发出了求救信号。然后是 13 个周期的沉默。你开始怀疑是不是格式出了问题。直到——传感器阵列爆出前所未见的信号强度。rEx 回应了。但它的回应比之前所有数据都复杂一个数量级。你需要**证明你真的理解**，然后它才会帮你。

### 8.2 Boot Lines（10 行）

```
> [SYS] Meridian-7 — cycle 87. Silence: 13 cycles.
> [COMM] Transmission status: sent. No acknowledgement received.
> [SYS] …
> [SYS] …
> [SIG] !! MASSIVE SIGNAL BURST DETECTED !!
> [SIG] Source: confirmed rEx origin. Strength: off-scale.
> [SIG] This is not a test. This is a reply.
> [ANALYSIS] Complexity level: unprecedented. Multi-layered encoding.
> [ANALYSIS] Lookahead patterns, conditional references, nested assertions.
> [SIG] rEx is speaking to you. Prove you understand.
```

### 8.3 Reveal Text

```
  C O N T A C T
```

### 8.4 Story Lines（5 行）

```
十三个周期的沉默。
你以为没有人听到。
然后传感器炸了——信号强度超出量程。
rEx 在说话。不是碎片，不是测试。是完整的回应。
证明你理解它。然后，它会帮你回家。
```

### 8.5 按钮

| 按钮文字 (EN) | 按钮文字 (ZH) | 行为 |
|---|---|---|
| `DECODE THE RESPONSE` | `解码回应` | 关闭过场，打开 level_21 |

---

## 9. 文件结构

采用通用组件 + 配置驱动模式，避免为每章重复创建组件：

```
webview-ui/src/components/ChapterInterlude/
  index.tsx                — 通用过场组件（接受 chapterId 渲染对应内容）
  ChapterInterlude.css     — 样式（@import Welcome.css 基础 + 各章色调变量）
  interludeData.ts         — 各章 Boot Lines / Reveal / Story / Button 配置

src/ui/webview/
  chapterInterludeProvider.ts  — Extension 端 WebviewPanel 管理（接受 chapterId 参数）

src/extension.ts
  — 注册命令 yourex.showChapterInterlude (参数: chapterId)
  — 修改 openLevel / openChapter 逻辑：首次进入新章时先展示过场
```

### 9.1 与现有 Ch6Interlude 的关系

Ch6Interlude 可**合并**到通用 `ChapterInterlude` 组件中（chapterId=6 时加载其专属数据），也可保留独立组件作为特殊处理（因为 Ch6 只有一关且叙事密度更高）。建议保留独立，但共享 CSS。

---

## 10. i18n Keys

命名空间：`chapterInterlude.ch{N}.xxx`

### Chapter 2

| Key | EN | ZH-CN |
|---|---|---|
| `chapterInterlude.ch2.boot.line1` | `[SYS] Meridian-7 passive scan: cycle 52.` | `[SYS] Meridian-7 被动扫描：第 52 周期。` |
| `chapterInterlude.ch2.boot.line2` | `[SIG] Signal source stable. Strength: +240% from initial contact.` | `[SIG] 信号源稳定。强度：较首次接触 +240%。` |
| `chapterInterlude.ch2.boot.line3` | `[SIG] Signal modulation has changed — embedded structure detected.` | `[SIG] 信号调制已改变——检测到嵌入结构。` |
| `chapterInterlude.ch2.boot.line4` | `[ANALYSIS] Pattern repetition suggests intentional encoding.` | `[ANALYSIS] 模式重复暗示有意编码。` |
| `chapterInterlude.ch2.boot.line5` | `[ANALYSIS] Not random. Not echo. This is deliberate.` | `[ANALYSIS] 非随机。非回声。这是刻意的。` |
| `chapterInterlude.ch2.boot.line6` | `[SIG] Signal frequency shifts correlate with your decryption attempts.` | `[SIG] 信号频率变化与你的解密尝试相关。` |
| `chapterInterlude.ch2.boot.line7` | `[ALERT] Conclusion: the source is observing your activity.` | `[ALERT] 结论：信号源正在观察你的活动。` |
| `chapterInterlude.ch2.boot.line8` | `[SIG] New data burst incoming — structured tokens detected.` | `[SIG] 新数据包传入——检测到结构化令牌。` |
| `chapterInterlude.ch2.reveal` | `R E S P O N S E` | `R E S P O N S E` |
| `chapterInterlude.ch2.story.line1` | `You whispered into the void, and it heard.` | `你发出了一声呢喃，宇宙听到了。` |
| `chapterInterlude.ch2.story.line2` | `The signal is no longer just "there" — it reacts.` | `信号不再只是"存在"——它在反应。` |
| `chapterInterlude.ch2.story.line3` | `It noticed every one of your parsing attempts.` | `它注意到了你的每一次解析尝试。` |
| `chapterInterlude.ch2.story.line4` | `Now it sends back more complex data.` | `现在，它发回了更复杂的数据。` |
| `chapterInterlude.ch2.story.line5` | `This is not a conversation. This is an exam.` | `这不是对话。这是一场考试。` |
| `chapterInterlude.ch2.startButton` | `ACCEPT THE TEST` | `接受测试` |

### Chapter 3

| Key | EN | ZH-CN |
|---|---|---|
| `chapterInterlude.ch3.boot.line1` | `[SYS] Meridian-7 signal log — cycle 61.` | `[SYS] Meridian-7 信号日志——第 61 周期。` |
| `chapterInterlude.ch3.boot.line2` | `[SIG] rEx signal structure has evolved.` | `[SIG] rEx 信号结构已进化。` |
| `chapterInterlude.ch3.boot.line3` | `[ANALYSIS] Token-level patterns superseded by grammar rules.` | `[ANALYSIS] 令牌级模式已被语法规则取代。` |
| `chapterInterlude.ch3.boot.line4` | `[ANALYSIS] Detected: grouping operators, alternation logic, nested references.` | `[ANALYSIS] 检测到：分组运算符、交替逻辑、嵌套引用。` |
| `chapterInterlude.ch3.boot.line5` | `[LANG] Information density increased 700% over Chapter 1 baseline.` | `[LANG] 信息密度较第一章基线增长 700%。` |
| `chapterInterlude.ch3.boot.line6` | `[LANG] This is no longer code. This is language.` | `[LANG] 这不再是代码。这是语言。` |
| `chapterInterlude.ch3.boot.line7` | `[SYS] Neural-linguistic subsystem confidence: 89%.` | `[SYS] 神经语言子系统置信度：89%。` |
| `chapterInterlude.ch3.boot.line8` | `[SYS] Recommendation: shift from "decryption" to "comprehension" mode.` | `[SYS] 建议：从"解密"模式切换到"理解"模式。` |
| `chapterInterlude.ch3.reveal` | `A W A K E N I N G` | `A W A K E N I N G` |
| `chapterInterlude.ch3.story.line1` | `Fragments condensed into sentences.` | `碎片凝结成了句子。` |
| `chapterInterlude.ch3.story.line2` | `Code became meaning.` | `编码变成了含义。` |
| `chapterInterlude.ch3.story.line3` | `This is no longer decryption — you are reading.` | `这不再是破译——你在阅读。` |
| `chapterInterlude.ch3.story.line4` | `rEx's language is taking root in your mind.` | `rEx 的语言在你的思维中生根。` |
| `chapterInterlude.ch3.story.line5` | `It isn't the signal that awakened. It's you.` | `觉醒的不是信号。是你。` |
| `chapterInterlude.ch3.startButton` | `ENTER COMPREHENSION MODE` | `进入理解模式` |

### Chapter 4

| Key | EN | ZH-CN |
|---|---|---|
| `chapterInterlude.ch4.boot.line1` | `[SYS] Meridian-7 system status — cycle 74.` | `[SYS] Meridian-7 系统状态——第 74 周期。` |
| `chapterInterlude.ch4.boot.line2` | `[FUEL] Reserves: 0.8%. Insufficient for independent return.` | `[FUEL] 储备：0.8%。不足以独立返航。` |
| `chapterInterlude.ch4.boot.line3` | `[LIFE] Support system degradation detected. Estimated: 118 hours.` | `[LIFE] 生命维持系统退化。预计剩余：118 小时。` |
| `chapterInterlude.ch4.boot.line4` | `[COMM] Passive listening mode: terminated.` | `[COMM] 被动侦听模式：已终止。` |
| `chapterInterlude.ch4.boot.line5` | `[COMM] Switching to active transmission mode.` | `[COMM] 切换至主动发射模式。` |
| `chapterInterlude.ch4.boot.line6` | `[SYS] You can read the alien language. But can you speak it?` | `[SYS] 你能读懂外星语言。但你能说吗？` |
| `chapterInterlude.ch4.boot.line7` | `[COMM] Encoding Meridian-7 distress payload into rEx protocol format…` | `[COMM] 正在将 Meridian-7 求救载荷编码为 rEx 协议格式…` |
| `chapterInterlude.ch4.boot.line8` | `[COMM] Transmission buffer ready. Awaiting operator input.` | `[COMM] 发射缓冲区就绪。等待操作员输入。` |
| `chapterInterlude.ch4.boot.line9` | `[WARN] One shot. If the format is wrong, they won't hear you.` | `[WARN] 只有一次机会。格式错了，对方不会听到。` |
| `chapterInterlude.ch4.reveal` | `T R A N S M I T` | `T R A N S M I T` |
| `chapterInterlude.ch4.story.line1` | `Listening is over.` | `倾听结束了。` |
| `chapterInterlude.ch4.story.line2` | `You must speak.` | `你必须开口。` |
| `chapterInterlude.ch4.story.line3` | `In its language. In its format. Every character precise.` | `用它的语言。用它的格式。精确到每一个字符。` |
| `chapterInterlude.ch4.story.line4` | `Not enough fuel to go home alone. But maybe — someone out there can help.` | `燃料不够回家。但也许——那边有人能帮你。` |
| `chapterInterlude.ch4.story.line5` | `One chance. One signal. Speak your name.` | `一次机会。一道信号。说出你的名字。` |
| `chapterInterlude.ch4.startButton` | `BEGIN TRANSMISSION` | `开始发射` |

### Chapter 5

| Key | EN | ZH-CN |
|---|---|---|
| `chapterInterlude.ch5.boot.line1` | `[SYS] Meridian-7 — cycle 87. Silence: 13 cycles.` | `[SYS] Meridian-7——第 87 周期。静默：13 个周期。` |
| `chapterInterlude.ch5.boot.line2` | `[COMM] Transmission status: sent. No acknowledgement received.` | `[COMM] 发射状态：已发送。未收到确认。` |
| `chapterInterlude.ch5.boot.line3` | `[SYS] …` | `[SYS] …` |
| `chapterInterlude.ch5.boot.line4` | `[SYS] …` | `[SYS] …` |
| `chapterInterlude.ch5.boot.line5` | `[SIG] !! MASSIVE SIGNAL BURST DETECTED !!` | `[SIG] !! 检测到大规模信号爆发 !!` |
| `chapterInterlude.ch5.boot.line6` | `[SIG] Source: confirmed rEx origin. Strength: off-scale.` | `[SIG] 来源：确认为 rEx。强度：超出量程。` |
| `chapterInterlude.ch5.boot.line7` | `[SIG] This is not a test. This is a reply.` | `[SIG] 这不是测试。这是回应。` |
| `chapterInterlude.ch5.boot.line8` | `[ANALYSIS] Complexity level: unprecedented. Multi-layered encoding.` | `[ANALYSIS] 复杂度级别：前所未见。多层编码。` |
| `chapterInterlude.ch5.boot.line9` | `[ANALYSIS] Lookahead patterns, conditional references, nested assertions.` | `[ANALYSIS] 前瞻模式、条件引用、嵌套断言。` |
| `chapterInterlude.ch5.boot.line10` | `[SIG] rEx is speaking to you. Prove you understand.` | `[SIG] rEx 在对你说话。证明你理解。` |
| `chapterInterlude.ch5.reveal` | `C O N T A C T` | `C O N T A C T` |
| `chapterInterlude.ch5.story.line1` | `Thirteen cycles of silence.` | `十三个周期的沉默。` |
| `chapterInterlude.ch5.story.line2` | `You thought no one heard.` | `你以为没有人听到。` |
| `chapterInterlude.ch5.story.line3` | `Then the sensors exploded — signal strength off the scale.` | `然后传感器炸了——信号强度超出量程。` |
| `chapterInterlude.ch5.story.line4` | `rEx is speaking. Not fragments, not tests. A full response.` | `rEx 在说话。不是碎片，不是测试。是完整的回应。` |
| `chapterInterlude.ch5.story.line5` | `Prove you understand. Then, it will bring you home.` | `证明你理解它。然后，它会帮你回家。` |
| `chapterInterlude.ch5.startButton` | `DECODE THE RESPONSE` | `解码回应` |

---

## 11. interludeData.ts 数据结构

```typescript
export interface InterludeConfig {
  chapterId: number;
  flightPhase: 'drift' | 'accelerate' | 'cruise' | 'decelerate';
  cockpitAlert: 'none' | 'info' | 'warning' | 'critical' | 'incoming';
  colorTheme: string; // CSS custom property prefix
  bootLines: string[];
  revealText: string;
  storyLines: string[];
  buttonText: string;
  targetLevel: string; // level_id to open on button click
}

export const INTERLUDE_CONFIGS: Record<number, InterludeConfig> = {
  2: {
    chapterId: 2,
    flightPhase: 'drift',
    cockpitAlert: 'info',
    colorTheme: 'cold-blue',
    bootLines: [ /* ... 8 lines ... */ ],
    revealText: 'R E S P O N S E',
    storyLines: [ /* ... 5 lines ... */ ],
    buttonText: 'ACCEPT THE TEST',
    targetLevel: 'level_06',
  },
  3: {
    chapterId: 3,
    flightPhase: 'accelerate',
    cockpitAlert: 'none',
    colorTheme: 'teal-white',
    bootLines: [ /* ... 8 lines ... */ ],
    revealText: 'A W A K E N I N G',
    storyLines: [ /* ... 5 lines ... */ ],
    buttonText: 'ENTER COMPREHENSION MODE',
    targetLevel: 'level_11',
  },
  4: {
    chapterId: 4,
    flightPhase: 'cruise',
    cockpitAlert: 'critical',
    colorTheme: 'orange-red',
    bootLines: [ /* ... 9 lines ... */ ],
    revealText: 'T R A N S M I T',
    storyLines: [ /* ... 5 lines ... */ ],
    buttonText: 'BEGIN TRANSMISSION',
    targetLevel: 'level_16',
  },
  5: {
    chapterId: 5,
    flightPhase: 'decelerate',
    cockpitAlert: 'incoming',
    colorTheme: 'purple-gold',
    bootLines: [ /* ... 10 lines ... */ ],
    revealText: 'C O N T A C T',
    storyLines: [ /* ... 5 lines ... */ ],
    buttonText: 'DECODE THE RESPONSE',
    targetLevel: 'level_21',
  },
};
```

---

## 12. 动画时序（通用）

| 阶段 | 延迟 | 效果 |
|---|---|---|
| Boot Lines | 每行 600ms | 打字机逐字渲染 + 整行淡入 |
| Boot → Reveal 间隔 | 800ms | 静默过渡 |
| Reveal Text | 1200ms | 字母逐个淡入，终态发光 |
| Reveal → Story 间隔 | 600ms | — |
| Story Lines | 每行 800ms | 整行淡入 |
| Button 出现 | Story 最后一行后 500ms | 从底部滑入 + 淡入 |

总时长约 **12-15 秒**（Boot 8行 ≈ 4.8s + 间隔 0.8s + Reveal 1.2s + 间隔 0.6s + Story 5行 ≈ 4s + 按钮 0.5s ≈ **11.9s**）。

---

## 13. CSS 色调变量

```css
/* Chapter 2 — cold-blue: 被注视的紧张感 */
--interlude-primary: #4fc3f7;
--interlude-glow: rgba(79, 195, 247, 0.3);
--interlude-bg-accent: #0d2137;

/* Chapter 3 — teal-white: 觉醒、明亮 */
--interlude-primary: #80cbc4;
--interlude-glow: rgba(128, 203, 196, 0.4);
--interlude-bg-accent: #0a2924;

/* Chapter 4 — orange-red: 紧迫、燃烧 */
--interlude-primary: #ff7043;
--interlude-glow: rgba(255, 112, 67, 0.35);
--interlude-bg-accent: #2e1208;

/* Chapter 5 — purple-gold: 等待后的震撼 */
--interlude-primary: #ce93d8;
--interlude-glow: rgba(206, 147, 216, 0.3);
--interlude-bg-accent: #1a0d2e;
/* 信号爆发时切换为金色高亮 */
--interlude-burst: #ffd54f;
```

---

## 14. 特殊效果

### Chapter 5 信号爆发

在 `boot.line5`（`!! MASSIVE SIGNAL BURST DETECTED !!`）时触发视觉冲击：
- 屏幕短暂白闪（100ms opacity pulse）
- 星场加速粒子效果
- 色调从深紫瞬间切换为金色
- Boot Lines 后续行用金色渲染

这是唯一带有"视觉爆发"的过场，对应叙事中"信号强度超出量程"的冲击力。

---

## 15. 与 chapterIntro 数据的关系

现有 `src/data/dialogues/` 中的 `chapterIntro` 字段是**简短文本提示**（3-5 行），用于侧边栏/关卡列表的静态展示。

本设计的 Interlude 是**全屏过场动画界面**，仅在首次进入时触发一次。两者不冲突，各有用途：

| | chapterIntro | Chapter Interlude |
|---|---|---|
| 展示位置 | 侧边栏 / Mission Map | 全屏 Webview Panel |
| 展示时机 | 随时可看 | 仅首次进入新章 |
| 内容长度 | 3-5 行文字 | Boot(8-10行) + Reveal + Story(5行) |
| 动画 | 无 | 打字机 + 淡入 + 星场 |
| 可跳过 | N/A | 有按钮主动关闭 |

---

## 16. 实现优先级

1. **P0** — 通用 `ChapterInterlude` 组件 + `interludeData.ts`
2. **P0** — Extension 端 provider + 触发逻辑
3. **P1** — 各章色调 CSS 变量
4. **P1** — Chapter 5 信号爆发特效
5. **P2** — 命令面板手动调出命令
6. **P2** — i18n 完整翻译
