import { Router, Request, Response } from 'express';
import { getGoogleAuthUrl, exchangeCodeForTokens, getUserInfo } from './google.oauth';
import { generateJWT } from './jwt';
import { User } from '../models/User';
import { GoogleToken } from '../models/GoogleToken';

const router = Router();

// GET /auth/google/start - Redirect to Google OAuth consent screen
router.get('/google/start', (req: Request, res: Response) => {
  try {
    const authUrl = getGoogleAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

// GET /auth/google/callback - Exchange code for tokens and create user session
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).json({ error: `OAuth error: ${error}` });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code);

    if (!tokenResponse.refresh_token) {
      return res.status(400).json({ error: 'No refresh token received. Please try again.' });
    }

    // Get user info
    const userInfo = await getUserInfo(tokenResponse.access_token);

    // Upsert User in MongoDB
    const user = await User.findOneAndUpdate(
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
    await GoogleToken.findOneAndUpdate(
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
    const jwtToken = generateJWT(user._id.toString());

    // Redirect to success page with token
    res.redirect(`/auth/success?token=${jwtToken}`);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /auth/success - Success page
router.get('/success', (req: Request, res: Response) => {
  res.send(`
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
  `);
});

export default router;

