# YourEx 多题型输入格式与多候选判题设计书 (v2)

## 1. 文档目的

本设计书用于解决 YourEx 现有题型输入格式过于单一的问题。

当前项目中的普通关卡默认假设为：

1. `input` 是一个字符串数组。
2. 判题时逐行执行正则匹配。
3. `expected` 也是按"命中的整行"来表达。

这个模型对 Chapter 1-5 的普通文本关卡是成立的，但对 Chapter 6 `Origin Frame` 这类"取证视图 / hexdump / 多列文本 / 多种理解路径并存"的特殊题型不成立。

本 v2 版本相对 v1 的关键修正：

1. 用 `level_26.json` 真实数据校正了列号边界。
2. 新增 `decode: 'hex-bytes'` 投影步骤，覆盖"hex 还原为 ASCII 后再判题"的合理玩家视角。
3. 简化 schema：删除 `passStrategy`、`LineSelection.mode`，合并 `lineJoiner/segmentJoiner` 为单一 `joiner`。
4. 显式定义 `matched-substrings` 模式下的 perfect / pass / partial / fail 判定规则。
5. 显式定义 legacy profile 的兜底策略。
6. 明确顶层 `level.expected` 与 profile 内 `expected` 的优先级。

---

## 2. 现状与问题

## 2.1 当前代码路径

当前关卡判题链路如下：

1. `src/types/level.ts` — `Level` 结构只包含 `input` 与 `expected`，无输入预处理配置。
2. `src/engine/levelLoader.ts` — 直接 `JSON.parse` 反序列化为 `Level`。
3. `src/engine/decryptionPipeline.ts` — 调用 `judge(extracted.regex, level.input, level.expected)`。
4. `src/engine/judge.ts` — `input.filter(line => regex.test(line))` 逐行匹配。

这意味着当前系统默认只有一种输入理解：

1. 每一行是独立的可判题单元。
2. 正则运行目标是"整行字符串"。
3. 命中结果是"原始输入行本身"。

## 2.2 当前模型的局限

这个模型在以下场景下会出问题：

1. 目标结构横跨多行（hexdump 的 ASCII 列每行只有 16 字节，目标帧需要连接 ~7 行）。
2. 输入存在明显的"列结构"（地址列、十六进制列、ASCII 旁注列）。
3. 同一题目允许多种等价理解方式。
4. 用户写出的正则是在匹配某个"投影结果"（例如解码后的 ASCII），而不是匹配原始整行。

## 2.3 Level 26 的典型矛盾

`level_26 / Origin Frame` 是当前最典型的样例。

剧情上是"二进制残骸中的结构取证"，玩家可能会出现多种合理理解：

1. 把整个 dump 当成一段连续 hex 字节流，解码为 ASCII 后正则匹配。
2. 直接对原始 input 逐行匹配（注定无法命中跨行的目标帧）。
3. 仅看右侧 ASCII 旁注列（每行只有 16 字符，无法独立组成完整目标）。

设计上必须接受第 1 种合理理解，同时不破坏所有普通关卡的第 2 种行为。

---

## 3. 设计目标

1. **不改造普通关卡的默认行为**——legacy 路径必须保留且未触动。
2. 允许特殊关卡在 JSON 中声明自己的输入判题方式。
3. 允许一个关卡配置多个"输入理解组合"。
4. 只要用户命中了任一合法组合，就判定为通过。
5. 支持按列裁剪、按行筛选、hex 解码、按整段文本判题。
6. 让 Level 26 成为第一个使用者，但结构对未来题型通用。

---

## 4. 非目标

1. 不引入真实二进制解析器（hex 解码只做 byte→char 直翻）。
2. 不改变 AI provider 的请求协议。
3. 不重做 PromptPanel 的整体 UI。
4. 不要求所有历史关卡迁移。

---

## 5. 核心结论

不建议只新增一个简单的"是否合并全部行"的布尔标志位。

原因是：

1. 单一布尔值无法表达"先按列裁剪，再按 hex 解码，再合并"。
2. 无法表达"本关允许多种理解都算对"。
3. 无法表达"匹配子串"与"匹配整行"两种 result 语义的区别。

因此将"标志位"升级为**关卡级判题输入配置对象** `judgeConfig`，并以 `profile` 形式支持多个候选组合。

---

## 6. 设计方案概览

在关卡 JSON 中新增可选结构 `judgeConfig`。

- 不存在 → 当前 legacy 行为（完全保留）。
- 存在 → 依次执行各 profile 判题，外加一个隐式 legacy profile 兜底，取最高状态作为最终结果。

---

## 7. 数据结构

```ts
interface Level {
  id: string;
  title: string;
  chapter: number;
  story: string;
  difficulty: 'easy' | 'medium' | 'hard';
  promptChallenge: string;
  input: string[];
  expected: string[];
  hints: string[];
  promptHints: string[];
  feedback: { onPass: string; onFail: string; onPerfect: string; onDirectWrite: string };
  judgeConfig?: JudgeConfig;
}

interface JudgeConfig {
  profiles: JudgeProfile[];
  /** 是否在所有 profile 之外再加一次 legacy（per-line + matched-lines）判题。默认 true。 */
  includeLegacy?: boolean;
}

interface JudgeProfile {
  id: string;
  label?: string;
  description?: string;
  source: InputProjection;
  match: MatchPolicy;
  /** 该 profile 的期望命中。缺省时回退到 level.expected。 */
  expected?: string[];
}

interface InputProjection {
  /** 行筛选，0-based，end-exclusive。缺省 = 所有行。 */
  lineRange?: { start?: number; end?: number };
  /** 每行裁剪的列区间，0-based，end-exclusive。缺省 = 整行。多个区间按顺序拼接。 */
  columnRanges?: { start: number; end?: number }[];
  /** 投影后是否按 hex 字节解码为字符（"7F 45 4C" → "\x7FEL"）。默认 'none'。 */
  decode?: 'none' | 'hex-bytes';
  /** 是否将所有行合并为一个大字符串。默认 false。 */
  mergeLines?: boolean;
  /** mergeLines=true 时的行间连接符。默认 ''。decode='hex-bytes' 时无意义（已转字节流）。 */
  joiner?: string;
  /** 是否对每个 column segment 做 trim。默认 false。 */
  trimEachSegment?: boolean;
}

interface MatchPolicy {
  /** per-line：对投影结果每行 test；whole-input：对整段 test/exec。默认 per-line。 */
  scope?: 'per-line' | 'whole-input';
  /** matched-lines：命中结果取整行；matched-substrings：命中结果取实际匹配子串。默认 matched-lines。 */
  resultMode?: 'matched-lines' | 'matched-substrings';
}
```

---

## 8. 字段语义

## 8.1 `judgeConfig`

不存在时完全走 legacy 路径，零行为差异。

存在时执行：依次对每个 profile 投影 + 判题，再叠加 legacy 兜底（除非 `includeLegacy=false`），取**状态优先级最高的结果**返回。

## 8.2 `profiles`

每个 profile 表示一种"用户可能采用的合理理解"。这些 profile 不是不同难度，而是同一答案的多种合法视角。

## 8.3 `lineRange`

0-based、end-exclusive。`{ start: 39, end: 50 }` 表示取第 39、40 ... 49 行。

## 8.4 `columnRanges` —— Level 26 真实列边界

> ⚠ v1 的 `[10, 58)` `[60, ...)` 边界是错误的。以下用真实 hexdump 行验证：
>
> ```
> "00000000  7F 45 4C 46 02 01 01 00 41 55 4D 4F 56 49 4F 00  .ELF....AUMOVIO."
>  0       7  8 9 ...
> ```
>
> 行总长 75 字符，结构：
>
> | 区段 | 范围 (end-exclusive) | 说明 |
> |---|---|---|
> | 地址列 | `[0, 8)` | 8 位十六进制地址 |
> | 分隔 | `[8, 10)` | 2 个空格 |
> | 十六进制列 | `[10, 57)` | 16 字节，2 hex char + 1 空格 × 16 = 47 字符（最后无尾空格） |
> | 分隔 | `[57, 59)` | 2 个空格 |
> | ASCII 旁注 | `[59, 75)` | 16 字符，不可打印字节用 `.` 代替 |

规则：

1. 0-based，`start` 包含、`end` 不包含。
2. `end` 缺省 = 取到行尾。
3. 越界自动安全裁剪，不抛异常。
4. 多个 range 按顺序拼接（中间不插字符）。

## 8.5 `decode: 'hex-bytes'` —— 新增字段

这是 v1 缺失的关键能力。

行为：

1. 取 `columnRanges` 投影后的字符串，按 `/[0-9A-Fa-f]{2}/g` 提取所有 hex byte token。
2. 每个 byte token 转为对应字符（含不可打印字符）。
3. 输出"解码后的 ASCII/二进制串"。
4. 此后所有行的解码字节按 `joiner`（默认空串）拼接为一段 `whole-input` 字符串。

例：行 `"7F 45 4C 46 02 01 01 00 41 55 4D 4F 56 49 4F 00"` → `"\x7FELF\x02\x01\x01\x00AUMOVIO\x00"`。

## 8.6 `scope`

1. `per-line` — 对投影结果中的每一行分别 `test`/`exec`。
2. `whole-input` — 把投影结果用 `joiner` 拼成一段字符串，对整段 `test`/`exec`。

普通关卡默认 `per-line`；Level 26 用 `whole-input`。

## 8.7 `resultMode`

1. `matched-lines` — 兼容当前 legacy 行为，命中结果是被命中的"行"本身。
2. `matched-substrings` — 命中结果是 `match[0]`，即实际匹配到的那段子串。

`whole-input` + `matched-substrings` 是 Level 26 的关键组合。

## 8.8 `expected` 的语义

- profile 内 `expected` 缺省时回退到顶层 `level.expected`。
- 在 `matched-substrings` 模式下：
  - 命中子串自动**去重**后与 `expected` 集合比较。
  - perfect / pass / partial / fail 判定见 §9.4。
- 顶层 `level.expected` **始终保留**，至少用于 UI 展示参考答案与 legacy 兜底 profile。

---

## 9. 判题语义

## 9.1 通过策略

> **任一 profile（含 legacy 兜底）通过即整关通过。**

不需要 `passStrategy` 字段（v1 中此字段唯一可选值就是 `any-profile`，YAGNI）。

## 9.2 状态优先级

`perfect > pass > partial > fail > error`

最终返回所有 profile 中**优先级最高**的那个 `JudgeResult`，并附带 `profileId` 调试字段。

同优先级时取**第一个 profile**（按声明顺序，legacy 永远排最后）。

## 9.3 Legacy 兜底

`includeLegacy !== false` 时（即默认），系统会在所有显式 profile 之后，**额外**执行一次：

1. `source = { mergeLines: false }`（即原始 `level.input`）
2. `match = { scope: 'per-line', resultMode: 'matched-lines' }`
3. `expected = level.expected`

这保证了：

1. 即使一个加了 `judgeConfig` 的关卡，玩家若写出能"逐行命中原始 expected"的正则，仍然会被判通过。
2. 与"用户多种理解都算对"的核心诉求一致。

## 9.4 `matched-substrings` 下的状态判定

用与 legacy 完全相同的集合判定，但比较对象是**去重后的命中子串数组**：

```
matched = uniq(执行 regex.exec/matchAll 拿到的所有 match[0])
status = determineStatus(matched, expected)
  perfect: matched 集合 == expected 集合 且长度相等
  pass:    expected 全部命中 且 matched 中无 expected 之外的额外项
  partial: expected 部分命中
  fail:    expected 一项未中
```

正确性要求：

1. 对带 `g`/`y` flag 的正则，必须新建 RegExp 副本或在每次复用前重置 `lastIndex`。
2. 若用户的正则没有 `g` flag，内部强制添加以收集所有 match。
3. 对 `match[0] === ''` 的零宽匹配，递增 `lastIndex` 防止死循环。

## 9.5 调试信息

`JudgeResult` 增加可选字段：

1. `profileId?: string` — 最终命中的 profile id（legacy 用 `'__legacy__'`）。
2. 不强制要求暴露 preparedInputPreview 给 UI；可在开发模式下打 log。

---

## 10. Level 26 的最终配置

> 关键原则：只用一个 profile 就能覆盖玩家的核心理解（hex→ASCII 解码后整段查找），其余靠 legacy 兜底。

```json
{
  "judgeConfig": {
    "profiles": [
      {
        "id": "hex-decoded-whole",
        "label": "将 hex 列解码为 ASCII 后整段匹配",
        "description": "把 hexdump 中段 [10,57) 的字节解码为字符流，正则在整段中查找子串。",
        "source": {
          "columnRanges": [{ "start": 10, "end": 57 }],
          "decode": "hex-bytes",
          "mergeLines": true,
          "joiner": ""
        },
        "match": {
          "scope": "whole-input",
          "resultMode": "matched-substrings"
        }
      }
    ]
  }
}
```

profile 没有显式 `expected`，因此回退到顶层 `level.expected`：

```
"rEx[ORIGIN:AUMOVIO-PLANT7|VEHICLE:E3-SUV|ECU:VCU_GATEWAY|BUILD:20260422|SEED:7FA19C2D|PHRASE:WE_WERE_THE_PARSER]"
```

Legacy 兜底自动追加。玩家若能写出严格正则，命中两处合法 Origin Frame，去重后等于 `expected` 单元素 → `perfect`。

> v1 中"只取 ASCII 旁注列"的 profile 已删除——每行 ASCII 旁注只有 16 字符且不可打印字节会被替换为 `.`，跨行拼接会得到 `rEx[ORIGIN:AUMOV` `IO-PLANT7|VEHICL` ... 中夹杂噪点的串，无法用单条正则可靠匹配 expected。
>
> v1 中的"hex 字节字符串原样匹配" profile 也删除——expected 写成 hex 字符串既脆弱又重复。`decode: 'hex-bytes'` 已经是更直接的视角。

---

## 11. 对现有代码的影响

## 11.1 `src/types/level.ts`

新增可选 `judgeConfig: JudgeConfig` 字段及其相关类型定义。可选字段，向后兼容。

## 11.2 `src/engine/levelLoader.ts`

`JSON.parse` 已经天然支持新字段，**无需改动**。

## 11.3 `src/engine/inputProjection.ts`（新增）

`projectInput(input: string[], source: InputProjection): string[]` —— 纯函数，按 lineRange → columnRanges → decode → mergeLines + joiner 顺序应用。

## 11.4 `src/engine/judge.ts`

1. 现有 `judge()` / `judgeFromString()` **完全不动**（legacy 路径）。
2. 新增 `judgeWithConfig(regex, level)`：
   - 无 `judgeConfig` → 直接 fallback 到 `judge()`。
   - 有 `judgeConfig` → 对每个 profile 投影 + 按 MatchPolicy 判题，再追加 legacy 兜底，取最高状态返回。
3. 新增 `judgeFromStringWithConfig(rawRegex, level)`，用于手动判题。

## 11.5 `src/engine/decryptionPipeline.ts`

将 `judge(extracted.regex, level.input, level.expected)` 替换为 `judgeWithConfig(extracted.regex, level)`。
`runManualJudge` 同样切换到 `judgeFromStringWithConfig`。

普通关卡（无 `judgeConfig`）行为完全不变。

## 11.6 `webview-ui/src/components/PromptPanel/index.tsx`

不要求改动。UI 仍展示 `level.input` 与 `level.expected`，profile 投影是判题内部语义。

## 11.7 locale 结构注意事项

`judgeConfig` 是结构性数据。短期内每个 locale 文件都包含一份相同的 `judgeConfig`；长期再考虑结构与文案分离。

---

## 12. 正确性要求

1. 对带 `g`/`y` flag 的正则，每次执行前重置 `lastIndex` 或使用本地副本。
2. `matched-substrings` 的比较对象是**去重后**的 `match[0]` 数组。
3. `columnRanges` 越界安全裁剪。
4. profile 数组为空 → 仅 legacy 兜底生效。
5. profile 抛异常 → 该 profile 视为 `error`，不影响其它 profile 与 legacy 兜底。

---

## 13. 迁移策略

1. **第一步**：仅 Level 26 的三个 locale JSON 加 `judgeConfig`。
2. **第二步**：未来日志窗口、表格列、协议帧、源码片段类题型直接复用此机制。
3. **第三步**：若机制成熟，在关卡编辑规范中正式纳入。

---

## 14. 一句话总结

把 YourEx 的关卡输入模型从"单一逐行文本"升级为"可声明式投影 + 多视角判题 + legacy 自动兜底"，让 Level 26 这种跨行 hexdump 题自然成立，而不是挤进普通题假设里——同时保证所有普通关卡零行为变化。
