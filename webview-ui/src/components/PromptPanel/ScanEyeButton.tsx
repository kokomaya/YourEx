import { useTranslation } from '../../i18n';
import './ScanEyeButton.css';

interface ScanEyeButtonProps {
  hasNewHint: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function ScanEyeButton({ hasNewHint, disabled, onClick }: ScanEyeButtonProps) {
  const { t } = useTranslation();

  const className = [
    'scan-eye-btn',
    hasNewHint ? 'scan-eye-btn--pulse' : '',
    disabled ? 'scan-eye-btn--disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      title={t('hint.scanEyeTooltip')}
      aria-label={t('hint.scanEyeTooltip')}
    >
      <span className="scan-eye-icon">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
          {/* Outer eye shape */}
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          {/* Iris */}
          <circle cx="12" cy="12" r="3.5" />
          {/* Inner pupil */}
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="scan-eye-label">{t('hint.scanGuidance')}</span>
      {hasNewHint && <span className="scan-eye-ping" />}
    </button>
  );
}
