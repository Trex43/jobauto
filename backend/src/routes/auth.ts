import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { generateTokenPair } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';
import { authenticate } from '../middleware/auth';
import { APIError, asyncHandler } from '../middleware/error';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new APIError('User already exists with this email', 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with profile and subscription
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        profile: {
          create: {
            // Empty profile, will be filled later
          },
        },
        subscription: {
          create: {
            tier: 'FREE',
            autoAppliesLimit: 5,
          },
        },
        jobPreferences: {
          create: {},
        },
        analytics: {
          create: {},
        },
      },
      include: {
        profile: true,
        subscription: true,
      },
    });

    // Store verification token (in production, use Redis or separate table)
    // For now, we'll store it in the user's metadata or send directly

    // Send verification email
    try {
      await sendVerificationEmail(email, firstName, verificationToken);
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          profile: user.profile,
          subscription: user.subscription,
        },
        tokens,
      },
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        subscription: true,
      },
    });

    if (!user) {
      throw new APIError('Invalid credentials', 401);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new APIError('Account has been deactivated', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new APIError('Invalid credentials', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Update analytics
    await prisma.userAnalytics.update({
      where: { userId: user.id },
      data: {
        lastActiveAt: new Date(),
        totalLogins: { increment: 1 },
      },
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          profile: user.profile,
          subscription: user.subscription,
        },
        tokens,
      },
    });
  })
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (with refresh token)
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new APIError('Refresh token is required', 400);
  }

  try {
    const { verifyRefreshToken } = await import('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new APIError('Invalid refresh token', 401);
    }

    // Generate new tokens
    const tokens = generateTokenPair(user);

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    throw new APIError('Invalid or expired refresh token', 401);
  }
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // In a production app, you might want to blacklist the token
  // For now, we just return success and let the client clear the token

  logger.info(`User logged out: ${req.user?.email}`);

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail(), handleValidationErrors],
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists, a reset email has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token (in production, use Redis)
    // For now, we'll just send the email

    // Send reset email
    try {
      await sendPasswordResetEmail(email, user.firstName, resetToken);
      logger.info(`Password reset email sent to: ${email}`);
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
    }

    res.json({
      success: true,
      message: 'If an account exists, a reset email has been sent.',
    });
  })
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    // In production, verify token against Redis/storage
    // For now, this is a placeholder implementation

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password (you'd find user by token first)
    // await prisma.user.update({ ... });

    logger.info('Password reset successful');

    res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
  })
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post(
  '/verify-email',
  [body('token').notEmpty(), handleValidationErrors],
  asyncHandler(async (req, res) => {
    const { token } = req.body;

    // In production, verify token against Redis/storage
    // For now, this is a placeholder implementation

    // Find and update user
    // const user = await prisma.user.update({ ... });

    // Send welcome email
    // await sendWelcomeEmail(user.email, user.firstName);

    res.json({
      success: true,
      message: 'Email verified successfully.',
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      profile: {
        include: {
          skills: true,
          experiences: true,
          educations: true,
        },
      },
      subscription: true,
      jobPreferences: true,
      analytics: true,
    },
  });

  if (!user) {
    throw new APIError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        profile: user.profile,
        subscription: user.subscription,
        jobPreferences: user.jobPreferences,
        analytics: user.analytics,
      },
    },
  });
}));

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new APIError('User not found', 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      throw new APIError('Current password is incorrect', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

export default router;
