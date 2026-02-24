import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

// Custom API Error class
export class APIError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export const Errors = {
  BadRequest: (message: string) => new APIError(message, 400),
  Unauthorized: (message: string = 'Unauthorized') => new APIError(message, 401),
  Forbidden: (message: string = 'Forbidden') => new APIError(message, 403),
  NotFound: (message: string = 'Resource not found') => new APIError(message, 404),
  Conflict: (message: string) => new APIError(message, 409),
  Validation: (message: string) => new APIError(message, 422),
  TooManyRequests: (message: string = 'Too many requests') => new APIError(message, 429),
  Internal: (message: string = 'Internal server error') => new APIError(message, 500),
};

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  stack?: string;
  errors?: any[];
  code?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | APIError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: any[] | undefined;
  let errorCode: string | undefined;

  // Handle API errors
  if (err instanceof APIError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    errorCode = err.code;
    
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        const fields = (err.meta?.target as string[])?.join(', ');
        message = `Unique constraint violation: ${fields || 'field'} already exists`;
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint violation';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid ID provided';
        break;
      default:
        statusCode = 500;
        message = 'Database error occurred';
        logger.error('Prisma error:', err);
    }
  }
  // Handle Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
    logger.error('Prisma validation error:', err);
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Handle syntax errors (malformed JSON)
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON format';
  }
  // Handle unknown errors
  else {
    logger.error('Unhandled error:', err);
    message = process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message;
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Add additional error details
  if (errors) {
    errorResponse.errors = errors;
  }
  if (errorCode) {
    errorResponse.code = errorCode;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: (req as any).user?.userId,
    });
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler for undefined routes
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new APIError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};
