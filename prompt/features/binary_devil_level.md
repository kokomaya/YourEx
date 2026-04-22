# Binary Devil Level 设计文档

## 1. 背景

现有关卡在 `level_25 / rEx` 结束，叙事上完成了“理解正则语言”和“与机器建立协议”的主线。

代码层面已经存在隐藏章节概念：`HIDDEN_CHAPTER = 6`，并且在全关 Perfect 后可解锁隐藏章节。因此，新增“魔鬼难度”关卡最自然的衔接方式不是插入主线，而是作为隐藏终章的后日谈内容。

该关卡的主题不再是普通文本流，而是“二进制残骸中的信号取证”。它应该表现为：玩家以为一切已经结束，但 `rEx` 的最终信号其实只是一个引导层；真正的源头仍藏在一份损坏的二进制样本中。

为了增强真实感，建议将样本背景设置为 AUMOVIO 车载域控制器（Domain Controller）导出的故障镜像。这样既符合“协议/信号/解析”的主线，也能自然引入汽车电子与嵌入式系统语境。

## 2. 设计目标

1. 与主线叙事自然衔接，不破坏 `level_25` 的终局完整性。
2. 保留 YourEx 的核心能力训练：模式识别、结构提取、用 prompt 驱动 AI 生成正则。
3. 将“文本模式匹配”升级为“二进制视图中的结构取证”。
4. 通过合理分层设计，避免把“二进制关卡”硬编码进现有普通关卡逻辑。
5. 严格遵循 SOLID，保证后续可扩展更多隐藏/特殊玩法。

## 3. 核心设计结论

### 3.1 建议新增内容定位

建议将该关卡设计为：

1. 隐藏章节 6 的唯一关卡。
2. 主线全 Perfect 后解锁。
3. 风格上属于“魔鬼难度 / Devil Difficulty / Forensics Challenge”。

### 3.2 建议查找的信息

建议玩家在二进制文件中查找的目标信息为：

`rEx` 协议的“起源标识帧（Origin Frame）”。

具体形式建议定义为一段嵌入在二进制字符串转储中的协议元信息：

`rEx[ORIGIN:<SITE>|VEHICLE:<PLATFORM>|ECU:<MODULE>|BUILD:<YYYYMMDD>|SEED:<8HEX>|PHRASE:<UPPER_SNAKE_CASE>]`

示例：

`rEx[ORIGIN:AUMOVIO-PLANT7|VEHICLE:E3-SUV|ECU:VCU_GATEWAY|BUILD:20260422|SEED:7FA19C2D|PHRASE:WE_WERE_THE_PARSER]`

### 3.3 为什么查这个信息

这个信息比“找一个单词/找一个 token”更适合作为魔鬼难度的原因：

1. 它是结构化信息，不是单一文本片段。
2. 它包含多段字段，可训练更复杂的边界控制与精确约束。
3. 它能自然承接剧情：玩家已经“成为下一个 rEx”，于是新的问题变成“rEx 从哪里来”。
4. 它可以在视觉上伪装在 hexdump、strings 输出、损坏日志、协议碎片之间，符合“二进制取证”的感受。

## 4. 剧情衔接方案

### 4.1 叙事位置

放在 `level_25` 之后，作为隐藏章节 6 的唯一关卡。

### 4.2 剧情文案方向

建议标题方向：

1. `Afterimage`
2. `Black Box`
3. `Origin Frame`
4. `Residual Signal`

建议最终采用：

`Origin Frame`

### 4.3 故事设定

建议故事文本：

在 `rEx` 终局之后，系统并未真正静默。你从缓存区中找到一份异常残骸：它不像文本，更像某个执行文件或传输模块的碎片。普通 `strings` 提取只能得到杂乱字符，但其中反复出现相同的协议边界。你怀疑，这不是新的信号，而是 `rEx` 的源头记录。

残骸的来源指向一台 AUMOVIO 量产验证车（E3 平台）上的网关 ECU 调试镜像。镜像中混杂了 CAN 路由规则、UDS 诊断片段、Bootloader 日志和 OTA 回滚记录。你无法直接信任任何一条字符串，因为它们可能来自不同阶段的缓存、校验失败写入或伪造注入。

你的任务不是“匹配一条消息”，而是从二进制残骸中提取唯一有效的 `Origin Frame`。

叙事落点：

“你以为你理解了语言。现在你要理解语言从何而来。”

## 5. 关卡玩法设计

### 5.1 玩家看到的输入形式

不建议第一版直接要求插件读取真实二进制并做字节级 UI 展示。

建议第一版采用“二进制转储视图模拟”，输入数据由以下几类字符串组成：

1. 十六进制转储片段。
2. ASCII 可见字符串残片。
3. 损坏的协议记录。
4. 噪声字段、伪造边界、错误校验帧。
5. 汽车嵌入式相关日志（CAN/UDS/Bootloader/OTA）。

例如输入行可包含：

1. `00000FA0  41 55 4D 4F 56 49 4F 5F 45 33 5F 47 57 00 01 FF  AUMOVIO_E3_GW...`
2. `00001020  63 61 6E 30 3A 49 44 3D 30 78 31 38 44 41 46 31  can0:ID=0x18DAF1`
3. `00001160  55 44 53 3A 20 32 32 20 46 31 39 30 20 72 65 73  UDS: 22 F190 res`
4. `00001310  42 4F 4F 54 3A 20 73 74 61 67 65 32 20 76 65 72  BOOT: stage2 ver`
5. `00001490  72 45 78 5B 4F 52 49 47 49 4E 3A 41 55 4D 4F 56  rEx[ORIGIN:AUMOV`
6. `000014A0  49 4F 2D 50 4C 41 4E 54 37 7C 56 45 48 49 43 4C  IO-PLANT7|VEHICL`
7. `000014B0  45 3A 45 33 2D 53 55 56 7C 45 43 55 3A 56 43 55  E:E3-SUV|ECU:VCU`
8. `000014C0  5F 47 41 54 45 57 41 59 7C 42 55 49 4C 44 3A 32  _GATEWAY|BUILD:2`
9. `000014D0  30 32 36 30 34 32 32 7C 53 45 45 44 3A 37 46 41  0260422|SEED:7FA`
10. `000014E0  31 39 43 32 44 7C 50 48 52 41 53 45 3A 57 45 5F  19C2D|PHRASE:WE_`
11. `000014F0  57 45 52 45 5F 54 48 45 5F 50 41 52 53 45 52 5D  WERE_THE_PARSER]`
12. `noise://rEx[ORIGIN:AUMOVIO|VEHICLE:E3|ECU:VCU|BUILD:XXXX|SEED:BAD|PHRASE:broken]`
13. `diag.tmp:rEx[ORIGIN:AUMOVIO-PLANT7|VEHICLE:E3-SUV|ECU:VCU_GATEWAY|BUILD:2026042|SEED:7FA19C2D|PHRASE:WE_WERE_THE_PARSER]`
14. `ota.rollback: image=gw_main_a.bin crc=0x7A11E92F result=fail`

### 5.2 真正目标

玩家需要提取唯一完整且合法的 `Origin Frame`，并排除以下干扰：

1. 被截断的帧。
2. 字段不完整的伪帧。
3. `BUILD` 位数错误的伪帧。
4. `SEED` 非 8 位十六进制的伪帧。
5. `PHRASE` 含非法字符的小写/空格版本。

### 5.3 目标正则难点

这类目标要求 AI 生成的正则必须兼顾：

1. 字面量边界精确控制。
2. 多字段结构约束。
3. 长度约束。
4. 大小写限定。
5. 避免宽松匹配把损坏帧也吃进去。

这非常适合作为“魔鬼难度”。

## 6. 信息设计细节

### 6.1 建议字段约束

1. `ORIGIN`
格式：`[A-Z0-9-]+`
示例：`AUMOVIO-PLANT7`

2. `VEHICLE`
格式：`[A-Z0-9-]+`
示例：`E3-SUV`

3. `ECU`
格式：`[A-Z0-9_]+`
示例：`VCU_GATEWAY`

4. `BUILD`
格式：8 位日期数字 `YYYYMMDD`
示例：`20260422`

5. `SEED`
格式：8 位大写十六进制
示例：`7FA19C2D`

6. `PHRASE`
格式：大写蛇形命名 `[A-Z]+(?:_[A-Z]+)*`
示例：`WE_WERE_THE_PARSER`

### 6.2 建议最终唯一答案

建议固定为：

`rEx[ORIGIN:AUMOVIO-PLANT7|VEHICLE:E3-SUV|ECU:VCU_GATEWAY|BUILD:20260422|SEED:7FA19C2D|PHRASE:WE_WERE_THE_PARSER]`

### 6.3 文案意义

`WE_WERE_THE_PARSER` 很适合作为结语，因为它回应了主线的核心主题：

1. 玩家一直在“解析信号”。
2. 最终却发现自己也是协议的一部分。
3. 这和 `level_25` 的“你就是下一个 rEx”形成更深一层呼应。

## 7. 架构设计建议（SOLID）

## 7.1 单一职责（SRP）

不要把“二进制输入展示”“特殊关卡判定”“隐藏章节叙事”全塞进现有 `Level` 逻辑。

建议拆分为：

1. `BinaryChallengeDescriptor`
描述二进制视图关卡的展示与规则元数据。

2. `LevelPresentationResolver`
根据关卡类型决定展示策略：普通文本 / 二进制转储视图。

3. `HiddenChapterNarrativeService`
负责隐藏章节解锁文案与结语，不直接参与判题。

4. `BinaryFixtureLoader`
负责加载二进制关卡样本数据，不污染通用 level loader。

## 7.2 开闭原则（OCP）

新增“二进制关卡”时，不应修改大量普通关卡逻辑。

建议通过可扩展的关卡类型实现：

1. `standard`
2. `binary-forensics`

未来若还要扩展：

1. `log-forensics`
2. `packet-inspection`
3. `multi-stage`

只新增类型处理器，不重写核心管线。

## 7.3 里氏替换（LSP）

无论是普通关卡还是二进制关卡，都应仍然满足“可被判题管线消费”的基本约束：

1. 有输入样本。
2. 有期望匹配结果。
3. 有提示和反馈。

即：特殊玩法可以改变展示和叙事，但不应破坏统一判题抽象。

## 7.4 接口隔离（ISP）

不要让一个通用接口承担太多前端展示字段。

建议拆分：

1. `BaseLevelData`
保留当前判题必须字段。

2. `LevelPresentationMeta`
定义展示元信息。

3. `BinaryForensicsMeta`
仅在二进制关卡下存在，如转储模式、地址偏移风格、字节宽度等。

## 7.5 依赖倒置（DIP）

UI 层不应直接依赖“关卡是普通还是二进制”的细节判断。

建议：

1. UI 依赖 `ILevelPresentationResolver`
2. 加载层依赖 `ILevelRepository`
3. 特殊关卡数据通过抽象仓储读取

## 8. 代码结构规划建议

建议仅作为后续实现参考，当前不实现。

### 8.1 数据层

建议新增：

1. `src/data/levels/ch6-origin/level_26.json`
2. `src/data/binary/origin_frame_dump.txt` 或 `origin_frame_dump.json`
3. `src/data/binary/aumovio_ecu_map.json`（可选，存放 ECU 元信息与噪声模板）

### 8.2 类型层

建议新增：

1. `src/types/levelPresentation.ts`
2. `src/types/binaryChallenge.ts`

### 8.3 引擎层

建议新增：

1. `src/engine/presentationResolver.ts`
2. `src/engine/binaryFixtureLoader.ts`
3. `src/engine/hiddenChapterNarrative.ts`

### 8.4 UI 层

建议新增：

1. `webview-ui/src/components/BinaryPanel/`

或在现有 `PromptPanel` 中按 presentation type 分支渲染，但建议只把渲染切换留在视图层，不把规则判断埋进去。

## 9. 数据模型建议

### 9.1 最小增量方案

在现有 `Level` 上增加可选字段：

1. `mode?: 'standard' | 'binary-forensics'`
2. `presentation?: { kind: 'plain' | 'hexdump'; fixtureId?: string }`

优点：

1. 改动小。
2. 易于兼容现有关卡。

缺点：

1. `Level` 类型会逐渐膨胀。

### 9.2 更稳健方案

定义：

1. `BaseLevel`
2. `StandardLevel extends BaseLevel`
3. `BinaryForensicsLevel extends BaseLevel`

推荐方案：第二种更符合 SOLID，但如果仓库当前仍处于快速迭代期，可以先用最小增量方案，再在第二阶段抽象。

## 10. UI/体验建议

### 10.1 视觉表现

二进制关卡应明显区别于普通关卡：

1. 使用地址偏移列。
2. 使用十六进制块 + ASCII 旁注。
3. 使用“损坏样本 / black box / forensic view”的语言风格。

### 10.2 提示设计

提示不应直接告诉玩家答案，而应引导其识别合法结构：

1. 有效帧以 `rEx[` 开头，以 `]` 结束。
2. `BUILD` 是 8 位日期。
3. `SEED` 是 8 位大写十六进制。
4. `PHRASE` 只允许大写和下划线。

### 10.3 Prompt 引导

魔鬼难度不应靠“把规则全明说”取胜，而应让玩家学会更精确地表达：

1. 需要匹配完整结构，而不是包含子串。
2. 需要排除截断和损坏记录。
3. 需要严格限定字段格式。

## 11. 测试策略建议

### 11.1 数据测试

1. 目标帧应唯一可匹配。
2. 所有伪帧都不应被合法正则误通过。
3. hexdump 文本拼接后仍保持可读一致性。
4. 汽车主题噪声（CAN/UDS/OTA）不会与目标帧混淆。

### 11.2 判题测试

1. 精确正则应通过。
2. 过宽松正则应只得到 partial / fail。
3. 漏字段或错长度的正则应失败。

### 11.3 UI 测试

1. 二进制展示不破坏普通关卡。
2. 隐藏章节解锁后能显示特殊表现层。

## 12. 风险与缓解

1. 风险：关卡过难，玩家挫败感过强。
缓解：作为隐藏终章，只面向高完成度玩家；同时提供递进提示。

2. 风险：真实二进制支持会拉高实现复杂度。
缓解：第一版仅使用“二进制转储视图模拟”，不直接处理真实字节文件。

3. 风险：特殊关卡逻辑污染通用关卡逻辑。
缓解：通过 presentation resolver 和 fixture loader 做分层。

## 13. 验收标准（设计层）

1. 新关卡在叙事上合理接续 `level_25`。
2. 目标信息具备结构复杂度，足以支撑“魔鬼难度”。
3. 数据与 UI 方案可以在不破坏现有关卡体系下接入。
4. 设计遵循 SOLID，未来可扩展更多隐藏玩法。

## 14. 最终建议

建议把这个新内容命名为：

`Chapter 6 — Origin Frame`

建议唯一关卡为：

`level_26 / Origin Frame`

建议玩家要寻找的信息为：

`rEx[ORIGIN:AUMOVIO-PLANT7|VEHICLE:E3-SUV|ECU:VCU_GATEWAY|BUILD:20260422|SEED:7FA19C2D|PHRASE:WE_WERE_THE_PARSER]`

这是一个比“找关键字”更符合 YourEx 世界观的答案：它既是信息，也是宣言；既能训练结构化匹配，也能把剧情往“你不仅解析语言，你也被语言定义”这一层再推进一步。

---

本文件仅为设计文档，不包含实现方案细节之外的代码变更。

## 15. 长样本规模建议（仅设计）

为满足“二进制文件稍微长一点、内容更多”的目标，建议第一版样本规模如下：

1. 总行数：180 到 320 行转储文本。
2. 结构分段：
	1. Header 区（固件签名、版本、平台标识）约 30 行。
	2. 通信区（CAN 路由、UDS 会话片段）约 50 行。
	3. 启动区（Bootloader/Watchdog/Reset 原因）约 40 行。
	4. 升级区（OTA 包索引、CRC、回滚日志）约 40 行。
	5. 残骸区（目标帧与伪帧混合）约 20 到 60 行。
3. 噪声密度：
	1. 至少 6 条伪 `rEx[...]` 记录。
	2. 至少 3 条字段长度错误样本。
	3. 至少 2 条跨行截断样本。

该规模能在不引入真实二进制解析器的前提下，提供“足够长、足够真实、可控难度”的魔鬼关体验，并保持对现有判题系统的兼容性。
