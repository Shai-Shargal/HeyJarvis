import { createLLMProvider } from '../llm/llm.factory';
import { ActionPlan } from './chat.types';

export class ChatService {
  private llmProvider = createLLMProvider();

  async generateActionPlan(userMessage: string): Promise<ActionPlan> {
    try {
      const plan = await this.llmProvider.generateActionPlan(userMessage);
      return plan;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate action plan: ${error.message}`);
      }
      throw new Error('Unknown error generating action plan');
    }
  }
}

