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
 * @route   GET /api/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      skills: true,
      experiences: true,
      educations: true,
    },
  });

  if (!profile) {
    throw new APIError('Profile not found', 404);
  }

  res.json({
    success: true,
    data: { profile },
  });
}));

/**
 * @route   PUT /api/profile
 * @desc    Update profile
 * @access  Private
 */
router.put(
  '/',
  authenticate,
  [
    body('headline').optional().trim(),
    body('summary').optional().trim(),
    body('phone').optional().trim(),
    body('location').optional().trim(),
    body('country').optional().trim(),
    body('city').optional().trim(),
    body('currentTitle').optional().trim(),
    body('currentCompany').optional().trim(),
    body('yearsOfExperience').optional().isInt({ min: 0, max: 50 }),
    body('linkedInUrl').optional().trim(),
    body('githubUrl').optional().trim(),
    body('portfolioUrl').optional().trim(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const updateData = req.body;

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });

    logger.info(`Profile updated for user: ${userId}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile },
    });
  })
);

/**
 * @route   POST /api/profile/skills
 * @desc    Add a skill
 * @access  Private
 */
router.post(
  '/skills',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Skill name is required'),
    body('category').optional().trim(),
    body('proficiency').optional().isInt({ min: 1, max: 10 }),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { name, category, proficiency } = req.body;

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new APIError('Profile not found', 404);
    }

    const skill = await prisma.skill.upsert({
      where: {
        profileId_name: {
          profileId: profile.id,
          name,
        },
      },
      update: {
        category,
        proficiency,
      },
      create: {
        profileId: profile.id,
        name,
        category,
        proficiency,
      },
    });

    res.json({
      success: true,
      message: 'Skill added successfully',
      data: { skill },
    });
  })
);

/**
 * @route   DELETE /api/profile/skills/:id
 * @desc    Remove a skill
 * @access  Private
 */
router.delete('/skills/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new APIError('Profile not found', 404);
  }

  await prisma.skill.deleteMany({
    where: {
      id,
      profileId: profile.id,
    },
  });

  res.json({
    success: true,
    message: 'Skill removed successfully',
  });
}));

/**
 * @route   POST /api/profile/experiences
 * @desc    Add work experience
 * @access  Private
 */
router.post(
  '/experiences',
  authenticate,
  [
    body('title').trim().notEmpty(),
    body('company').trim().notEmpty(),
    body('location').optional().trim(),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601(),
    body('isCurrent').optional().isBoolean(),
    body('description').optional().trim(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { title, company, location, startDate, endDate, isCurrent, description } = req.body;

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new APIError('Profile not found', 404);
    }

    const experience = await prisma.experience.create({
      data: {
        profileId: profile.id,
        title,
        company,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent || false,
        description,
      },
    });

    res.json({
      success: true,
      message: 'Experience added successfully',
      data: { experience },
    });
  })
);

/**
 * @route   DELETE /api/profile/experiences/:id
 * @desc    Remove work experience
 * @access  Private
 */
router.delete('/experiences/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new APIError('Profile not found', 404);
  }

  await prisma.experience.deleteMany({
    where: {
      id,
      profileId: profile.id,
    },
  });

  res.json({
    success: true,
    message: 'Experience removed successfully',
  });
}));

/**
 * @route   POST /api/profile/educations
 * @desc    Add education
 * @access  Private
 */
router.post(
  '/educations',
  authenticate,
  [
    body('institution').trim().notEmpty(),
    body('degree').trim().notEmpty(),
    body('fieldOfStudy').optional().trim(),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601(),
    body('isCurrent').optional().isBoolean(),
    body('gpa').optional().trim(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { institution, degree, fieldOfStudy, startDate, endDate, isCurrent, gpa } = req.body;

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new APIError('Profile not found', 404);
    }

    const education = await prisma.education.create({
      data: {
        profileId: profile.id,
        institution,
        degree,
        fieldOfStudy,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent || false,
        gpa,
      },
    });

    res.json({
      success: true,
      message: 'Education added successfully',
      data: { education },
    });
  })
);

/**
 * @route   DELETE /api/profile/educations/:id
 * @desc    Remove education
 * @access  Private
 */
router.delete('/educations/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new APIError('Profile not found', 404);
  }

  await prisma.education.deleteMany({
    where: {
      id,
      profileId: profile.id,
    },
  });

  res.json({
    success: true,
    message: 'Education removed successfully',
  });
}));

/**
 * @route   POST /api/profile/resume
 * @desc    Upload resume (text extraction)
 * @access  Private
 */
router.post('/resume', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { resumeText, resumeUrl } = req.body;

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {
      resumeText,
      resumeUrl,
    },
    create: {
      userId,
      resumeText,
      resumeUrl,
    },
  });

  res.json({
    success: true,
    message: 'Resume updated successfully',
    data: { profile },
  });
}));

export default router;

