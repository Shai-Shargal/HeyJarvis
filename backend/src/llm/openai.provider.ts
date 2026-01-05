import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LLMProvider } from './llm.provider';
import { ActionPlan } from '../chat/chat.types';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { validateActionPlan } from '../chat/chat.schema';

@Injectable()
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.client = new OpenAI({
      apiKey,
    });
  }

  async generateActionPlan(userMessage: string): Promise<ActionPlan> {
    try {
      const model = this.configService.get<string>('LLM_MODEL', 'gpt-4o-mini');
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(userMessage) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent JSON
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Parse JSON response
      let jsonData: unknown;
      try {
        jsonData = JSON.parse(content);
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Failed to parse JSON from OpenAI response');
        }
      }

      // Validate and return ActionPlan
      return validateActionPlan(jsonData);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown error from OpenAI API');
    }
  }
}
