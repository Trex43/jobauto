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
    body('remotePreference').optional().isIn(['remote', 'onsite', 'hybrid']),
    body('minSalary').optional().isInt({ min: 0 }),
    body('maxSalary').optional().isInt({ min: 0 }),
    body('salaryCurrency').optional().trim(),
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
    body('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'lead', 'executive']),
    body('resumeId').optional().trim(),
    body('autoApplyLimit').optional().isInt({ min: 1, max: 100 }),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const updateData = req.body;

    const preferences = await prisma.jobPreference.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
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

