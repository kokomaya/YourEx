import type { IAIProvider } from './IAIProvider';

const DEFAULT_RESPONSES: Record<string, string> = {
  level_01: '```regex\n/hello/i\n```',
  level_02: '```regex\n/\\d/\n```',
  level_03: '```regex\n/^[\\w.+-]+@[\\w-]+\\.\\w{2,}$/\n```',
  level_04: '```regex\n/\\b(\\w+)\\b.*\\b\\1\\b/\n```',
  level_05: '```regex\n/\\.signal$/\n```',
};

export class MockProvider implements IAIProvider {
  readonly name = 'Mock';

  private readonly _responses: Record<string, string>;

  constructor(responses: Record<string, string> = {}) {
    this._responses = { ...DEFAULT_RESPONSES, ...responses };
  }

  async generate(prompt: string): Promise<string> {
    // Exact match
    if (this._responses[prompt]) {
      return this._responses[prompt];
    }

    // Match by level id mentioned in prompt
    for (const [key, value] of Object.entries(this._responses)) {
      if (prompt.includes(key)) {
        return value;
      }
    }

    return '/placeholder/';
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  setResponse(key: string, value: string): void {
    this._responses[key] = value;
  }
}
