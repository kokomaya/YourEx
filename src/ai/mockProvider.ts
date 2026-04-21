import type { IAIProvider } from './IAIProvider';

export class MockProvider implements IAIProvider {
  readonly name = 'Mock';

  constructor(private readonly _responses: Record<string, string> = {}) {}

  async generate(_prompt: string): Promise<string> {
    // TODO: Phase 2 - Task 2.5
    return this._responses[_prompt] ?? '/placeholder/';
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}
