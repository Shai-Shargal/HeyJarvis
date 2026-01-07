import { Injectable, Inject } from '@nestjs/common';
import { LLMProvider } from './llm.provider';
import { ActionPlan } from '../chat/chat.types';

@Injectable()
export class LLMService {
  constructor(@Inject('LLM_PROVIDER') private llmProvider: LLMProvider) {}

  async generateActionPlan(userMessage: string): Promise<ActionPlan> {
    return this.llmProvider.generateActionPlan(userMessage);
  }
}


