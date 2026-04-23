import { useTranslation } from '../../i18n';
import './HintPanel.css';

interface HintPanelProps {
  promptHints: string[];
  totalCount: number;
  visible: boolean;
}

export function HintPanel({ promptHints, totalCount, visible }: HintPanelProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  const lockedCount = totalCount - promptHints.length;

  return (
    <div className="hint-panel">
      <div className="hint-panel__header">
        <span className="hint-panel__icon">📡</span>
        <span className="hint-panel__title">{t('hint.scanGuidance')}</span>
      </div>
      <ul className="hint-panel__list">
        {promptHints.map((hint, i) => (
          <li key={i} className="hint-panel__item hint-panel__item--unlocked">
            <span className="hint-panel__marker">▸</span>
            <span className="hint-panel__text">{hint}</span>
          </li>
        ))}
        {Array.from({ length: lockedCount }).map((_, i) => (
          <li key={`locked-${i}`} className="hint-panel__item hint-panel__item--locked">
            <span className="hint-panel__marker">▹</span>
            <span className="hint-panel__redacted">
              {'░'.repeat(12 + Math.floor(Math.random() * 8))}
            </span>
            <span className="hint-panel__lock-tag">{t('hint.locked')}</span>
          </li>
        ))}
        {promptHints.length === 0 && lockedCount === 0 && (
          <li className="hint-panel__item hint-panel__item--empty">
            <span className="hint-panel__text text-muted">{t('hint.noHintsYet')}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
