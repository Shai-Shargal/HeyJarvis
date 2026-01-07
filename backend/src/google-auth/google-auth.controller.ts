import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { GoogleAuthService } from './google-auth.service';

@Controller('auth')
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get('google/start')
  startGoogleAuth(@Res() res: Response) {
    try {
      const authUrl = this.googleAuthService.getGoogleAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to generate authentication URL',
      });
    }
  }

  @Get('google/callback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    try {
      if (error) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: `OAuth error: ${error}`,
        });
      }

      if (!code || typeof code !== 'string') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Missing authorization code',
        });
      }

      const jwtToken = await this.googleAuthService.handleOAuthCallback(code);
      res.redirect(`/auth/success?token=${jwtToken}`);
    } catch (error) {
      console.error('Error in Google OAuth callback:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Authentication failed',
      });
    }
  }

  @Get('success')
  successPage() {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Success</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
              color: #34a853;
              margin-bottom: 1rem;
            }
            p {
              color: #666;
              font-size: 1.1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Success!</h1>
            <p>Google account connected successfully. You can close this tab.</p>
          </div>
        </body>
      </html>
    `;
  }

  @Get('token')
  async getToken(@Query('email') email: string) {
    return this.googleAuthService.getTokenByEmail(email);
  }
}


