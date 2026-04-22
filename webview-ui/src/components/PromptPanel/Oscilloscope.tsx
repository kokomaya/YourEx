import { useRef, useEffect } from 'react';

interface OscilloscopeProps {
  /** Canvas width in px */
  width?: number;
  /** Canvas height in px */
  height?: number;
  /** Whether animation is running */
  active: boolean;
}

// Subtle sci-fi green-cyan — not too saturated, pairs with blue accent
const WAVE_COLOR = '#5ee8b0';
const WAVE_GLOW = '#3cd9a0';
const GHOST_COLOR = 'rgba(94, 232, 176, 0.3)';

function computeWave(nx: number, t: number): number {
  return (
    Math.sin(nx * Math.PI * 4 + t * 3) * 0.55 +
    Math.sin(nx * Math.PI * 7 + t * 1.7) * 0.25 +
    Math.sin(nx * Math.PI * 13 + t * 5.3) * 0.12 +
    Math.sin(t * 0.7 + nx * 2) * 0.08
  );
}

/**
 * Procedural oscilloscope waveform on canvas.
 * Composite sine wave with phosphor trail, ghost echo, and CRT glow.
 */
export function Oscilloscope({
  width = 280,
  height = 48,
  active,
}: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let t = 0;

    const draw = () => {
      t += 0.022;

      // Phosphor fade trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, 0, width, height);

      const midY = height / 2;
      const amp = height * 0.34;

      // Ghost trace (delayed echo)
      ctx.beginPath();
      ctx.strokeStyle = GHOST_COLOR;
      ctx.lineWidth = 0.8;
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const y = midY + computeWave(nx, t - 0.35) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Main waveform with glow
      ctx.beginPath();
      ctx.strokeStyle = WAVE_COLOR;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = WAVE_GLOW;
      ctx.shadowBlur = 8;

      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const y = midY + computeWave(nx, t) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Dim center baseline
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(94, 232, 176, 0.06)';
      ctx.lineWidth = 0.5;
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    rafRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafRef.current);
  }, [active, width, height]);

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="oscilloscope-canvas"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: '3px',
        border: '1px solid rgba(94, 232, 176, 0.12)',
        opacity: 0.8,
      }}
    />
  );
}
