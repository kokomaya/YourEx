import type {
  JudgeResult,
  JudgeStatus,
  Level,
  JudgeProfile,
  MatchPolicy,
  MatchTransform,
} from '../types';
import { projectInput } from './inputProjection';

const LEGACY_PROFILE_ID = '__legacy__';

export function judge(
  regex: RegExp,
  input: string[],
  expected: string[]
): JudgeResult {
  try {
    const matched = input.filter(line => testFresh(regex, line));
    const status = determineStatus(matched, expected);

    return {
      status,
      matched,
      expected,
      regex,
      rawRegexString: regex.toString(),
    };
  } catch (e: unknown) {
    return {
      status: 'error',
      matched: [],
      expected,
      regex: null,
      rawRegexString: regex?.toString() ?? '',
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

function determineStatus(matched: string[], expected: string[]): JudgeStatus {
  const matchedSet = new Set(matched);
  const expectedSet = new Set(expected);

  const allExpectedMatched = expected.every(e => matchedSet.has(e));
  const noExtra = matched.every(m => expectedSet.has(m));

  if (allExpectedMatched && noExtra && matched.length === expected.length) {
    return 'perfect';
  }
  if (allExpectedMatched && noExtra) {
    return 'pass';
  }
  if (expected.some(e => matchedSet.has(e))) {
    return 'partial';
  }
  return 'fail';
}

export function judgeFromString(
  rawRegex: string,
  input: string[],
  expected: string[]
): JudgeResult {
  const parsed = parseRawRegex(rawRegex);
  if (!parsed.ok) {
    return {
      status: 'error',
      matched: [],
      expected,
      regex: null,
      rawRegexString: rawRegex,
      errorMessage: parsed.error,
    };
  }
  return judge(parsed.regex, input, expected);
}

// ---------------------------------------------------------------------------
// Profile-aware judging
// ---------------------------------------------------------------------------

const STATUS_PRIORITY: Record<JudgeStatus, number> = {
  perfect: 5,
  pass: 4,
  partial: 3,
  fail: 2,
  error: 1,
};

/**
 * Judge a level taking its optional `judgeConfig` into account.
 *
 * Behavior:
 *   - No judgeConfig → behaves exactly like legacy `judge()`.
 *   - With judgeConfig → runs every profile, optionally appends a legacy
 *     fallback profile, and returns the highest-priority result.
 */
export function judgeWithConfig(regex: RegExp, level: Level): JudgeResult {
  if (!level.judgeConfig) {
    return judge(regex, level.input, level.expected);
  }

  const results: JudgeResult[] = [];

  for (const profile of level.judgeConfig.profiles) {
    results.push(runProfile(regex, level, profile));
  }

  if (level.judgeConfig.includeLegacy !== false) {
    const legacy = judge(cloneRegex(regex), level.input, level.expected);
    results.push({ ...legacy, profileId: LEGACY_PROFILE_ID });
  }

  return pickBestResult(results, regex);
}

export function judgeFromStringWithConfig(rawRegex: string, level: Level): JudgeResult {
  const parsed = parseRawRegex(rawRegex);
  if (!parsed.ok) {
    return {
      status: 'error',
      matched: [],
      expected: level.expected,
      regex: null,
      rawRegexString: rawRegex,
      errorMessage: parsed.error,
    };
  }
  return judgeWithConfig(parsed.regex, level);
}

function runProfile(regex: RegExp, level: Level, profile: JudgeProfile): JudgeResult {
  const expected = profile.expected ?? level.expected;
  try {
    const projected = projectInput(level.input, profile.source);
    const policy: Required<MatchPolicy> = {
      scope: profile.match.scope ?? 'per-line',
      resultMode: profile.match.resultMode ?? 'matched-lines',
    };

    const matched = normalizeCollectedMatches(
      collectMatches(cloneRegex(regex), projected, policy),
      profile.normalizeMatches,
    );
    const status = determineStatus(matched, expected);

    return {
      status,
      matched,
      expected,
      regex,
      rawRegexString: regex.toString(),
      profileId: profile.id,
    };
  } catch (e: unknown) {
    return {
      status: 'error',
      matched: [],
      expected,
      regex: null,
      rawRegexString: regex?.toString() ?? '',
      errorMessage: e instanceof Error ? e.message : String(e),
      profileId: profile.id,
    };
  }
}

function collectMatches(regex: RegExp, lines: string[], policy: Required<MatchPolicy>): string[] {
  if (policy.scope === 'per-line') {
    if (policy.resultMode === 'matched-lines') {
      return lines.filter(line => testFresh(regex, line));
    }
    // per-line + matched-substrings: collect first match[0] from each matching line
    const out: string[] = [];
    for (const line of lines) {
      const m = execFresh(regex, line);
      if (m && m[0] !== undefined) out.push(m[0]);
    }
    return uniq(out);
  }

  // whole-input
  const joined = lines.join('');
  if (policy.resultMode === 'matched-lines') {
    // 'matched-lines' has no natural meaning for whole-input — fall back to
    // returning the joined string when it matches (or empty otherwise).
    return testFresh(regex, joined) ? [joined] : [];
  }
  return uniq(execAll(regex, joined));
}

function testFresh(regex: RegExp, s: string): boolean {
  if (regex.global || regex.sticky) regex.lastIndex = 0;
  const result = regex.test(s);
  if (regex.global || regex.sticky) regex.lastIndex = 0;
  return result;
}

function execFresh(regex: RegExp, s: string): RegExpExecArray | null {
  if (regex.global || regex.sticky) regex.lastIndex = 0;
  const m = regex.exec(s);
  if (regex.global || regex.sticky) regex.lastIndex = 0;
  return m;
}

function execAll(regex: RegExp, s: string): string[] {
  // ensure 'g' flag so we can iterate
  const flags = regex.flags.includes('g') ? regex.flags : regex.flags + 'g';
  const r = new RegExp(regex.source, flags);
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = r.exec(s)) !== null) {
    out.push(m[0]);
    if (m[0] === '') r.lastIndex++; // avoid zero-width infinite loop
  }
  return out;
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function normalizeCollectedMatches(matches: string[], transforms?: MatchTransform[]): string[] {
  if (!transforms || transforms.length === 0) {
    return matches;
  }
  return uniq(matches.map(match => applyMatchTransforms(match, transforms)));
}

function applyMatchTransforms(value: string, transforms: MatchTransform[]): string {
  let out = value;
  for (const transform of transforms) {
    out = out.replace(new RegExp(transform.pattern, transform.flags), transform.replacement);
  }
  return out;
}

function cloneRegex(r: RegExp): RegExp {
  return new RegExp(r.source, r.flags);
}

function pickBestResult(results: JudgeResult[], regex: RegExp): JudgeResult {
  if (results.length === 0) {
    return {
      status: 'fail',
      matched: [],
      expected: [],
      regex,
      rawRegexString: regex.toString(),
    };
  }
  let best = results[0];
  for (let i = 1; i < results.length; i++) {
    if (STATUS_PRIORITY[results[i].status] > STATUS_PRIORITY[best.status]) {
      best = results[i];
    }
  }
  return best;
}

type ParsedRegex = { ok: true; regex: RegExp } | { ok: false; error: string };

function parseRawRegex(rawRegex: string): ParsedRegex {
  const match = rawRegex.match(/^\/(.+)\/([gimsuy]*)$/s);
  if (!match) {
    return { ok: false, error: 'Invalid regex format' };
  }
  try {
    return { ok: true, regex: new RegExp(match[1], match[2]) };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
