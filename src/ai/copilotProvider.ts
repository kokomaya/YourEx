import * as vscode from 'vscode';
import type { IAIProvider } from './IAIProvider';

const MODEL_SELECTOR: vscode.LanguageModelChatSelector = { vendor: 'copilot', family: 'gpt-4o' };

const SYSTEM_PROMPT =
  'You are a regex expert. The user will describe a pattern they need. ' +
  'Respond ONLY with a single regex in /pattern/flags notation. ' +
  'Do not explain. Do not add any other text.';

export class CopilotProvider implements IAIProvider {
  readonly name = 'Copilot';

  async generate(prompt: string): Promise<string> {
    const [model] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
    if (!model) {
      throw new Error('[CopilotProvider] No Copilot model available');
    }

    const messages = [
      vscode.LanguageModelChatMessage.User(SYSTEM_PROMPT),
      vscode.LanguageModelChatMessage.User(prompt),
    ];

    const response = await model.sendRequest(messages);

    const parts: string[] = [];
    for await (const fragment of response.text) {
      parts.push(fragment);
    }
    return parts.join('');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const models = await vscode.lm.selectChatModels(MODEL_SELECTOR);
      return models.length > 0;
    } catch {
      return false;
    }
  }
}
