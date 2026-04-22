# Cockpit Monitor Frame System 设计书

## 1. 目标与范围

本设计用于给 YourEx 增加“驾驶舱显示器边框”系统：

1. 将闯关内容限定在一个科幻显示器窗口内。
2. 在窗口外保留驾驶舱前景氛围，但不干扰核心阅读。
3. 让用户感知“正在驾驶舱屏幕里进行信号解密”。
4. 支持章节差异化显示器样式与状态反馈。

本文件仅定义设计与架构，不包含实现代码。

---

## 2. 视觉与交互原则

### 2.1 视觉原则

1. 屏幕优先：核心挑战内容永远在 monitor viewport 内部渲染。
2. 边框语义化：边框不仅是装饰，还承载状态灯、扫描线、告警条。
3. 分层清晰：背景层、驾驶舱层、显示器层、内容层职责明确。
4. 可读性优先：在炫酷效果下保证文本对比度、字号与焦点可见。

### 2.2 交互原则

1. 输入不中断：所有动态边框效果不捕获指针事件。
2. 状态可感知：loading、error、success 对应不同边框反馈。
3. 不惊扰用户：平时为低频动态，事件触发短时增强后回落。
4. 降级可用：关闭特效后仍保留稳定静态边框与完整功能。

---

## 3. SOLID 架构约束

### 3.1 SRP 单一职责

1. MonitorThemeProfile 只描述显示器视觉参数。
2. FrameLayoutEngine 只负责边框几何布局与安全区。
3. FrameEffectEngine 只负责边框动效调度。
4. MonitorSceneResolver 只负责根据上下文选择方案。
5. MonitorViewportShell 只负责包裹业务内容并注入样式变量。

### 3.2 OCP 开闭原则

新增边框效果通过插件扩展，不改核心调度器：

1. EdgeGlowEffect
2. CornerBracketEffect
3. SignalScanBezelEffect
4. AlertStripEffect

### 3.3 LSP 里氏替换

所有边框效果实现统一接口，保证可替换：

1. mount(container)
2. update(params)
3. unmount()

### 3.4 ISP 接口隔离

按职责拆分接口，避免大而全：

1. IFrameEffect
2. IFramePostEffect
3. IFrameInteractiveEffect
4. IViewportMaskProvider

### 3.5 DIP 依赖倒置

组件依赖抽象，不依赖具体实现：

1. PromptPanel/Welcome 依赖 IMonitorSceneResolver。
2. SceneResolver 依赖 IFrameEffectRegistry。
3. Registry 持有具体 Effect 插件。

---

## 4. 核心概念模型

### 4.1 MonitorThemeProfile

每个章节一个显示器主题对象，包含：

1. bezelStyle（边框样式）
2. cornerStyle（角标样式）
3. viewportMask（屏幕窗口形状）
4. statusLightPalette（状态灯颜色）
5. motionPreset（运动节奏）
6. readabilityPreset（对比度/亮度阈值）

### 4.2 MonitorSceneContext

用于动态选择显示器方案：

1. chapterId
2. levelId
3. stateHint（idle/loading/success/error）
4. performanceTier（low/medium/high）
5. reducedMotion
6. cockpitAlert（normal/warning/critical）

### 4.3 FrameToken

显示器边框原语标识：

1. frame.bezel.edgeGlow
2. frame.bezel.cornerBracket
3. frame.overlay.signalScan
4. frame.overlay.alertStrip
5. frame.mask.crtSoftClip
6. frame.mask.hardRectClip

---

## 5. 视觉分层设计

从后到前分为 4 层：

1. SpaceBackdropLayer：宇宙背景与远景动态。
2. CockpitShellLayer：驾驶舱前景和 HUD 组件。
3. MonitorFrameLayer：显示器边框、角标、状态灯、描边动画。
4. MonitorContentLayer：闯关内容容器（PromptPanel/Welcome 业务 UI）。

关键约束：

1. MonitorContentLayer 必须在显示器 viewport 内裁剪。
2. MonitorFrameLayer 永不遮挡关键输入区域。
3. 所有 frame 动效均 pointer-events: none。

---

## 6. 章节化显示器风格

### 6.1 Chapter 1

1. 轻量冷色边框。
2. 低频 edge glow。
3. 矩形安全区最大化可读性。

### 6.2 Chapter 2

1. 增加 corner bracket 与细扫描线。
2. 状态灯与交互反馈更明显。

### 6.3 Chapter 3

1. 引入 signal scan bezel。
2. loading 时出现边框巡检动画。

### 6.4 Chapter 4

1. 工程化硬边框样式。
2. warning 状态触发 alert strip。

### 6.5 Chapter 5

1. 半透明霓虹边框 + 柔和光晕。
2. success 时短时发光扩散。

### 6.6 Chapter 6 Origin Frame

1. 高细节边框与告警灯节奏。
2. critical 时可触发短促异常闪断。
3. 仍保证输入区可用与高对比。

---

## 7. 配置与运行时状态

### 7.1 建议配置键

1. yourex.visual.monitorFrameEnabled
2. yourex.visual.monitorFrameStyle
3. yourex.visual.monitorFrameIntensity
4. yourex.visual.monitorViewportPadding
5. yourex.visual.monitorOverlayOpacity

### 7.2 建议运行时状态

1. activeMonitorThemeId
2. activeFrameTokens
3. viewportBounds
4. frameAlertLevel
5. frameAnimationBudget

---

## 8. 代码结构规划

建议新增目录：

1. webview-ui/src/visual/monitor/theme/
2. webview-ui/src/visual/monitor/layout/
3. webview-ui/src/visual/monitor/effects/
4. webview-ui/src/visual/monitor/runtime/
5. webview-ui/src/visual/monitor/components/
6. webview-ui/src/visual/monitor/hooks/

建议新增文件：

1. webview-ui/src/visual/monitor/theme/monitorThemeProfiles.ts
2. webview-ui/src/visual/monitor/theme/monitorTypes.ts
3. webview-ui/src/visual/monitor/theme/monitorSceneResolver.ts
4. webview-ui/src/visual/monitor/layout/frameLayoutEngine.ts
5. webview-ui/src/visual/monitor/effects/interfaces.ts
6. webview-ui/src/visual/monitor/effects/bezelEdgeGlow.ts
7. webview-ui/src/visual/monitor/effects/cornerBracket.ts
8. webview-ui/src/visual/monitor/effects/signalScanBezel.ts
9. webview-ui/src/visual/monitor/effects/alertStrip.ts
10. webview-ui/src/visual/monitor/runtime/frameEffectRegistry.ts
11. webview-ui/src/visual/monitor/runtime/frameMotionPolicy.ts
12. webview-ui/src/visual/monitor/components/MonitorViewportShell.tsx
13. webview-ui/src/visual/monitor/hooks/useMonitorScene.ts

现有文件改造建议：

1. webview-ui/src/components/PromptPanel/index.tsx
改为通过 MonitorViewportShell 承载闯关内容。

2. webview-ui/src/components/Welcome/index.tsx
接入同一 MonitorViewportShell，保持世界观一致。

3. webview-ui/src/styles/global.css
保留全局变量；边框复杂样式迁移到 monitor 模块内。

---

## 9. 性能与可访问性

### 9.1 性能分级

1. High：完整边框动画与后处理。
2. Medium：关闭重型边框后处理，保留基础描边与状态灯。
3. Low：静态边框 + 状态色变化，无连续动画。

### 9.2 可访问性

1. reduced motion 时边框动态降为静态。
2. high contrast 模式强化边框与文本对比。
3. 支持 viewport padding 调节，避免紧贴边框造成阅读疲劳。

---

## 10. 测试策略

### 10.1 单元测试

1. MonitorSceneResolver 映射正确。
2. FrameMotionPolicy 降级策略正确。
3. FrameLayoutEngine 输出边界合法。

### 10.2 组件测试

1. MonitorViewportShell 正确裁剪内容区域。
2. 不同 stateHint 下边框状态变更正确。
3. 边框层不阻断按钮/输入交互。

### 10.3 回归测试

1. 关闭 monitorFrame 后功能与布局正常。
2. 低性能档无卡顿与闪烁。
3. 章节切换无资源泄漏。

---

## 11. 分阶段实施建议

### Phase 1 基础骨架

1. 建立 monitor types/theme/resolver。
2. 建立 MonitorViewportShell 与布局引擎。
3. 接入配置与降级策略。

### Phase 2 核心边框效果

1. 实现 edge glow 与 corner bracket。
2. 实现 signal scan bezel。
3. 接入 loading/error/success 状态反馈。

### Phase 3 章节化与 Origin Frame

1. 完成 chapter 1-5 差异化边框主题。
2. 完成 chapter 6 高压告警边框节奏。
3. 完成与驾驶舱背景联动。

### Phase 4 打磨与稳定性

1. 性能预算与降级阈值调优。
2. 可访问性和对比度优化。
3. 全链路回归。

---

## 12. 验收标准

1. 用户能明确感知“闯关内容在驾驶舱显示器内部”。
2. 边框效果科幻且不影响可读性与点击输入。
3. 各章节显示器样式存在可感知差异。
4. 低性能和 reduced motion 下稳定可用。
5. 架构符合 SOLID，新增边框效果不改核心调度器。

---

本设计文档仅定义驾驶舱显示器边框系统方案，不包含实现代码。
