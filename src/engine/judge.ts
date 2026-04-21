import type { JudgeResult } from '../types';

export function judge(
  _regex: RegExp,
  _input: string[],
  _expected: string[]
): JudgeResult {
  // TODO: Phase 2 - Task 2.2
  return {
    status: 'fail',
    matched: [],
    expected: _expected,
    regex: null,
    rawRegexString: '',
  };
}
