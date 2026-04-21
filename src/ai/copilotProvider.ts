import type { IAIProvider } from './IAIProvider';

export class CopilotProvider implements IAIProvider {
  readonly name = 'Copilot';

  async generate(_prompt: string): Promise<string> {
    // TODO: Phase 2 - Task 2.6
    throw new Error('Not implemented');
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Phase 2 - Task 2.6
    return false;
  }
}
