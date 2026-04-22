import { useMemo } from 'react';
import { MONITOR_THEME_PROFILES, FALLBACK_MONITOR_THEME } from './monitorThemeProfiles';
import type { MonitorSceneContext, MonitorSceneModel } from './monitorTypes';

export function useMonitorScene(context: MonitorSceneContext): MonitorSceneModel {
  return useMemo(() => {
    const theme = MONITOR_THEME_PROFILES[context.chapterId] ?? FALLBACK_MONITOR_THEME;
    const animationsEnabled =
      context.monitorFrameEnabled &&
      !context.reducedMotion &&
      context.performanceTier !== 'low';

    const frameClassName = [
      'monitor-frame',
      `monitor-frame--${theme.bezelStyle}`,
      theme.cornerBrackets ? 'monitor-frame--brackets' : '',
      theme.signalScan && animationsEnabled ? 'monitor-frame--scan' : '',
      theme.alertStrip ? 'monitor-frame--alert-strip' : '',
      animationsEnabled ? '' : 'monitor-frame--static',
      context.cockpitAlert === 'critical' ? 'monitor-frame--critical' : '',
      context.cockpitAlert === 'warning' ? 'monitor-frame--warning' : '',
    ].filter(Boolean).join(' ');

    const statusClassName = [
      'monitor-status',
      `monitor-status--${context.stateHint}`,
    ].join(' ');

    const statusColor = theme.statusLights[context.stateHint];

    const cssVars: Record<string, string> = {
      '--monitor-bezel-color': theme.bezelColor,
      '--monitor-bezel-glow': theme.bezelGlow,
      '--monitor-status-color': statusColor,
    };

    return {
      theme,
      frameClassName,
      statusClassName,
      cssVars,
      animationsEnabled,
    };
  }, [
    context.chapterId,
    context.stateHint,
    context.performanceTier,
    context.reducedMotion,
    context.cockpitAlert,
    context.monitorFrameEnabled,
  ]);
}
