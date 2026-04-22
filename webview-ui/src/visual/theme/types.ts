export type PerformanceTier = 'low' | 'medium' | 'high';
export type MotionLevel = 'off' | 'low' | 'medium' | 'high';

export type EffectToken =
  | 'bg.starfieldForward'
  | 'bg.waveTransmission'
  | 'bg.binaryStream'
  | 'bg.hexDriftGrid'
  | 'bg.auroraSignalFog'
  | 'post.glitchBlur'
  | 'post.canopyReflectionPulse'
  | 'ui.button.neonPulse'
  | 'ui.button.plasmaEdge'
  | 'ui.button.circuitTrace'
  | 'ui.button.signalLock'
  | 'ui.hud.cockpitFrame'
  | 'ui.hud.velocityStreak'
  | 'ui.hud.signalRadarSweep'
  | 'ui.focus.scanLine'
  | 'ui.focus.scanlineSweep'
  | 'ui.focus.dataBloom';

export interface ThemeProfile {
  id: string;
  chapter: number;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
  backgroundEffects: EffectToken[];
  interactiveEffects: EffectToken[];
  postEffects: EffectToken[];
  intensity: number;
}

export interface SceneContext {
  chapterId?: number;
  levelId?: string;
  mode?: 'user' | 'developer';
  flightPhase?: 'cruise' | 'accelerate' | 'turbulence' | 'jump';
  cockpitAlert?: 'normal' | 'warning' | 'critical';
  reducedMotion?: boolean;
  performanceTier?: PerformanceTier;
  effectsEnabled?: boolean;
  blurEnabled?: boolean;
  motionLevel?: MotionLevel;
  backgroundIntensity?: number;
  cockpitOverlayOpacity?: number;
  starfieldSpeedMultiplier?: number;
  chapterThemeOverride?: number;
  stateHint?: 'idle' | 'loading' | 'success' | 'error';
}

export interface VisualConfigBootstrap {
  effectsEnabled: boolean;
  motionLevel: MotionLevel;
  blurEnabled: boolean;
  backgroundIntensity: number;
  chapterThemeOverride: number;
  cockpitOverlayOpacity: number;
  starfieldSpeedMultiplier: number;
}

export interface MotionProfile {
  animationScale: number;
  densityScale: number;
  postEffectsEnabled: boolean;
  blurEnabled: boolean;
}

export interface SceneLayer {
  token: EffectToken;
  className: string;
  opacity: number;
  speed: number;
  duration: number;
}

export interface VisualSceneModel {
  theme: ThemeProfile;
  motion: MotionProfile;
  performanceTier: PerformanceTier;
  layers: SceneLayer[];
  rootClassName: string;
  buttonClassName: string;
  activeEffects: EffectToken[];
  flightPhase: NonNullable<SceneContext['flightPhase']>;
  cockpitAlert: NonNullable<SceneContext['cockpitAlert']>;
  cssVars: Record<string, string | number>;
}
