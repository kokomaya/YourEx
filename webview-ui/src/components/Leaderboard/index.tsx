import { useState, useEffect } from 'react';
import { useVSCode, useMessageListener } from '../../hooks/useVSCode';
import { useTranslation } from '../../i18n';
import type { LeaderboardEntry, ExtensionMessage } from '../../types/messages';
import './Leaderboard.css';

const DIMENSION_ICONS: Record<string, string> = {
  avgScore: '📊',
  totalXp: '⚡',
  totalPromptLength: '📏',
  maxCombo: '🔥',
  manualClears: '⚔️',
  levelsCompleted: '📡',
  achievements: '🏅',
};

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const { postMessage } = useVSCode();
  const { t } = useTranslation();

  useMessageListener((raw) => {
    const msg = raw as ExtensionMessage;
    if (msg.command === 'showLeaderboard') {
      setEntries(msg.entries);
    }
  });

  useEffect(() => {
    postMessage({ command: 'ready' });
  }, [postMessage]);

  if (entries.length === 0) {
    return (
      <div className="leaderboard">
        <h2>{t('leaderboard.title')}</h2>
        <p className="leaderboard-waiting">{t('leaderboard.loading')}</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h2>{t('leaderboard.title')}</h2>
      <div className="leaderboard-grid">
        {entries.map((entry) => (
          <div key={entry.dimension} className="leaderboard-card">
            <span className="card-icon">{DIMENSION_ICONS[entry.dimension] ?? '📈'}</span>
            <span className="card-label">{entry.label}</span>
            <span className="card-value">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
