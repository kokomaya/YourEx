import type { EffectDefinition } from '../interfaces';

export const scanlineSweepEffect: EffectDefinition = {
  token: 'ui.focus.scanLine',
  className: 'visual-layer--scanline',
  baseOpacity: 0.2,
  baseSpeed: 1.1,
  category: 'post',
};
