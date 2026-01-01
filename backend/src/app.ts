import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth/auth.routes';
import gmailRoutes from './gmail/gmail.routes';
import { authMiddleware, AuthRequest } from './middleware/authMiddleware';
import { User } from './models/User';
import { GoogleToken } from './models/GoogleToken';
import { generateJWT } from './auth/jwt';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/gmail', gmailRoutes);

// Protected route: GET /me
app.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/token - Get a new JWT token if user is already authenticated
// This allows getting a fresh token without going through OAuth again
app.get('/auth/token', async (req: Request, res: Response) => {
  try {
    // Check if user has a valid Google token in DB
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ 
        error: 'Email parameter is required',
        hint: 'Use: /auth/token?email=your@email.com'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        hint: 'Please authenticate first via /auth/google/start'
      });
    }

    // Check if user has a Google token (means they're authenticated)
    const googleToken = await GoogleToken.findOne({ userId: user._id });
    
    if (!googleToken) {
      return res.status(401).json({ 
        error: 'No Google authentication found',
        hint: 'Please authenticate first via /auth/google/start'
      });
    }

    // Generate new JWT token
    const jwtToken = generateJWT(user._id.toString());

    res.json({
      token: jwtToken,
      expiresIn: '7d',
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default app;

