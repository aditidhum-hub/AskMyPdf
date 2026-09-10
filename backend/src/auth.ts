import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { getUserById } from './db/database.js';

const JWT_SECRET = process.env.ASKMYPDF_JWT_SECRET || 'askmypdf-enterprise-secret-key-change-in-prod';

export interface AuthPayload {
  userId: string;
  email: string;
  expiresAt: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Hashes a plain-text password using crypto.scryptSync with a cryptographically secure salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Validates a candidate password against the stored salt:hash string using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKeyBuffer = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKeyBuffer);
  } catch {
    return false;
  }
}

/**
 * Creates a signed stateless bearer token containing user credentials and expiry timestamp.
 */
export function createSessionToken(userId: string, email: string, expiresInDays = 7): string {
  const payload: AuthPayload = {
    userId,
    email,
    expiresAt: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadBase64).digest('base64url');
  return `${payloadBase64}.${signature}`;
}

/**
 * Decodes and verifies a session token. Returns the decoded AuthPayload or null if invalid/expired.
 */
export function verifySessionToken(token: string): AuthPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payloadBase64).digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: AuthPayload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (payload.expiresAt < Date.now()) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Optional auth middleware: attaches req.user if a valid token is present, otherwise continues as guest.
 */
export function createOptionalAuthMiddleware(db: DatabaseSync) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7).trim();
    const payload = verifySessionToken(token);
    if (!payload) {
      return next();
    }

    const user = getUserById(db, payload.userId);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }
    next();
  };
}

/**
 * Required auth middleware: rejects unauthenticated requests with 401 Unauthorized.
 */
export function createRequireAuthMiddleware(db: DatabaseSync) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Missing or malformed Bearer token.' });
    }

    const token = authHeader.slice(7).trim();
    const payload = verifySessionToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Session token has expired or is invalid.' });
    }

    const user = getUserById(db, payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User associated with token no longer exists.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    next();
  };
}
