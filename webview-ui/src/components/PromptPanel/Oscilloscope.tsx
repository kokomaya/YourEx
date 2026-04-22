import { useRef, useEffect } from 'react';

interface OscilloscopeProps {
  /** CSS color for the waveform line */
  color?: string;
  /** Canvas width in px */
  width?: number;
  /** Canvas height in px */
  height?: number;
  /** Whether animation is running */
  active: boolean;
}

/**
 * Procedural oscilloscope waveform drawn on canvas via requestAnimationFrame.
 * Renders a composite sine wave that drifts over time, with a fading phosphor trail
 * and a subtle scan-line glow — mimicking a real CRT oscilloscope.
 */
export function Oscilloscope({
  color = '#4fc3f7',
  width = 280,
  height = 64,
  active,
}: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let t = 0;

    const draw = () => {
      t += 0.025;

      // Phosphor fade: semi-transparent clear for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, width, height);

      const midY = height / 2;
      const amp = height * 0.32;

      // Main waveform
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;

      for (let x = 0; x < width; x++) {
        const nx = x / width; // 0..1
        // Composite wave: primary sine + harmonic + noise drift
        const wave =
          Math.sin(nx * Math.PI * 4 + t * 3) * 0.6 +
          Math.sin(nx * Math.PI * 7 + t * 1.7) * 0.25 +
          Math.sin(nx * Math.PI * 13 + t * 5.3) * 0.1 +
          Math.sin(t * 0.8 + nx * 2) * 0.05; // slow drift

        const y = midY + wave * amp;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Dimmer secondary trace (echo / ghost signal)
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.7;
      ctx.globalAlpha = 0.2;

      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const wave =
          Math.sin(nx * Math.PI * 4 + (t - 0.4) * 3) * 0.6 +
          Math.sin(nx * Math.PI * 7 + (t - 0.4) * 1.7) * 0.25 +
          Math.sin(nx * Math.PI * 13 + (t - 0.4) * 5.3) * 0.1;
        const y = midY + wave * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Horizontal center baseline (dim grid line)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 0.5;
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    // Clear canvas initially
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, width, height);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, color, width, height]);

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
        borderRadius: '4px',
        border: `1px solid ${color}22`,
        opacity: 0.85,
      }}
    />
  );
}
