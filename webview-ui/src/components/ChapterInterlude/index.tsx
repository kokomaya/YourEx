import { useState, useEffect, useMemo } from 'react';
import { useVSCode } from '../../hooks/useVSCode';
import { useTranslation } from '../../i18n';
import { useVisualScene } from '../../visual/hooks/useVisualScene';
import { VisualScene } from '../../visual/components/VisualScene';
import { useVisualPreferences } from '../../visual/hooks/useVisualPreferences';
import { useMonitorScene } from '../../visual/monitor/useMonitorScene';
import { MonitorViewportShell } from '../../visual/monitor/MonitorViewportShell';
import '../../visual/monitor/MonitorFrame.css';
import { INTERLUDE_CONFIGS } from './interludeData';
import './ChapterInterlude.css';

export function ChapterInterlude() {
  const { postMessage } = useVSCode();
  const { t } = useTranslation();
  const visual = useVisualPreferences();

  const chapterId = ((window as unknown as Record<string, unknown>).__YOUREX_BOOT_CONTEXT__ as { chapterId?: number } | undefined)?.chapterId ?? 2;
  const config = INTERLUDE_CONFIGS[chapterId];

  const [visibleLines, setVisibleLines] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [burstTriggered, setBurstTriggered] = useState(false);

  const bootLines = useMemo(() => {
    const lines: string[] = [];
    for (let i = 1; i <= config.bootLineCount; i++) {
      lines.push(t(`chapterInterlude.ch${chapterId}.boot.line${i}`));
    }
    return lines;
  }, [t, chapterId, config.bootLineCount]);

  const storyLines = useMemo(() => {
    const lines: string[] = [];
    for (let i = 1; i <= config.storyLineCount; i++) {
      lines.push(t(`chapterInterlude.ch${chapterId}.story.line${i}`));
    }
    return lines;
  }, [t, chapterId, config.storyLineCount]);

  const scene = useVisualScene({
    chapterId: config.chapterId,
    chapterThemeOverride: visual.chapterThemeOverride > 0 ? visual.chapterThemeOverride : undefined,
    effectsEnabled: visual.effectsEnabled,
    blurEnabled: visual.blurEnabled,
    motionLevel: visual.motionLevel,
    backgroundIntensity: visual.backgroundIntensity,
    cockpitOverlayOpacity: visual.cockpitOverlayOpacity,
    starfieldSpeedMultiplier: visual.starfieldSpeedMultiplier,
    performanceTier: visual.performanceTier,
    flightPhase: config.flightPhase,
    cockpitAlert: showButtons ? 'normal' : config.cockpitAlert,
    stateHint: showButtons ? 'success' : 'loading',
    reducedMotion: window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  });

  const monitor = useMonitorScene({
    chapterId: config.chapterId,
    stateHint: showButtons ? 'success' : 'loading',
    performanceTier: visual.performanceTier,
    reducedMotion: window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
    cockpitAlert: showButtons ? 'normal' : config.cockpitAlert,
    monitorFrameEnabled: visual.effectsEnabled,
  });

  useEffect(() => {
    const totalLines = bootLines.length;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleLines(current);

      // Chapter 5 burst effect on line 5
      if (chapterId === 5 && current === 5) {
        setBurstTriggered(true);
      }

      if (current >= totalLines) {
        clearInterval(interval);
        setTimeout(() => setShowReveal(true), 400);
        setTimeout(() => setShowStory(true), 1200);
        setTimeout(() => setShowButtons(true), 2400);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [bootLines.length, chapterId]);

  const handleBegin = () => {
    postMessage({ command: 'beginChapter', chapterId });
  };

  const themeClass = `chapter-interlude--${config.colorTheme}`;
  const burstClass = burstTriggered ? 'chapter-interlude--burst' : '';

  return (
    <VisualScene scene={scene}>
      <MonitorViewportShell monitor={monitor}>
        <div className={`welcome chapter-interlude ${themeClass} ${burstClass}`}>
          <h2 className="boot-title">
            {t(`chapterInterlude.ch${chapterId}.title`)}
          </h2>

          <div className="boot-lines">
            {bootLines.slice(0, visibleLines).map((line, i) => (
              <p
                key={i}
                className={`boot-line ${chapterId === 5 && i >= 4 && burstTriggered ? 'boot-line--burst' : ''}`}
              >
                {line || '\u00A0'}
              </p>
            ))}
          </div>

          {showReveal && (
            <div className="rex-reveal">
              <pre>{t(`chapterInterlude.ch${chapterId}.reveal`)}</pre>
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
                {t(`chapterInterlude.ch${chapterId}.startButton`)}
              </button>
            </div>
          )}
        </div>
      </MonitorViewportShell>
    </VisualScene>
  );
}
