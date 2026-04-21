export type JudgeStatus = 'perfect' | 'pass' | 'partial' | 'fail' | 'error';

export interface JudgeResult {
  status: JudgeStatus;
  matched: string[];
  expected: string[];
  regex: RegExp | null;
  rawRegexString: string;
  errorMessage?: string;
}
