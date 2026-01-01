import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../auth/jwt';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Auth middleware: Missing or invalid authorization header');
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔍 Auth middleware: Verifying token, length:', token.length);
    
    const payload = verifyJWT(token);
    console.log('✅ Auth middleware: Token verified, userId:', payload.userId);

    req.userId = payload.userId;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(401).json({ 
      error: 'Invalid or expired token',
      details: errorMessage 
    });
  }
}

