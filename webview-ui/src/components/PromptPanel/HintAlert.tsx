import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n';
import './HintAlert.css';

interface HintAlertProps {
  hints: string[];
  hasNewHint: boolean;
}

/**
 * Displays auto-unlocked hints inside the result panel on failure.
 * The newest hint gets a typewriter reveal animation.
 */
export function HintAlert({ hints, hasNewHint }: HintAlertProps) {
  const { t } = useTranslation();
  const [revealedChars, setRevealedChars] = useState(0);
  const lastHint = hints[hints.length - 1] ?? '';
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Typewriter effect for the newest hint
  useEffect(() => {
    if (!hasNewHint || !lastHint) return;
    setRevealedChars(0);
    const total = lastHint.length;
    let current = 0;

    timerRef.current = setInterval(() => {
      current += 1;
      setRevealedChars(current);
      if (current >= total) {
        clearInterval(timerRef.current);
      }
    }, 25);

    return () => clearInterval(timerRef.current);
  }, [hasNewHint, lastHint]);

  if (hints.length === 0) return null;

  const previousHints = hints.slice(0, -1);

  return (
    <div className="hint-alert">
      <div className="hint-alert__header">
        <span className="hint-alert__icon">⚠</span>
        <span className="hint-alert__title">{t('hint.interceptedSignal')}</span>
        <span className="hint-alert__scanline" />
      </div>
      <div className="hint-alert__body">
        {previousHints.map((hint, i) => (
          <div key={i} className="hint-alert__line hint-alert__line--old">
            {hint}
          </div>
        ))}
        <div className={`hint-alert__line ${hasNewHint ? 'hint-alert__line--new' : 'hint-alert__line--old'}`}>
          {hasNewHint
            ? lastHint.slice(0, revealedChars) + (revealedChars < lastHint.length ? '█' : '')
            : lastHint}
        </div>
      </div>
    </div>
  );
}
