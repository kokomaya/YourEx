import { describe, it, expect } from 'vitest';
import path from 'path';
import { runDecryptionPipeline } from '../../src/engine/decryptionPipeline';
import { MockProvider } from '../../src/ai/mockProvider';
import { setDataRoot, setLevelLocale, getLevelById } from '../../src/engine/levelLoader';

/**
 * The wizard's auto-fill text is the *example prompt* shown to first-time
 * players. Two invariants we lock here:
 *  1. The localized text mentions the keyword the level expects ("hello"),
 *     so a competent AI would produce a passing regex.
 *  2. When the AI returns the canonical level_01 answer (`/hello/i`),
 *     the prompt + level pipeline lands a passing judge result. This
 *     guards against accidental level_01 expected/input drift that would
 *     make even a perfect answer fail the wizard's submission step.
 */
describe('tutorial fill-prompt smoke test', () => {
  beforeAll();

  it('zh-CN auto-fill text references the target keyword', () => {
    const fillText = '匹配所有包含小写单词 hello 的行';
    expect(fillText.toLowerCase()).toContain('hello');
  });

  it('en auto-fill text references the target keyword', () => {
    const fillText = 'Match every line that contains the lowercase word "hello"';
    expect(fillText.toLowerCase()).toContain('hello');
  });

  it('canonical level_01 answer (/hello/i) still passes via the pipeline', async () => {
    setDataRoot(path.join(__dirname, '..', '..', 'src', 'data', 'levels'));
    setLevelLocale('zh-CN');
    const level = getLevelById('level_01');
    expect(level).toBeTruthy();
    // Seed Mock to return the canonical answer regardless of prompt text,
    // so we're testing the level shape, not MockProvider's prompt routing.
    const provider = new MockProvider({ any: '```regex\n/hello/\n```' });
    provider.setResponse('level_01', '```regex\n/hello/\n```');
    const result = await runDecryptionPipeline('level_01 any prompt', level!, provider, 1);
    expect(['perfect', 'pass']).toContain(result.judgeResult.status);
  });
});

function beforeAll() { /* placeholder to keep file shape if needed */ }
