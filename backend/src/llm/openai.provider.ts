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
      throw new Error('OPENAI_API_KEY is required. Please set it in your .env file.');
    }
    if (apiKey.trim() === '' || apiKey === 'your_openai_api_key') {
      throw new Error('OPENAI_API_KEY is not set correctly. Please set a valid API key in your .env file.');
    }
    this.client = new OpenAI({
      apiKey,
    });
    console.log('✅ OpenAI provider initialized');
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
    } catch (error: any) {
      console.error('OpenAI API Error Details:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        type: error?.type,
      });

      // Handle specific OpenAI API errors
      if (error?.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env file.');
      }
      if (error?.status === 429) {
        throw new Error('OpenAI API rate limit exceeded or insufficient credits. Please add credits to your OpenAI account.');
      }
      if (error?.status === 500 || error?.status === 503) {
        throw new Error('OpenAI API is temporarily unavailable. Please try again later.');
      }
      if (error?.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please add credits to your OpenAI account at https://platform.openai.com/account/billing');
      }

      // Generic error handling
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown error from OpenAI API');
    }
  }
}
