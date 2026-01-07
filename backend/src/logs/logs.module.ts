import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { ActionLog, ActionLogSchema } from '../models/action-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ActionLog', schema: ActionLogSchema },
    ]),
  ],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService], // Export for use in ExecuteModule
})
export class LogsModule {}


