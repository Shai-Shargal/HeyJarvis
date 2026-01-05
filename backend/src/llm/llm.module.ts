import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLMService } from './llm.service';
import { OpenAIProvider } from './openai.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    LLMService,
    {
      provide: 'LLM_PROVIDER',
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('LLM_PROVIDER', 'openai').toLowerCase();
        switch (provider) {
          case 'openai':
            return new OpenAIProvider(configService);
          default:
            throw new Error(`Unsupported LLM provider: ${provider}`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [LLMService],
})
export class LLMModule {}

