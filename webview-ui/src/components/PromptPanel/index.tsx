import { useState, useCallback, useEffect, useRef } from 'react';
import { useVSCode, useMessageListener } from '../../hooks/useVSCode';
import { useTranslation } from '../../i18n';
import type { Level, JudgeResult, PromptScore, LevelRewardData, HintData, ExtensionMessage } from '../../types/messages';
import { RewardOverlay } from '../Reward';
import { useVisualScene } from '../../visual/hooks/useVisualScene';
import { VisualScene } from '../../visual/components/VisualScene';
import { useVisualPreferences } from '../../visual/hooks/useVisualPreferences';
import { useMonitorScene } from '../../visual/monitor/useMonitorScene';
import { MonitorViewportShell } from '../../visual/monitor/MonitorViewportShell';
import { Oscilloscope } from './Oscilloscope';
import { ScanEyeButton } from './ScanEyeButton';
import { HintPanel } from './HintPanel';
import { HintAlert } from './HintAlert';
import '../../visual/monitor/MonitorFrame.css';
import './PromptPanel.css';

export function PromptPanel() {
  const { postMessage } = useVSCode();
  const { t } = useTranslation();
  const visual = useVisualPreferences();
  const [level, setLevel] = useState<Level | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    judgeResult: JudgeResult;
    score?: PromptScore;
    feedback: string;
    rawRegex?: string;
  } | null>(null);
  const [reward, setReward] = useState<LevelRewardData | null>(null);
  const [signalFragment, setSignalFragment] = useState<string | null>(null);
  const [hintData, setHintData] = useState<HintData | null>(null);
  const [hintPanelOpen, setHintPanelOpen] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stateHint = loading
    ? 'loading'
    : result?.judgeResult.status === 'error' || result?.judgeResult.status === 'fail'
      ? 'error'
      : result?.judgeResult.status === 'perfect' || result?.judgeResult.status === 'pass'
        ? 'success'
        : 'idle';

  const flightPhase = loading
    ? 'accelerate'
    : stateHint === 'error'
      ? 'turbulence'
      : stateHint === 'success'
        ? 'jump'
        : level?.chapter && level.chapter >= 4
          ? 'accelerate'
          : 'cruise';

  const cockpitAlert = stateHint === 'error'
    ? 'critical'
    : loading
      ? 'warning'
      : 'normal';

  useMessageListener(useCallback((msg: unknown) => {
    const data = msg as ExtensionMessage;
    switch (data.command) {
      case 'loadLevel':
        setLevel(data.level);
        setResult(null);
        setReward(null);
        setSignalFragment(null);
        setHintData(null);
        setHintPanelOpen(false);
        setPrompt('');
        if (autoAdvanceTimer.current) {
          clearTimeout(autoAdvanceTimer.current);
          autoAdvanceTimer.current = null;
        }
        break;
      case 'showResult':
        setResult({
          judgeResult: data.result,
          score: data.score,
          feedback: data.feedback,
          rawRegex: data.rawRegex,
        });
        if (data.reward) {
          const r = data.reward;
          if (r.isChapterComplete || r.isGameComplete || r.isOriginComplete) {
            // Major milestone: show full reward overlay
            setReward(r);
          } else {
            // Normal level pass: show signal fragment + auto-advance
            setSignalFragment(pickSignalFragment(r.chapter, r.levelId));
            autoAdvanceTimer.current = setTimeout(() => {
              postMessage({ command: 'nextLevel' });
              autoAdvanceTimer.current = null;
            }, 2200);
          }
        }
        setLoading(false);
        break;
      case 'showError':
        setResult({
          judgeResult: { status: 'error', matched: [], expected: [], rawRegexString: '', errorMessage: data.message },
          feedback: data.message,
        });
        setLoading(false);
        break;
      case 'setLoading':
        setLoading(data.loading);
        break;
      case 'updateHints':
        setHintData(data.hintData);
        break;
    }
  }, []));

  useEffect(() => {
    postMessage({ command: 'ready' });
  }, [postMessage]);

  const scene = useVisualScene({
    chapterId: level?.chapter ?? 1,
    chapterThemeOverride: visual.chapterThemeOverride > 0 ? visual.chapterThemeOverride : undefined,
    effectsEnabled: visual.effectsEnabled,
    blurEnabled: visual.blurEnabled,
    motionLevel: visual.motionLevel,
    backgroundIntensity: visual.backgroundIntensity,
    cockpitOverlayOpacity: visual.cockpitOverlayOpacity,
    starfieldSpeedMultiplier: visual.starfieldSpeedMultiplier,
    performanceTier: visual.performanceTier,
    stateHint,
    flightPhase,
    cockpitAlert,
    reducedMotion: window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  });

  const monitor = useMonitorScene({
    chapterId: level?.chapter ?? 1,
    stateHint,
    performanceTier: visual.performanceTier,
    reducedMotion: window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
    cockpitAlert,
    monitorFrameEnabled: visual.effectsEnabled,
  });

  const handleExecute = () => {
    if (!level || !prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    postMessage({ command: 'executePrompt', prompt: prompt.trim(), levelId: level.id });
  };

  const handleManual = () => {
    if (!level) return;
    postMessage({ command: 'manualMode', levelId: level.id });
  };

  if (!level) {
    return (
      <VisualScene scene={scene}>
        <MonitorViewportShell monitor={monitor}>
          <div className="prompt-panel prompt-panel--waiting">
            <h2>{t('promptPanel.title')}</h2>
            <p className="text-secondary">{t('promptPanel.awaiting')}</p>
            <p className="text-muted hint">{t('promptPanel.selectHint')}</p>
          </div>
        </MonitorViewportShell>
      </VisualScene>
    );
  }

  const statusIcon = result ? getStatusIcon(result.judgeResult.status) : null;

  return (
    <VisualScene scene={scene}>
      <MonitorViewportShell monitor={monitor}>
      <div className="prompt-panel">
        <header className="signal-header">
          <h2>[Signal #{level.id.replace('level_', '')} — {level.title}]</h2>
          <span className="chapter-chip">{t('promptPanel.chapter', { n: level.chapter })}</span>
          <span className="difficulty-badge" data-difficulty={level.difficulty}>
            {level.difficulty}
          </span>
        </header>

      <section className="signal-story">
        <p className="text-secondary">{level.story}</p>
      </section>

      <section className="signal-challenge">
        <h3>{t('promptPanel.mission')}</h3>
        <p>{level.promptChallenge}</p>
      </section>

      <section className="test-data">
        <h3>{t('promptPanel.testData')}</h3>
        <ul className="data-list">
          {level.input.map((item, i) => (
            <li key={i} className={getMatchClass(item, result)}>
              <span className="data-marker">✦</span> "{item}"
              {result && (
                <span className="match-indicator">
                  {result.judgeResult.matched.includes(item) ? ' ✓' : ''}
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="expected-label">
          <span className="text-muted">{t('promptPanel.expected')}</span>
          {level.expected.map((e, i) => (
            <code key={i} className="expected-item">"{e}"</code>
          ))}
        </div>
      </section>

      <section className="prompt-input">
        <div className="prompt-input__header">
          <h3>{t('promptPanel.yourPrompt')}</h3>
          <ScanEyeButton
            onClick={() => setHintPanelOpen(v => !v)}
            hasNewHint={!!hintData?.hasNewPromptHint}
            disabled={!hintData || (hintData.totalPromptHints === 0 && hintData.totalHints === 0)}
          />
        </div>
        <textarea
          className="console-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('promptPanel.placeholder')}
          rows={3}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleExecute();
          }}
        />
        <div className="char-count text-muted">
          {t('promptPanel.charCount', { count: prompt.length })}
        </div>
      </section>

      {hintData && (
        <HintPanel
          promptHints={hintData.promptHints}
          totalCount={hintData.totalPromptHints}
          hasPeeked={hintData.hasPeeked}
          peekPenalty={hintData.peekPenalty}
          visible={hintPanelOpen}
          onPeek={() => {
            if (level) {
              postMessage({ command: 'peekHint', levelId: level.id });
            }
          }}
        />
      )}

        <div className="action-buttons">
          <button className={`btn-primary ${scene.buttonClassName}`} onClick={handleExecute} disabled={loading || !prompt.trim()}>
            {loading ? t('promptPanel.loading') : t('promptPanel.execute')}
          </button>
          <button className={`btn-secondary ${scene.buttonClassName}`} onClick={handleManual} disabled={loading}>
            {t('promptPanel.manual')}
          </button>
        </div>

        {result && (
          <section className="result-panel" data-status={result.judgeResult.status}>
            <h3>{statusIcon} {t(getStatusLabel(result.judgeResult.status))}</h3>
            <p className="feedback-text">{result.feedback}</p>

          {hintData && hintData.hints.length > 0 &&
            (result.judgeResult.status === 'fail' || result.judgeResult.status === 'partial' || result.judgeResult.status === 'error') && (
            <HintAlert hints={hintData.hints} hasNewHint={hintData.hasNewHint} />
          )}

          {result.rawRegex && (
            <div className="regex-display">
              <span className="text-muted">{t('promptPanel.aiRegex')}</span>
              <code>{result.rawRegex}</code>
            </div>
          )}

          <div className="match-stats">
            <span>{t('promptPanel.signal', { matched: result.judgeResult.matched.length, total: level.expected.length })}</span>
            {result.score && <span> | {t('promptPanel.promptScore', { score: result.score.total })}</span>}
          </div>

          {result.score && result.score.total > 0 && (
            <div className="score-breakdown">
              <div className="score-row">
                <span>{t('promptPanel.scoreBrevity')}</span>
                <div className="score-bar"><div style={{ width: `${result.score.brevityScore}%` }} /></div>
                <span>{result.score.brevityScore}</span>
              </div>
              <div className="score-row">
                <span>{t('promptPanel.scoreFirstTry')}</span>
                <div className="score-bar"><div style={{ width: `${result.score.firstTryScore}%` }} /></div>
                <span>{result.score.firstTryScore}</span>
              </div>
              <div className="score-row">
                <span>{t('promptPanel.scoreElegance')}</span>
                <div className="score-bar"><div style={{ width: `${result.score.eleganceScore}%` }} /></div>
                <span>{result.score.eleganceScore}</span>
              </div>
              <div className="score-row">
                <span>{t('promptPanel.scoreRegex')}</span>
                <div className="score-bar"><div style={{ width: `${result.score.regexQualityScore}%` }} /></div>
                <span>{result.score.regexQualityScore}</span>
              </div>
            </div>
          )}
          </section>
        )}

        {reward && (
          <RewardOverlay reward={reward} onDismiss={() => setReward(null)} />
        )}

        {signalFragment && !reward && (
          <div className="signal-fragment" onClick={() => {
            setSignalFragment(null);
            if (autoAdvanceTimer.current) {
              clearTimeout(autoAdvanceTimer.current);
              autoAdvanceTimer.current = null;
            }
            postMessage({ command: 'nextLevel' });
          }}>
            <Oscilloscope active={true} width={280} height={48} />
            <span className="signal-fragment__code">{signalFragment}</span>
            <span className="signal-fragment__hint">{t('promptPanel.signalLocked')}</span>
          </div>
        )}
      </div>
      </MonitorViewportShell>
    </VisualScene>
  );
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'perfect': return '✅✅';
    case 'pass': return '✅';
    case 'partial': return '⚠️';
    case 'error': return '🚫';
    default: return '❌';
  }
}

function getStatusLabel(status: string): string {
  const STATUS_KEY: Record<string, string> = {
    perfect: 'promptPanel.statusPerfect',
    pass: 'promptPanel.statusPass',
    partial: 'promptPanel.statusPartial',
    error: 'promptPanel.statusError',
  };
  // Can't use hook here - return the key for the component to translate
  return STATUS_KEY[status] ?? 'promptPanel.statusFail';
}

function getMatchClass(item: string, result: { judgeResult: JudgeResult } | null): string {
  if (!result) return '';
  const isMatched = result.judgeResult.matched.includes(item);
  const isExpected = result.judgeResult.expected.includes(item);
  if (isMatched && isExpected) return 'match-correct';
  if (isMatched && !isExpected) return 'match-extra';
  if (!isMatched && isExpected) return 'match-missed';
  return '';
}

const SIGNAL_FRAGMENTS = [
  'rEx[SIG:{0}::ACK]',
  'rEx[FREQ:CH{1}::LOCK]',
  'rEx[PARSE:{0}::CONFIRMED]',
  'rEx[NODE:{0}::SYNC]',
  'rEx[STREAM:CH{1}::{0}::PASS]',
  'rEx[DECODE:{0}::VALID]',
  'rEx[ECHO:CH{1}::{0}::OK]',
  'rEx[SIGNAL:{0}::CAPTURED]',
];

/** Narrative fragments shown at key story milestones */
const NARRATIVE_FRAGMENTS: Record<string, string> = {
  'level_05': 'rEx[…WHO ARE YOU…]',
  'level_10': 'rEx[…TEST PASSED…]',
  'level_15': 'rEx[…I CAN HEAR YOU…]',
  'level_20': 'rEx[…MESSAGE RECEIVED…CALCULATING…]',
  'level_24': 'rEx[…DOCKING BAY 7…STANDBY…]',
};

function pickSignalFragment(chapter: number, levelId: string): string {
  // Show narrative fragment at key milestones
  if (NARRATIVE_FRAGMENTS[levelId]) {
    return NARRATIVE_FRAGMENTS[levelId];
  }
  const idx = levelId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const template = SIGNAL_FRAGMENTS[idx % SIGNAL_FRAGMENTS.length];
  const num = levelId.replace('level_', '');
  return template.replace('{0}', num).replace('{1}', String(chapter));
}
