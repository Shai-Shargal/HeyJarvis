import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IUser } from '../models/user.schema';
import { IGoogleToken } from '../models/google-token.schema';

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

@Injectable()
export class GoogleAuthService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('GoogleToken') private googleTokenModel: Model<IGoogleToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  getGoogleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      redirect_uri: this.configService.get<string>('GOOGLE_REDIRECT_URI'),
      response_type: 'code',
      scope: 'openid email profile https://www.googleapis.com/auth/gmail.modify',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    try {
      const response = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
          client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
          redirect_uri: this.configService.get<string>('GOOGLE_REDIRECT_URI'),
          grant_type: 'authorization_code',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to exchange code for tokens: ${error.response?.data?.error || error.message}`);
      }
      throw new Error('Failed to exchange code for tokens');
    }
  }

  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await axios.get<GoogleUserInfo>(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get user info: ${error.response?.data?.error || error.message}`);
      }
      throw new Error('Failed to get user info');
    }
  }

  async handleOAuthCallback(code: string): Promise<string> {
    // Exchange code for tokens
    const tokenResponse = await this.exchangeCodeForTokens(code);

    if (!tokenResponse.refresh_token) {
      throw new BadRequestException('No refresh token received. Please try again.');
    }

    // Get user info
    const userInfo = await this.getUserInfo(tokenResponse.access_token);

    // Upsert User in MongoDB
    const user = await this.userModel.findOneAndUpdate(
      { googleId: userInfo.sub },
      {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // Save refresh token and scopes
    const scopes = tokenResponse.scope.split(' ').filter(Boolean);
    await this.googleTokenModel.findOneAndUpdate(
      { userId: user._id },
      {
        refreshToken: tokenResponse.refresh_token,
        scopes,
      },
      {
        upsert: true,
        new: true,
      }
    );

    // Generate JWT
    return this.jwtService.sign({ userId: user._id.toString() });
  }

  async getTokenByEmail(email: string) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException({
        error: 'Email parameter is required',
        hint: 'Use: /auth/token?email=your@email.com',
      });
    }

    // Find user by email
    const user = await this.userModel.findOne({ email });
    
    if (!user) {
      throw new NotFoundException({
        error: 'User not found',
        hint: 'Please authenticate first via /auth/google/start',
      });
    }

    // Check if user has a Google token (means they're authenticated)
    const googleToken = await this.googleTokenModel.findOne({ userId: user._id });
    
    if (!googleToken) {
      throw new UnauthorizedException({
        error: 'No Google authentication found',
        hint: 'Please authenticate first via /auth/google/start',
      });
    }

    // Generate new JWT token
    const jwtToken = this.jwtService.sign({ userId: user._id.toString() });

    return {
      token: jwtToken,
      expiresIn: '7d',
      user: {
        email: user.email,
        name: user.name,
      },
    };
  }
}

