import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ActionPlan } from '../chat/chat.types';

export type IActionLog = ActionLog & Document;

export type ExecutionStatus = 'SUCCESS' | 'FAILED' | 'DRY_RUN';

@Schema({ timestamps: true })
export class ActionLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  // Request information
  @Prop()
  message?: string;

  @Prop({ type: Object, required: true })
  plan!: ActionPlan;

  @Prop({ default: true })
  approved!: boolean;

  // Execution information
  @Prop({ type: String, enum: ['SUCCESS', 'FAILED', 'DRY_RUN'], required: true })
  status!: ExecutionStatus;

  @Prop({ required: true })
  startedAt!: Date;

  @Prop()
  finishedAt?: Date;

  @Prop()
  durationMs?: number;

  @Prop()
  errorMessage?: string;

  // Outcome information
  @Prop({ default: 0 })
  affectedCount!: number;

  @Prop({ default: '' })
  queryUsed!: string;

  @Prop({ type: [String], default: [] })
  messageIds!: string[]; // Max 50, stored as array

  @Prop({
    type: [
      {
        id: String,
        subject: String,
        from: String,
        date: String,
        snippet: String,
      },
    ],
    default: [],
  })
  sample!: Array<{
    id: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
  }>;
}

export const ActionLogSchema = SchemaFactory.createForClass(ActionLog);

// Create compound index for efficient queries: userId + createdAt (descending)
ActionLogSchema.index({ userId: 1, createdAt: -1 });

