import { LLMProvider } from './llm.provider';
import { OpenAIProvider } from './openai.provider';
import { env } from '../config/env';

export function createLLMProvider(): LLMProvider {
  const provider = env.LLM_PROVIDER.toLowerCase();

  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Unsupported LLM provider: ${env.LLM_PROVIDER}`);
  }
}

