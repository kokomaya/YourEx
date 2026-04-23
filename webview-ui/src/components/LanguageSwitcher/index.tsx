import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, type Locale } from '../../i18n';
import { useVSCode } from '../../hooks/useVSCode';
import './LanguageSwitcher.css';

const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en', label: 'EN' },
];

/**
 * Binary transition overlay — shows cascading 0/1 streams
 * when switching language, like a protocol reconfiguration.
 */
function BinaryTransition({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const COLS = Math.floor(W / 14);
    const drops: number[] = new Array(COLS).fill(0).map(() => Math.random() * -20);
    const DURATION = 1400;

    startRef.current = performance.now();

    function draw(now: number) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);

      // Phase 1 (0-0.6): Binary rain fills screen
      // Phase 2 (0.6-0.8): Hold + glitch
      // Phase 3 (0.8-1.0): Fade out

      if (progress < 0.6) {
        ctx!.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx!.fillRect(0, 0, W, H);
      } else if (progress < 0.8) {
        // Glitch: random blocks
        if (Math.random() > 0.7) {
          const gx = Math.random() * W;
          const gy = Math.random() * H;
          const gw = 40 + Math.random() * 100;
          const gh = 4 + Math.random() * 12;
          ctx!.fillStyle = `rgba(0, ${160 + Math.random() * 95}, ${80 + Math.random() * 80}, 0.3)`;
          ctx!.fillRect(gx, gy, gw, gh);
        }
      } else {
        // Fade out
        const fadeAlpha = (progress - 0.8) / 0.2;
        ctx!.fillStyle = `rgba(0, 0, 0, ${0.15 * fadeAlpha})`;
        ctx!.fillRect(0, 0, W, H);
      }

      // Draw binary columns
      if (progress < 0.8) {
        ctx!.font = '13px "Courier New", monospace';

        for (let i = 0; i < COLS; i++) {
          const char = Math.random() > 0.5 ? '1' : '0';
          const x = i * 14;
          const y = drops[i] * 16;

          // Color: bright green for leading chars, dim for trailing
          const brightness = Math.random();
          if (brightness > 0.9) {
            ctx!.fillStyle = '#ffffff';
          } else if (brightness > 0.5) {
            ctx!.fillStyle = `rgb(0, ${200 + Math.floor(Math.random() * 55)}, ${80 + Math.floor(Math.random() * 60)})`;
          } else {
            ctx!.fillStyle = `rgb(0, ${100 + Math.floor(Math.random() * 80)}, ${40 + Math.floor(Math.random() * 40)})`;
          }

          ctx!.fillText(char, x, y);
          drops[i] += 0.4 + Math.random() * 0.6;

          if (drops[i] * 16 > H && Math.random() > 0.97) {
            drops[i] = 0;
          }
        }
      }

      // Center text during hold phase
      if (progress > 0.3 && progress < 0.85) {
        const textAlpha = progress < 0.4
          ? (progress - 0.3) / 0.1
          : progress > 0.75
            ? 1 - (progress - 0.75) / 0.1
            : 1;

        ctx!.save();
        ctx!.font = 'bold 16px "Courier New", monospace';
        ctx!.textAlign = 'center';
        ctx!.fillStyle = `rgba(0, 255, 160, ${textAlpha * 0.9})`;

        const label = 'SWITCHING LANGUAGE PROTOCOL…';
        // Binary decoration around the label
        const binaryDeco = Array.from({ length: 8 }, () => Math.random() > 0.5 ? '1' : '0').join('');
        ctx!.fillText(`[${binaryDeco}] ${label} [${binaryDeco}]`, W / 2, H / 2);

        ctx!.restore();
      }

      if (progress >= 1) {
        onComplete();
        return;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    // Initial black fill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, W, H);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className="binary-transition-overlay">
      <canvas ref={canvasRef} className="binary-transition-canvas" />
    </div>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const { postMessage } = useVSCode();
  const [transitioning, setTransitioning] = useState(false);
  const pendingLocaleRef = useRef<Locale | null>(null);

  const handleSwitch = useCallback(() => {
    const currentIdx = SUPPORTED_LOCALES.findIndex(l => l.code === locale);
    const nextIdx = (currentIdx + 1) % SUPPORTED_LOCALES.length;
    const nextLocale = SUPPORTED_LOCALES[nextIdx].code;

    pendingLocaleRef.current = nextLocale;
    setTransitioning(true);

    // Notify extension about locale change
    postMessage({ command: 'switchLanguage', locale: nextLocale });
  }, [locale, postMessage]);

  const handleTransitionComplete = useCallback(() => {
    if (pendingLocaleRef.current) {
      setLocale(pendingLocaleRef.current);
      pendingLocaleRef.current = null;
    }
    setTransitioning(false);
  }, [setLocale]);

  const currentLabel = SUPPORTED_LOCALES.find(l => l.code === locale)?.label ?? locale;

  return (
    <>
      <button
        className="language-switcher-btn"
        onClick={handleSwitch}
        disabled={transitioning}
        title="Switch Language / 切换语言"
      >
        <span className="lang-icon">🌐</span>
        <span className="lang-label">{currentLabel}</span>
      </button>
      <BinaryTransition active={transitioning} onComplete={handleTransitionComplete} />
    </>
  );
}
