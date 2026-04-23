import { useState, useEffect, useMemo } from 'react';
import { useVSCode } from '../../hooks/useVSCode';
import { useTranslation } from '../../i18n';
import { useVisualScene } from '../../visual/hooks/useVisualScene';
import { VisualScene } from '../../visual/components/VisualScene';
import { useVisualPreferences } from '../../visual/hooks/useVisualPreferences';
import { useMonitorScene } from '../../visual/monitor/useMonitorScene';
import { MonitorViewportShell } from '../../visual/monitor/MonitorViewportShell';
import '../../visual/monitor/MonitorFrame.css';
import './Welcome.css';

const REX_REVEAL = '            r E x';

export function Welcome() {
  const { postMessage } = useVSCode();
  const { t } = useTranslation();
  const visual = useVisualPreferences();
  const [visibleLines, setVisibleLines] = useState(0);
  const [showRex, setShowRex] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const bootLines = useMemo(() => {
    const lines: string[] = [];
    for (let i = 1; i <= 11; i++) {
      lines.push(t(`welcome.boot.line${i}`));
    }
    return lines;
  }, [t]);

  const storyLines = useMemo(() => {
    const lines: string[] = [];
    for (let i = 1; i <= 5; i++) {
      lines.push(t(`welcome.story.line${i}`));
    }
    return lines;
  }, [t]);

  const scene = useVisualScene({
    chapterId: 1,
    chapterThemeOverride: visual.chapterThemeOverride > 0 ? visual.chapterThemeOverride : undefined,
    effectsEnabled: visual.effectsEnabled,
    blurEnabled: visual.blurEnabled,
    motionLevel: visual.motionLevel,
    backgroundIntensity: visual.backgroundIntensity,
    cockpitOverlayOpacity: visual.cockpitOverlayOpacity,
    starfieldSpeedMultiplier: visual.starfieldSpeedMultiplier,
    performanceTier: visual.performanceTier,
    flightPhase: showButtons ? 'cruise' : 'accelerate',
    cockpitAlert: showButtons ? 'normal' : 'warning',
    stateHint: showButtons ? 'success' : 'loading',
    reducedMotion: window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  });

  const monitor = useMonitorScene({
    chapterId: 1,
    stateHint: showButtons ? 'success' : 'loading',
    performanceTier: visual.performanceTier,
    reducedMotion: window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
    cockpitAlert: showButtons ? 'normal' : 'warning',
    monitorFrameEnabled: visual.effectsEnabled,
  });

  useEffect(() => {
    // Typewriter effect for boot lines
    const totalLines = bootLines.length;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleLines(current);
      if (current >= totalLines) {
        clearInterval(interval);
        setTimeout(() => setShowRex(true), 400);
        setTimeout(() => setShowStory(true), 1200);
        setTimeout(() => setShowButtons(true), 2400);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [bootLines.length]);

  const handleStart = () => {
    postMessage({ command: 'startDecryption' });
  };

  return (
    <VisualScene scene={scene}>
      <MonitorViewportShell monitor={monitor}>
      <div className="welcome">
        <h2 className="boot-title">{t('welcome.title')}</h2>

      <div className="boot-lines">
        {bootLines.slice(0, visibleLines).map((line, i) => (
          <p key={i} className="boot-line">{line || '\u00A0'}</p>
        ))}
      </div>

      {showRex && (
        <div className="rex-reveal">
          <pre>{REX_REVEAL}</pre>
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
            <button className={`btn-primary ${scene.buttonClassName}`} onClick={handleStart}>
              {t('welcome.startButton')}
            </button>
          </div>
        )}
      </div>
      </MonitorViewportShell>
    </VisualScene>
  );
}
