import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LLMModule } from '../llm/llm.module';
import { GmailModule } from '../gmail/gmail.module';

@Module({
  imports: [LLMModule, GmailModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

