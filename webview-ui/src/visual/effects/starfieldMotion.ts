/**
 * Procedural starfield motion driver.
 *
 * Continuously scrolls background-position on a tiled noise
 * texture, with gentle scale breathing and opacity drift.
 * Never loops back — position accumulates forever, and
 * because the texture is `repeat`, it tiles seamlessly.
 */

function smoothNoise(t: number, seed: number): number {
  return (
    Math.sin(t * 0.6 + seed) * 0.5 +
    Math.sin(t * 1.1 + seed * 2.3) * 0.3 +
    Math.sin(t * 1.9 + seed * 4.7) * 0.2
  );
}

export interface StarfieldMotionOptions {
  /** Pixels per second scroll speed for primary layer (default 12). */
  scrollSpeed?: number;
  /** Speed multiplier from user config (default 1). */
  speedMultiplier?: number;
}

/**
 * Start procedural motion on a starfield element.
 * Returns a cleanup function.
 */
export function startStarfieldMotion(
  el: HTMLElement,
  opts: StarfieldMotionOptions = {},
): () => void {
  const BASE_SPEED = opts.scrollSpeed ?? 12; // px/s
  const MULT = opts.speedMultiplier ?? 1;

  // Two independent scroll offsets for the two tiled layers
  let offsetX1 = 0;
  let offsetY1 = 0;
  let offsetX2 = 0;
  let offsetY2 = 0;

  let prevTime = 0;
  let rafId = 0;

  // Kill any competing CSS animation
  el.style.animation = 'none';

  function tick(now: number) {
    if (prevTime === 0) {
      prevTime = now;
      rafId = requestAnimationFrame(tick);
      return;
    }

    const dt = Math.min((now - prevTime) / 1000, 0.1);
    prevTime = now;

    const t = now / 1000;
    const speed = BASE_SPEED * MULT;

    // Layer 1 (50% 50% tile): mostly forward-up, slight lateral wander
    offsetX1 += smoothNoise(t * 0.2, 0) * speed * 0.3 * dt;
    offsetY1 -= speed * dt; // always forward (upward scroll)

    // Layer 2 (72% 72% tile): slower, different drift angle — parallax
    offsetX2 += smoothNoise(t * 0.15, 5) * speed * 0.2 * dt;
    offsetY2 -= speed * 0.6 * dt;

    // Scale breathing
    const scale = 1.02 + smoothNoise(t * 0.18, 10) * 0.04;
    // Opacity drift
    const opacity = 0.65 + smoothNoise(t * 0.12, 20) * 0.15;

    el.style.backgroundPosition =
      `${offsetX1.toFixed(1)}px ${offsetY1.toFixed(1)}px, ` +
      `${offsetX2.toFixed(1)}px ${offsetY2.toFixed(1)}px, ` +
      `center`;
    el.style.transform = `scale(${scale.toFixed(4)})`;
    el.style.opacity = opacity.toFixed(3);

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
  };
}
