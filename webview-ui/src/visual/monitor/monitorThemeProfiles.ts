import type { MonitorThemeProfile } from './monitorTypes';

const BASE_STATUS_LIGHTS = {
  idle: '#22d3ee',
  loading: '#fbbf24',
  success: '#34d399',
  error: '#fb7185',
};

export const MONITOR_THEME_PROFILES: Record<number, MonitorThemeProfile> = {
  1: {
    id: 'monitor-ch1',
    chapter: 1,
    bezelStyle: 'clean',
    cornerBrackets: false,
    signalScan: false,
    alertStrip: false,
    bezelColor: '#22d3ee',
    bezelGlow: 'rgba(34, 211, 238, 0.25)',
    statusLights: BASE_STATUS_LIGHTS,
  },
  2: {
    id: 'monitor-ch2',
    chapter: 2,
    bezelStyle: 'bracket',
    cornerBrackets: true,
    signalScan: false,
    alertStrip: false,
    bezelColor: '#34d399',
    bezelGlow: 'rgba(52, 211, 153, 0.22)',
    statusLights: BASE_STATUS_LIGHTS,
  },
  3: {
    id: 'monitor-ch3',
    chapter: 3,
    bezelStyle: 'scan',
    cornerBrackets: true,
    signalScan: true,
    alertStrip: false,
    bezelColor: '#60a5fa',
    bezelGlow: 'rgba(96, 165, 250, 0.22)',
    statusLights: BASE_STATUS_LIGHTS,
  },
  4: {
    id: 'monitor-ch4',
    chapter: 4,
    bezelStyle: 'hard',
    cornerBrackets: true,
    signalScan: true,
    alertStrip: true,
    bezelColor: '#fbbf24',
    bezelGlow: 'rgba(251, 191, 36, 0.2)',
    statusLights: BASE_STATUS_LIGHTS,
  },
  5: {
    id: 'monitor-ch5',
    chapter: 5,
    bezelStyle: 'neon',
    cornerBrackets: true,
    signalScan: true,
    alertStrip: false,
    bezelColor: '#c084fc',
    bezelGlow: 'rgba(192, 132, 252, 0.28)',
    statusLights: BASE_STATUS_LIGHTS,
  },
  6: {
    id: 'monitor-ch6',
    chapter: 6,
    bezelStyle: 'alert',
    cornerBrackets: true,
    signalScan: true,
    alertStrip: true,
    bezelColor: '#22d3ee',
    bezelGlow: 'rgba(34, 211, 238, 0.3)',
    statusLights: {
      idle: '#22d3ee',
      loading: '#fb923c',
      success: '#34d399',
      error: '#ef4444',
    },
  },
};

export const FALLBACK_MONITOR_THEME = MONITOR_THEME_PROFILES[1];
