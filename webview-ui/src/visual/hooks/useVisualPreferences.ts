import { useEffect, useMemo, useState } from 'react';
import { estimatePerformanceTier } from '../runtime/perfMonitor';
import type { PerformanceTier, VisualConfigBootstrap } from '../theme/types';

declare global {
  interface Window {
    __YOUREX_VISUAL_CONFIG__?: VisualConfigBootstrap;
  }
}

const DEFAULT_CONFIG: VisualConfigBootstrap = {
  effectsEnabled: true,
  motionLevel: 'medium',
  blurEnabled: true,
  backgroundIntensity: 60,
  chapterThemeOverride: 0,
  cockpitOverlayOpacity: 55,
  starfieldSpeedMultiplier: 1,
};

export function useVisualPreferences() {
  const bootstrap = window.__YOUREX_VISUAL_CONFIG__ ?? DEFAULT_CONFIG;
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>('high');

  useEffect(() => {
    if (!bootstrap.effectsEnabled || bootstrap.motionLevel === 'off') {
      setPerformanceTier('low');
      return;
    }

    const stop = estimatePerformanceTier((sample) => {
      setPerformanceTier(sample.tier);
    });

    return stop;
  }, [bootstrap.effectsEnabled, bootstrap.motionLevel]);

  return useMemo(() => ({
    ...bootstrap,
    performanceTier,
  }), [bootstrap, performanceTier]);
}
