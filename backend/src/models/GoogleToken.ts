import mongoose, { Document, Schema } from 'mongoose';

export interface IGoogleToken extends Document {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const GoogleTokenSchema = new Schema<IGoogleToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    scopes: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const GoogleToken = mongoose.model<IGoogleToken>('GoogleToken', GoogleTokenSchema);

