import type { EffectToken } from '../theme/types';
import { starfieldForwardEffect } from '../effects/background/starfieldForward';
import { waveTransmissionEffect } from '../effects/background/waveTransmission';
import { binaryStreamEffect } from '../effects/background/binaryStream';
import { hexDriftGridEffect } from '../effects/background/hexDriftGrid';
import { auroraSignalFogEffect } from '../effects/background/auroraSignalFog';
import { glitchBlurEffect } from '../effects/post/glitchBlur';
import { canopyReflectionPulseEffect } from '../effects/post/canopyReflectionPulse';
import { neonPulseButtonEffect } from '../effects/ui/neonPulseButton';
import { plasmaEdgeButtonEffect } from '../effects/ui/plasmaEdgeButton';
import { circuitTraceButtonEffect } from '../effects/ui/circuitTraceButton';
import { signalLockButtonEffect } from '../effects/ui/signalLockButton';
import { scanlineSweepEffect } from '../effects/post/scanlineSweep';
import { dataBloomEffect } from '../effects/post/dataBloom';
import { cockpitFrameEffect } from '../effects/post/cockpitFrame';
import { velocityStreakEffect } from '../effects/post/velocityStreak';
import { signalRadarSweepEffect } from '../effects/post/signalRadarSweep';
import type { EffectDefinition } from '../effects/interfaces';

export interface RegisteredEffect {
  token: EffectToken;
  className: string;
  baseOpacity: number;
  baseSpeed: number;
  category: 'background' | 'interactive' | 'post';
}

const EFFECT_DEFINITIONS: EffectDefinition[] = [
  starfieldForwardEffect,
  waveTransmissionEffect,
  binaryStreamEffect,
  hexDriftGridEffect,
  auroraSignalFogEffect,
  glitchBlurEffect,
  canopyReflectionPulseEffect,
  neonPulseButtonEffect,
  plasmaEdgeButtonEffect,
  circuitTraceButtonEffect,
  signalLockButtonEffect,
  scanlineSweepEffect,
  dataBloomEffect,
  cockpitFrameEffect,
  velocityStreakEffect,
  signalRadarSweepEffect,
];

export const EFFECT_REGISTRY: Record<EffectToken, RegisteredEffect> = EFFECT_DEFINITIONS.reduce(
  (acc, effect) => {
    acc[effect.token] = effect;
    return acc;
  },
  {} as Record<EffectToken, RegisteredEffect>
);
