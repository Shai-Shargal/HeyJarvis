import { ActionPlan } from '../chat/chat.types';

export interface LLMProvider {
  generateActionPlan(userMessage: string): Promise<ActionPlan>;
}

