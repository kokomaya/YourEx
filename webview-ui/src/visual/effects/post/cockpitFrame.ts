import type { EffectDefinition } from '../interfaces';

export const cockpitFrameEffect: EffectDefinition = {
  token: 'ui.hud.cockpitFrame',
  className: 'visual-layer--cockpit-frame',
  baseOpacity: 1,
  baseSpeed: 0.5,
  category: 'post',
};
