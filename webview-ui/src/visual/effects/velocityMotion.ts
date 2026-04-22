/**
 * Procedural velocity-streak motion driver.
 *
 * Generates a never-repeating, always-forward wandering path
 * using layered sine waves as smooth noise. The element drifts,
 * gently turns and rolls like a ship in continuous flight.
 * A soft return-force keeps it within the safe bounds defined by
 * the CSS `inset: -8%`.
 */

/** Cheap smooth noise via layered sines — no library needed. */
function smoothNoise(t: number, seed: number): number {
  return (
    Math.sin(t * 0.7 + seed) * 0.5 +
    Math.sin(t * 1.3 + seed * 2.1) * 0.3 +
    Math.sin(t * 2.1 + seed * 5.4) * 0.2
  );
}

export interface VelocityMotionOptions {
  /** Base forward speed in % per second (default 0.8). */
  speed?: number;
  /** Maximum wander radius in % from origin (default 5). */
  bounds?: number;
}

/**
 * Start the procedural motion on a DOM element.
 * Returns a cleanup function to stop the animation.
 */
export function startVelocityMotion(
  el: HTMLElement,
  opts: VelocityMotionOptions = {},
): () => void {
  const SPEED = opts.speed ?? 0.8; // % per second
  const BOUNDS = opts.bounds ?? 5;
  const TURN_RATE = 0.35; // radians/s max turn influence
  const RETURN_STRENGTH = 0.12; // how aggressively it steers back
  const ROLL_AMP = 10; // ±degrees

  let x = 0;
  let y = 0;
  let heading = -Math.PI / 6; // initial: slightly upper-right
  let prevTime = 0;
  let rafId = 0;

  // Kill any CSS animation that might compete
  el.style.animation = 'none';

  function tick(now: number) {
    if (prevTime === 0) {
      prevTime = now;
      rafId = requestAnimationFrame(tick);
      return;
    }

    const dt = Math.min((now - prevTime) / 1000, 0.1); // cap at 100 ms
    prevTime = now;

    const t = now / 1000;

    // --- Heading: smooth wander ---
    heading += smoothNoise(t, 0) * TURN_RATE * dt;

    // --- Soft return toward center when near bounds ---
    const dist = Math.sqrt(x * x + y * y);
    if (dist > BOUNDS * 0.4) {
      const angleToCenter = Math.atan2(-y, -x);
      // Blend heading toward center, stronger the further out
      const urgency = ((dist - BOUNDS * 0.4) / (BOUNDS * 0.6)) * RETURN_STRENGTH;
      let diff = angleToCenter - heading;
      // Normalize to [-π, π]
      diff = ((diff + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      heading += diff * urgency;
    }

    // --- Move forward ---
    x += Math.cos(heading) * SPEED * dt;
    y += Math.sin(heading) * SPEED * dt;

    // Hard clamp as safety net
    x = Math.max(-BOUNDS, Math.min(BOUNDS, x));
    y = Math.max(-BOUNDS, Math.min(BOUNDS, y));

    // --- Roll & scale & opacity from noise ---
    const roll = smoothNoise(t * 0.45, 10) * ROLL_AMP;
    const scale = 1.02 + smoothNoise(t * 0.35, 30) * 0.03;
    const opacity = 0.75 + smoothNoise(t * 0.25, 20) * 0.15;

    el.style.transform = `translate3d(${x.toFixed(3)}%, ${y.toFixed(3)}%, 0) rotate(${roll.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
    el.style.opacity = opacity.toFixed(3);

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
  };
}
