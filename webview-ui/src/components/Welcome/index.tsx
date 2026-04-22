import { useState, useEffect } from 'react';
import { useVSCode } from '../../hooks/useVSCode';
import { useVisualScene } from '../../visual/hooks/useVisualScene';
import { VisualScene } from '../../visual/components/VisualScene';
import { useVisualPreferences } from '../../visual/hooks/useVisualPreferences';
import { useMonitorScene } from '../../visual/monitor/useMonitorScene';
import { MonitorViewportShell } from '../../visual/monitor/MonitorViewportShell';
import '../../visual/monitor/MonitorFrame.css';
import './Welcome.css';

const BOOT_LINES = [
  '>> 接入未知信号源…',
  '>> 协议识别失败…',
  '>> 语言结构：未知',
  '',
  '所有异常数据中，都出现同一个标记：',
];

const REX_REVEAL = '            r E x';

const STORY_LINES = [
  '它不是代码，也不是攻击。',
  '它是一种语言。',
  '',
  '你被选中参与这次解析任务。',
  '原因只有一个：你能够定义规则。',
];

export function Welcome() {
  const { postMessage } = useVSCode();
  const visual = useVisualPreferences();
  const [visibleLines, setVisibleLines] = useState(0);
  const [showRex, setShowRex] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

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
    const totalLines = BOOT_LINES.length;
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
  }, []);

  const handleStart = () => {
    postMessage({ command: 'startDecryption' });
  };

  return (
    <VisualScene scene={scene}>
      <MonitorViewportShell monitor={monitor}>
      <div className="welcome">
        <h2 className="boot-title">[System Booting…]</h2>

      <div className="boot-lines">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
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
          {STORY_LINES.map((line, i) => (
            <p key={i} className="story-line">{line || '\u00A0'}</p>
          ))}
        </div>
      )}

        {showButtons && (
          <div className="welcome-actions">
            <button className={`btn-primary ${scene.buttonClassName}`} onClick={handleStart}>
              🤖 启用协助系统
            </button>
            <button className={`btn-secondary ${scene.buttonClassName}`} onClick={handleStart}>
              ⚔️ 独立解析
            </button>
          </div>
        )}
      </div>
      </MonitorViewportShell>
    </VisualScene>
  );
}
