import { useCallback } from 'react';
import { useVSCode } from '../../hooks/useVSCode';
import { useRewardPhase } from './useRewardPhase';
import type { LevelRewardData } from '../../types/messages';
import './Reward.css';

interface RewardOverlayProps {
  reward: LevelRewardData;
  onDismiss: () => void;
}

export function RewardOverlay({ reward, onDismiss }: RewardOverlayProps) {
  const { postMessage } = useVSCode();
  const { phase, skipToActions } = useRewardPhase(
    true,
    reward.isChapterComplete,
    reward.isGameComplete || reward.isOriginComplete,
  );

  const handleClick = useCallback(() => {
    if (phase !== 'actions') {
      skipToActions();
    }
  }, [phase, skipToActions]);

  const handleNextLevel = useCallback(() => {
    postMessage({ command: 'nextLevel' });
    onDismiss();
  }, [postMessage, onDismiss]);

  const handleReplay = useCallback(() => {
    postMessage({ command: 'replayLevel', levelId: reward.levelId });
    onDismiss();
  }, [postMessage, onDismiss, reward.levelId]);

  const handleLeaderboard = useCallback(() => {
    postMessage({ command: 'viewLeaderboard' });
    onDismiss();
  }, [postMessage, onDismiss]);

  const isPerfect = reward.tier === 'perfect';
  const showChapter = reward.isChapterComplete && (phase === 'chapter' || phase === 'finale' || phase === 'actions');
  const showFinale = (reward.isGameComplete || reward.isOriginComplete) && (phase === 'finale' || phase === 'actions');

  return (
    <div
      className={`reward-overlay ${isPerfect ? 'reward--perfect' : 'reward--pass'}`}
      onClick={handleClick}
      role="presentation"
    >
      {/* Phase 1: Icon + headline */}
      <div className={`reward-icon ${phase !== 'idle' ? 'reward-icon--visible' : ''}`}>
        <span className="reward-icon__symbol">
          {isPerfect ? '⭐' : '✓'}
        </span>
        <TypewriterText
          text={isPerfect ? 'PERFECT DECODE — 零噪声。零误差。' : 'SIGNAL DECODED — 信号已解析'}
          active={phase !== 'idle'}
        />
      </div>

      {isPerfect && phase !== 'idle' && <div className="reward-glow-pulse" />}

      {/* Phase 2: Score card */}
      <div className={`reward-scores ${phaseAtLeast(phase, 'score') ? 'reward-scores--visible' : ''}`}>
        {reward.score && reward.score.total > 0 && (
          <div className="reward-score-card">
            <div className="reward-score-card__header">SIGNAL ANALYSIS</div>
            <div className="reward-score-row">
              <span>📏 简洁度</span>
              <span className="reward-score-val">{reward.score.brevityScore}</span>
            </div>
            <div className="reward-score-row">
              <span>🎯 一次性</span>
              <span className="reward-score-val">{reward.score.firstTryScore}</span>
            </div>
            <div className="reward-score-row">
              <span>🧠 优雅度</span>
              <span className="reward-score-val">{reward.score.eleganceScore}</span>
            </div>
            <div className="reward-score-row">
              <span>⚔️ 规则质量</span>
              <span className="reward-score-val">{reward.score.regexQualityScore}</span>
            </div>
            <div className="reward-score-total">
              <span>TOTAL</span>
              <span className="reward-score-val reward-score-val--total">{reward.score.total}</span>
            </div>
          </div>
        )}

        <div className="reward-xp">
          <span className="reward-xp__label">XP</span>
          <span className="reward-xp__value">+{reward.xpGained}</span>
          {reward.comboCount > 1 && (
            <span className="reward-combo">x{reward.comboCount} COMBO</span>
          )}
        </div>

        {reward.newAchievements.length > 0 && (
          <div className="reward-achievements">
            {reward.newAchievements.map(a => (
              <div key={a.id} className="reward-achievement-badge">
                <span className="reward-achievement-badge__name">{a.name}</span>
                <span className="reward-achievement-badge__desc">{a.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase 3: Chapter summary (only if chapter complete) */}
      {showChapter && reward.chapterSummary && !showFinale && (
        <ChapterPanel summary={reward.chapterSummary} />
      )}

      {/* Phase 3 alt: Game complete / Origin finale */}
      {showFinale && (
        <FinalePanel
          isOrigin={reward.isOriginComplete}
          summary={reward.chapterSummary!}
        />
      )}

      {/* Phase 4: Action buttons */}
      <div className={`reward-actions ${phase === 'actions' ? 'reward-actions--visible' : ''}`}>
        {!reward.isGameComplete && !reward.isOriginComplete && (
          <button className="reward-btn reward-btn--primary" onClick={handleNextLevel}>
            {reward.isChapterComplete ? '▶ 进入下一章' : '▶ 下一关'}
          </button>
        )}
        <button className="reward-btn reward-btn--secondary" onClick={handleReplay}>
          ↺ 重新挑战
        </button>
        <button className="reward-btn reward-btn--secondary" onClick={handleLeaderboard}>
          📊 排行榜
        </button>
        {reward.isGameComplete && !reward.isOriginComplete && (
          <p className="reward-hint">还有一个信号源未被探测…</p>
        )}
      </div>

      {phase !== 'actions' && (
        <div className="reward-skip-hint">点击任意处跳过</div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function TypewriterText({ text, active }: { text: string; active: boolean }) {
  // For reduced-motion or simplicity, just fade in the text
  return (
    <span className={`typewriter-text ${active ? 'typewriter-text--active' : ''}`}>
      {text}
    </span>
  );
}

function ChapterPanel({ summary }: { summary: NonNullable<LevelRewardData['chapterSummary']> }) {
  return (
    <div className="reward-chapter">
      <div className="reward-chapter__title">
        📡 Chapter {summary.chapter} Complete — {summary.chapterName}
      </div>
      <p className="reward-chapter__line">{summary.completeLine}</p>

      <div className="reward-chapter__stats">
        <div className="reward-stat-row">
          <span>Levels</span>
          <span>{summary.levelsCompleted}/{summary.totalLevels} ✓</span>
        </div>
        <div className="reward-stat-row">
          <span>Perfect</span>
          <span>{summary.levelsPerfect}/{summary.totalLevels} ⭐</span>
        </div>
        <div className="reward-stat-row">
          <span>Total XP</span>
          <span>+{summary.totalXp}</span>
        </div>
        <div className="reward-stat-row">
          <span>Best Combo</span>
          <span>x{summary.bestCombo}</span>
        </div>
      </div>

      {summary.achievements.length > 0 && (
        <div className="reward-chapter__achievements">
          <div className="reward-chapter__ach-title">Achievements Unlocked:</div>
          {summary.achievements.map(a => (
            <span key={a.id} className="reward-mini-badge">{a.name}</span>
          ))}
        </div>
      )}

      {summary.nextChapter !== null && (
        <div className="reward-chapter__next">
          <span className="reward-next-label">&gt;&gt; CHAPTER {summary.nextChapter} UNLOCKED</span>
          {summary.nextChapterIntro && (
            <p className="reward-next-intro">{summary.nextChapterIntro}</p>
          )}
        </div>
      )}
    </div>
  );
}

function FinalePanel({
  isOrigin,
  summary,
}: {
  isOrigin: boolean;
  summary: NonNullable<LevelRewardData['chapterSummary']>;
}) {
  const elapsedMin = summary.elapsedMs ? Math.round(summary.elapsedMs / 60000) : 0;

  if (isOrigin) {
    return (
      <div className="reward-finale reward-finale--origin">
        <div className="reward-finale__static">[BLACK BOX RECOVERED]</div>
        <p className="reward-finale__line">&gt;&gt; 解析残骸数据…</p>
        <p className="reward-finale__line">&gt;&gt; 帧校验通过…</p>
        <p className="reward-finale__line">&gt;&gt; 源信号定位完成。</p>
        <div className="reward-finale__reveal">WE WERE THE PARSER</div>
        <p className="reward-finale__sub">
          解析者与信号，从未分开过。
          <br />
          rEx 不是终点。rEx 是起点。
        </p>
      </div>
    );
  }

  return (
    <div className="reward-finale reward-finale--game">
      <p className="reward-finale__line">…you understand now…</p>
      <p className="reward-finale__line">…the language is yours…</p>
      <p className="reward-finale__line">…rEx was never the signal. You were.…</p>
      <div className="reward-finale__reveal">你就是下一个 rEx</div>
      <p className="reward-finale__sub">所有信号已解密。你学会了如何与机器对话。</p>
      <p className="reward-finale__sub">rEx 说：&ldquo;Welcome home.&rdquo;</p>
      <div className="reward-finale__stats">
        <div className="reward-stat-row">
          <span>解密关卡</span>
          <span>{summary.totalCompletedLevels}/{summary.totalStandardLevels}</span>
        </div>
        <div className="reward-stat-row">
          <span>总 XP</span>
          <span>{summary.totalXp}</span>
        </div>
        <div className="reward-stat-row">
          <span>游玩时间</span>
          <span>{elapsedMin} 分钟</span>
        </div>
        <div className="reward-stat-row">
          <span>成就</span>
          <span>{summary.achievements.length} 个</span>
        </div>
      </div>
    </div>
  );
}

function phaseAtLeast(current: string, target: string): boolean {
  const order = ['idle', 'icon', 'score', 'actions', 'chapter', 'finale'];
  // actions/chapter/finale are all "late" phases
  const latePhases = ['score', 'actions', 'chapter', 'finale'];
  if (latePhases.includes(target)) {
    return latePhases.includes(current);
  }
  return order.indexOf(current) >= order.indexOf(target);
}
