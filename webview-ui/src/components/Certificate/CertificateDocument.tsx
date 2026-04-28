import { Document, Page, Text, View, StyleSheet, Svg, Rect, Line, Polygon, Path } from '@react-pdf/renderer';
import type { JourneyCertificateData, ChapterJourneyView, LevelJourneyView } from '../../types/messages';
import { COLORS, FONTS, SPACING, SIZES } from './styles/theme';

const PAGE_W = 595;
const PAGE_H = 842;

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bgDeep,
    color: COLORS.textPrimary,
    padding: SPACING.page,
    fontFamily: FONTS.pdfBody,
    fontSize: SIZES.body,
    lineHeight: 1.45,
  },
  scanlinesTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  pageTag: {
    fontFamily: FONTS.pdfMono,
    fontSize: SIZES.caption,
    color: COLORS.accentSignal,
    marginBottom: 6,
  },
  hr: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.rule,
    marginVertical: 8,
  },
  // Cover
  coverInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  coverTitle: {
    fontFamily: FONTS.pdfBold,
    fontSize: SIZES.hugeCover,
    letterSpacing: 4,
    color: COLORS.accentSignal,
    textAlign: 'center',
  },
  coverTitleSub: {
    fontFamily: FONTS.pdfMono,
    fontSize: 16,
    letterSpacing: 6,
    color: COLORS.accentGold,
    textAlign: 'center',
    marginTop: 8,
  },
  coverBadge: {
    fontFamily: FONTS.pdfMono,
    fontSize: 10,
    color: COLORS.accentGold,
    textAlign: 'center',
    letterSpacing: 2,
    marginVertical: 14,
  },
  coverNamePlate: {
    borderWidth: 1,
    borderColor: COLORS.accentSignal,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginVertical: 14,
  },
  coverNameText: {
    fontFamily: FONTS.pdfMono,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  coverSummary: {
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: 10,
    marginVertical: 4,
    paddingHorizontal: 24,
  },
  coverMetaBox: {
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.bgPanel,
    padding: 12,
    marginVertical: 18,
  },
  coverMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontFamily: FONTS.pdfMono,
    fontSize: 10,
    paddingVertical: 2,
  },
  coverMetaLabel: { color: COLORS.accentSignal },
  coverMetaValue: { color: COLORS.textPrimary },
  coverFooter: {
    textAlign: 'center',
    fontFamily: FONTS.pdfMono,
    fontSize: 10,
    color: COLORS.accentGold,
  },
  // Overview
  sectionHeader: {
    fontFamily: FONTS.pdfMono,
    fontSize: SIZES.sectionTitle,
    color: COLORS.accentSignal,
    marginBottom: SPACING.block,
  },
  statsBox: {
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.bgPanel,
    padding: 14,
    marginBottom: SPACING.section,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontFamily: FONTS.pdfMono,
    fontSize: 10,
    paddingVertical: 3,
  },
  statLabel: { color: COLORS.textMuted },
  statValue: { color: COLORS.textPrimary, fontFamily: FONTS.pdfBold },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: FONTS.pdfMono,
    fontSize: 10,
    marginBottom: 4,
    color: COLORS.textPrimary,
  },
  // Chapter page
  chapterTitle: {
    fontFamily: FONTS.pdfMono,
    fontSize: 14,
    color: COLORS.accentSignal,
    marginBottom: 4,
  },
  chapterLine: {
    fontStyle: 'italic',
    fontSize: 9,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  levelCard: {
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.bgPanel,
    padding: 10,
    marginBottom: 10,
  },
  levelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontFamily: FONTS.pdfMono,
    fontSize: 10,
    marginBottom: 6,
  },
  codeBlock: {
    backgroundColor: COLORS.bgPanelAlt,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.accentSignal,
    padding: 6,
    fontFamily: FONTS.pdfMono,
    fontSize: 9,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  codeLabel: {
    fontFamily: FONTS.pdfMono,
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  chapterFooter: {
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.rule,
    paddingTop: 6,
    fontFamily: FONTS.pdfMono,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  // Achievements
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achievementCard: {
    width: 150,
    height: 80,
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.bgPanel,
    padding: 8,
    marginBottom: 10,
    marginRight: 10,
  },
  achievementName: {
    fontFamily: FONTS.pdfBold,
    fontSize: 10,
    color: COLORS.accentGold,
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
  achievementLocked: {
    fontFamily: FONTS.pdfMono,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingTop: 22,
  },
  // Ending
  endingPage: {
    backgroundColor: COLORS.bgDeep,
    color: COLORS.textPrimary,
    padding: 60,
    fontFamily: FONTS.pdfBody,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endingTag: {
    fontFamily: FONTS.pdfMono,
    fontSize: 14,
    color: COLORS.accentSignal,
    marginBottom: 30,
    letterSpacing: 4,
  },
  endingHeadline: {
    fontFamily: FONTS.pdfBold,
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 30,
    letterSpacing: 2,
  },
  endingLine: {
    fontSize: 11,
    color: COLORS.textPrimary,
    marginVertical: 4,
  },
  sigil: {
    width: 110,
    height: 110,
    marginVertical: 36,
    borderWidth: 1,
    borderColor: COLORS.accentGold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sigilText: {
    fontFamily: FONTS.pdfMono,
    color: COLORS.accentGold,
    fontSize: 12,
    letterSpacing: 4,
  },
  endingFooter: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: FONTS.pdfMono,
    fontSize: 9,
    color: COLORS.textMuted,
  },
});

interface Props {
  data: JourneyCertificateData;
}

function ScanLines() {
  return (
    <View style={styles.scanlinesTop}>
      <Svg width={PAGE_W} height={12} viewBox={`0 0 ${PAGE_W} 12`}>
        {Array.from({ length: PAGE_W / 6 }).map((_, i) => (
          <Rect key={i} x={i * 6} y={4} width={2} height={1} fill={COLORS.scan} />
        ))}
      </Svg>
    </View>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const w = 200;
  const filled = w * ratio;
  return (
    <Svg width={w} height={8} viewBox={`0 0 ${w} 8`}>
      <Rect x={0} y={0} width={w} height={8} fill={COLORS.bgPanelAlt} />
      <Rect x={0} y={0} width={filled} height={8} fill={COLORS.accentSignal} />
    </Svg>
  );
}

function Waveform({ chapters }: { chapters: ChapterJourneyView[] }) {
  const allAttempts = chapters.flatMap(c => c.levels.flatMap(l => l.attempts));
  const w = PAGE_W - SPACING.page * 2 - 4;
  const h = 36;
  const n = Math.max(allAttempts.length, 1);
  const step = w / n;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Rect x={0} y={0} width={w} height={h} fill={COLORS.bgPanel} />
      {allAttempts.map((a, i) => {
        const x = i * step;
        const isOk = a.status === 'perfect' || a.status === 'pass';
        const barH = isOk ? (a.status === 'perfect' ? 28 : 18) : 6;
        const color = a.status === 'perfect' ? COLORS.perfect : a.status === 'pass' ? COLORS.pass : COLORS.fail;
        return <Rect key={i} x={x + 0.5} y={h - barH} width={Math.max(step - 1, 0.5)} height={barH} fill={color} />;
      })}
      <Line x1={0} y1={h - 1} x2={w} y2={h - 1} stroke={COLORS.rule} strokeWidth={0.5} />
    </Svg>
  );
}

function CoverPage({ data }: Props) {
  const issued = new Date(data.generatedAt);
  const isoDate = `${issued.getFullYear()}-${pad(issued.getMonth() + 1)}-${pad(issued.getDate())} ${pad(issued.getHours())}:${pad(issued.getMinutes())}:${pad(issued.getSeconds())}`;

  return (
    <Page size="A4" style={styles.page}>
      <ScanLines />
      <View style={styles.coverInner}>
        <View>
          <Text style={styles.pageTag}>[REX_TRANSMISSION:CERT_GENESIS]</Text>
          <View style={{ height: 80 }} />
          <Text style={styles.coverTitle}>YOUREX · JOURNEY</Text>
          <Text style={styles.coverTitleSub}>CERTIFICATE</Text>
          <Text style={styles.coverBadge}>◆◆◆  SIGNAL FULLY DECODED  ◆◆◆</Text>
        </View>

        <View>
          <Text style={[styles.coverSummary, { color: COLORS.textMuted, marginBottom: 8 }]}>
            {'>>'} This certifies that:
          </Text>
          <View style={styles.coverNamePlate}>
            <Text style={styles.coverNameText}>{data.playerName}</Text>
          </View>
          <Text style={styles.coverSummary}>
            has successfully decoded all rEx signals, parsed {data.totalCompletedStandardLevels} protocol frames,
            and ascended from Signal Contact to certified rEx Parser.
          </Text>

          <View style={styles.coverMetaBox}>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>CERT_ID    </Text>
              <Text style={styles.coverMetaValue}>{data.certificateId}</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>ISSUED_AT  </Text>
              <Text style={styles.coverMetaValue}>{isoDate}</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>CHAPTERS   </Text>
              <Text style={styles.coverMetaValue}>
                {data.totalCompletedStandardLevels}/{data.totalStandardLevels}
                {data.isOriginComplete ? '  (+ ORIGIN: ✓)' : data.isOriginUnlocked ? '  (+ ORIGIN: ?)' : ''}
              </Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>RANK       </Text>
              <Text style={styles.coverMetaValue}>{rankFor(data)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.coverFooter}>rEx says: "Welcome home."</Text>
      </View>
    </Page>
  );
}

function OverviewPage({ data }: Props) {
  const successRate = data.totalAttempts > 0
    ? ((data.perfectCount + data.passCount) / data.totalAttempts * 100).toFixed(1) + '%'
    : '—';
  const playTime = formatDuration(data.totalPlayTime);

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.pageTag}>// SIGNAL_TRACE_REPORT // ROUTE: HOME</Text>
      <View style={styles.hr} />

      <Text style={styles.sectionHeader}>MISSION SUMMARY</Text>
      <View style={styles.statsBox}>
        <Stat label="Total Levels Completed" value={`${data.totalCompletedStandardLevels} / ${data.totalStandardLevels}`} />
        <Stat label="Origin (hidden)" value={data.isOriginComplete ? '✓ Decoded' : data.isOriginUnlocked ? 'Unfinished' : 'Not Triggered'} />
        <Stat label="Perfect Decodes" value={`${data.perfectCount}`} />
        <Stat label="Total Attempts" value={`${data.totalAttempts}`} />
        <Stat label="Success Rate" value={successRate} />
        <Stat label="Total Prompt Chars" value={`${data.totalPromptLength}`} />
        <Stat label="Best Combo" value={`x${data.maxCombo}`} />
        <Stat label="Total XP" value={`${data.totalXp}`} />
        <Stat label="Play Time" value={playTime} />
      </View>

      <Text style={styles.sectionHeader}>CHAPTER PROGRESS</Text>
      {data.chapters.map(ch => (
        <View key={ch.chapter} style={styles.chapterRow}>
          <Text style={{ width: 40 }}>Ch{ch.chapter}</Text>
          <View style={{ marginRight: 10 }}>
            <ProgressBar value={ch.levels.filter(l => l.status === 'pass' || l.status === 'perfect').length} max={ch.levels.length} />
          </View>
          <Text>
            {ch.levels.filter(l => l.status === 'pass' || l.status === 'perfect').length}/{ch.levels.length}
            {'  '}({ch.levels.filter(l => l.status === 'perfect').length}⭐)
          </Text>
        </View>
      ))}

      <View style={{ marginTop: SPACING.section }}>
        <Text style={styles.sectionHeader}>SIGNAL WAVEFORM (success/fail per attempt)</Text>
        <Waveform chapters={data.chapters} />
      </View>
    </Page>
  );
}

function ChapterPage({ chapter }: { chapter: ChapterJourneyView }) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.pageTag}>{'>>'} CHAPTER {chapter.chapter} // {chapter.chapterTitle.toUpperCase()}</Text>
      <View style={styles.hr} />
      {chapter.chapterCompleteLine ? (
        <Text style={styles.chapterLine}>"{chapter.chapterCompleteLine}"</Text>
      ) : null}

      {chapter.levels.map(level => (
        <View key={level.levelId} style={styles.levelCard} wrap={false}>
          <View style={styles.levelCardHeader}>
            <Text style={{ color: COLORS.accentSignal }}>
              LEVEL {level.levelOrder} // {level.levelTitle}
            </Text>
            <Text style={{ color: levelStatusColor(level.status) }}>
              {levelStatusGlyph(level.status)} {level.status.toUpperCase()}
              {level.bestScore ? `  ${level.bestScore.total}/100` : ''}
            </Text>
          </View>
          <Text style={{ fontFamily: FONTS.pdfMono, fontSize: 9, color: COLORS.textMuted }}>
            Attempts: {level.totalAttempts}
            {level.failCount > 0 && level.successCount > 0
              ? `  (${level.failCount} fail → ${level.successCount} ${level.status === 'perfect' ? 'perfect' : 'pass'})`
              : ''}
          </Text>

          {renderBestSuccess(level)}
        </View>
      ))}

      <Text style={styles.chapterFooter}>
        Chapter Stats: {chapter.levels.filter(l => l.status === 'pass' || l.status === 'perfect').length}/{chapter.levels.length} ✓
        {'  '}Perfect: {chapter.levels.filter(l => l.status === 'perfect').length}
        {'  '}Attempts: {chapter.levels.reduce((sum, l) => sum + l.totalAttempts, 0)}
      </Text>
    </Page>
  );
}

function renderBestSuccess(level: LevelJourneyView) {
  const success = level.attempts.find(a => a.status === 'perfect') || level.attempts.find(a => a.status === 'pass');
  if (!success) {
    return (
      <Text style={[styles.codeLabel, { marginTop: 6 }]}>— not yet decoded —</Text>
    );
  }
  return (
    <>
      <Text style={styles.codeLabel}>Final Prompt:</Text>
      <View style={styles.codeBlock}>
        <Text>{success.prompt && success.prompt.length > 0 ? success.prompt : '— manual mode —'}</Text>
      </View>
      {success.regex ? (
        <>
          <Text style={styles.codeLabel}>Final Regex:</Text>
          <View style={styles.codeBlock}>
            <Text>{success.regex}</Text>
          </View>
        </>
      ) : null}
    </>
  );
}

function AchievementsPage({ data }: Props) {
  const unlocked = data.achievements.filter(a => a.unlocked);
  const locked = data.achievements.filter(a => !a.unlocked);
  return (
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.pageTag}>{'>>'} ACHIEVEMENTS UNLOCKED</Text>
      <View style={styles.hr} />
      <View style={styles.achievementGrid}>
        {unlocked.map(a => (
          <View key={a.id} style={styles.achievementCard} wrap={false}>
            <Text style={styles.achievementName}>{a.name}</Text>
            <Text style={styles.achievementDesc}>{a.description}</Text>
          </View>
        ))}
      </View>

      {locked.length > 0 && (
        <>
          <Text style={[styles.sectionHeader, { marginTop: SPACING.section }]}>LOCKED</Text>
          <View style={styles.achievementGrid}>
            {locked.map(a => (
              <View key={a.id} style={[styles.achievementCard, { opacity: 0.5 }]} wrap={false}>
                <Text style={styles.achievementLocked}>? ? ?</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Page>
  );
}

function EndingPage({ data }: Props) {
  return (
    <Page size="A4" style={styles.endingPage}>
      <Text style={styles.endingTag}>{'>>'} END_OF_TRANSMISSION {'<<'}</Text>
      <Text style={styles.endingHeadline}>ALL SIGNALS DECODED.</Text>
      <Text style={styles.endingLine}>You defined the rules.</Text>
      <Text style={styles.endingLine}>You are the next rEx.</Text>

      <View style={styles.sigil}>
        <Svg width={90} height={90} viewBox="0 0 90 90">
          <Polygon points="45,8 82,28 82,62 45,82 8,62 8,28" stroke={COLORS.accentGold} strokeWidth={1.2} fill="none" />
          <Polygon points="45,22 70,35 70,55 45,68 20,55 20,35" stroke={COLORS.accentSignal} strokeWidth={0.8} fill="none" />
          <Path d="M30 50 Q45 30 60 50" stroke={COLORS.accentGold} strokeWidth={1.2} fill="none" />
          <Path d="M30 42 L60 42" stroke={COLORS.accentSignal} strokeWidth={0.8} />
          <Rect x={42} y={40} width={6} height={6} fill={COLORS.accentGold} />
        </Svg>
        <Text style={[styles.sigilText, { marginTop: 6 }]}>rEx</Text>
      </View>

      <Text style={[styles.endingLine, { marginTop: 18, color: COLORS.accentGold }]}>rEx says: "Welcome home."</Text>

      <Text style={styles.endingFooter}>
        CERT: {data.certificateId}  ·  yourex.dev
      </Text>
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function CertificateDocument({ data }: Props) {
  return (
    <Document
      title={`YourEx Journey Certificate — ${data.playerName}`}
      author="YourEx"
      subject="Journey Certificate"
      creator="YourEx"
    >
      <CoverPage data={data} />
      <OverviewPage data={data} />
      {data.chapters.map(ch => (
        <ChapterPage key={ch.chapter} chapter={ch} />
      ))}
      <AchievementsPage data={data} />
      <EndingPage data={data} />
    </Document>
  );
}

function levelStatusColor(status: LevelJourneyView['status']): string {
  switch (status) {
    case 'perfect':
      return COLORS.perfect;
    case 'pass':
      return COLORS.pass;
    case 'attempted':
      return COLORS.accentAmber;
    case 'skipped':
    default:
      return COLORS.textMuted;
  }
}

function levelStatusGlyph(status: LevelJourneyView['status']): string {
  switch (status) {
    case 'perfect':
      return '★';
    case 'pass':
      return '✓';
    case 'attempted':
      return '◐';
    case 'skipped':
    default:
      return '○';
  }
}

function rankFor(data: JourneyCertificateData): string {
  const rate = data.totalAttempts > 0 ? data.perfectCount / data.totalAttempts : 0;
  if (data.isOriginComplete) return 'MASTER PARSER';
  if (rate >= 0.6) return 'ELITE PARSER';
  if (data.totalCompletedStandardLevels >= data.totalStandardLevels) return 'CERTIFIED PARSER';
  return 'SIGNAL CONTACT';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '—';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
