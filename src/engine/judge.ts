import type { JudgeResult, JudgeStatus } from '../types';

export function judge(
  regex: RegExp,
  input: string[],
  expected: string[]
): JudgeResult {
  try {
    const matched = input.filter(line => regex.test(line));
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
  const match = rawRegex.match(/^\/(.+)\/([gimsuy]*)$/s);
  if (!match) {
    return {
      status: 'error',
      matched: [],
      expected,
      regex: null,
      rawRegexString: rawRegex,
      errorMessage: 'Invalid regex format',
    };
  }
  try {
    const regex = new RegExp(match[1], match[2]);
    return judge(regex, input, expected);
  } catch (e: unknown) {
    return {
      status: 'error',
      matched: [],
      expected,
      regex: null,
      rawRegexString: rawRegex,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}
