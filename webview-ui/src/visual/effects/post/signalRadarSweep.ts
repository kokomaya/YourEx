import type { EffectDefinition } from '../interfaces';

export const signalRadarSweepEffect: EffectDefinition = {
  token: 'ui.hud.signalRadarSweep',
  className: 'visual-layer--radar',
  baseOpacity: 0.2,
  baseSpeed: 1,
  category: 'post',
};
