import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { APIError, asyncHandler } from '../middleware/error';
import { logger } from '../utils/logger';

const router = Router();

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
 * @route   GET /api/preferences
 * @desc    Get current user's job preferences
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const preferences = await prisma.jobPreference.findUnique({
    where: { userId },
  });

  if (!preferences) {
    // Create default preferences with new fields
    const newPrefs = await prisma.jobPreference.create({
      data: { userId },
    });
    return res.json({
      success: true,
      data: { preferences: newPrefs },
    });
  }

  res.json({
    success: true,
    data: { preferences },
  });
}));

/**
 * @route   PUT /api/preferences
 * @desc    Update job preferences
 * @access  Private
 */
router.put(
  '/',
  authenticate,
  [
    body('desiredRoles').optional().isArray(),
    body('desiredLocations').optional().isArray(),
    body('remotePreference').optional().custom((value) => value === null || ['remote', 'onsite', 'hybrid'].includes(value)),
    body('minSalary').optional().custom((value) => value === null || (Number.isInteger(value) && value >= 0)),
    body('maxSalary').optional().custom((value) => value === null || (Number.isInteger(value) && value >= 0)),
    body('salaryCurrency').optional().isIn(['USD', 'EUR', 'GBP', 'KWD', 'AED', 'SAR', 'INR']),
    body('salaryPeriod').optional().isIn(['yearly', 'monthly', 'hourly']),
    body('minMatchScore').optional().isInt({ min: 0, max: 100 }),
    body('industryPreferences').optional().isArray(),
    body('companySizePreferences').optional().isArray(),
    body('excludedCompanies').optional().isArray(),
    body('excludedKeywords').optional().isArray(),
    body('emailNotifications').optional().isBoolean(),
    body('dailyDigest').optional().isBoolean(),
    body('instantAlerts').optional().isBoolean(),
    // New fields validation
    body('skills').optional().isArray(),
    body('experienceLevel').optional().custom((value) => value === null || ['entry', 'mid', 'senior', 'lead', 'executive'].includes(value)),
    body('resumeId').optional().custom((value) => value === null || (typeof value === 'string' && value.trim().length > 0)),
    body('autoApplyLimit').optional().isInt({ min: 1, max: 100 }),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const updateData = req.body;

    // Strip Prisma-managed fields to avoid unexpected errors
    const {
      id,
      userId: _userId,
      createdAt,
      updatedAt,
      ...safeUpdateData
    } = updateData;

    const preferences = await prisma.jobPreference.upsert({
      where: { userId },
      update: safeUpdateData,
      create: {
        userId,
        ...safeUpdateData,
      },
    });

    logger.info(`Job preferences updated for user: ${userId}`);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences },
    });
  })
);

export default router;
