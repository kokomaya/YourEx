import type { MotionProfile, SceneContext } from '../theme/types';

const BASE_MOTION: MotionProfile = {
  animationScale: 1,
  densityScale: 1,
  postEffectsEnabled: true,
  blurEnabled: true,
};

export function resolveMotionProfile(context: SceneContext): MotionProfile {
  const effectsEnabled = context.effectsEnabled ?? true;
  if (!effectsEnabled || context.motionLevel === 'off' || context.reducedMotion) {
    return {
      animationScale: 0,
      densityScale: 0,
      postEffectsEnabled: false,
      blurEnabled: false,
    };
  }

  const tier = context.performanceTier ?? 'high';
  if (tier === 'low' || context.motionLevel === 'low') {
    return {
      animationScale: 0,
      densityScale: 0.2,
      postEffectsEnabled: false,
      blurEnabled: false,
    };
  }

  if (tier === 'medium' || context.motionLevel === 'medium') {
    return {
      animationScale: 0.72,
      densityScale: 0.78,
      postEffectsEnabled: true,
      blurEnabled: context.blurEnabled ?? true,
    };
  }

  return {
    ...BASE_MOTION,
    blurEnabled: context.blurEnabled ?? true,
  };
}
