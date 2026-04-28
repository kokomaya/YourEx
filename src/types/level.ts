export interface Level {
  id: string;
  title: string;
  chapter: number;
  story: string;
  difficulty: 'easy' | 'medium' | 'hard';
  promptChallenge: string;
  input: string[];
  expected: string[];
  hints: string[];
  promptHints: string[];
  feedback: {
    onPass: string;
    onFail: string;
    onPerfect: string;
    onDirectWrite: string;
  };
  judgeConfig?: JudgeConfig;
  /**
   * When set, completing this level (subject to requireStatus) unlocks the
   * journey certificate generation entry. The unlock state is data-driven so
   * future chapters can move or duplicate the trigger without code changes.
   */
  certificateTrigger?: CertificateTrigger;
}

export interface CertificateTrigger {
  /** Reserved for future certificate templates. Currently always 'journey'. */
  type: 'journey';
  /** 'pass' (default) — pass or perfect both trigger; 'perfect' — only perfect. */
  requireStatus?: 'pass' | 'perfect';
  /** Whether the reward UI should auto-prompt the certificate on first unlock. Default true. */
  autoPrompt?: boolean;
}

export interface JudgeConfig {
  profiles: JudgeProfile[];
  /** Whether to also run a legacy (per-line + matched-lines) judge as a fallback profile. Default: true. */
  includeLegacy?: boolean;
}

export interface JudgeProfile {
  id: string;
  label?: string;
  description?: string;
  source: InputProjection;
  match: MatchPolicy;
  /** Falls back to level.expected when omitted. */
  expected?: string[];
  /** Optional ordered transforms applied to collected match results before status comparison. */
  normalizeMatches?: MatchTransform[];
}

export interface MatchTransform {
  /** Replacement regex source applied in order to each collected match. */
  pattern: string;
  /** Optional regex flags for the replacement pattern. */
  flags?: string;
  /** Replacement string passed to String.prototype.replace. */
  replacement: string;
}

export interface InputProjection {
  /** 0-based, end-exclusive line range. Defaults to all lines. */
  lineRange?: { start?: number; end?: number };
  /** 0-based, end-exclusive column slices. Multiple ranges are concatenated in order. Defaults to whole line. */
  columnRanges?: { start: number; end?: number }[];
  /** Decode after column slicing. 'hex-bytes' parses every /[0-9A-Fa-f]{2}/ token to a char. Default 'none'. */
  decode?: 'none' | 'hex-bytes';
  /** Merge all projected lines into one big string. Default false. */
  mergeLines?: boolean;
  /** Joiner used when mergeLines=true. Default ''. */
  joiner?: string;
  /** Trim each column segment before concatenation. Default false. */
  trimEachSegment?: boolean;
}

export interface MatchPolicy {
  /** per-line: test each projected line; whole-input: match against the merged string. Default per-line. */
  scope?: 'per-line' | 'whole-input';
  /** matched-lines: result keeps the matched line; matched-substrings: result keeps match[0]. Default matched-lines. */
  resultMode?: 'matched-lines' | 'matched-substrings';
}
