import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GmailService } from './gmail.service';
import { GoogleTokenSchema } from '../models/google-token.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'GoogleToken', schema: GoogleTokenSchema },
    ]),
    ConfigModule,
  ],
  providers: [GmailService],
  exports: [GmailService],
})
export class GmailModule {}

