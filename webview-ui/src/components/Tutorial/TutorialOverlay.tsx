import { useCallback, useEffect, useRef, useState } from 'react';
import type { TutorialStep, TutorialUiText } from '../../types/messages';
import './TutorialOverlay.css';

interface Props {
  steps: TutorialStep[];
  uiText: TutorialUiText;
  /** Step the controller asked us to jump to (cross-IPC advance). */
  forcedStepId?: string | null;
  /**
   * True while an executePrompt / executeRegex request is in flight. The
   * tooltip swaps action buttons for a spinner so the player understands
   * they're waiting on the LLM rather than the wizard hanging.
   */
  loading?: boolean;
  onEvent: (type: 'ready' | 'skip' | 'finish' | 'requestSidebar' | 'stepShown', stepId?: string) => void;
  /** Called when the in-tooltip "Auto-Fill" action is clicked. */
  onFillPrompt: (text: string) => void;
  /**
   * Called by the regex-fill step: drops the answer into the regex textarea
   * (and clears the prompt box) without submitting. The wizard then advances
   * locally to the next step, which asks the player to actually press Execute.
   */
  onFillRegex: (text: string) => void;
  /**
   * Direct submission path used by step 5 ("Execute"). The wizard surfaces a
   * primary button in the tooltip so the player isn't trapped if the spotlit
   * Execute button is unreachable (mask click-through quirks, empty textarea,
   * etc.). The handler should fill the prompt first if empty, then submit.
   */
  onSubmitFromWizard: (fallbackPromptText: string) => void;
}

interface Rect { left: number; top: number; right: number; bottom: number; }

function unionRect(selector: string | null): Rect | null {
  if (!selector) return null;
  const parts = selector.split(',').map(s => s.trim()).filter(Boolean);
  let acc: Rect | null = null;
  for (const sel of parts) {
    let elems: NodeListOf<Element>;
    try { elems = document.querySelectorAll(sel); } catch { continue; }
    elems.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (!acc) acc = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      else {
        acc.left = Math.min(acc.left, r.left);
        acc.top = Math.min(acc.top, r.top);
        acc.right = Math.max(acc.right, r.right);
        acc.bottom = Math.max(acc.bottom, r.bottom);
      }
    });
  }
  return acc;
}

function placeTooltip(
  rect: Rect | null,
  preferred: TutorialStep['placement'],
  tipW = 320,
  tipH = 180,
): { left: number; top: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!rect) {
    return { left: (vw - tipW) / 2, top: (vh - tipH) / 2 };
  }
  const place = preferred && preferred !== 'auto'
    ? preferred
    : (vh - rect.bottom > tipH + 16 ? 'bottom' : (rect.top > tipH + 16 ? 'top' : 'bottom'));
  let left: number, top: number;
  if (place === 'bottom') {
    top = rect.bottom + 14;
    left = (rect.left + rect.right) / 2 - tipW / 2;
  } else if (place === 'top') {
    top = rect.top - tipH - 14;
    left = (rect.left + rect.right) / 2 - tipW / 2;
  } else if (place === 'right') {
    left = rect.right + 14;
    top = (rect.top + rect.bottom) / 2 - tipH / 2;
  } else {
    left = rect.left - tipW - 14;
    top = (rect.top + rect.bottom) / 2 - tipH / 2;
  }
  left = Math.max(8, Math.min(vw - tipW - 8, left));
  top = Math.max(8, Math.min(vh - tipH - 8, top));
  return { left, top };
}

function formatBody(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

function rectEquals(a: Rect | null, b: Rect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.left === b.left && a.top === b.top && a.right === b.right && a.bottom === b.bottom;
}

export function TutorialOverlay({ steps, uiText, forcedStepId, loading, onEvent, onFillPrompt, onFillRegex, onSubmitFromWizard }: Props) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tipPos, setTipPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const lastShownRef = useRef<string>('');
  // Hold callbacks in refs so the measurement effect doesn't re-run every
  // time the parent re-renders with new inline arrow handlers — that used to
  // trigger an infinite measure → setState → re-render loop that looked like
  // a flicker on steps whose anchor moves under a smooth-scroll.
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const rectRef = useRef<Rect | null>(null);
  const tipPosRef = useRef(tipPos);

  const step = steps[idx];

  const measure = useCallback(() => {
    if (!step) return;
    const r = unionRect(step.anchor);
    if (!rectEquals(rectRef.current, r)) {
      rectRef.current = r;
      setRect(r);
    }
    const p = placeTooltip(r, step.placement);
    if (p.left !== tipPosRef.current.left || p.top !== tipPosRef.current.top) {
      tipPosRef.current = p;
      setTipPos(p);
    }
  }, [step]);

  useEffect(() => {
    measure();
    if (step) {
      // Scroll into view, then measure again
      const r = unionRect(step.anchor);
      if (r) {
        const first = step.anchor ? document.querySelector(step.anchor.split(',')[0].trim()) : null;
        first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(measure, 350);
      }
      if (lastShownRef.current !== step.id) {
        lastShownRef.current = step.id;
        onEventRef.current('stepShown', step.id);
      }
    }
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [step, measure]);

  // Re-measure on every animation frame for the first 600ms — DOM layout
  // settles fast after the smooth scroll completes, and the equality guard
  // in measure() means stable frames cost zero re-renders.
  useEffect(() => {
    if (!step) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      measure();
      if (t - start < 600) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, measure]);

  // Signal ready once on mount
  useEffect(() => {
    onEventRef.current('ready');
  }, []);

  // External advance (cross-IPC, e.g. after Execute submission). We apply
  // each forcedStepId value at most once — otherwise it would keep snapping
  // the wizard back whenever the player presses Next from a later step
  // (PromptPanel has no mechanism to clear forcedStepId after delivery).
  const appliedForcedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!forcedStepId) return;
    if (appliedForcedRef.current === forcedStepId) return;
    appliedForcedRef.current = forcedStepId;
    const target = steps.findIndex(s => s.id === forcedStepId);
    if (target >= 0) setIdx(target);
  }, [forcedStepId, steps]);

  if (!step) return null;

  const isLast = idx === steps.length - 1;
  const isPromptPanelLast = isLast; // when run inside PromptPanel area, last = result step
  const nextLabel = isPromptPanelLast ? uiText.next : uiText.next;

  const pad = 6;
  const spotStyle: React.CSSProperties | null = rect
    ? {
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.right - rect.left + pad * 2,
        height: rect.bottom - rect.top + pad * 2,
      }
    : null;

  // Build 4 surround rects so the spotlit area is truly empty (no element
  // sits over the target). clip-path used to deliver this geometrically but
  // some VS Code webviews still treated the clipped region as click-blocking.
  // Splitting into 4 plain divs sidesteps the entire issue.
  let maskRects: React.CSSProperties[] = [
    { left: 0, top: 0, right: 0, bottom: 0 }, // full-cover fallback
  ];
  if (rect) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const x1 = Math.max(0, rect.left - pad), y1 = Math.max(0, rect.top - pad);
    const x2 = Math.min(vw, rect.right + pad), y2 = Math.min(vh, rect.bottom + pad);
    maskRects = [
      { left: 0, top: 0, width: vw, height: y1 },                    // top
      { left: 0, top: y2, width: vw, height: Math.max(0, vh - y2) }, // bottom
      { left: 0, top: y1, width: x1, height: y2 - y1 },              // left
      { left: x2, top: y1, width: Math.max(0, vw - x2), height: y2 - y1 }, // right
    ];
  }

  const counter = uiText.stepCounter
    .replace('{n}', String(idx + 1))
    .replace('{total}', String(steps.length));

  const isWaitForExecute = step.action?.kind === 'waitFor' && step.action.event === 'executePrompt';
  // Only the original "execute" step gets the in-tooltip fallback button —
  // that step might be reached with an empty prompt box, so we pre-fill from
  // the auto-fill text. The later regex-execute step always has the regex
  // textarea pre-populated, so the spotlit Execute button is enough.
  const showSubmitFallback = isWaitForExecute && step.id === 'execute';
  // Find the fillPrompt action from any earlier step so step 5 can recover
  // when the player skipped Auto-Fill on step 3.
  const fillStep = steps.find(s => s.action?.kind === 'fillPrompt');
  const fillText = fillStep?.action?.kind === 'fillPrompt' ? fillStep.action.text : '';

  return (
    <div className="tut-root">
      {maskRects.map((style, i) => (
        <div key={i} className="tut-mask" style={style} />
      ))}
      {spotStyle && <div className="tut-spot" style={spotStyle} />}
      <div
        className="tut-tip"
        style={{ left: tipPos.left, top: tipPos.top }}
        role="dialog"
        aria-modal="true"
      >
        <div className="tut-tip__head">
          <span className="tut-tip__counter">{counter}</span>
          <button
            className="tut-tip__close"
            type="button"
            aria-label={uiText.skip}
            onClick={() => onEvent('skip')}
          >×</button>
        </div>
        <div className="tut-tip__title">{step.title}</div>
        <div
          className="tut-tip__body"
          dangerouslySetInnerHTML={{ __html: formatBody(step.body) }}
        />
        {step.action?.kind === 'fillPrompt' && !loading && (
          <button
            className="tut-tip__btn tut-tip__btn--primary tut-tip__btn--fill"
            type="button"
            onClick={() => step.action?.kind === 'fillPrompt' && onFillPrompt(step.action.text)}
          >{step.action.label}</button>
        )}
        {step.action?.kind === 'fillRegex' && !loading && (
          <button
            className="tut-tip__btn tut-tip__btn--primary tut-tip__btn--fill"
            type="button"
            onClick={() => {
              if (step.action?.kind !== 'fillRegex') return;
              onFillRegex(step.action.text);
              // Advance to the next step (which asks the player to press Execute).
              setIdx(i => Math.min(steps.length - 1, i + 1));
            }}
          >{step.action.label}</button>
        )}
        {step.action?.kind === 'waitFor' && !loading && (
          <div className="tut-tip__hint">{step.action.hint}</div>
        )}
        {showSubmitFallback && !loading && (
          <button
            className="tut-tip__btn tut-tip__btn--primary tut-tip__btn--fill"
            type="button"
            onClick={() => onSubmitFromWizard(fillText)}
          >▶ Execute Now</button>
        )}
        {loading && (
          <div className="tut-tip__loading" role="status" aria-live="polite">
            <span className="tut-tip__spinner" aria-hidden="true" />
            <span>{uiText.waitingForLlm}</span>
          </div>
        )}
        <div className="tut-tip__actions">
          <button
            className="tut-tip__skip"
            type="button"
            disabled={loading}
            onClick={() => onEvent('skip')}
          >{uiText.skip}</button>
          <span className="tut-tip__spacer" />
          {idx > 0 && (
            <button
              className="tut-tip__btn"
              type="button"
              disabled={loading}
              onClick={() => setIdx(i => Math.max(0, i - 1))}
            >{uiText.prev}</button>
          )}
          {!step.blockingNext && (
            <button
              className="tut-tip__btn tut-tip__btn--primary"
              type="button"
              disabled={loading}
              onClick={() => {
                if (isLast) {
                  // Last step of the prompt-panel area asks the extension to
                  // hand off to the sidebar wizard.
                  onEvent('requestSidebar');
                } else {
                  setIdx(i => Math.min(steps.length - 1, i + 1));
                }
              }}
            >{isLast ? uiText.next : nextLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}
