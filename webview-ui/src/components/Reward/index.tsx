import { useCallback } from 'react';
import { useVSCode } from '../../hooks/useVSCode';
import { useTranslation } from '../../i18n';
import { useRewardPhase } from './useRewardPhase';
import type { LevelRewardData } from '../../types/messages';
import './Reward.css';

interface RewardOverlayProps {
  reward: LevelRewardData;
  onDismiss: () => void;
}

export function RewardOverlay({ reward, onDismiss }: RewardOverlayProps) {
  const { postMessage } = useVSCode();
  const { t } = useTranslation();
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

  const handleCertificate = useCallback(() => {
    postMessage({ command: 'openJourneyCertificate' });
    onDismiss();
  }, [postMessage, onDismiss]);

  const showCertificateButton =
    reward.certificateAutoPrompt !== false &&
    (reward.certificateJustUnlocked === true || reward.certificateAutoPrompt === true);

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
          text={isPerfect ? t('reward.perfect') : t('reward.pass')}
          active={phase !== 'idle'}
        />
      </div>

      {isPerfect && phase !== 'idle' && <div className="reward-glow-pulse" />}

      {/* Phase 2: Score card */}
      <div className={`reward-scores ${phaseAtLeast(phase, 'score') ? 'reward-scores--visible' : ''}`}>
        {reward.score && reward.score.total > 0 && (
          <div className="reward-score-card">
            <div className="reward-score-card__header">{t('reward.signalAnalysis')}</div>
            <div className="reward-score-row">
              <span>{t('reward.scoreBrevity')}</span>
              <span className="reward-score-val">{reward.score.brevityScore}</span>
            </div>
            <div className="reward-score-row">
              <span>{t('reward.scoreFirstTry')}</span>
              <span className="reward-score-val">{reward.score.firstTryScore}</span>
            </div>
            <div className="reward-score-row">
              <span>{t('reward.scoreElegance')}</span>
              <span className="reward-score-val">{reward.score.eleganceScore}</span>
            </div>
            <div className="reward-score-row">
              <span>{t('reward.scoreRegex')}</span>
              <span className="reward-score-val">{reward.score.regexQualityScore}</span>
            </div>
            <div className="reward-score-total">
              <span>{t('reward.total')}</span>
              <span className="reward-score-val reward-score-val--total">{reward.score.total}</span>
            </div>
          </div>
        )}

        <div className="reward-xp">
          <span className="reward-xp__label">{t('reward.xpLabel')}</span>
          <span className="reward-xp__value">+{reward.xpGained}</span>
          {reward.comboCount > 1 && (
            <span className="reward-combo">{t('reward.combo', { count: reward.comboCount })}</span>
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
        {showCertificateButton && (
          <button className="reward-btn reward-btn--primary" onClick={handleCertificate}>
            {t('certificate.entryButton')}
          </button>
        )}
        {!reward.isGameComplete && !reward.isOriginComplete && (
          <button
            className={`reward-btn ${showCertificateButton ? 'reward-btn--secondary' : 'reward-btn--primary'}`}
            onClick={handleNextLevel}
          >
            {reward.isChapterComplete ? t('reward.nextChapter') : t('reward.nextLevel')}
          </button>
        )}
        <button className="reward-btn reward-btn--secondary" onClick={handleReplay}>
          {t('reward.replay')}
        </button>
        <button className="reward-btn reward-btn--secondary" onClick={handleLeaderboard}>
          {t('reward.leaderboard')}
        </button>
        {reward.isGameComplete && !reward.isOriginComplete && (
          <div className="reward-origin-teaser">
            <p className="reward-origin-teaser__quote">{t('reward.originHint')}</p>
            <p className="reward-origin-teaser__condition">{t('reward.originHintSub')}</p>
          </div>
        )}
      </div>

      {phase !== 'actions' && (
        <div className="reward-skip-hint">{t('reward.skipHint')}</div>
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
  const { t } = useTranslation();
  return (
    <div className="reward-chapter">
      <div className="reward-chapter__title">
        {t('reward.chapterComplete', { chapter: summary.chapter, name: summary.chapterName })}
      </div>
      <p className="reward-chapter__line">{summary.completeLine}</p>

      <div className="reward-chapter__stats">
        <div className="reward-stat-row">
          <span>{t('reward.levels')}</span>
          <span>{summary.levelsCompleted}/{summary.totalLevels} ✓</span>
        </div>
        <div className="reward-stat-row">
          <span>{t('reward.perfect.label')}</span>
          <span>{summary.levelsPerfect}/{summary.totalLevels} ⭐</span>
        </div>
        <div className="reward-stat-row">
          <span>{t('reward.totalXp')}</span>
          <span>+{summary.totalXp}</span>
        </div>
        <div className="reward-stat-row">
          <span>{t('reward.bestCombo')}</span>
          <span>x{summary.bestCombo}</span>
        </div>
      </div>

      {summary.achievements.length > 0 && (
        <div className="reward-chapter__achievements">
          <div className="reward-chapter__ach-title">{t('reward.achievementsUnlocked')}</div>
          {summary.achievements.map(a => (
            <span key={a.id} className="reward-mini-badge">{a.name}</span>
          ))}
        </div>
      )}

      {summary.nextChapter !== null && (
        <div className="reward-chapter__next">
          <span className="reward-next-label">{t('reward.chapterUnlocked', { n: summary.nextChapter })}</span>
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
  const { t } = useTranslation();
  const elapsedMin = summary.elapsedMs ? Math.round(summary.elapsedMs / 60000) : 0;

  if (isOrigin) {
    return (
      <div className="reward-finale reward-finale--origin">
        <div className="reward-finale__static">{t('reward.finale.protocol')}</div>
        <p className="reward-finale__line">{t('reward.finale.origin1')}</p>
        <p className="reward-finale__line">{t('reward.finale.origin2')}</p>
        <p className="reward-finale__line">{t('reward.finale.origin3')}</p>
        <div className="reward-finale__reveal">{t('reward.finale.originReveal')}</div>
        <p className="reward-finale__sub" dangerouslySetInnerHTML={{ __html: t('reward.finale.originSub') }} />
      </div>
    );
  }

  return (
    <div className="reward-finale reward-finale--game">
      <p className="reward-finale__line">{t('reward.finale.game1')}</p>
      <p className="reward-finale__line">{t('reward.finale.game2')}</p>
      <p className="reward-finale__line">{t('reward.finale.game3')}</p>
      <div className="reward-finale__reveal">{t('reward.finale.gameReveal')}</div>
      <p className="reward-finale__sub">{t('reward.finale.gameSub1')}</p>
      <p className="reward-finale__sub">{t('reward.finale.gameSub2')}</p>
      <div className="reward-finale__stats">
        <div className="reward-stat-row">
          <span>{t('reward.finale.decryptedLevels')}</span>
          <span>{summary.totalCompletedLevels}/{summary.totalStandardLevels}</span>
        </div>
        <div className="reward-stat-row">
          <span>{t('reward.finale.totalXp')}</span>
          <span>{summary.totalXp}</span>
        </div>
        <div className="reward-stat-row">
          <span>{t('reward.finale.playTime')}</span>
          <span>{t('reward.finale.playTimeValue', { min: elapsedMin })}</span>
        </div>
        <div className="reward-stat-row">
          <span>{t('reward.finale.achievementCount')}</span>
          <span>{t('reward.finale.achievementUnit', { count: summary.achievements.length })}</span>
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
