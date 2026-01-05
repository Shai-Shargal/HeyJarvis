import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IGoogleToken = GoogleToken & Document;

@Schema({ timestamps: true })
export class GoogleToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  refreshToken: string;

  @Prop({ type: [String], required: true })
  scopes: string[];
}

export const GoogleTokenSchema = SchemaFactory.createForClass(GoogleToken);

