import type { ThemeProfile } from './types';

const BASE_THEME: Omit<ThemeProfile, 'id' | 'chapter'> = {
  palette: {
    primary: '#050a14',
    secondary: '#0a0e17',
    accent: '#22d3ee',
    glow: 'rgba(34, 211, 238, 0.45)',
  },
  backgroundEffects: ['bg.starfieldForward'],
  interactiveEffects: ['ui.button.neonPulse'],
  postEffects: ['ui.hud.cockpitFrame'],
  intensity: 0.7,
};

export const THEME_PROFILES: Record<number, ThemeProfile> = {
  1: {
    ...BASE_THEME,
    id: 'chapter-1-signal-contact',
    chapter: 1,
    backgroundEffects: ['bg.starfieldForward'],
    interactiveEffects: ['ui.button.neonPulse'],
    postEffects: ['ui.hud.cockpitFrame', 'ui.hud.signalRadarSweep'],
    intensity: 0.7,
  },
  2: {
    ...BASE_THEME,
    id: 'chapter-2-pattern-recognition',
    chapter: 2,
    palette: {
      primary: '#050b18',
      secondary: '#0a1020',
      accent: '#34d399',
      glow: 'rgba(52, 211, 153, 0.40)',
    },
    backgroundEffects: ['bg.starfieldForward'],
    interactiveEffects: ['ui.button.plasmaEdge'],
    postEffects: ['ui.hud.cockpitFrame', 'ui.hud.signalRadarSweep'],
    intensity: 0.72,
  },
  3: {
    ...BASE_THEME,
    id: 'chapter-3-syntax-awakening',
    chapter: 3,
    palette: {
      primary: '#060c1a',
      secondary: '#0c1628',
      accent: '#60a5fa',
      glow: 'rgba(96, 165, 250, 0.36)',
    },
    backgroundEffects: ['bg.starfieldForward', 'bg.binaryStream'],
    interactiveEffects: ['ui.button.circuitTrace'],
    postEffects: ['ui.hud.cockpitFrame', 'ui.hud.signalRadarSweep', 'ui.focus.scanLine'],
    intensity: 0.75,
  },
  4: {
    ...BASE_THEME,
    id: 'chapter-4-transmission',
    chapter: 4,
    palette: {
      primary: '#070c18',
      secondary: '#10162a',
      accent: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.33)',
    },
    backgroundEffects: ['bg.starfieldForward', 'bg.hexDriftGrid'],
    interactiveEffects: ['ui.button.signalLock'],
    postEffects: ['ui.hud.cockpitFrame', 'ui.hud.signalRadarSweep', 'ui.hud.velocityStreak', 'ui.focus.dataBloom'],
    intensity: 0.78,
  },
  5: {
    ...BASE_THEME,
    id: 'chapter-5-rex',
    chapter: 5,
    palette: {
      primary: '#060a18',
      secondary: '#10142a',
      accent: '#c084fc',
      glow: 'rgba(192, 132, 252, 0.36)',
    },
    backgroundEffects: ['bg.starfieldForward', 'bg.auroraSignalFog'],
    interactiveEffects: ['ui.button.neonPulse'],
    postEffects: ['ui.hud.cockpitFrame', 'ui.hud.signalRadarSweep', 'post.canopyReflectionPulse', 'ui.hud.velocityStreak'],
    intensity: 0.82,
  },
  6: {
    ...BASE_THEME,
    id: 'chapter-6-origin-frame',
    chapter: 6,
    palette: {
      primary: '#040812',
      secondary: '#0a0f1e',
      accent: '#22d3ee',
      glow: 'rgba(34, 211, 238, 0.34)',
    },
    backgroundEffects: ['bg.starfieldForward', 'bg.hexDriftGrid', 'bg.binaryStream'],
    interactiveEffects: ['ui.button.signalLock', 'ui.button.circuitTrace'],
    postEffects: ['ui.hud.cockpitFrame', 'ui.hud.signalRadarSweep', 'ui.hud.velocityStreak', 'post.glitchBlur', 'ui.focus.scanLine'],
    intensity: 0.88,
  },
};

export const FALLBACK_THEME = THEME_PROFILES[1];
