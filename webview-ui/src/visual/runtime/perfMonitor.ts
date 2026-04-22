import type { PerformanceTier } from '../theme/types';

export interface PerfSample {
  fps: number;
  tier: PerformanceTier;
}

function classifyTier(fps: number): PerformanceTier {
  if (fps >= 54) return 'high';
  if (fps >= 32) return 'medium';
  return 'low';
}

export function estimatePerformanceTier(
  onUpdate: (sample: PerfSample) => void,
  sampleWindow = 60
): () => void {
  let raf = 0;
  let last = performance.now();
  const deltas: number[] = [];

  const tick = (now: number) => {
    const delta = now - last;
    last = now;

    if (delta > 0 && delta < 1000) {
      deltas.push(delta);
      if (deltas.length > sampleWindow) {
        deltas.shift();
      }

      if (deltas.length === sampleWindow) {
        const avgDelta = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
        const fps = 1000 / avgDelta;
        onUpdate({ fps, tier: classifyTier(fps) });
      }
    }

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
