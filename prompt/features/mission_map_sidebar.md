# Mission Map Sidebar 设计书

## 1. 目标

将左侧关卡树从 VS Code 原生 TreeDataProvider（树形折叠列表）改造为 **Webview 任务地图**，
模拟游戏中的任务节点地图：节点连线、区域分层、已完成/锁定/当前 状态可视化。

---

## 2. 现状分析

### 2.1 当前实现

| 组件 | 说明 |
|---|---|
| `SidebarProvider` | `TreeDataProvider<SidebarItem>`，两层树：章节 → 关卡 |
| `SidebarItem` | 继承 `vscode.TreeItem`，纯文本 + emoji 标记状态 |
| `package.json` 注册 | `"type": "tree"`，view id = `yourex-levels` |
| 数据源 | `levelLoader.ts` 从 JSON 加载 `Level[]` |
| 状态 | `GameStateManager` 提供完成状态、最佳分数、解锁判断 |
| 权限 | `IAccessPolicy` 控制章节解锁、开发者模式 |

### 2.2 改造要点

1. 将 view `type` 从 `"tree"` 改为 `"webview"`。
2. 新增 `MissionMapProvider`（`WebviewViewProvider`）替代 `SidebarProvider`。
3. 保留 `SidebarProvider` 作为降级方案（配置开关切换）。
4. 地图 UI 在 webview 内用 HTML/CSS 渲染，不引入 React（保持侧边栏轻量）。

---

## 3. 视觉设计

### 3.1 地图布局

```
  Ch.1 ──────── Ch.2 ──────── Ch.3
  ┌─┐    ╱      ┌─┐    ╱      ┌─┐
  │●│───        │●│───        │○│
  │●│           │○│           │○│
  │●│           │○│           │●│
  │●│           │●│           │○│
  │●│           │○│           │○│
  └─┘           └─┘           └─┘
```

- 每个章节是一个 **区域（Region）**，包含 5 个 **任务节点（Node）**。
- 节点垂直排列，区域水平排列，区域之间用连线串联。
- 侧边栏宽度有限（~300px），区域纵向滚动，章节间横向标签切换。

### 3.2 节点状态

| 状态 | 视觉 |
|---|---|
| 已完成（perfect） | 实心亮色圆 + 分数标签 + 星标 |
| 已完成（pass） | 实心圆 + 分数标签 |
| 可用（unlocked） | 空心脉冲圆（当前目标） |
| 锁定 | 暗灰虚线圆 + 🔒 |

### 3.3 节点连线

- 已完成节点之间：实线亮色。
- 已完成 → 可用：虚线脉冲（引导）。
- 锁定节点之间：暗灰虚线。

### 3.4 章节区域

- 顶部显示章节名称 + 进度条（3/5）。
- 区域背景色随章节主题微调。
- 锁定章节整体灰暗 + 大锁图标覆盖。

---

## 4. SOLID 架构

### 4.1 SRP 单一职责

| 模块 | 职责 |
|---|---|
| `MissionMapProvider` | Webview 生命周期管理、消息路由 |
| `IMapDataSource` | 提供节点数据（关卡、状态、分数） |
| `MapDataSource` | `IMapDataSource` 的实现，组合 `levelLoader` + `GameStateManager` + `IAccessPolicy` |
| `IMapLayoutEngine` | 计算节点坐标与连线 |
| `VerticalMapLayout` | `IMapLayoutEngine` 的实现（垂直节点排列） |
| `MapRenderer`（webview 内） | 接收布局数据，渲染 DOM |
| `MapInteraction`（webview 内） | 处理点击、hover、滚动、章节切换 |

### 4.2 OCP 开闭原则

- 新增节点状态样式 → 添加 CSS class，不改 `MapRenderer`。
- 新增布局算法 → 实现 `IMapLayoutEngine`，不改 `MissionMapProvider`。
- 新增章节 → 数据驱动，`MapDataSource` 自动适配。

### 4.3 LSP 里氏替换

- `IMapDataSource` 的任何实现（正常模式 / 开发者模式 / mock）可互换。
- `IMapLayoutEngine` 的任何实现（垂直 / 网格 / 自由布局）可互换。

### 4.4 ISP 接口隔离

```
IMapDataSource          → 只暴露数据查询
IMapLayoutEngine        → 只暴露坐标计算
IMapInteractionHandler  → 只暴露用户事件处理
```

Webview 内的渲染层不需要知道 VS Code API；
Extension 侧不需要知道 DOM 结构。

### 4.5 DIP 依赖倒置

- `MissionMapProvider` 依赖 `IMapDataSource`，不依赖 `GameStateManager`。
- `MapRenderer` 依赖布局数据（纯 JSON），不依赖 `IMapLayoutEngine`。
- Extension ↔ Webview 通过 `postMessage` 协议通信，双方不直接引用。

---

## 5. 消息协议

### 5.1 Extension → Webview

| command | payload | 说明 |
|---|---|---|
| `loadMap` | `{ chapters: ChapterMapData[] }` | 初始化全部地图数据 |
| `updateNode` | `{ nodeId, status, score? }` | 单节点状态更新 |
| `setActiveChapter` | `{ chapterId }` | 切换焦点章节 |

### 5.2 Webview → Extension

| command | payload | 说明 |
|---|---|---|
| `ready` | — | webview 就绪，请求数据 |
| `selectLevel` | `{ levelId }` | 用户点击节点 |

---

## 6. 数据模型

```ts
interface MapNode {
  id: string;             // level id
  title: string;
  chapter: number;
  index: number;          // 章节内序号 0-4
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'locked' | 'available' | 'passed' | 'perfect';
  score: number | null;
  promptChallenge: string; // tooltip
}

interface ChapterMapData {
  chapter: number;
  name: string;
  unlocked: boolean;
  progress: number;       // 已完成数
  total: number;          // 总数
  themeColor: string;     // 章节主题色
  nodes: MapNode[];
}
```

---

## 7. 文件结构（实际实现）

### Extension 侧（`src/`）

```
src/ui/sidebar/
  sidebarProvider.ts              ← 保留，作为经典树形降级方案
  missionMap/
    MissionMapProvider.ts         ← WebviewViewProvider + 内联 HTML/CSS/JS
    IMapDataSource.ts             ← 数据接口
    MapDataSource.ts              ← 数据实现
    mapMessages.ts                ← 消息类型定义
```

注意：设计书原计划的 `IMapLayoutEngine`/`VerticalMapLayout` 被移除 —— 
节点固定垂直排列、总数 ≤ 30，布局逻辑内联在渲染函数中即可。

原计划的 webview 侧独立文件（map.ts/MapRenderer.ts/MapInteraction.ts/map.css）
合并为 MissionMapProvider 内联字符串，避免额外 build 入口和资源加载。
侧边栏 webview bundle = 0KB（纯内联，无外部依赖）。

---

## 8. package.json 变更（实际实现）

```jsonc
"views": {
  "yourex-sidebar": [
    {
      "id": "yourex-levels",
      "name": "Mission Map",
      "type": "webview"          // 主视图：任务地图
    },
    {
      "id": "yourex-levels-tree",
      "name": "Level List",
      "type": "tree",
      "visibility": "collapsed"  // 经典树形视图，默认折叠
    }
  ]
}
```

两个视图共存于同一侧边栏容器，用户可展开/折叠切换。
无需额外配置项。

---

## 9. 性能考量

1. 侧边栏 webview 节点总数 ≤ 30（5 章 × 5 关 + 隐藏章），无需虚拟滚动。
2. 状态更新用 `updateNode` 单节点 patch，不重建整树。
3. 不引入 React / 框架，bundle 体积 < 15KB。
4. CSS 动画限于当前可用节点的脉冲效果，不超过 3 个同时动画。

---

## 10. 可访问性

1. 每个节点是 `<button role="treeitem">`，支持键盘导航（↑↓ 切节点，Enter 选择）。
2. `aria-label` 包含关卡名 + 状态 + 分数。
3. 锁定节点 `aria-disabled="true"`。
4. 章节标签用 `role="tablist"` + `role="tab"`。
5. 高对比模式下节点用实线边框替代颜色区分。

---

## 11. 实施阶段

### Phase 1 — 骨架

1. 创建 `MissionMapProvider` + HTML/CSS 模板。
2. 实现 `IMapDataSource` / `MapDataSource`。
3. Extension ↔ Webview 消息协议打通。
4. 渲染静态节点列表（无连线、无动画）。

### Phase 2 — 交互与状态

1. 节点点击 → 打开关卡。
2. 节点状态实时更新（完成后刷新图标/分数）。
3. 章节切换标签。
4. 锁定章节灰暗遮罩。

### Phase 3 — 视觉增强

1. 节点连线绘制（CSS/SVG）。
2. 当前目标节点脉冲动画。
3. 章节主题色差异化。
4. 完成节点星标/粒子效果。

### Phase 4 — 降级与打磨

1. `useClassicTree` 配置开关 + 原 TreeView 保留。
2. 键盘导航与屏幕阅读器测试。
3. 高对比模式适配。
