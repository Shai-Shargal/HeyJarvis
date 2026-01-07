import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExecuteController } from './execute.controller';
import { ExecuteService } from './execute.service';
import { GmailModule } from '../gmail/gmail.module';
import { ActionLog, ActionLogSchema } from '../models/action-log.schema';

@Module({
  imports: [
    GmailModule,
    MongooseModule.forFeature([
      { name: 'ActionLog', schema: ActionLogSchema },
    ]),
  ],
  controllers: [ExecuteController],
  providers: [ExecuteService],
})
export class ExecuteModule {}

