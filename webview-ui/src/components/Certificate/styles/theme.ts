export const COLORS = {
  bgDeep: '#05070D',
  bgPanel: '#0B1020',
  bgPanelAlt: '#0E1426',
  textPrimary: '#E6EDF7',
  textMuted: '#7A8AA0',
  accentSignal: '#34F5C5',
  accentAmber: '#FFB454',
  accentGold: '#FFD27A',
  perfect: '#FFD27A',
  pass: '#34F5C5',
  fail: '#FF5C7A',
  rule: '#1F2A44',
  scan: '#152038',
} as const;

export const FONTS = {
  /**
   * Custom fonts in the PDF require Font.register + a network-reachable URL,
   * which webview CSP locks down. v1 uses the built-in Helvetica, which has
   * no CJK glyphs — the structural text in the PDF is therefore English-only.
   * The on-screen preview uses system fonts and fully supports both languages.
   */
  pdfBody: 'Helvetica',
  pdfMono: 'Courier',
  pdfBold: 'Helvetica-Bold',
  previewMono: '"JetBrains Mono", Consolas, "Courier New", monospace',
  previewBody: 'Inter, "Segoe UI", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
} as const;

export const SPACING = {
  page: 28,
  section: 18,
  block: 10,
  tight: 4,
} as const;

export const SIZES = {
  pageTitle: 22,
  sectionTitle: 12,
  body: 10,
  caption: 8,
  hugeCover: 30,
} as const;
