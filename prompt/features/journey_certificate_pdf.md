# Journey Certificate PDF 设计书

## 1. 目标

为 YourEx 增加"用户旅程证书（Journey Certificate）"功能：将玩家在所有关卡中的完整操作历史导出为一份**科技感十足的 PDF 证书**，作为通关纪念与回顾总结。

核心价值：
1. **仪式感**：通关第五大关后解锁，标志玩家正式成为 rEx 的传承者。
2. **完整旅程回顾**：记录每一关的所有尝试（包括错误），让玩家看到自己从生疏到熟练的成长曲线。
3. **可分享的纪念品**：PDF 文件易于打印、分享、收藏。

---

## 2. 触发与解锁

### 2.1 数据驱动的触发机制（核心原则）

证书的解锁触发**不由代码硬编码**，而是由关卡 JSON 中的字段决定。任意一关只要带上特定字段，通过该关卡后就会解锁证书生成入口。

这样的好处：
1. **OCP（开闭原则）**：未来新增章节、调整解锁点、设置多个解锁点，都只需改关卡数据，不需改代码。
2. **关卡设计自由**：策划可以自由决定证书在哪一关后解锁（例如 Ch5 终局、Ch6 彩蛋、甚至特殊活动关卡）。
3. **可扩展为多类型证书**：未来可支持"章节证书"、"彩蛋证书"等不同类型，由字段值区分。

### 2.2 关卡 JSON 字段设计

在 `Level` 接口中新增可选字段 `certificateTrigger`：

```ts
export interface Level {
  // ... 已有字段
  /**
   * 通关此关卡后解锁证书生成入口。
   * 一旦解锁则永久解锁（持久化到 globalState）。
   * 可选字段，未设置则该关卡不触发证书解锁。
   */
  certificateTrigger?: CertificateTrigger;
}

export interface CertificateTrigger {
  /** 证书类型标识，未来可扩展不同证书模板。当前固定为 'journey'。 */
  type: 'journey';
  /**
   * 触发条件：
   * - 'pass'：通关（pass 或 perfect）即可触发
   * - 'perfect'：仅 perfect 触发
   * 默认 'pass'。
   */
  requireStatus?: 'pass' | 'perfect';
  /**
   * 是否首次通关时自动弹出证书生成提示。
   * 默认 true。
   */
  autoPrompt?: boolean;
}
```

**示例（在 `level_25.json` 中配置）：**

```json
{
  "id": "level_25",
  "title": "...",
  "chapter": 5,
  ...
  "certificateTrigger": {
    "type": "journey",
    "requireStatus": "pass",
    "autoPrompt": true
  }
}
```

### 2.3 解锁状态判定

```ts
/**
 * 数据驱动的解锁判定：扫描所有已通关的关卡，
 * 查找是否有任何一关带 certificateTrigger 且达到了 requireStatus。
 */
function isCertificateUnlocked(state: GameState, levels: Level[]): boolean {
  // 一旦解锁过就持久化
  if (state.certificateUnlocked) {
    return true;
  }

  for (const level of levels) {
    const trigger = level.certificateTrigger;
    if (!trigger || trigger.type !== 'journey') continue;

    const required = trigger.requireStatus ?? 'pass';
    const attempts = state.completedLevels[level.id] ?? [];
    const hit = attempts.some(a =>
      required === 'perfect'
        ? a.judgeResult.status === 'perfect'
        : a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass'
    );
    if (hit) return true;
  }
  return false;
}
```

**触发后持久化：**
- 在通关结算流程（`recordAttempt` 后）检测：若刚通关的关卡带 `certificateTrigger` 且达到 `requireStatus`，则设置 `state.certificateUnlocked = true`。
- 之后即使关卡数据变更或字段被移除，玩家的解锁状态也不会丢失。
- 新增 `GameState` 字段 `certificateUnlocked: boolean`（默认 `false`）。

### 2.4 入口位置

| 位置 | 显示条件 | 说明 |
|---|---|---|
| `GameCompleteReward` 终局界面 | 当前关卡带 `certificateTrigger` 且 `autoPrompt !== false` | 主行动按钮：`📜 生成旅程证书` |
| `RewardOverlay` 单关奖励界面 | 当前关卡带 `certificateTrigger` | 次级按钮 `生成证书` |
| `MissionMapProvider` 侧边栏底部 | `state.certificateUnlocked === true` 后常驻 | 小图标按钮 `生成证书 PDF` |
| 命令面板 | `state.certificateUnlocked === true` 后可用 | `YourEx: Generate Journey Certificate` |

证书入口在解锁前应隐藏（不灰显），避免提前剧透。

---

## 3. 数据模型

### 3.1 旅程数据聚合

```ts
interface JourneyCertificateData {
  // --- 证书元数据 ---
  certificateId: string;          // 唯一编号，例如 "REX-2026-0428-7A3F"
  generatedAt: number;            // 生成时间戳
  playerName: string;             // 默认 "PARSER" 或读取系统用户名
  totalPlayTime: number;          // 总游玩时长（毫秒）

  // --- 全局统计 ---
  totalAttempts: number;
  totalPromptLength: number;
  perfectCount: number;
  passCount: number;
  failCount: number;
  totalXp: number;
  maxCombo: number;
  achievements: Achievement[];

  // --- 章节旅程 ---
  chapters: ChapterJourney[];     // 6 个章节（Ch1-Ch5 必有，Ch6 视完成情况）
}

interface ChapterJourney {
  chapter: number;                // 1-6
  chapterTitle: string;           // "Signal Contact" / "Pattern Recognition" ...
  chapterCompleteLine: string;    // 来自 DIALOGUES.chapterComplete
  isComplete: boolean;            // 章节是否全部通关
  levels: LevelJourney[];         // 该章节所有关卡（按顺序）
}

interface LevelJourney {
  levelId: string;
  levelOrder: number;             // 章内序号
  levelTitle: string;
  levelStory: string;             // 关卡剧情简介（一句话）
  status: 'perfect' | 'pass' | 'attempted' | 'skipped';
                                  // skipped：Ch6 未触发；attempted：Ch6 失败
  attempts: AttemptRecord[];      // 完整尝试历史
  bestScore?: PromptScore;        // 最佳分数
  totalAttempts: number;
}

interface AttemptRecord {
  attemptNumber: number;
  timestamp: number;
  mode: 'prompt' | 'manual';
  // 关键规则：错误尝试不记录 prompt/regex 内容
  prompt?: string;                // 仅在 status === 'pass' | 'perfect' 时填充
  regex?: string;                 // 仅在 pass | perfect 时填充
  status: 'perfect' | 'pass' | 'fail';
  scoreTotal?: number;
}
```

### 3.2 错误尝试的记录策略（核心规则）

| 尝试结果 | 记录内容 |
|---|---|
| `perfect` / `pass` | 记录 attemptNumber、timestamp、mode、**prompt 全文**、**regex 全文**、scoreTotal |
| `fail` | **仅记录** attemptNumber、timestamp、status="fail"，**不记录** prompt/regex 内容 |

理由：
1. 隐私 — 失败的尝试可能包含玩家的"乱试"输入，记录这些没有价值且令人尴尬。
2. 可读性 — PDF 中只展示有价值的最终答案，错误次数仅作为统计指标体现成长。
3. 仪式感 — 证书呈现的是"成功的旅程"，错误是数字（试错次数），不是内容。

### 3.3 Ch6 特殊处理

| Ch6 状态 | 证书呈现 |
|---|---|
| 未触发（玩家未进入 Ch6） | 章节标记为 `skipped`，显示"`>> ORIGIN SIGNAL — UNDETECTED`"占位 |
| 触发但未通过 | 章节状态 `attempted`，列出尝试次数，但不展示答案 |
| 通过（perfect/pass） | 完整记录 prompt/regex，作为"隐藏成就"高亮展示 |

---

## 4. PDF 视觉设计

### 4.1 整体风格

**主题**：科幻、深空、信号解析、终端美学

| 元素 | 设计 |
|---|---|
| 主色调 | 深空黑（`#05070D`）背景 + 信号绿（`#34F5C5`）/ 琥珀橙（`#FFB454`）主色 |
| 字体 | 主标题：等宽 `JetBrains Mono` / `Fira Code` ；正文：`Inter` / 系统无衬线 |
| 装饰元素 | 星点背景、网格线、扫描线、电路纹理、波形信号曲线 |
| 排版 | A4 纵向（210×297mm），统一 25mm 内边距 |

### 4.2 页面结构（共约 8-12 页）

```
Page 1     ── 证书首页（封面）
Page 2     ── 旅程概览（统计仪表盘）
Page 3-7   ── 章节详情（每章 1-2 页）
Page 8     ── 成就墙
Page 9     ── 终局印记 / 落款页
```

---

### 4.3 Page 1 — 证书封面（核心设计）

**布局示意（ASCII）：**

```
┌────────────────────────────────────────────────────┐
│ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░│ <- 顶部扫描线 + 噪点
│                                                    │
│  ┌─[REX_TRANSMISSION:CERT_GENESIS]─────────┐      │
│  │                                          │      │
│  │     Y O U R E X · J O U R N E Y          │      │  <- 巨型 Logo 字
│  │     ─────────────────────────            │      │
│  │       C E R T I F I C A T E              │      │
│  │                                          │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│        ╱╲       SIGNAL FULLY DECODED       ╱╲      │  <- 状态徽章
│       ╱  ╲                                ╱  ╲     │
│      ▼    ▼                              ▼    ▼    │
│                                                    │
│  >> 兹证明 / This certifies that:                  │
│                                                    │
│       ┌──────────────────────────────────┐        │
│       │       P A R S E R - 7 7          │        │  <- 玩家名（手写体）
│       │  ─────────────────────────       │        │
│       └──────────────────────────────────┘        │
│                                                    │
│  已成功解译 rEx 全部信号，破解 25 道协议帧，       │
│  从信号接触者晋升为正式的 rEx 协议解译官。         │
│                                                    │
│  has successfully decoded all rEx signals,         │
│  parsed 25 protocol frames, and ascended           │
│  from Signal Contact to certified rEx Parser.      │
│                                                    │
│  ╔═══════════════════════════════════════════╗   │
│  ║  CERT_ID    : REX-2026-0428-7A3F          ║   │
│  ║  ISSUED_AT  : 2026-04-28 14:32:11 UTC     ║   │
│  ║  CHAPTERS   : 5/5  (+ ORIGIN: ✓)          ║   │
│  ║  RANK       : ◆◆◆◆◆ MASTER PARSER         ║   │
│  ╚═══════════════════════════════════════════╝   │
│                                                    │
│           ┌─────────────────────┐                  │
│           │  [QR: signal-trace] │                  │  <- 二维码占位（可选）
│           └─────────────────────┘                  │
│                                                    │
│  rEx says: "Welcome home."                         │
│                                                    │
│ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░│
└────────────────────────────────────────────────────┘
```

**关键视觉元素：**

1. **顶/底扫描线**：信号噪点条带（点阵纹理）
2. **巨型 Logo**：`Y O U R E X · J O U R N E Y CERTIFICATE` 字距拉开，呼应游戏内 REX_REVEAL 风格
3. **荣誉徽章**：菱形 SVG，中央 `SIGNAL FULLY DECODED`
4. **玩家名牌**：边框为终端窗口风，名字用大号等宽字体
5. **认证元数据框**：仿系统日志输出风格，方框由 `╔═╗║╚═╝` 等字符构成
6. **背景层**：浅扫描线 + 微弱星点（不影响阅读）

---

### 4.4 Page 2 — 旅程概览仪表盘

```
┌────────────────────────────────────────────────────┐
│ // SIGNAL_TRACE_REPORT // ROUTE: HOME              │
│ ────────────────────────────────────────────────── │
│                                                    │
│  ┌── MISSION SUMMARY ─────────────────────┐       │
│  │                                         │       │
│  │   Total Levels Completed    25 / 25 ✓  │       │
│  │   Origin (hidden)           ✓ / Skipped │       │
│  │   Perfect Decodes           18 ⭐       │       │
│  │   Total Attempts            142         │       │
│  │   Success Rate              71.8%       │       │
│  │   Total Prompt Chars        3,847       │       │
│  │   Best Combo                x12         │       │
│  │   Total XP                  4,820       │       │
│  │   Play Time                 6h 24m      │       │
│  │                                         │       │
│  └─────────────────────────────────────────┘       │
│                                                    │
│  CHAPTER PROGRESS                                  │
│                                                    │
│  Ch1 ████████████████████ 5/5  (3⭐)               │
│  Ch2 ████████████████████ 5/5  (4⭐)               │
│  Ch3 ████████████████████ 5/5  (3⭐)               │
│  Ch4 ████████████████████ 5/5  (4⭐)               │
│  Ch5 ████████████████████ 5/5  (4⭐)               │
│  Ch6 ████████████████████ 1/1  (✓ ORIGIN)          │
│                                                    │
│  SIGNAL WAVEFORM (success/fail per attempt)        │
│  ┌──────────────────────────────────────────┐     │
│  │  ▁▂▁▃▁▁▂▁▁▁▂▃▁▂▁▁▁▁▁▂▁▁▂▁▁▁▁▁▁▁▁▁▂▁▁  │     │
│  └──────────────────────────────────────────┘     │
│                                                    │
└────────────────────────────────────────────────────┘
```

**关键元素：**

1. 数据用等宽字体对齐
2. 章节进度条用 ASCII 字符块（`█▓▒░`）模拟终端进度条
3. 底部"信号波形"图：以每次尝试的成败为序列，绘制小波形 SVG，体现学习曲线

---

### 4.5 Page 3-7 — 章节详情（每章一页）

```
┌────────────────────────────────────────────────────┐
│ >> CHAPTER 1 // SIGNAL CONTACT                     │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ "信号接触完成。你已经能识别基本模式了。"           │
│                                                    │
│ ┌── LEVEL 01 // 第一束信号 ─────────────────┐     │
│ │ Status:    ⭐ PERFECT     Score: 980/1000 │     │
│ │ Attempts:  2 (1 fail → 1 perfect)         │     │
│ │                                            │     │
│ │ Final Prompt:                              │     │
│ │ ┌─────────────────────────────────────┐   │     │
│ │ │ 提取所有以 SIG- 开头的代号            │   │     │
│ │ └─────────────────────────────────────┘   │     │
│ │                                            │     │
│ │ Final Regex:                               │     │
│ │ ┌─────────────────────────────────────┐   │     │
│ │ │ /SIG-[A-Z0-9]+/g                    │   │     │
│ │ └─────────────────────────────────────┘   │     │
│ └────────────────────────────────────────────┘     │
│                                                    │
│ ┌── LEVEL 02 // 频段过滤 ───────────────────┐     │
│ │ Status:    ✓ PASS         Score: 720/1000 │     │
│ │ Attempts:  4 (3 fail → 1 pass)            │     │
│ │ ...                                        │     │
│ └────────────────────────────────────────────┘     │
│                                                    │
│ (… 其余关卡 …)                                     │
│                                                    │
│ ─────────────────────────────────────────────────  │
│ Chapter Stats:  5/5 ✓  Perfect: 3  Attempts: 28   │
└────────────────────────────────────────────────────┘
```

**关键规则：**

1. 失败的尝试**只显示数量**（"3 fail → 1 pass"），不展开内容。
2. 成功 prompt/regex 用代码块样式（深背景 + 等宽字体 + 语法高亮的等宽展现）。
3. 每关一个卡片，最多 2-3 关一页（视内容长度自动分页）。
4. 章节首页带章节通关台词（DIALOGUES.chapterComplete）。

---

### 4.6 Page 8 — 成就墙

```
┌────────────────────────────────────────────────────┐
│ >> ACHIEVEMENTS UNLOCKED                           │
│ ─────────────────────────────────────────────────  │
│                                                    │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│   │   📡    │  │    ⚡    │  │    ⭐    │          │
│   │ FIRST   │  │ SPEED   │  │ PERFECT │          │
│   │ SIGNAL  │  │ PARSE   │  │ STREAK  │          │
│   │ 第一束  │  │ 极速解译 │  │ 连击大师 │          │
│   └─────────┘  └─────────┘  └─────────┘          │
│                                                    │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│   │   🎯    │  │    🔓   │  │    🏆   │          │
│   │ ZERO    │  │ ORIGIN  │  │ MASTER  │          │
│   │ NOISE   │  │ FOUND   │  │ PARSER  │          │
│   └─────────┘  └─────────┘  └─────────┘          │
│                                                    │
│   未解锁 (locked):                                 │
│   ┌─────────┐  ┌─────────┐                        │
│   │   ?     │  │    ?    │                        │
│   │ ▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓ │                        │
│   └─────────┘  └─────────┘                        │
│                                                    │
└────────────────────────────────────────────────────┘
```

成就以九宫格/六宫格徽章形式展示，未解锁的用问号占位。

---

### 4.7 末页 — 终局印记

```
┌────────────────────────────────────────────────────┐
│                                                    │
│           >> END_OF_TRANSMISSION <<                │
│                                                    │
│                                                    │
│              ALL SIGNALS DECODED.                  │
│                                                    │
│              所有信号已解密。                      │
│              你定义了规则。                        │
│              你就是下一个 rEx。                    │
│                                                    │
│              You are the next rEx.                 │
│                                                    │
│                                                    │
│              ┌────────────────────┐                │
│              │                    │                │
│              │   [SIGIL_SIGNATURE]│                │  <- 印章式签名图形
│              │                    │                │
│              └────────────────────┘                │
│                                                    │
│              rEx says: "Welcome home."             │
│                                                    │
│  ─────────────────────────────────────────────     │
│  CERT: REX-2026-0428-7A3F  ·  yourex.dev          │
└────────────────────────────────────────────────────┘
```

落款带印章式 SVG 图形，可选附二维码（链接到证书 ID 校验页 — 暂为占位）。

---

## 5. 技术方案

### 5.1 PDF 生成方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|---|---|---|---|
| **pdf-lib**（纯 Node） | 无依赖浏览器；体积小；支持复杂排版 | 中文字体需手动嵌入；样式手写 | ⭐⭐ |
| **PDFKit**（Node） | 成熟、API 简洁；可绘 SVG | 中文字体嵌入复杂；排版手写 | ⭐⭐⭐ |
| **html → PDF（Puppeteer）** | 用 HTML/CSS 设计排版自由 | 需依赖 Chromium，体积巨大 | ⭐ |
| **html → PDF（jsPDF + html2canvas，webview 内）** | 在 webview 中调用，无 Node 依赖；CSS 可视化对齐设计 | 中文字体需打包；分页需手动控制 | ⭐⭐⭐⭐ |
| **react-pdf (@react-pdf/renderer)** | React 组件式定义 PDF；与现有 UI 技术栈一致；中文字体需注册 | 学习曲线；动态布局需注意 | ⭐⭐⭐⭐⭐ |

**推荐方案：`@react-pdf/renderer`**

理由：
1. 与 webview-ui 的 React 技术栈一致。
2. 组件化定义，每页/每章节即一个 React 组件，易维护。
3. 支持 SVG、Image、自定义字体。
4. 可在 webview 中生成并通过 `Uint8Array` 传给 extension 端写文件。

### 5.2 SOLID 架构

```
src/engine/
  certificateBuilder.ts          ← 旅程数据聚合（GameState → JourneyCertificateData）

src/ui/webview/
  certificateProvider.ts         ← Extension 侧：管理证书 webview，处理保存请求

webview-ui/src/components/Certificate/
  index.tsx                      ← 主组件（接收 JourneyCertificateData，渲染预览 + 触发下载）
  CertificateDocument.tsx        ← @react-pdf/renderer 的 <Document> 定义
  pages/
    CoverPage.tsx                ← Page 1 封面
    OverviewPage.tsx             ← Page 2 仪表盘
    ChapterPage.tsx              ← Page 3-7 章节页（接收 ChapterJourney prop）
    AchievementsPage.tsx         ← Page 8 成就墙
    EndingPage.tsx               ← 末页
  components/
    Badge.tsx                    ← 徽章 SVG 组件
    StatBlock.tsx                ← 统计数据块
    LevelCard.tsx                ← 关卡卡片
    Waveform.tsx                 ← 信号波形 SVG
    ScanLines.tsx                ← 扫描线装饰
  styles/
    theme.ts                     ← 颜色、字体、间距常量
  fonts/
    JetBrainsMono-Regular.ttf
    JetBrainsMono-Bold.ttf
    NotoSansSC-Regular.ttf       ← 中文字体（思源黑体）
    NotoSansSC-Bold.ttf
```

### 5.3 SRP 单一职责

| 模块 | 职责 |
|---|---|
| `CertificateUnlockChecker` | 扫描关卡数据 + GameState，判定 `certificateTrigger` 是否被命中；管理 `state.certificateUnlocked` 持久化 |
| `CertificateBuilder` | 从 `GameState` + `levels` 数据聚合 `JourneyCertificateData`，**过滤掉 fail 尝试中的 prompt/regex** |
| `CertificateDocument` | 定义 PDF 文档结构（页面顺序、Document props） |
| `pages/*` | 每个页面的视觉布局，纯展示，接收 props |
| `certificateProvider.ts` | Webview 创建、消息路由、保存对话框 |

### 5.4 OCP 开闭原则

- 新增页面 → 在 `CertificateDocument` 中插入，不改其他页面
- 新增章节（Ch7+）→ `ChapterPage` 自动适配
- 新增成就 → `AchievementsPage` 自动列出

---

## 6. 用户流程

```
[Ch5 全通关]
     │
     ▼
[GameCompleteReward 显示 "📜 生成旅程证书" 按钮]
     │ (或侧边栏入口 / 命令面板)
     ▼
[点击 → 打开证书预览 Webview]
     │
     ├─ 显示证书每页缩略图（横向滚动或网格预览）
     ├─ 顶部按钮：[下载 PDF] [自定义玩家名] [刷新]
     │
     ▼
[玩家点击 "下载 PDF"]
     │
     ▼
[Extension 弹出保存对话框 (vscode.window.showSaveDialog)]
     │ 默认文件名：YourEx_Journey_Certificate_{playerName}_{date}.pdf
     ▼
[写入文件 → 显示成功通知 "证书已生成"]
     │
     ▼
[通知附带 "打开文件" 按钮 → vscode.env.openExternal(fileUri)]
```

### 6.1 玩家名输入

- 默认名：读取 `os.userInfo().username` → 大写 → 截取前 16 字符 → 例如 `PARSER-ALICE`
- 提供输入框允许自定义（最长 24 字符，仅允许字母数字/中文/`-_·`）
- 保存到 `globalState`：`yourex.certificatePlayerName`，下次默认填入

### 6.2 证书 ID 生成

```
REX-{YYYY}-{MMDD}-{4位随机十六进制}
例：REX-2026-0428-7A3F
```

- 一旦首次生成保存到 `globalState`：`yourex.certificateId`
- 后续重新生成保持同一 ID（同一段旅程同一证书）
- 命令面板提供 `YourEx: Regenerate Certificate ID`（重置）

---

## 7. 消息协议

### 7.1 Extension → Webview

| command | payload | 说明 |
|---|---|---|
| `loadCertificateData` | `JourneyCertificateData` | 初始化证书数据 |
| `saveSuccess` | `{ filePath: string }` | PDF 已写入磁盘 |
| `saveFailed` | `{ error: string }` | 保存失败 |

### 7.2 Webview → Extension

| command | payload | 说明 |
|---|---|---|
| `generatePdf` | `{ pdfBytes: Uint8Array, fileName: string }` | 请求 extension 写入文件 |
| `setPlayerName` | `{ name: string }` | 持久化自定义玩家名 |
| `closeCertificate` | — | 关闭面板 |

---

## 8. i18n Keys

新增命名空间 `certificate`：

| Key | 英文 | 中文 |
|---|---|---|
| `certificate.entryButton` | `📜 Generate Journey Certificate` | `📜 生成旅程证书` |
| `certificate.title` | `YOUREX · JOURNEY CERTIFICATE` | `YOUREX · 旅程证书` |
| `certificate.statusBadge` | `SIGNAL FULLY DECODED` | `信号已完全解译` |
| `certificate.thisCertifies` | `This certifies that` | `兹证明` |
| `certificate.summaryEn` | `has successfully decoded all rEx signals...` | — |
| `certificate.summaryZh` | — | `已成功解译 rEx 全部信号...` |
| `certificate.rankMaster` | `MASTER PARSER` | `资深解译官` |
| `certificate.welcomeHome` | `rEx says: "Welcome home."` | `rEx 说："Welcome home."` |
| `certificate.endTransmission` | `>> END_OF_TRANSMISSION <<` | `>> 传输结束 <<` |
| `certificate.allSignalsDecoded` | `ALL SIGNALS DECODED.` | `所有信号已解密。` |
| `certificate.youAreNextRex` | `You are the next rEx.` | `你就是下一个 rEx。` |
| `certificate.attemptsLabel` | `Attempts` | `尝试次数` |
| `certificate.failPrefix` | `{n} fail → {k} {result}` | `{n} 次失败 → {k} 次{result}` |
| `certificate.skippedOrigin` | `>> ORIGIN SIGNAL — UNDETECTED` | `>> 起源信号 — 未探测` |
| `certificate.downloadButton` | `Download PDF` | `下载 PDF` |
| `certificate.customizeName` | `Customize Name` | `自定义署名` |
| `certificate.savedNotification` | `Certificate saved to {path}` | `证书已保存至 {path}` |
| `certificate.openFile` | `Open File` | `打开文件` |

证书 PDF 内同时呈现中英双语（双语证书形式），**不依赖当前 i18n 语言切换**——更具仪式感与国际化收藏价值。

---

## 9. 性能与体积

| 项 | 目标 |
|---|---|
| PDF 文件大小 | < 2 MB（含中文字体子集化） |
| 生成耗时 | < 3 秒（25 关 × 平均 5 attempts ≈ 125 条记录） |
| 中文字体 | 使用 `subset-font` 提取仅需的字符（标题用 + 正文常用字） |
| 字体加载 | webview 启动时预加载，证书生成时直接使用 |

---

## 10. 边界情况

| 情况 | 处理 |
|---|---|
| 玩家修改了系统时间 → timestamp 异常 | 不校验，按记录值显示；`generatedAt` 用当前时间 |
| 玩家在 Ch5 通关前手动调用命令 | 命令灰显 / 显示提示"请先通关 Ch5" |
| 关卡数据缺失（旧存档） | 显示 "Status: ATTEMPTED · Data Incomplete" |
| 字体加载失败 | 降级为系统字体 + 通知玩家 |
| 玩家名包含表情符号或特殊字符 | 校验失败时回退默认名 |
| 同一关多次 perfect | 取最佳分数那次的 prompt/regex |
| 玩家从未提交 prompt（manual 模式通关） | "Final Prompt" 区域显示 `— manual mode —` |

---

## 11. 实施阶段

### Phase 1 — 数据层（P0）

1. 在 `src/types/level.ts` 新增 `certificateTrigger` 字段与 `CertificateTrigger` 接口
2. 在 `src/types/gameState.ts` 新增 `certificateUnlocked: boolean` 字段
3. 新增 `src/engine/certificateUnlockChecker.ts`，实现数据驱动的解锁判定与持久化
4. 在通关结算流程（`recordAttempt` 之后）调用解锁检测
5. 在目标关卡的 JSON 中（如 `level_25.json`）添加 `certificateTrigger` 字段
6. 新增 `src/engine/certificateBuilder.ts`，从 `GameState` 聚合 `JourneyCertificateData`
7. 新增证书相关类型定义到 `src/types/certificate.ts`
8. 实现 fail 尝试的内容过滤逻辑
9. 实现证书 ID 生成与持久化

### Phase 2 — PDF 生成基础设施（P0）

1. 安装 `@react-pdf/renderer` 与中英文字体（NotoSansSC、JetBrainsMono）
2. 字体子集化脚本
3. `CertificateDocument` 框架与 5 类页面骨架
4. 主题常量（颜色、字号、间距）

### Phase 3 — 视觉实现（P0）

1. Cover 页（封面）
2. Overview 页（仪表盘 + 进度条 + 信号波形 SVG）
3. Chapter 页（关卡卡片）
4. Achievements 页（徽章网格）
5. Ending 页（终局印记）

### Phase 4 — 集成（P1）

1. `certificateProvider.ts`（Extension webview 管理 + 保存对话框）
2. `Certificate/index.tsx`（webview 入口 + 预览 + 下载触发）
3. 在 `GameCompleteReward` 中加入入口按钮
4. 在侧边栏 / 命令面板加入入口
5. i18n key 添加

### Phase 5 — 打磨（P2）

1. 玩家名自定义弹窗
2. 印章 SVG 设计
3. 二维码（可选）
4. 打印优化（CMYK 适配、出血线 — 可选）
5. 减弱动效模式（pdf 预览动画降级）

---

## 12. 测试要点

| 测试项 | 验证 |
|---|---|
| 关卡无 `certificateTrigger` → 入口始终隐藏 | 移除字段验证 |
| 关卡有 `certificateTrigger` 且 `requireStatus: 'pass'` → pass 即解锁 | 通关结算后入口出现 |
| 关卡有 `certificateTrigger` 且 `requireStatus: 'perfect'` → 仅 perfect 解锁，pass 不触发 | 状态判定正确 |
| 多个关卡都带 `certificateTrigger` → 任一命中即解锁 | OR 语义 |
| 已解锁后移除关卡 `certificateTrigger` 字段 → 入口仍可见 | 持久化生效 |
| Ch6 未触发 → "UNDETECTED" 占位 | Skip 状态正确 |
| Ch6 通关 → Origin 章节完整呈现 | 数据流端到端 |
| Fail 尝试不出现 prompt/regex 内容 | 规则严格执行 |
| 中英文字符混排无乱码 | 字体子集化覆盖完整 |
| PDF 在 Adobe Reader / 浏览器 / macOS Preview 三端显示一致 | 兼容性 |
| 大量 attempts（>20）不溢出页面 | 自动分页 |
| 文件名包含中文/特殊字符 | 编码安全 |
