import type { EffectDefinition } from '../interfaces';

export const velocityStreakEffect: EffectDefinition = {
  token: 'ui.hud.velocityStreak',
  className: 'visual-layer--velocity',
  baseOpacity: 0.26,
  baseSpeed: 1.3,
  category: 'post',
};
