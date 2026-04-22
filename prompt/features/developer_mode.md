# Developer Mode / User Mode 分离计划书

## 1. 背景与目标

当前模式是单一路径：用户必须按章节解锁规则闯关。需求是增加“开发者模式”，使其可以无视章节与关卡解锁状态，直接进入任意关卡进行调试；同时“用户模式”保持现有闯关体验不变。

本计划书仅描述架构与实施步骤，不包含代码实现。

## 2. 范围定义

### 2.1 In Scope

1. 新增运行模式概念：`user` / `developer`。
2. 模式可持久化、可切换、可在 UI 显示当前模式。
3. 关卡访问控制在用户模式生效，在开发者模式放开。
4. 不破坏现有闯关、计分、排行榜、回放等业务流程。
5. 增加覆盖模式行为差异的测试策略。

### 2.2 Out of Scope

1. 不修改关卡内容与评分算法。
2. 不新增复杂权限系统（如账号鉴权）。
3. 不调整 webview 视觉主题（仅必要提示）。

## 3. 关键原则（SOLID）

1. 单一职责（SRP）
每个类只负责一个方向：模式状态、访问策略、UI 展示、命令编排分离。

2. 开闭原则（OCP）
通过策略接口扩展模式行为，避免在业务代码中大量 `if/else` 硬编码。

3. 里氏替换（LSP）
`UserAccessPolicy` 与 `DeveloperAccessPolicy` 必须可互换，不改变调用方语义。

4. 接口隔离（ISP）
拆分小接口：模式读取、模式切换、关卡可见性判断、关卡可进入判断，避免胖接口。

5. 依赖倒置（DIP）
`extension.ts` 与 `sidebarProvider` 依赖抽象接口（如 `IAccessPolicy`、`IModeService`），不依赖具体策略实现。

## 4. 目标架构

### 4.1 新增核心概念

1. `RunMode`
枚举：`user`、`developer`。

2. `IModeService`
职责：获取当前模式、切换模式、持久化模式、事件通知。

3. `IAccessPolicy`
职责：判定章节是否可展开、关卡是否可点击、是否允许直接打开任意关卡。

### 4.2 策略实现

1. `UserAccessPolicy`
复用现有解锁逻辑：只允许已解锁章节/关卡按规则进入。

2. `DeveloperAccessPolicy`
忽略章节解锁与关卡解锁限制：允许访问全部关卡。

3. `AccessPolicyFactory`
依据当前 `RunMode` 返回对应策略对象。

### 4.3 编排层职责

1. `extension.ts`
负责组装依赖：`ModeService` + `AccessPolicyFactory` + `SidebarProvider` + `PromptPanelProvider`。

2. `SidebarProvider`
只消费 `IAccessPolicy` 输出 UI 状态，不自行推导模式规则。

3. 命令处理（openLevel/startDecryption）
在进入关卡前统一走 `IAccessPolicy` 校验；开发者模式直接放行。

## 5. 配置与持久化设计

### 5.1 配置项

建议增加配置键（示例）：

1. `yourex.mode.default`: 默认模式（初次安装时生效）。
2. `yourex.mode.allowDeveloper`: 是否允许切换到开发者模式（团队分发版本可关闭）。

### 5.2 状态存储

1. 运行模式存入 `context.globalState`，键如 `yourex.runMode`。
2. 兼容旧数据：缺省时回落到 `user`。
3. 模式切换后触发 UI 刷新事件，避免重启扩展。

## 6. UI 与交互计划

### 6.1 命令入口

新增命令（规划名）：

1. `yourex.switchMode`：弹出 QuickPick 切换 `User Mode / Developer Mode`。
2. `yourex.showCurrentMode`：显示当前模式与说明。

### 6.2 侧边栏展示

1. 用户模式：保持现有锁定行为与提示文案。
2. 开发者模式：章节全部可展开；可在章节标题添加 `DEV` 标识（弱提示）。

### 6.3 状态栏展示

1. 用户模式：保持现有内容。
2. 开发者模式：追加轻量标签（如 `[DEV]`），防止误判测试结果。

## 7. 代码结构规划

建议新增目录与文件（仅规划）：

1. `src/mode/runMode.ts`
定义 `RunMode` 类型与转换函数。
2. `src/mode/modeService.ts`
`IModeService` 抽象与实现。
3. `src/access/IAccessPolicy.ts`
访问控制接口。
4. `src/access/userAccessPolicy.ts`
用户模式策略实现。
5. `src/access/developerAccessPolicy.ts`
开发者模式策略实现。
6. `src/access/accessPolicyFactory.ts`
根据模式组装策略。

现有文件改造点（仅规划）：

1. `src/extension.ts`
依赖注入与命令注册更新。
2. `src/ui/sidebar/sidebarProvider.ts`
由读取 `GameStateManager` 的硬逻辑，改为调用 `IAccessPolicy`。
3. `src/ui/statusbar.ts`
增加模式标签显示。

## 8. 实施阶段计划

### Phase 1: 模式基础设施

1. 引入 `RunMode` 与 `ModeService`。
2. 增加持久化与模式变更事件。
3. 保持默认 `user`，不改变现有行为。

### Phase 2: 访问策略抽象

1. 抽取 `IAccessPolicy`。
2. 实现 `UserAccessPolicy`（等价现有逻辑）。
3. 在 `SidebarProvider` 仅使用策略结果渲染。

### Phase 3: 开发者策略接入

1. 实现 `DeveloperAccessPolicy` 并接入工厂。
2. `openLevel/startDecryption` 入口统一使用策略校验。
3. 新增模式切换命令。

### Phase 4: UI 标识与体验优化

1. 状态栏/侧边栏加入模式提示。
2. 切换模式后即时刷新 TreeView 与 Panel。
3. 增加必要提示文案，避免用户混淆。

### Phase 5: 测试与回归

1. 单测覆盖策略行为差异。
2. 集成测试覆盖命令入口。
3. 回归验证用户模式零行为变化。

## 9. 测试计划

### 9.1 单元测试

1. `ModeService`
默认值、持久化、切换事件。

2. `UserAccessPolicy`
未解锁章节不可展开、不可进入未解锁关卡。

3. `DeveloperAccessPolicy`
全部章节可见、全部关卡可进入。

4. `AccessPolicyFactory`
模式与策略映射正确。

### 9.2 集成测试

1. 切换至开发者模式后，侧边栏可访问全部关卡。
2. 切回用户模式后，恢复正常闯关限制。
3. 模式切换不影响得分/历史记录读写。

### 9.3 回归测试

1. `promptReplay`、`leaderboard`、`manualMode` 行为不回归。
2. 首次启动欢迎页逻辑不受影响。

## 10. 风险与缓解

1. 风险：模式判断散落导致维护困难。
缓解：强制通过 `IAccessPolicy` 统一决策。

2. 风险：开发者模式误用于正式体验。
缓解：状态栏显式 `[DEV]`；可通过配置禁用开发者模式入口。

3. 风险：旧存档兼容问题。
缓解：Mode 缺省回退 `user`，并在读取时做 normalize。

## 11. 验收标准（DoD）

1. 用户模式下：当前闯关流程、解锁、提示与旧版本一致。
2. 开发者模式下：可直接打开任意关卡，无需章节解锁。
3. 模式切换可即时生效并持久化。
4. 所有新增测试通过，现有测试无回归。
5. 代码结构符合分层与 SOLID 约束，入口编排不包含业务细节。

## 12. 非功能要求

1. 可维护性：新增第三种模式时，只新增策略类与工厂映射。
2. 可测试性：关键逻辑可脱离 VS Code API 独立测试。
3. 可读性：命名清晰，策略职责边界明确。

## 13. 迁移与发布策略

1. 先灰度：默认仍为用户模式。
2. 对外发行版可通过配置关闭开发者模式入口。
3. 如出现问题，可快速回退至 `UserAccessPolicy` 单策略路径。

---

本计划书为设计基线。后续实现时应遵循“先抽象后接入、先保持等价行为再扩展”的原则，确保用户模式零回归。
