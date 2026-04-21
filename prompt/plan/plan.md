---

# 🌌 项目设计书

# `/YourEx/` — Your little game of rEgular eXpression

### *"Match the pattern. Understand the language."*

**核心风格：外星语言主线 + "YourEx"隐喻 + 克制的中二 + 强科技感**

---

# 1. 📌 项目背景与目标

## 1.1 背景

```text
[System Booting…]

>> 接入未知信号源…
>> 协议识别失败…
>> 语言结构：未知

—— ERROR ——
无法解析数据
```

> *全球多个系统正在被同一种信号干扰。*
> *日志失序、数据污染、通信异常。*
> *所有异常数据中，都出现同一个标记：**rEx***
> *它不是代码，也不是攻击。它是一种语言。*
> *一种从未被人类记录过的语言。*

当前公司 Promptathon 提示词大赛存在问题：

* 形式单一（写 prompt → 提交 → 评分）—— 缺乏叙事驱动
* 参与感弱 —— 没有沉浸感，灵魂已经下班
* Prompt 质量难以量化 —— "好的提示词"缺乏直观可测试的标准
* 学习过程缺乏反馈与乐趣 —— 没有即时反馈循环

## 1.2 项目目标

开发一个基于 Visual Studio Code 的插件：

👉 将 **Prompt Engineering（提示词工程）** + 正则表达式
👉 包裹在 **外星信号解密** 的叙事框架中
👉 打造一场 **沉浸式的闯关提示词大赛**

**为什么正则 × Prompt 是完美组合？**

* ✅ 正则有 **精确的对错判定** —— prompt 生成的 regex 跑一遍测试用例就知道好不好
* ✅ prompt 质量 **可量化** —— 长度、尝试次数、生成结果的精确度都是数据
* ✅ 学正则很枯燥，但 **让 AI 学正则很有趣** —— 你变成了指令官而不是执行者
* ✅ 公司提示词大赛终于有了 **即时反馈 + 游戏感 + 可排名** 的载体

核心目标：

* 🌌 **让人沉浸**（外星信号解密，科幻叙事拉满）
* 🧠 **练 Prompt 真功夫**（即时反馈，越 prompt 越上瘾）
* 🏆 **让人争先**（排行榜 + 解密进度竞速）

---

# 2. 🎯 核心理念

> **"你不是在匹配，你在理解。"**
> **"From noise to meaning."**
> **"Not just regex. It's YourEx."**

这不是一场考试。
这是一次 **信号解密任务**。

表层：正则闯关
中层：外星语言解密
深层：**理解复杂世界的能力 —— 通过学会"怎么跟 AI 说话"**

**三角关系：**

```
    你（Parser / 解析者）
    │
    │  写 Prompt（向 AI 下达解析指令）
    ▼
   AI（解码协助系统）
    │
    │  生成 Regex（构建解析规则）
    ▼
  rEx（未知信号 / 正则表达式）
    │
    │  跑测试用例（信号验证）
    ▼
  ✅ Decrypted / ❌ Parse Failed
```

每一关都是一次解密：
- 前期：你告诉 AI *"帮我找出数字"*，信号局部解锁 —— 原来这么简单
- 中期：你写了 200 字的指令，AI 构建了一个漏洞百出的规则 —— 指令也要"恰到好处"
- 终局：你用一句话让 AI 写出完美规则，最后一段信号被解析 —— **rEx 不再是未知**

---

# 3. 🧠 核心功能设计

## 3.1 游戏核心循环 —— "信号解析流程"

> *每一关都是一段被截获的信号。你的任务：定义解析规则。*

### 🤖 主模式：Prompt 模式（提示词大赛核心）

```
📡 接收到新信号（打开关卡，看到信号描述 + 测试数据）
     ↓
✍️  向 AI 下达解析指令（在 prompt 输入框写提示词）
     ↓
🤖  AI 构建解析规则（AI 生成正则表达式）
     ↓
🔍  信号验证（自动运行测试用例）
     ↓
✅ Decrypted / ❌ Parse Failed
```

玩家在 VS Code 内完成：

1. 📡 接收信号 —— *"[New Signal Detected]"*
2. ✍️ 编写 Prompt —— *"向解码协助系统下达指令……"*
3. 🤖 AI 生成正则 —— *"规则构建完成。验证中……"*
4. 🔍 自动判题 —— *"信号匹配验证……"*
5. ✅/❌ 获得反馈 —— *"[Pattern Accepted]" / "[Parse Failed]"*
6. 🔄 优化指令重试 / 🔓 解锁下一段信号

### ⚔️ 副模式：手写模式（硬核玩家 / 加分项）

* 跳过 AI，直接手写正则规则
* 成功 → 额外加分 + 专属成就 *"你不需要协助系统。你就是规则。"*
* 失败 → *"规则构建失败。建议启用协助系统。"*

---

## 3.2 关卡结构设计

### 关卡数据结构（JSON）

```json
{
  "id": "level_03",
  "title": "Fragment Found",
  "chapter": 1,
  "story": "[Signal Fragment #3] 在截获的通信数据中，混杂着大量噪声。你需要从中提取出所有合法的邮箱地址——它们可能是 rEx 信号源的坐标标识。",
  "difficulty": "medium",
  "promptChallenge": "写一个 prompt，让 AI 生成能精确匹配合法邮箱地址的正则表达式",
  "input": [
    "test@example.com",
    "bad@@example",
    "user@mail.co",
    "not-an-email",
    "signal@rex.org"
  ],
  "expected": [
    "test@example.com",
    "user@mail.co",
    "signal@rex.org"
  ],
  "hints": [
    "[Hint] 这种标识符中只包含一个 @ 符号",
    "[Hint] 域名部分包含至少一个分隔符",
    "[Hint] 你的指令需要明确描述标识符的结构"
  ],
  "promptHints": [
    "试试在 prompt 里描述邮箱的组成部分",
    "告诉 AI：用户名部分可以包含什么字符？",
    "别忘了让 AI 处理边界情况"
  ],
  "feedback": {
    "onPass": "[Pattern Accepted] 信号片段已解密。新的结构正在浮现。",
    "onFail": "[Parse Failed] 结构不完整。信号仍处于混乱状态。",
    "onPerfect": "[Decryption Success] 这不只是匹配。你开始理解它了。",
    "onDirectWrite": "[Manual Override] 你不需要协助系统。你就是规则。"
  }
}
```

---

## 3.3 判题引擎 —— "信号验证系统"

### 核心流程

```js
async function judgeWithPrompt(prompt, testCases, expected, aiProvider) {
  // 1. 把玩家的 prompt 发给 AI
  const aiResponse = await aiProvider.generate(prompt);

  // 2. 从 AI 回复中提取正则
  const regex = extractRegex(aiResponse);
  if (!regex) return { status: 'blocked', msg: '[Error] 协助系统未返回有效规则' };

  // 3. 运行测试用例
  const matched = testCases.filter(x => regex.test(x));
  const perfect = JSON.stringify(matched.sort()) === JSON.stringify(expected.sort());

  // 4. 计算 prompt 评分
  const promptScore = scorePrompt(prompt, perfect);

  return { regex, matched, perfect, promptScore, aiResponse };
}

function scorePrompt(prompt, passed) {
  if (!passed) return 0;
  const lengthScore = Math.max(0, 100 - prompt.length);  // 越短越高分
  const eleganceBonus = hasStructuredFormat(prompt) ? 10 : 0;
  return lengthScore + eleganceBonus;
}
```

### 双重评判：规则正确性 × 指令质量

| 维度 | 评分逻辑 | 权重 |
|------|----------|------|
| 🎯 规则正确性 | 测试用例通过率 | 必须 100% 才算解密成功 |
| 📏 指令简洁度 | prompt 字数越少分越高 | 30% |
| 🎯 指令精确度 | 一次 prompt 就通关 vs 多次迭代 | 30% |
| 🧠 指令优雅度 | 结构清晰 / 有约束条件 / 无冗余 | 20% |
| ⚔️ 规则质量 | 生成的正则长度 + 边界处理 | 20% |

判定等级：

| 结果 | 状态 | 系统反馈 |
|------|------|----------|
| 一次 prompt 通关 + regex 精确 | ✅✅ **Full Decode** | *"[Perfect Parse] 指令精确。规则优雅。信号已完全解密。"* |
| 通关但 prompt 冗余 | ✅ **Decoded** | *"[Decoded] 信号已解密。但你的指令可以更简洁。"* |
| 多次迭代后通关 | ✅ **Decoded (Retry)** | *"[Decoded] 经过多轮校准，信号最终被解析。"* |
| regex 有多余匹配 | ❌ **Partial** | *"[Partial Match] 你捕捉到了片段，但还没有读懂整体。"* |
| AI 生成了无效 regex | 🚫 **Error** | *"[System Error] 协助系统输出无效。优化你的指令。"* |

---

## 3.4 即时反馈系统

### Prompt 模式解密成功

```
╔══════════════════════════════════════════╗
║  [Pattern Accepted]                      ║
║                                          ║
║  结构已识别。                              ║
║  信号解密进度提升。                         ║
║                                          ║
║  📝 你的指令（42字符）：                    ║
║  "写一个匹配邮箱的正则，要求@只出现一次，    ║
║   域名部分包含至少一个点"                   ║
║                                          ║
║  🤖 生成规则：/^[\w.+-]+@[\w-]+\.\w{2,}$/ ║
║                                          ║
║  ✅ Signal: 3/3  |  Prompt 评分: 87       ║
║  📡 解密进度: 42% → 48%                   ║
║                                          ║
║  [New Signal Detected]                   ║
╚══════════════════════════════════════════╝
```

### Prompt 模式解析失败

```
╔══════════════════════════════════════════╗
║  [Parse Failed]                          ║
║                                          ║
║  结构不完整。                              ║
║  信号仍处于混乱状态。                       ║
║                                          ║
║  📝 你的指令："给我一个邮箱的正则"           ║
║  🤖 生成规则：/.*@.*/                      ║
║  ✅ Signal: 1/3  |  ❌ 规则过于宽泛         ║
║                                          ║
║  [Hint Unlocked]                         ║
║  你的指令需要更精确的约束条件……              ║
║                                          ║
║  🔄 重新下达指令                            ║
╚══════════════════════════════════════════╝
```

### 手写模式解密成功

```
╔══════════════════════════════════════════╗
║  [Manual Override — Accepted]            ║
║                                          ║
║  你不需要协助系统。你就是规则。              ║
║                                          ║
║  ⚔️ 手写规则：/^[\w.+-]+@[\w-]+\.\w+$/   ║
║  ✅ Signal: 3/3  |  Hard Mode Bonus: +10 ║
║  📡 解密进度: 42% → 50%                   ║
║                                          ║
║  [New Signal Detected]                   ║
╚══════════════════════════════════════════╝
```

---

# 4. 🧩 游戏化设计 —— "信号解密之路"

## 4.1 世界观 —— 五章解密剧情

> *全球多个系统正在被同一种信号干扰。*
> *所有异常数据中，都出现同一个标记：**rEx***
> *你被选中参与这次解析任务。原因只有一个：你能够定义规则。*

| 章节 | 名称 | 剧情 | 正则技能 | Prompt 技能 | 氛围 |
|------|------|------|----------|-------------|------|
| 第一章 | 📡 **Signal Contact** | 首次接触未知信号。从噪声中提取最基本的模式 | 字面匹配、`.`、`\d`、`\w` | 基础指令、明确目标 | 好奇、试探 |
| 第二章 | 🔍 **Pattern Recognition** | 信号中隐藏着更复杂的结构。每个字符都有多重含义 | 字符类 `[]`、`[^]`、转义 | 约束条件、负面限定、消歧 | 专注、困惑 |
| 第三章 | ⚡ **Syntax Awakening** | 信号的语法规律开始浮现。但你的指令太冗余，AI 也被你搞晕了 | `*`、`+`、`?`、`{n,m}`、贪婪/懒惰 | 精简表达、去除冗余、精准约束 | 觉醒、突破 |
| 第四章 | 🛰️ **Transmission** | 信号变成了结构化的通信协议。你学会用结构化指令解析复杂数据 | `()`、`(?:)`、`\1` 反向引用 | 分步指令、Few-shot 示例、结构化模板 | 清晰、掌控 |
| 第五章 | 🌌 **rEx** | 最后一段信号。所有规律汇聚。一条指令，完成终极解密 | 前瞻 `(?=)`、后顾 `(?<=)`、综合 | 高级 prompt 技巧、一句话搞定 | 史诗、顿悟 |

### 详细关卡列表

#### 📡 第一章：Signal Contact（信号接触）

| Level | 名称 | 双关含义 |
|-------|------|----------|
| 1 | Hello, rEx | 初次"打招呼" / 基础匹配 |
| 2 | Signal in Noise | 从混乱中找模式 |
| 3 | Fragment Found | 提取片段 |
| 4 | Echo Pattern | 重复结构 |
| 5 | Still There? | 结尾匹配 / 呼唤感 |

#### 🔍 第二章：Pattern Recognition（模式识别）

| Level | 名称 | 含义 |
|-------|------|------|
| 6 | Hidden Token | 提取关键数据 |
| 7 | Broken Syntax | 字符类 |
| 8 | Encoded Digits | 数字规则 |
| 9 | Partial Truth | 子匹配 |
| 10 | Repeat Protocol | 量词 |

#### ⚡ 第三章：Syntax Awakening（语法觉醒）

| Level | 名称 | 含义 |
|-------|------|------|
| 11 | Time Signature | 时间格式 |
| 12 | Unknown Coordinates | 位置信息 |
| 13 | Split Reality | 分组 |
| 14 | Either / Or | 选择 |
| 15 | Memory Blocks | 捕获结构 |

#### 🛰️ 第四章：Transmission（信号通信）

| Level | 名称 | 含义 |
|-------|------|------|
| 16 | Message Header | 结构化文本 |
| 17 | Protocol Sync | 规则组合 |
| 18 | Nested Signal | 嵌套 |
| 19 | Corrupted Packet | 容错 |
| 20 | Reconstruction | 综合解析 |

#### 🌌 第五章：rEx（终局）

| Level | 名称 | 含义 |
|-------|------|------|
| 21 | Full Decode | 完整解析 |
| 22 | Not Just Pattern | 超越匹配 |
| 23 | Language Formed | 语言成型 |
| 24 | You Understand | 认知完成 |
| 25 | rEx | 终局（对话 / 理解） |

### 🧠 Prompt 技能进阶路线（隐藏教学线）

每一章不仅教正则，更在 **暗线教 Prompt Engineering**：

```
第一章：你会学到 → 好的 prompt 要有明确的目标
第二章：你会学到 → 好的 prompt 要有约束条件（什么不该匹配）
第三章：你会学到 → 好的 prompt 要简洁，去掉废话
第四章：你会学到 → 复杂需求要用结构化 prompt（分步、举例）
第五章：你会学到 → 终极 prompt = 精准 + 简洁 + 结构化
```

### 隐藏章节 🌙

| 章节 | 名称 | 解锁条件 |
|------|------|----------|
| 彩蛋 | 🌙 **[Incoming Signal…]** | 全章节 Perfect 通关 —— rEx 开始回应你 |
| 真结局 | 🌌 **…you understand now…** | 隐藏章节 + 总 XP ≥ 500 |
| 逆转 | 🔄 **Signal Generator** | 真结局后解锁 —— 你来写 prompt 让 AI 出题，交叉挑战其他玩家 |

### 👽 关键彩蛋 —— rEx 回应

中后期开始，通关后偶尔出现：

```text
[Incoming Signal…]

…you are parsing…

…you are close…
```

最终阶段：

```text
…you understand now…
```

---

## 4.2 成就系统 —— "解析者等级"

| XP | 等级 | 称号 | 解锁文案 |
|----|------|------|----------|
| 0 | 🔇 | **Signal Lost** | *"你连噪声都分不清"* |
| 30 | 📡 | **First Contact** | *"你捕获到了第一个模式"* |
| 80 | 🔍 | **Pattern Seeker** | *"你的指令开始有结构了"* |
| 150 | ⚡ | **Syntax Parser** | *"协助系统说：跟你合作效率提升了"* |
| 250 | 🛰️ | **Signal Architect** | *"你构建的规则，精确而优雅"* |
| 400 | 🌌 | **Language Decoder** | *"你说一句，AI 懂十句"* |
| 500+ | ✨ | **The Parser** | *"你没有改变信号。你只是学会了理解它。"* |

### 🏅 特殊成就

| 成就 | 条件 | 文案 |
|------|------|------|
| 📡 First Signal | 首关一次 prompt 通过 | *"信号清晰。无需校准。"* |
| ⚡ Speed Parse | 单关 prompt → 通关 < 30 秒 | *"解析速度超出预期"* |
| 📏 Minimal Instruction | 用 ≤ 15 字 prompt 通关 | *"极简指令。极致效果。"* |
| 📖 Noise Overflow | prompt > 200 字但失败 | *"指令噪声过大。信号丢失。"* |
| ⚔️ Manual Override | 手写模式通关任意一关 | *"你不需要协助系统。你就是规则。"* |
| 🗡️ Full Manual | 手写模式通关全部关卡 | *"The system was never needed. You were the parser."* |
| 🔥 Chain Decode | 连续 10 关 Perfect | *"解析链路稳定。零误差。"* |
| 💀 Persistent Parser | 单关 prompt 迭代 10 次仍通过 | *"信号最终被解析。无论花了多久。"* |
| 🌙 Night Shift | 凌晨 2-5 点通关 | *"有些信号，只在深夜才清晰"* |
| 🤖 Human-Machine Sync | prompt + 手动微调 regex 达到最优解 | *"人机协同。完美输出。"* |
| 🧪 Multi-Vector | 同一关用 3 种不同 prompt 风格通关 | *"通往解密的路径不止一条"* |
| 📐 Perfect Engineer | 所有关卡 prompt 评分均 ≥ 90 | *"你的指令不是文字，是精密仪器"* |

---

## 4.3 XP系统 —— "解密进度"

> *信号解密进度取决于你的指令质量*

| 行为 | XP变化 | 系统反馈 |
|------|--------|----------|
| 一次 prompt 通关 | +18 | *"[Efficient] 指令精确。一次解密。"* |
| 两次 prompt 通关 | +12 | *"[Calibrated] 经过校准，规则生效。"* |
| 三次以上通关 | +5 | *"[Decoded] 最终解析成功。效率待优化。"* |
| 手写模式通关 | +25 | *"[Manual Override] 你就是规则。"* |
| 连续通关 (combo) | +5 × combo | *"[Chain Decode] 解析链路持续稳定"* |
| 使用提示 | -3 | *"[Hint Used] 外部信息注入"* |
| Perfect（一次过 + regex 精确） | +8 bonus | *"[Perfect Parse]"* |
| Prompt 评分 ≥ 90 | +5 bonus | *"[Elegant Instruction]"* |
| Prompt ≤ 20 字通关 | +5 bonus | *"[Minimal]"* |
| 手写 + 正则长度最优 | +10 bonus | *"[Optimal Rule]"* |

### 解密进度条

```
📡 信号解密进度
[██████████░░░░░░░░░░] 48%

第一章 ████████ 100%  →  Signal Contact
第二章 ██████░░  72%  →  Pattern Recognition
第三章 ░░░░░░░░   0%  →  Syntax Awakening (Locked)
第四章 ░░░░░░░░   0%  →  Transmission (Locked)
第五章 ░░░░░░░░   0%  →  rEx (Locked)
```

### Combo 系统

```
⚡ x1 → ⚡⚡ x2 → ⚡⚡⚡ x3 → 🔥 CHAIN DECODE x4 → ✨ FULL SYNC x5+
```

链路中断时：*"[Chain Broken] 解析中断。重新校准。"*

---

## 4.4 提示机制 —— "信号辅助系统"

> *当你的解析陷入困境，系统会逐步释放辅助信息*

| 尝试次数 | 提示等级 | 系统反馈 |
|----------|----------|----------|
| 第 1 次失败 | 🔇 无提示 | *"[Parse Failed] 重新分析信号。"* |
| 第 2 次失败 | 💬 指令方向 | *"[Hint] 有些结构，并不是唯一的。"* |
| 第 3 次失败 | 📖 正则方向 + Prompt 模板 | *"[Template Unlocked] 参考指令结构已释放"* |
| 第 5 次失败 | 🆘 几乎完整的 Prompt | *"[Override] 系统已生成参考指令。"* |

---

# 5. 🧱 插件架构设计

## 5.1 技术栈

* VS Code Extension API
* Node.js / TypeScript
* **React 18 + Vite** —— WebView 前端框架（Prompt Panel、Welcome、排行榜等所有 WebView 页面）
* AI Provider 接口（支持 Copilot / OpenAI / 任意 LLM）

---

## 5.2 模块划分

```text
/src
 ├── extension.ts           # 🌌 插件入口 - "系统启动"
 ├── engine/
 │    ├── judge.ts           # 🔍 判题引擎 - "信号验证"
 │    ├── promptScorer.ts    # 📝 Prompt 评分器 - "指令质量评估"
 │    ├── aiProvider.ts      # 🤖 AI 协助系统接口
 │    ├── regexExtractor.ts  # 🔧 从 AI 回复中提取正则
 │    ├── levelLoader.ts     # 📡 关卡加载 - "信号接收"
 │    ├── xpTracker.ts       # 📊 解密进度系统
 │    ├── comboTracker.ts    # ⚡ 连击追踪
 │    └── achievement.ts     # 🏅 成就系统
 ├── ui/
 │    ├── sidebar.ts         # 📡 信号面板（TreeView，非 React）
 │    ├── statusbar.ts       # 📊 状态栏 - 解密进度（非 React）
 │    ├── feedback.ts        # 💬 反馈系统
 │    └── webview/            # ✨ React WebView 宿主（Provider + 消息桥）
 │         ├── promptPanelProvider.ts
 │         ├── welcomeProvider.ts
 │         └── leaderboardProvider.ts
 ├── story/
 │    └── dialogues.ts       # 🌌 剧情文案库
 ├── webview-ui/              # 📦 React 前端（独立 Vite 项目）
 │    ├── package.json
 │    ├── vite.config.ts
 │    ├── tsconfig.json
 │    ├── index.html
 │    └── src/
 │         ├── main.tsx       # React 入口
 │         ├── App.tsx
 │         ├── hooks/
 │         │    └── useVSCode.ts   # acquireVsCodeApi() 封装
 │         ├── components/
 │         │    ├── PromptPanel/
 │         │    ├── Welcome/
 │         │    ├── Leaderboard/
 │         │    └── shared/
 │         └── styles/
 └── data/
      └── levels/            # 📡 关卡数据
           ├── ch1-signal-contact/
           ├── ch2-pattern-recognition/
           ├── ch3-syntax-awakening/
           ├── ch4-transmission/
           ├── ch5-rex/
           └── secret/
```

---

## 5.3 核心模块说明

### ① AI Provider —— "解码协助系统"

* 统一接口，支持多种 AI 后端
* 内置 VS Code Copilot Chat API（零配置）
* 可选：OpenAI API / Azure OpenAI / 本地模型
* 记录每次 prompt ↔ response 用于评分和回放

---

### ② Prompt Scorer —— "指令质量评估"

评分维度：

```
总分 = 正确性(必须) × (简洁度 30% + 一次性 30% + 优雅度 20% + regex质量 20%)
```

* **简洁度**：prompt 字数越少分越高（鼓励精准表达）
* **一次性**：第几次 prompt 才通关（一次过 = 满分）
* **优雅度**：有结构 / 有约束 / 有示例 = 加分
* **regex 质量**：生成的正则长度 + 边界处理

---

### ③ Judge Engine —— "信号验证核心"

* 接收 AI 生成的 regex
* 对比测试用例结果
* 计算匹配精度（Perfect / Partial / Fail）
* 联合 Prompt Scorer 输出综合评分

---

### ④ UI 模块

#### Prompt Panel —— "指令终端"

```
╔══════════════════════════════════════════╗
║  [Signal #3 — Fragment Found]            ║
║                                          ║
║  📡 信号描述：                             ║
║  从截获的通信数据中提取合法邮箱标识           ║
║                                          ║
║  📋 测试数据：                             ║
║  ✦ "test@example.com"                    ║
║  ✦ "bad@@example"                        ║
║  ✦ "user@mail.co"                        ║
║                                          ║
║  ─────────────────────────────────────   ║
║  ✍️ 你的指令：                             ║
║  ┌──────────────────────────────────┐    ║
║  │ 写一个正则，匹配包含单个@且域名    │    ║
║  │ 含点的邮箱地址                     │    ║
║  └──────────────────────────────────┘    ║
║                                          ║
║  [ 🤖 Execute Parse ]  [ ⚔️ Manual ]     ║
╚══════════════════════════════════════════╝
```

#### Sidebar —— "信号解密面板"

```text
📡 /YourEx/ — Signal Decryption
 │
 ├── Ch.1 📡 Signal Contact
 │    ├── ✅ 1 Hello, rEx (Prompt: 87)
 │    ├── ✅ 2 Signal in Noise (Prompt: 92 ⭐)
 │    ├── 🔓 3 Fragment Found
 │    ├── 🔒 4 Echo Pattern
 │    └── 🔒 5 Still There?
 │
 ├── Ch.2 🔍 Pattern Recognition
 │    └── 🔒 (完成第一章解锁)
 │
 ├── Ch.3 ⚡ Syntax Awakening
 │    └── 🔒
 │
 ├── Ch.4 🛰️ Transmission
 │    └── 🔒
 │
 ├── Ch.5 🌌 rEx
 │    └── 🔒
 │
 └── 🌙 [Incoming Signal…]
```

---

#### Status Bar —— "系统状态"

```text
📡 Lv.5 Syntax Parser | XP: 120 | ⚡x3 | Ch.2 🔍 | Prompt Avg: 85 | Decrypt: 48%
```

---

# 6. 🎮 用户交互设计

## 6.1 启动方式

命令面板：

```text
YourEx: Start Decryption     ← 开始解密
YourEx: Signal Progress      ← 查看进度
YourEx: Leaderboard          ← 排行榜
YourEx: Prompt Replay        ← 查看历史指令
```

首次启动显示开场白：

```
╔═══════════════════════════════════════════╗
║                                           ║
║  [System Booting…]                        ║
║                                           ║
║  >> 接入未知信号源…                         ║
║  >> 协议识别失败…                           ║
║  >> 语言结构：未知                          ║
║                                           ║
║  所有异常数据中                              ║
║  都出现同一个标记：                          ║
║                                           ║
║             r E x                         ║
║                                           ║
║  它不是代码，也不是攻击。                     ║
║  它是一种语言。                              ║
║                                           ║
║  你被选中参与这次解析任务。                    ║
║  原因只有一个：你能够定义规则。                ║
║                                           ║
║  [ 🤖 启用协助系统 ]  [ ⚔️ 独立解析 ]       ║
║                                           ║
╚═══════════════════════════════════════════╝
```

---

## 6.2 关卡文件格式（手写模式）

```js
// 📡 signal_1-3.regex.js
//
// ═══════════════════════════════════════
// Ch.1 Signal Contact — [Fragment Found]
// ═══════════════════════════════════════
//
// [Signal Description]
// 在截获的通信数据中，混杂着大量噪声。
// 你需要从中提取出所有合法的邮箱标识。
//
// [Test Data]
//   "test@example.com"
//   "bad@@example"
//   "user@mail.co"
//   "not-an-email"
//
// [Expected Match]
//   "test@example.com", "user@mail.co"
//
// 💡 Prompt 模式：命令面板 → YourEx: Start Decryption
// ⚔️ 手写模式：直接在下面写正则（额外加分）
//
// ═══════════════════════════════════════

export const regex = /你的规则/;
```

---

## 6.3 执行方式

**Prompt 模式：**
* 在指令终端写 prompt → 点击 **🤖 Execute Parse** → 自动判题

**手写模式：**
* **Ctrl+S 保存 → 自动验证** —— *"[Manual Override] 检测到手写规则。验证中……"*
* 或点击状态栏 **📡 Submit Rule** 按钮

---

# 7. 🏁 Promptathon 竞赛设计 —— "谁先解密 rEx"

> **本插件为公司提示词大赛量身定制。核心竞争力：用指令质量决胜负。**

## 7.1 🏃 竞速模式 —— "Speed Decrypt"

* 计时从接收第一个信号开始
* 谁先 **用 prompt** 解密全部信号
* Prompt 模式专属赛道

```
🏆 Speed Decrypt Leaderboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥇 张三  Ch.5 🌌  23:41  Prompt均分:91  ✨ The Parser
🥈 李四  Ch.4 🛰️  25:12  Prompt均分:85  🌌 Language Decoder
🥉 王五  Ch.3 ⚡  28:55  Prompt均分:78  ⚡ Syntax Parser
 4. 赵六  Ch.2 🔍  31:20  Prompt均分:72  🔍 Pattern Seeker
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 7.2 🎯 最优 Prompt 挑战 —— "Minimal Instruction"

> **提示词大赛的灵魂赛道：谁能用最少的字，让 AI 生成最精确的规则？**

* 通关后开启评分模式
* **Prompt 长度 × Prompt 精确度 × Regex 质量** 综合打分
* 同一关可反复挑战刷分

```
📏 Minimal Instruction Leaderboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Signal #3: "Fragment Found"

🥇 张三  Prompt(18字): "匹配标准邮箱格式，    评分: 95
         @仅一次，域名含点"
         → 生成: /^[\w.+-]+@[\w-]+\.\w{2,}$/

🥈 李四  Prompt(8字): "匹配合法邮箱"          评分: 82
         → 生成: /^\S+@\S+\.\S+$/  ⚠️边界宽泛

🥉 王五  Prompt(45字): "请写一个正则表达式，   评分: 71
         用于匹配邮箱地址，邮箱由用户名..."    ⚠️指令冗余
         → 生成: /^[a-zA-Z0-9.]+@[a-z]+\.[a-z]{2,}$/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 7.3 ⚔️ 手写挑战赛 —— "Manual Override"

* 不用 AI，纯手写正则规则
* 独立排行榜
* 最短正则 = 最优雅的规则

```
⚔️ Manual Override Leaderboard
━━━━━━━━━━━━━━━━━━━━━━━━━━
Signal #3: "Fragment Found"
🥇 张三  /^[\w.+-]+@[\w-]+\.\w{2,}$/    (27字符)
🥈 李四  /^\S+@\S+\.\S+$/               (15字符) 🏅Minimal
🥉 王五  /^.+@.+\..+$/                  (12字符) ⚠️宽泛
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 7.4 🧠 Prompt 对决模式 —— "Instruction Duel"（活动亮点）

> **两个解析者，同一信号，同一 AI，不同指令 —— 谁的指令更优？**

* 两两配对，同时开始
* 同一关卡、同一 AI 模型
* 比较：谁的 prompt 更短 + 生成的 regex 更精确
* 观众可在大屏幕上看到双方指令的实时对比

```
⚔️ INSTRUCTION DUEL ⚔️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Signal #8: "Encoded Digits"

  🔴 Parser A                🔵 Parser B
  ──────────                 ──────────
  Instruction:               Instruction:
  "匹配中国手机号，           "match Chinese
  11位，1开头"               mobile number"

  Generated:                 Generated:
  /^1\d{10}$/                /^1[3-9]\d{9}$/

  Signal: 5/5 ✅             Signal: 5/5 ✅
  Prompt: 14字               Prompt: 27字符
  Regex: 10字符              Regex: 13字符

  🏆 Parser A wins — More efficient instruction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 7.5 🎪 现场互动设计（公司活动专属）

### 大屏幕实时播报

```
═══ 📡 LIVE DECRYPTION ══════════════════════════════
  张三 用 12 字指令解密了 [Fragment Found]  Prompt评分: 94!
  李四 的指令让 AI 生成了无效规则 🚫  协助系统故障
  王五 切换 Manual Override 解密了 [Repeat Protocol] ⚔️
  赵六 触发了 FULL SYNC ✨
  🏆 当前最短指令记录：张三 8字 解密 [Hello, rEx]
  📡 全场解密总进度：67%
═══════════════════════════════════════════════════════
```

### 全场事件

* **有人用 ≤ 10 字 prompt 通关** → 全场广播 + *"[Minimal Instruction Detected]"*
* **有人手写模式通关** → 大屏幕特效 + *"[Manual Override] 检测到独立解析者"*
* **有人获得 ✨ The Parser** → 大屏幕特效 + 终局文案播放
* **全场解密总进度到 100%** → 解锁全场彩蛋 + rEx 终局回应
* **Instruction Duel** 环节 → 大屏幕双人分屏，全场投票猜谁赢

### 🏅 活动专属奖项

| 奖项 | 评选标准 | 奖品建议 |
|------|----------|----------|
| 🏆 **The Parser** | 全信号 Prompt 均分最高 | 大奖 |
| ⚡ **Speed Decrypt** | 通关最快 | 效率之星 |
| 📏 **Minimal Instruction** | 全关卡 Prompt 总字数最少 | 指令之美 |
| ⚔️ **Manual Override** | 手写模式通关最多 | 真·正则大师 |
| 💀 **Persistent Parser** | 失败最多次但最终通关 | 毅力之星 |
| 😂 **Best Malfunction** | prompt 导致 AI 生成最离谱的正则 | 快乐源泉 |
| 🌙 **Night Shift** | 最晚还在刷分的人 | 深夜解析者 |

---

# 8. 📊 排行榜系统

## 本地版本

* 存 JSON 文件

## 在线版本（活动用）

* WebSocket 实时推送到大屏幕
* API + 轻量数据库

记录维度：

| 维度 | 说明 | 排行榜名 |
|------|------|----------|
| Prompt 均分 | 所有关卡 prompt 评分平均值 | 🧠 Instruction Quality |
| 通关速度 | 总用时 | ⚡ Speed Decrypt |
| 总 XP | 解密进度总分 | 📡 Decryption Progress |
| Prompt 总长度 | 所有 prompt 累计字数（越少越好）| 📏 Minimal Instruction |
| 手写通关数 | 不用 AI 通关的关卡数 | ⚔️ Manual Override |
| 连击最高 | 最长 combo | 🔥 Chain Decode |
| 成就数量 | 解锁最多 | 🏅 Achievement Hunter |

---

# 9. ⚠️ 风险与对策

| 风险 | 对策 | 设计保险 |
|------|------|----------|
| AI 不稳定 | 支持多个 AI 后端 + 本地 fallback | 手写模式作为保底 |
| Prompt 太容易 | 后期关卡需要精确约束才能通关 | AI 对模糊 prompt 会生成宽泛正则 |
| 太难，劝退 | 第一章极简单，教学关自带 prompt 模板 | 前 3 关是 warm up，10 秒能过 |
| 无反馈 | 每一步都有系统反馈 + prompt 评分 | 提交即判题，零等待 |
| 无聊 | 科幻叙事 + 成就 + combo + 排行榜 + 对决模式 | 信号解密的沉浸感 |
| 安装复杂 | 零依赖，装插件即玩，内置 Copilot 对接 | 关卡数据内置 |
| 科幻主题太重 | 文案克制，不喊口号，系统在说话 | 科技感而非中二感 |
| 抄 prompt | 每关可多次挑战，最高分计入排行 | prompt 回放功能可追溯 |
| AI 模型差异 | 活动统一指定 AI 模型 | 本地部署或统一 API |

---

# 10. 🚀 MVP开发计划

## Day 1 —— "[System Booting]"

* 基础插件框架 + 项目结构
* Level Loader（JSON 关卡加载）
* AI Provider 接口（对接 Copilot / OpenAI）
* 第一章关卡数据（5 关）

## Day 2 —— "[Signal Processing]"

* Judge Engine（判题引擎）
* Prompt Scorer（prompt 评分系统）
* Regex Extractor（从 AI 回复中提取正则）
* 反馈系统（成功/失败/错误三种状态）

## Day 3 —— "[First Contact]"

* Prompt Panel（指令输入面板）
* Sidebar（信号面板 + 解密进度 + prompt 分数）
* Status Bar（等级 + combo + prompt 均分 + 解密进度）
* XP 系统 + 开场白

## Day 4 —— "[Full Sync]"（活动前）

* 排行榜系统（本地 + 在线）
* 全部 5 章关卡数据（25 关）
* Instruction Duel 对决模式
* 大屏幕播报页面

👉 Day 3 结束即可用于比赛！Day 4 锦上添花。

---

# 11. 📈 后续扩展

* 🌐 在线排行榜 + 实时大屏（WebSocket）
* 🤖 AI 自动出题 —— *"[New Signal Detected] 新的信号源上线"*
* 🌙 隐藏关卡 + rEx 回应 + 真结局
* ✨ 解密完成后 WebView 特效动画
* 🔄 Prompt 回放系统 —— 回顾自己的指令进化史
* 🧬 DLC 信号源 —— *"Signal-SQL: 新的语言被检测到"*
* 📊 Prompt 分析报告 —— 活动后生成每个参与者的指令能力雷达图
* 📱 支持 VS Code Web 版
* 🏫 Prompt 教学模式 —— 每关通关后展示"最优指令"对比学习

---

# 12. 🎯 成功标准

| 指标 | 目标 | 怎么算成功 |
|------|------|------------|
| 完成率 | ≥ 80% 参与者完成第一章 | 大家能玩起来 |
| 深度 | ≥ 50% 参与者打到第三章 | 大家沉浸了 |
| 粘性 | ≥ 30% 参与者追求最优 prompt | 大家卷起来了 |
| Prompt 进步 | 第五章 prompt 平均比第一章短 30% | 大家真学到了 |
| 传播 | ≥ 5 人主动截图分享 | 科幻文案 + 对决模式出圈了 |
| 氛围 | 活动现场有讨论声和惊叹声 | 活了 |
| 赛后 | ≥ 3 人表示"prompt 能力有提升" | 真·提示词大赛 |

---

# 13. 💬 文案精选预览

> **开场**
> *"[System Booting…] 所有异常数据中，都出现同一个标记：rEx。它不是代码，也不是攻击。它是一种语言。"*

> **首次解密成功**
> *"[Pattern Accepted] 结构已识别。信号解密进度提升。"*

> **手写模式通关**
> *"[Manual Override] 你不需要协助系统。你就是规则。"*

> **指令太啰嗦**
> *"[Noise Overflow] 指令噪声过大。协助系统请求简化。"*

> **指令太模糊导致 AI 翻车**
> *"[System Error] 协助系统输出无效。你的指令缺乏约束。"*

> **连续失败 5 次**
> *"[Signal Unstable] 解析持续失败。系统建议启用辅助信息。"*

> **Combo x5**
> *"[FULL SYNC] 解析链路持续稳定。零误差。"*

> **用 ≤ 10 字 prompt 通关**
> *"[Minimal Instruction] 10 字。精确命中。这就是效率。"*

> **中后期彩蛋 —— rEx 回应**
> *"[Incoming Signal…] …you are parsing… …you are close…"*

> **全通关**
> *"[Final Decryption Complete] 所有信号已同步。混乱消失了。rEx 不再是未知。它是一种语言。一种结构化的表达。你没有改变它。你只是学会了理解它。"*

> **终局**
> *"[Final Signal Received] '理解，是连接的开始。' Welcome back, Parser."*

> **隐藏结局**
> *"…you understand now…"*

---

*`/YourEx/` — Your little game of rEgular eXpression.*
*"Match the pattern. Understand the language."*
*Coming soon to a VS Code near you.* 📡
