import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log request
  logger.info(`→ ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.userId,
  });

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](`← ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, {
      statusCode: res.statusCode,
      duration,
      userId: (req as any).user?.userId,
    });
  });

  next();
};

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Log slow requests (over 1 second)
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`, {
        url: req.url,
        method: req.method,
        duration,
        userId: (req as any).user?.userId,
      });
    }
  });

  next();
};
