import { useState, useEffect, useMemo } from 'react';
import { useVSCode } from '../../hooks/useVSCode';
import { useTranslation } from '../../i18n';
import { useVisualScene } from '../../visual/hooks/useVisualScene';
import { VisualScene } from '../../visual/components/VisualScene';
import { useVisualPreferences } from '../../visual/hooks/useVisualPreferences';
import { useMonitorScene } from '../../visual/monitor/useMonitorScene';
import { MonitorViewportShell } from '../../visual/monitor/MonitorViewportShell';
import '../../visual/monitor/MonitorFrame.css';
import './Ch6Interlude.css';

export function Ch6Interlude() {
  const { postMessage } = useVSCode();
  const { t } = useTranslation();
  const visual = useVisualPreferences();
  const [visibleLines, setVisibleLines] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const bootLines = useMemo(() => {
    const lines: string[] = [];
    for (let i = 1; i <= 10; i++) {
      lines.push(t(`ch6Interlude.boot.line${i}`));
    }
    return lines;
  }, [t]);

  const storyLines = useMemo(() => {
    const lines: string[] = [];
    for (let i = 1; i <= 5; i++) {
      lines.push(t(`ch6Interlude.story.line${i}`));
    }
    return lines;
  }, [t]);

  const scene = useVisualScene({
    chapterId: 6,
    chapterThemeOverride: visual.chapterThemeOverride > 0 ? visual.chapterThemeOverride : undefined,
    effectsEnabled: visual.effectsEnabled,
    blurEnabled: visual.blurEnabled,
    motionLevel: visual.motionLevel,
    backgroundIntensity: visual.backgroundIntensity,
    cockpitOverlayOpacity: visual.cockpitOverlayOpacity,
    starfieldSpeedMultiplier: visual.starfieldSpeedMultiplier,
    performanceTier: visual.performanceTier,
    flightPhase: 'cruise',
    cockpitAlert: showButtons ? 'normal' : 'warning',
    stateHint: 'loading',
    reducedMotion: window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  });

  const monitor = useMonitorScene({
    chapterId: 6,
    stateHint: 'loading',
    performanceTier: visual.performanceTier,
    reducedMotion: window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
    cockpitAlert: showButtons ? 'normal' : 'warning',
    monitorFrameEnabled: visual.effectsEnabled,
  });

  useEffect(() => {
    const totalLines = bootLines.length;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleLines(current);
      if (current >= totalLines) {
        clearInterval(interval);
        setTimeout(() => setShowReveal(true), 400);
        setTimeout(() => setShowStory(true), 1200);
        setTimeout(() => setShowButtons(true), 2400);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [bootLines.length]);

  const handleBegin = () => {
    postMessage({ command: 'beginAdaptation' });
  };

  return (
    <VisualScene scene={scene}>
      <MonitorViewportShell monitor={monitor}>
        <div className="welcome ch6-interlude">
          <h2 className="boot-title">{t('ch6Interlude.title')}</h2>

          <div className="boot-lines">
            {bootLines.slice(0, visibleLines).map((line, i) => (
              <p key={i} className="boot-line">{line || '\u00A0'}</p>
            ))}
          </div>

          {showReveal && (
            <div className="rex-reveal">
              <pre>{t('ch6Interlude.reveal')}</pre>
            </div>
          )}

          {showStory && (
            <div className="story-lines">
              {storyLines.map((line, i) => (
                <p key={i} className="story-line">{line || '\u00A0'}</p>
              ))}
            </div>
          )}

          {showButtons && (
            <div className="welcome-actions">
              <button className={`btn-primary ${scene.buttonClassName}`} onClick={handleBegin}>
                {t('ch6Interlude.startButton')}
              </button>
            </div>
          )}
        </div>
      </MonitorViewportShell>
    </VisualScene>
  );
}
