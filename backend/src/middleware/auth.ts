import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload & {
        profile?: any;
        subscription?: any;
      };
    }
  }
}

/**
 * Authenticate JWT token middleware
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyAccessToken(token);

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          profile: true,
          subscription: true,
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found.',
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Account has been deactivated.',
        });
        return;
      }

      // Attach user to request
      req.user = {
        ...decoded,
        profile: user.profile,
        subscription: user.subscription,
      };

      next();
    } catch (jwtError) {
      logger.warn('JWT verification failed:', jwtError);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          profile: true,
          subscription: true,
        },
      });

      if (user && user.isActive) {
        req.user = {
          ...decoded,
          profile: user.profile,
          subscription: user.subscription,
        };
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Authorize specific roles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Please log in.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
      return;
    }

    next();
  };
};

/**
 * Check if user has active subscription
 */
export const requireSubscription = (...tiers: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Please log in.',
      });
      return;
    }

    const subscription = req.user.subscription;

    if (!subscription) {
      res.status(403).json({
        success: false,
        message: 'Active subscription required.',
      });
      return;
    }

    if (tiers.length > 0 && !tiers.includes(subscription.tier)) {
      res.status(403).json({
        success: false,
        message: 'This feature requires a higher subscription tier.',
      });
      return;
    }

    next();
  };
};

/**
 * Rate limit by user ID (for authenticated routes)
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next();
      return;
    }

    const userId = req.user.userId;
    const now = Date.now();
    const userRequests = requests.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (userRequests.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
      });
      return;
    }

    userRequests.count++;
    next();
  };
};
