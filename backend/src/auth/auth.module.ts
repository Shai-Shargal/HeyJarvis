import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from './jwt.strategy';
import { UserSchema } from '../models/user.schema';
import { GoogleTokenSchema } from '../models/google-token.schema';
import { UserService } from './user.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'GoogleToken', schema: GoogleTokenSchema },
    ]),
  ],
  providers: [JwtStrategy, UserService],
  exports: [JwtStrategy, PassportModule, UserService],
})
export class AuthModule {}


