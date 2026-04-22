# Procedural Velocity Motion System

## 问题

CSS `@keyframes` 循环动画在首尾衔接时产生不可消除的顿挫：
- 位移回到起点 → 跳跃
- 多阶段分段 → 换挡感
- 匀速旋转 → 仍有微顿

根本原因：循环动画必须回到起点。

## 方案

用 JS `requestAnimationFrame` 生成永不回头的连续路径，彻底替代 CSS keyframe。

## 核心算法

1. **航向驱动**：叠加正弦噪声平滑改变 heading 角度，每帧沿当前航向前进，永不后退。
2. **回正力**：漂出安全区 40% 时自动柔性转向回中心，越远越强，保证不出框。
3. **滚转**：±10° 低频正弦模拟飞船侧倾。
4. **缩放/透明度**：独立噪声种子微幅呼吸，不与位移同步。
5. **帧率无关**：delta time 驱动，`performance.now()` 计时。

## 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| speed | 0.8 | % per second 前进速度 |
| bounds | 5 | 最大游走半径 (%) |
| TURN_RATE | 0.35 | rad/s 最大转向影响 |
| RETURN_STRENGTH | 0.12 | 回正力系数 |
| ROLL_AMP | 10 | ±度 滚转幅度 |

## 文件

- `webview-ui/src/visual/effects/velocityMotion.ts` — 运动驱动器
- `webview-ui/src/visual/components/VisualScene.tsx` — ref callback 挂载
- `webview-ui/src/styles/global.css` — 移除 velocity CSS animation

## 效果

路径是实时计算的无限曲线，每帧都是上一帧的延续，不存在"回到起点"，零顿挫。
