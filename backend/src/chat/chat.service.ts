import { Injectable } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import { ActionPlan } from './chat.types';

@Injectable()
export class ChatService {
  constructor(private readonly llmService: LLMService) {}

  async generateActionPlan(userMessage: string): Promise<ActionPlan> {
    try {
      const plan = await this.llmService.generateActionPlan(userMessage);
      return plan;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate action plan: ${error.message}`);
      }
      throw new Error('Unknown error generating action plan');
    }
  }
}
