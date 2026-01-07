import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { GoogleAuthModule } from './google-auth/google-auth.module';
import { ChatModule } from './chat/chat.module';
import { GmailModule } from './gmail/gmail.module';
import { ExecuteModule } from './execute/execute.module';
import { LogsModule } from './logs/logs.module';
import { LLMModule } from './llm/llm.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    GoogleAuthModule,
    ChatModule,
    GmailModule,
    ExecuteModule,
    LogsModule,
    LLMModule,
  ],
  controllers: [AppController],
})
export class AppModule {}


