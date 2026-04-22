import type { PerformanceTier } from '../theme/types';

/* ---------- Monitor theme types ---------- */

export type MonitorBezelStyle = 'clean' | 'bracket' | 'scan' | 'hard' | 'neon' | 'alert';

export interface MonitorThemeProfile {
  id: string;
  chapter: number;
  bezelStyle: MonitorBezelStyle;
  cornerBrackets: boolean;
  signalScan: boolean;
  alertStrip: boolean;
  bezelColor: string;
  bezelGlow: string;
  statusLights: {
    idle: string;
    loading: string;
    success: string;
    error: string;
  };
}

export interface MonitorSceneContext {
  chapterId: number;
  stateHint: 'idle' | 'loading' | 'success' | 'error';
  performanceTier: PerformanceTier;
  reducedMotion: boolean;
  cockpitAlert: 'normal' | 'warning' | 'critical';
  monitorFrameEnabled: boolean;
}

export interface MonitorSceneModel {
  theme: MonitorThemeProfile;
  frameClassName: string;
  statusClassName: string;
  cssVars: Record<string, string>;
  animationsEnabled: boolean;
}
