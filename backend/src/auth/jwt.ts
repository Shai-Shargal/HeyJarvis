import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  userId: string;
}

export function generateJWT(userId: string): string {
  const payload: JWTPayload = {
    userId,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyJWT(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('❌ JWT Error: Token expired at', error.expiredAt);
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('❌ JWT Error: Invalid token', error.message);
      throw new Error(`Invalid token: ${error.message}`);
    } else {
      console.error('❌ JWT Error: Unknown error', error);
      throw new Error('Invalid or expired token');
    }
  }
}

