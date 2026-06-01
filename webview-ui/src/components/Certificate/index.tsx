import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
import { useMessageListener, useVSCode } from '../../hooks/useVSCode';
import type {
  ExtensionMessage,
  JourneyCertificateData,
  ChapterJourneyView,
  LevelJourneyView,
} from '../../types/messages';
import { SECTIONS as CODEX_SECTIONS } from '../Codex';
import './Certificate.css';

// Image export: html2canvas snapshots the entire stitched preview (all
// pages laid out vertically) into a single tall PNG, which the extension
// writes straight into the user's Documents folder. PDF was tried earlier
// but the multi-page layout fought us on fonts, backgrounds, and page
// margins — a flat image side-steps all of that and is what most users
// actually want to share/print.

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'rendering' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

const PRINT_DOC_TITLE_PREFIX = 'YourEx_Journey_Certificate';

export function Certificate() {
  const { t } = useTranslation();
  const { postMessage } = useVSCode();
  const [data, setData] = useState<JourneyCertificateData | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    postMessage({ command: 'ready' });
  }, [postMessage]);

  useMessageListener((msg: unknown) => {
    const m = msg as ExtensionMessage;
    if (m.command === 'loadCertificateData') {
      setData(m.data);
      setNameDraft(m.data.playerName);
    } else if (m.command === 'certificateSaved') {
      setSaveStatus({
        kind: 'success',
        message: t('certificate.exportSavedTo', { path: m.filePath }),
      });
    } else if (m.command === 'certificateSaveFailed') {
      setSaveStatus({ kind: 'error', message: m.error });
    }
  });

  const fileName = useMemo(() => {
    if (!data) return `${PRINT_DOC_TITLE_PREFIX}.png`;
    const safeName = data.playerName.replace(/[^\p{L}\p{N}_-]+/gu, '_');
    const date = new Date(data.generatedAt);
    return `${PRINT_DOC_TITLE_PREFIX}_${safeName}_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}.png`;
  }, [data]);

  const handleExportImage = useCallback(async () => {
    if (!data) return;
    const root = previewRef.current;
    if (!root) {
      setSaveStatus({ kind: 'error', message: 'Preview not ready' });
      return;
    }
    setSaveStatus({ kind: 'rendering' });
    try {
      // Lazy-load so the renderer only ships when the user actually exports.
      const { default: html2canvas } = await import('html2canvas');

      // Collect the page's stylesheet text up front. html2canvas builds an
      // internal iframe to render its clone, and inside that iframe the
      // original <link rel="stylesheet" href="vscode-webview-resource://…">
      // tags can't load — so without re-injecting the CSS, every class-based
      // rule (flex layout, grids, text-align, borders) silently disappears
      // and the snapshot looks like raw unstyled text.
      const cssText = collectStylesheetText();

      // Switch the live preview to a single 900px column for the snapshot —
      // this keeps the in-webview look (centered titles, name plate, grid
      // rows) instead of squishing pages into the live multi-column grid.
      root.classList.add('cert-preview--export');
      void root.offsetHeight;

      try {
        const canvas = await html2canvas(root, {
          backgroundColor: '#05070d',
          scale: 2,
          useCORS: true,
          logging: false,
          width: root.offsetWidth,
          height: root.offsetHeight,
          windowWidth: root.offsetWidth,
          windowHeight: root.offsetHeight,
          onclone: (clonedDoc) => {
            // Re-inject the CSS so class-based styles apply inside the
            // html2canvas iframe even when the original stylesheet link
            // can't be fetched from there.
            if (cssText) {
              const style = clonedDoc.createElement('style');
              style.setAttribute('data-cert-export', '');
              style.textContent = cssText;
              clonedDoc.head.appendChild(style);
            }
            // Make sure the export class is also present on the clone in
            // case html2canvas snapshots before our class-add takes effect
            // in the cloned tree.
            const clonedRoot = clonedDoc.querySelector('.cert-preview');
            clonedRoot?.classList.add('cert-preview--export');
          },
        });
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/png')
        );
        if (!blob) throw new Error('Could not encode image');
        const buf = await blob.arrayBuffer();
        postMessage({
          command: 'generateCertificateImage',
          imageBytes: Array.from(new Uint8Array(buf)),
          fileName,
        });
      } finally {
        root.classList.remove('cert-preview--export');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setSaveStatus({ kind: 'error', message });
    }
  }, [data, fileName, postMessage]);

  const handleSaveName = useCallback(() => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== data?.playerName) {
      postMessage({ command: 'setCertificatePlayerName', name: trimmed });
    }
  }, [nameDraft, data?.playerName, postMessage]);

  const handleOpenHiddenChapter = useCallback(() => {
    postMessage({ command: 'openHiddenChapter' });
  }, [postMessage]);

  if (!data) {
    return (
      <div className="cert-root">
        <div className="cert-empty">{t('certificate.regenerating')}</div>
      </div>
    );
  }

  return (
    <div className="cert-root">
      <header className="cert-header">
        <div>
          <h1 className="cert-header__title">{t('certificate.title')}</h1>
          <p className="cert-header__subtitle">{t('certificate.previewLabel')}</p>
        </div>
        <div className="cert-toolbar">
          <input
            className="cert-name-input"
            value={nameDraft}
            maxLength={24}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder={t('certificate.playerNameLabel')}
          />
          <button className="cert-btn cert-btn--ghost" onClick={handleSaveName}>
            {t('certificate.playerNameSave')}
          </button>
          <button
            className="cert-btn cert-btn--primary"
            onClick={handleExportImage}
            disabled={saveStatus.kind === 'rendering'}
            title={t('certificate.exportTooltip')}
          >
            {saveStatus.kind === 'rendering' ? t('certificate.exportRendering') : t('certificate.exportImageButton')}
          </button>
          {!data.isOriginComplete && (
            <button
              className={`cert-btn ${data.isOriginUnlocked ? 'cert-btn--accent' : 'cert-btn--ghost'}`}
              onClick={data.isOriginUnlocked ? handleOpenHiddenChapter : undefined}
              disabled={!data.isOriginUnlocked}
              title={data.isOriginUnlocked ? undefined : t('certificate.originTeaserCondition')}
            >
              {data.isOriginUnlocked ? t('certificate.openHiddenChapter') : t('certificate.hiddenChapterLocked')}
            </button>
          )}
        </div>
      </header>

      <div
        className={`cert-status ${
          saveStatus.kind === 'success' ? 'cert-status--ok' : saveStatus.kind === 'error' ? 'cert-status--err' : ''
        }`}
      >
        {(saveStatus.kind === 'success' || saveStatus.kind === 'error') && saveStatus.message}
        {saveStatus.kind === 'idle' && t('certificate.exportHint')}
      </div>

      <div className="cert-preview" ref={previewRef}>
        <CoverPreview data={data} t={t} />
        <OverviewPreview data={data} t={t} />
        <ManualPreview t={t} />
        {data.chapters.map((ch) => (
          <ChapterPreview key={ch.chapter} chapter={ch} t={t} />
        ))}
        <AchievementsPreview data={data} t={t} />
        <EndingPreview data={data} t={t} />
      </div>
    </div>
  );
}

type TFn = (key: string, params?: Record<string, string | number>) => string;

function CoverPreview({ data, t }: { data: JourneyCertificateData; t: TFn }) {
  const issued = new Date(data.generatedAt);
  const isoDate = `${issued.getFullYear()}-${pad(issued.getMonth() + 1)}-${pad(issued.getDate())} ${pad(issued.getHours())}:${pad(issued.getMinutes())}:${pad(issued.getSeconds())}`;
  return (
    <div className="cert-page">
      <div className="cert-page__tag">{t('certificate.cover.transmissionTag')}</div>
      <div className="cert-cover-title">YOUREX · JOURNEY</div>
      <div className="cert-cover-sub">CERTIFICATE</div>
      <div className="cert-cover-badge">◆◆◆ {t('certificate.statusBadge')} ◆◆◆</div>

      <div style={{ textAlign: 'center', color: '#7a8aa0', fontSize: 11, marginTop: 18 }}>
        {'>>'} {t('certificate.thisCertifies')}
      </div>
      <div className="cert-cover-name">{data.playerName}</div>

      <div className="cert-cover-summary">
        {t('certificate.summary', { total: data.totalCompletedStandardLevels })}
      </div>

      <div className="cert-cover-meta">
        <div className="cert-cover-meta-row">
          <span>{t('certificate.cover.certIdLabel')}</span>
          <span>{data.certificateId}</span>
        </div>
        <div className="cert-cover-meta-row">
          <span>{t('certificate.cover.issuedAtLabel')}</span>
          <span>{isoDate}</span>
        </div>
        <div className="cert-cover-meta-row">
          <span>{t('certificate.cover.chaptersLabel')}</span>
          <span>
            {data.totalCompletedStandardLevels}/{data.totalStandardLevels}
            {data.isOriginComplete ? ' (+ ORIGIN: ✓)' : data.isOriginUnlocked ? ' (+ ORIGIN: ?)' : ''}
          </span>
        </div>
        <div className="cert-cover-meta-row">
          <span>{t('certificate.cover.rankLabel')}</span>
          <span>{rankFor(data, t)}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: '#ffd27a', fontSize: 11, marginTop: 18 }}>
        {t('certificate.welcomeHome')}
      </div>
    </div>
  );
}

function OverviewPreview({ data, t }: { data: JourneyCertificateData; t: TFn }) {
  const successRate = data.totalAttempts > 0
    ? ((data.perfectCount + data.passCount) / data.totalAttempts * 100).toFixed(1) + '%'
    : '—';
  const playTime = formatDuration(data.totalPlayTime);
  const allAttempts = data.chapters.flatMap((c) => c.levels.flatMap((l) => l.attempts));

  return (
    <div className="cert-page">
      <div className="cert-page__tag">{t('certificate.signalTraceReport')}</div>
      <div className="cert-page__divider" />
      <h2 className="cert-page__title">{t('certificate.missionSummary')}</h2>
      <div className="cert-stats-box">
        <StatRow label={t('certificate.statsLevels')} value={`${data.totalCompletedStandardLevels} / ${data.totalStandardLevels}`} />
        <StatRow label={t('certificate.statsOrigin')} value={data.isOriginComplete ? '✓' : data.isOriginUnlocked ? '— in progress —' : t('certificate.skippedOrigin')} />
        <StatRow label={t('certificate.statsPerfect')} value={String(data.perfectCount)} />
        <StatRow label={t('certificate.statsAttempts')} value={String(data.totalAttempts)} />
        <StatRow label={t('certificate.statsSuccessRate')} value={successRate} />
        <StatRow label={t('certificate.statsPromptChars')} value={String(data.totalPromptLength)} />
        <StatRow label={t('certificate.statsCombo')} value={`x${data.maxCombo}`} />
        <StatRow label={t('certificate.statsXp')} value={String(data.totalXp)} />
        <StatRow label={t('certificate.statsPlayTime')} value={playTime} />
      </div>

      <h3 className="cert-section-title">{t('certificate.chapterProgress')}</h3>
      {data.chapters.map((ch) => {
        const passed = ch.levels.filter((l) => l.status === 'pass' || l.status === 'perfect').length;
        const total = ch.levels.length;
        const perfect = ch.levels.filter((l) => l.status === 'perfect').length;
        const ratio = total > 0 ? passed / total : 0;
        return (
          <div key={ch.chapter} className="cert-chapter-row">
            <span>Ch{ch.chapter}</span>
            <div className="cert-bar">
              <div style={{ width: `${ratio * 100}%` }} />
            </div>
            <span>{passed}/{total}{perfect > 0 ? ` (${perfect}⭐)` : ''}</span>
          </div>
        );
      })}

      <h3 className="cert-section-title" style={{ marginTop: 18 }}>{t('certificate.signalWaveform')}</h3>
      <div className="cert-waveform">
        {allAttempts.map((a, i) => {
          const color = a.status === 'perfect' ? '#ffd27a' : a.status === 'pass' ? '#34f5c5' : '#ff5c7a';
          const h = a.status === 'perfect' ? 28 : a.status === 'pass' ? 18 : 6;
          return (
            <div
              key={i}
              className="cert-waveform__bar"
              style={{ height: h, background: color }}
            />
          );
        })}
        {allAttempts.length === 0 && (
          <div style={{ color: '#7a8aa0', fontSize: 10, padding: 8 }}>—</div>
        )}
      </div>
    </div>
  );
}

function ManualPreview({ t }: { t: TFn }) {
  return (
    <div className="cert-page cert-manual">
      <div className="cert-page__tag">{'>>'} {t('codex.title')}</div>
      <div className="cert-page__divider" />
      <p className="cert-manual__subtitle">{t('codex.subtitle')}</p>
      <div className="cert-manual__grid">
        {CODEX_SECTIONS.map((sec, si) => (
          <section key={si} className="cert-manual__section">
            <div className="cert-manual__section-header">
              <span className="cert-manual__section-icon">{sec.icon}</span>
              <span className="cert-manual__section-title">{t(sec.titleKey)}</span>
            </div>
            <table className="cert-manual__table">
              <tbody>
                {sec.entries.map((entry, i) => (
                  <tr key={i}>
                    <td className="cert-manual__meta">{entry.meta}</td>
                    <td className="cert-manual__desc">{t(entry.desc)}</td>
                    <td className="cert-manual__example">{entry.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
      <div className="cert-manual__footer">{t('codex.footer')}</div>
    </div>
  );
}

function ChapterPreview({ chapter, t }: { chapter: ChapterJourneyView; t: TFn }) {
  return (
    <div className="cert-page">
      <div className="cert-page__tag">{'>>'} CHAPTER {chapter.chapter} // {chapter.chapterTitle.toUpperCase()}</div>
      <div className="cert-page__divider" />
      {chapter.chapterCompleteLine && (
        <p style={{ fontStyle: 'italic', fontSize: 11, color: '#7a8aa0', margin: '0 0 12px 0' }}>
          "{chapter.chapterCompleteLine}"
        </p>
      )}
      {chapter.levels.map((level) => (
        <LevelCardPreview key={level.levelId} level={level} t={t} />
      ))}
      <div className="cert-chapter-footer">
        {t('certificate.chapterStats', {
          complete: chapter.levels.filter((l) => l.status === 'pass' || l.status === 'perfect').length,
          total: chapter.levels.length,
          perfect: chapter.levels.filter((l) => l.status === 'perfect').length,
          attempts: chapter.levels.reduce((sum, l) => sum + l.totalAttempts, 0),
        })}
      </div>
    </div>
  );
}

function LevelCardPreview({ level, t }: { level: LevelJourneyView; t: TFn }) {
  const success = level.attempts.find((a) => a.status === 'perfect') || level.attempts.find((a) => a.status === 'pass');
  return (
    <div className="cert-level-card">
      <div className="cert-level-header">
        <span style={{ color: '#34f5c5' }}>
          {t('certificate.chapterLevel', { order: level.levelOrder })} // {level.levelTitle}
        </span>
        <span style={{ color: levelStatusColor(level.status) }}>
          {levelStatusGlyph(level.status)} {translateStatus(level.status, t)}
          {level.bestScore ? `  ${level.bestScore.total}/100` : ''}
        </span>
      </div>
      <div className="cert-level-attempts">
        {t('certificate.attemptsLabel')}: {level.totalAttempts}
        {level.failCount > 0 && level.successCount > 0 ? (
          ' · ' + t('certificate.failSummary', {
            fail: level.failCount,
            success: level.successCount,
            result: translateStatus(level.status === 'perfect' ? 'perfect' : 'pass', t),
          })
        ) : null}
      </div>
      {success ? (
        <>
          <div className="cert-code-label">{t('certificate.levelFinalPrompt')}</div>
          <div className="cert-code-block">
            {success.prompt && success.prompt.length > 0 ? success.prompt : t('certificate.levelManualMode')}
          </div>
          {success.regex ? (
            <>
              <div className="cert-code-label">{t('certificate.levelFinalRegex')}</div>
              <div className="cert-code-block">{success.regex}</div>
            </>
          ) : null}
        </>
      ) : (
        <div className="cert-code-label" style={{ marginTop: 8 }}>{t('certificate.levelNoSuccessYet')}</div>
      )}
    </div>
  );
}

function AchievementsPreview({ data, t }: { data: JourneyCertificateData; t: TFn }) {
  const unlocked = data.achievements.filter((a) => a.unlocked);
  const locked = data.achievements.filter((a) => !a.unlocked);
  return (
    <div className="cert-page">
      <div className="cert-page__tag">{t('certificate.achievementsTitle')}</div>
      <div className="cert-page__divider" />
      <div className="cert-achievement-grid">
        {unlocked.map((a) => (
          <div key={a.id} className="cert-achievement-card">
            <div className="cert-achievement-card__name">{a.name}</div>
            <div className="cert-achievement-card__desc">{a.description}</div>
          </div>
        ))}
      </div>
      {locked.length > 0 && (
        <>
          <h3 className="cert-section-title" style={{ marginTop: 18 }}>{t('certificate.achievementLockedHint')}</h3>
          <div className="cert-achievement-grid">
            {locked.map((a) => (
              <div key={a.id} className="cert-achievement-card cert-achievement-card--locked">
                <div className="cert-achievement-card__name">? ? ?</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EndingPreview({ data, t }: { data: JourneyCertificateData; t: TFn }) {
  return (
    <div className="cert-page">
      <div className="cert-ending">
        <div className="cert-ending__tag">{t('certificate.endTransmission')}</div>
        <div className="cert-ending__headline">{t('certificate.allSignalsDecoded')}</div>
        <div className="cert-ending__line">{t('certificate.youAreNextRex')}</div>
        <div className="cert-ending__sigil">
          <svg width="90" height="90" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
            <polygon points="45,8 82,28 82,62 45,82 8,62 8,28" stroke="#ffd27a" strokeWidth="1.2" fill="none" />
            <polygon points="45,22 70,35 70,55 45,68 20,55 20,35" stroke="#34f5c5" strokeWidth="0.8" fill="none" />
            <path d="M30 50 Q45 30 60 50" stroke="#ffd27a" strokeWidth="1.2" fill="none" />
            <path d="M30 42 L60 42" stroke="#34f5c5" strokeWidth="0.8" />
            <rect x="42" y="40" width="6" height="6" fill="#ffd27a" />
          </svg>
        </div>
        <div className="cert-ending__line" style={{ color: '#ffd27a', marginTop: 14 }}>
          {t('certificate.welcomeHome')}
        </div>

        {!data.isOriginComplete && (
          <div className="cert-ending__origin-teaser">
            <div className="cert-ending__origin-signal">{t('certificate.originTeaser')}</div>
            <div className="cert-ending__origin-condition">{t('certificate.originTeaserCondition')}</div>
          </div>
        )}

        <div className="cert-ending__footer">
          CERT: {data.certificateId} · {t('certificate.brandFooter')}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="cert-stat-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function collectStylesheetText(): string {
  const parts: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin sheet (very unlikely inside a webview, but be safe).
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      parts.push(rule.cssText);
    }
  }
  return parts.join('\n');
}

function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '—';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function levelStatusColor(status: LevelJourneyView['status']): string {
  switch (status) {
    case 'perfect': return '#ffd27a';
    case 'pass': return '#34f5c5';
    case 'attempted': return '#ffb454';
    case 'skipped':
    default: return '#7a8aa0';
  }
}

function levelStatusGlyph(status: LevelJourneyView['status']): string {
  switch (status) {
    case 'perfect': return '★';
    case 'pass': return '✓';
    case 'attempted': return '◐';
    case 'skipped':
    default: return '○';
  }
}

function translateStatus(status: LevelJourneyView['status'] | 'pass' | 'perfect' | 'fail', t: TFn): string {
  switch (status) {
    case 'perfect': return t('certificate.levelStatusPerfect');
    case 'pass': return t('certificate.levelStatusPass');
    case 'attempted': return t('certificate.levelStatusAttempted');
    case 'skipped': return t('certificate.levelStatusSkipped');
    case 'fail': return t('certificate.levelStatusAttempted');
    default: return String(status);
  }
}

function rankFor(data: JourneyCertificateData, t: TFn): string {
  const rate = data.totalAttempts > 0 ? data.perfectCount / data.totalAttempts : 0;
  if (data.isOriginComplete) return t('certificate.rankMaster');
  if (rate >= 0.6) return 'ELITE PARSER';
  if (data.totalCompletedStandardLevels >= data.totalStandardLevels) return 'CERTIFIED PARSER';
  return 'SIGNAL CONTACT';
}

export default Certificate;
