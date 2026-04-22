import { useMemo } from 'react';
import { resolveThemeProfile } from '../theme/sceneResolver';
import { resolveMotionProfile } from '../runtime/motionPolicy';
import { EFFECT_REGISTRY } from '../runtime/effectRegistry';
import type { SceneContext, VisualSceneModel } from '../theme/types';

function chooseButtonClass(interactiveEffects: string[]): string {
  if (interactiveEffects.includes('ui.button.signalLock')) {
    return EFFECT_REGISTRY['ui.button.signalLock'].className;
  }
  if (interactiveEffects.includes('ui.button.plasmaEdge')) {
    return EFFECT_REGISTRY['ui.button.plasmaEdge'].className;
  }
  if (interactiveEffects.includes('ui.button.circuitTrace')) {
    return EFFECT_REGISTRY['ui.button.circuitTrace'].className;
  }
  return EFFECT_REGISTRY['ui.button.neonPulse'].className;
}

function getBaseDuration(token: string): number {
  switch (token) {
    case 'bg.starfieldForward':
      return 14;
    case 'bg.waveTransmission':
      return 18;
    case 'bg.binaryStream':
      return 11;
    case 'bg.hexDriftGrid':
      return 24;
    case 'bg.auroraSignalFog':
      return 14;
    case 'ui.hud.velocityStreak':
      return 8;
    case 'ui.hud.cockpitFrame':
      return 20;
    case 'ui.hud.signalRadarSweep':
      return 5.8;
    case 'post.canopyReflectionPulse':
      return 4.8;
    case 'post.glitchBlur':
      return 1.6;
    case 'ui.focus.scanLine':
    case 'ui.focus.scanlineSweep':
      return 6;
    case 'ui.focus.dataBloom':
      return 4.2;
    default:
      return 8;
  }
}

function getFlightPhaseMultiplier(phase: SceneContext['flightPhase']): number {
  switch (phase) {
    case 'accelerate':
      return 1.35;
    case 'turbulence':
      return 1.15;
    case 'jump':
      return 1.75;
    case 'cruise':
    default:
      return 1;
  }
}

export function useVisualScene(context: SceneContext): VisualSceneModel {
  return useMemo(() => {
    const theme = resolveThemeProfile(context);
    const motion = resolveMotionProfile(context);
    const performanceTier = context.performanceTier ?? 'high';
    const flightPhase = context.flightPhase ?? 'cruise';
    const cockpitAlert = context.cockpitAlert ?? 'normal';
    const intensityScale = Math.min(Math.max((context.backgroundIntensity ?? 60) / 100, 0), 1);
    const cockpitOverlay = Math.min(Math.max((context.cockpitOverlayOpacity ?? 55) / 100, 0), 1);
    const starfieldSpeedMultiplier = Math.min(Math.max(context.starfieldSpeedMultiplier ?? 1, 0.5), 3);
    const flightMultiplier = getFlightPhaseMultiplier(flightPhase);

    const backgroundLayers = theme.backgroundEffects
      .map((token) => EFFECT_REGISTRY[token])
      .filter(Boolean)
      .map((effect) => {
        const isStarfield = effect.token === 'bg.starfieldForward';
        const starfieldBoost = isStarfield ? starfieldSpeedMultiplier * flightMultiplier : 1;
        const speed = effect.baseSpeed * (motion.animationScale || 0.01) * starfieldBoost;
        // Starfield renders at full opacity (controlled by backgroundIntensity only)
        // Other bg effects use normal intensity chain
        const opacity = isStarfield
          ? intensityScale
          : effect.baseOpacity * theme.intensity * motion.densityScale * intensityScale;
        return {
        token: effect.token,
        className: effect.className,
        opacity,
        speed,
        duration: getBaseDuration(effect.token) / Math.max(speed, 0.1),
        };
      });

    const postLayers = motion.postEffectsEnabled
      ? theme.postEffects
          .filter((token) => token !== 'post.glitchBlur' || motion.blurEnabled)
          .map((token) => EFFECT_REGISTRY[token])
          .filter(Boolean)
          .map((effect) => {
            const isCockpit = effect.token === 'ui.hud.cockpitFrame';
            const velocityBoost = effect.token === 'ui.hud.velocityStreak' ? flightMultiplier : 1;
            const speed = effect.baseSpeed * (motion.animationScale || 0.01) * velocityBoost;
            // Cockpit frame renders at cockpitOverlay opacity directly
            // HUD elements scale by cockpitOverlay, others use normal chain
            const opacity = isCockpit
              ? cockpitOverlay
              : effect.token.startsWith('ui.hud')
                ? effect.baseOpacity * cockpitOverlay
                : effect.baseOpacity * motion.densityScale * intensityScale;
            return {
            token: effect.token,
            className: effect.className,
            opacity,
            speed,
            duration: getBaseDuration(effect.token) / Math.max(speed, 0.1),
            };
          })
      : [];

    if (context.stateHint === 'error' && motion.blurEnabled) {
      const glitch = EFFECT_REGISTRY['post.glitchBlur'];
      postLayers.push({
        token: glitch.token,
        className: `${glitch.className} visual-layer--error-boost`,
        opacity: Math.max(glitch.baseOpacity, 0.4),
        speed: glitch.baseSpeed,
        duration: getBaseDuration(glitch.token) / Math.max(glitch.baseSpeed, 0.1),
      });
    }

    if (context.stateHint === 'success') {
      const bloom = EFFECT_REGISTRY['ui.focus.dataBloom'];
      postLayers.push({
        token: bloom.token,
        className: `${bloom.className} visual-layer--success-boost`,
        opacity: Math.max(bloom.baseOpacity, 0.35),
        speed: bloom.baseSpeed,
        duration: getBaseDuration(bloom.token) / Math.max(bloom.baseSpeed, 0.1),
      });
    }

    const buttonClassName = chooseButtonClass(theme.interactiveEffects);

    const rootClassName = [
      'visual-scene',
      `visual-theme--${theme.chapter}`,
      `visual-phase--${flightPhase}`,
      `visual-alert--${cockpitAlert}`,
      motion.animationScale === 0 ? 'visual-scene--static' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const cssVars: Record<string, string | number> = {
      '--scene-primary': theme.palette.primary,
      '--scene-secondary': theme.palette.secondary,
      '--scene-accent': theme.palette.accent,
      '--scene-glow': theme.palette.glow,
      '--scene-intensity': theme.intensity,
      '--scene-animation-scale': motion.animationScale,
      '--scene-cockpit-opacity': cockpitOverlay,
      '--scene-starfield-multiplier': starfieldSpeedMultiplier,
    };

    const activeEffects = [...backgroundLayers, ...postLayers].map((layer) => layer.token);

    return {
      theme,
      motion,
      performanceTier,
      layers: [...backgroundLayers, ...postLayers],
      rootClassName,
      buttonClassName,
      activeEffects,
      flightPhase,
      cockpitAlert,
      cssVars,
    };
  }, [context]);
}
