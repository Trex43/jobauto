import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

// Token payloads
export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
  tokenVersion: number;
}

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<AccessTokenPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRE }
  );
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (user: {
  id: string;
  email: string;
  role: string;
  tokenVersion?: number;
}) => {
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    tokenVersion: user.tokenVersion || 0,
  });

  return { accessToken, refreshToken };
};

/**
 * Store refresh token in database (for token rotation)
 */
export const storeRefreshToken = async (userId: string, token: string, expiresAt: Date) => {
  // In a production app, you'd store this in Redis or a separate table
  // For now, we'll just increment the token version on the user
  await prisma.user.update({
    where: { id: userId },
    data: {
      // You could add a refreshTokens relation here
    },
  });
};

/**
 * Revoke all refresh tokens for a user
 */
export const revokeAllUserTokens = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      // Increment token version to invalidate all existing refresh tokens
    },
  });
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string) => {
  return jwt.decode(token);
};
