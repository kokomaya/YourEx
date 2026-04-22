import type { EffectToken } from '../theme/types';

export type EffectCategory = 'background' | 'interactive' | 'post';

export interface EffectDefinition {
  token: EffectToken;
  className: string;
  baseOpacity: number;
  baseSpeed: number;
  category: EffectCategory;
}
