import { describe, it, expect } from 'vitest';
import { runDecryptionPipeline, runManualJudge } from '../../src/engine/decryptionPipeline';
import { MockProvider } from '../../src/ai/mockProvider';
import type { Level } from '../../src/types';

const MOCK_LEVEL: Level = {
  id: 'level_01',
  title: 'Hello, rEx',
  chapter: 1,
  story: 'test story',
  difficulty: 'easy',
  promptChallenge: 'match hello',
  input: ['hello', 'world', 'HELLO', 'test'],
  expected: ['hello', 'HELLO'],
  hints: [],
  promptHints: [],
  feedback: { onPass: '', onFail: '', onPerfect: '', onDirectWrite: '' },
};

describe('decryptionPipeline', () => {
  it('full pipeline: prompt → AI → extract → judge → score', async () => {
    const provider = new MockProvider({ test: '```regex\n/hello/i\n```' });
    const result = await runDecryptionPipeline('test', MOCK_LEVEL, provider, 1);

    expect(result.regex).toBeInstanceOf(RegExp);
    expect(result.judgeResult.status).toBe('perfect');
    expect(result.promptScore.total).toBeGreaterThan(0);
  });

  it('returns error when AI response has no regex', async () => {
    const provider = new MockProvider({ 'bad prompt': 'no regex here' });
    const result = await runDecryptionPipeline('bad prompt', MOCK_LEVEL, provider, 1);

    expect(result.judgeResult.status).toBe('error');
    expect(result.regex).toBeNull();
    expect(result.promptScore.total).toBe(0);
  });

  it('returns fail when regex does not match expected', async () => {
    const provider = new MockProvider({ 'wrong': '```regex\n/xyz/\n```' });
    const result = await runDecryptionPipeline('wrong', MOCK_LEVEL, provider, 1);

    expect(result.judgeResult.status).toBe('fail');
    expect(result.promptScore.total).toBe(0);
  });

  it('attempt number affects score', async () => {
    const provider = new MockProvider({ test: '```regex\n/hello/i\n```' });
    const first = await runDecryptionPipeline('test', MOCK_LEVEL, provider, 1);
    const third = await runDecryptionPipeline('test', MOCK_LEVEL, provider, 3);

    expect(first.promptScore.firstTryScore).toBeGreaterThan(third.promptScore.firstTryScore);
  });
});

describe('runManualJudge', () => {
  it('judges valid regex correctly', () => {
    const result = runManualJudge('/hello/i', MOCK_LEVEL);
    expect(result.status).toBe('perfect');
  });

  it('returns error for invalid format', () => {
    const result = runManualJudge('not-regex', MOCK_LEVEL);
    expect(result.status).toBe('error');
  });

  it('returns error for invalid regex pattern', () => {
    const result = runManualJudge('/[broken/', MOCK_LEVEL);
    expect(result.status).toBe('error');
  });
});
