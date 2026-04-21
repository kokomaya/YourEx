import { useState } from 'react';
import { useMessageListener } from '../../hooks/useVSCode';
import type { PromptScore, LevelAttemptView, ExtensionMessage } from '../../types/messages';
import './ScoreDetail.css';

interface ScoreDetailState {
  levelTitle: string;
  attempts: LevelAttemptView[];
  bestScore?: PromptScore;
}

const DIMENSION_LABELS: Record<string, { label: string; weight: string }> = {
  brevityScore: { label: 'Brevity', weight: '30%' },
  firstTryScore: { label: 'First Try', weight: '30%' },
  eleganceScore: { label: 'Elegance', weight: '20%' },
  regexQualityScore: { label: 'Regex Quality', weight: '20%' },
};

function ScoreBar({ label, weight, value }: { label: string; weight: string; value: number }) {
  const barClass = value >= 80 ? 'bar-high' : value >= 50 ? 'bar-mid' : 'bar-low';
  return (
    <div className="score-dimension">
      <div className="dimension-header">
        <span className="dimension-label">{label}</span>
        <span className="dimension-weight">{weight}</span>
        <span className="dimension-value">{value}</span>
      </div>
      <div className="dimension-bar">
        <div className={`dimension-fill ${barClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ScoreDetail() {
  const [data, setData] = useState<ScoreDetailState | null>(null);

  useMessageListener((raw) => {
    const msg = raw as ExtensionMessage;
    if (msg.command === 'showScoreDetail') {
      setData({
        levelTitle: msg.levelTitle,
        attempts: msg.attempts,
        bestScore: msg.bestScore,
      });
    }
  });

  if (!data) {
    return (
      <div className="score-detail">
        <h2>[Score Analysis]</h2>
        <p className="score-waiting">{'>'} Awaiting decryption data…</p>
      </div>
    );
  }

  const { levelTitle, attempts, bestScore } = data;

  return (
    <div className="score-detail">
      <h2>[Score Analysis] {levelTitle}</h2>

      {bestScore && (
        <div className="best-score-section">
          <div className="total-score">
            <span className="total-label">Total Score</span>
            <span className="total-value">{bestScore.total}</span>
          </div>
          <div className="dimensions">
            {Object.entries(DIMENSION_LABELS).map(([key, { label, weight }]) => (
              <ScoreBar
                key={key}
                label={label}
                weight={weight}
                value={bestScore[key as keyof PromptScore]}
              />
            ))}
          </div>
        </div>
      )}

      <div className="attempts-section">
        <h3>[Attempt Log] {attempts.length} total</h3>
        <div className="attempts-list">
          {attempts.map((attempt, i) => (
            <div key={i} className={`attempt-row status-${attempt.judgeResult.status}`}>
              <span className="attempt-num">#{attempt.attemptNumber}</span>
              <span className="attempt-mode">{attempt.mode === 'prompt' ? '📡' : '⚔️'}</span>
              <span className="attempt-status">{attempt.judgeResult.status}</span>
              {attempt.promptScore && (
                <span className="attempt-score">{attempt.promptScore.total}pts</span>
              )}
              {attempt.prompt && (
                <span className="attempt-prompt" title={attempt.prompt}>
                  {attempt.prompt.length > 40 ? attempt.prompt.slice(0, 40) + '…' : attempt.prompt}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
