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
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
      include: {
        skills: true,
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startDate: 'desc' } },
      },
    });

    if (!profile) {
      throw new APIError('Profile not found', 404);
    }

    res.json({
      success: true,
      data: { profile },
    });
  })
);

/**
 * @route   PUT /api/profile
 * @desc    Update profile
 * @access  Private
 */
router.put(
  '/',
  authenticate,
  [
    body('phone').optional().trim(),
    body('location').optional().trim(),
    body('country').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('headline').optional().trim(),
    body('summary').optional().trim(),
    body('yearsOfExperience').optional().isInt({ min: 0 }),
    body('currentTitle').optional().trim(),
    body('currentCompany').optional().trim(),
    body('linkedInUrl').optional().trim().isURL(),
    body('githubUrl').optional().trim().isURL(),
    body('portfolioUrl').optional().trim().isURL(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const {
      phone,
      location,
      country,
      city,
      state,
      zipCode,
      headline,
      summary,
      yearsOfExperience,
      currentTitle,
      currentCompany,
      linkedInUrl,
      githubUrl,
      portfolioUrl,
    } = req.body;

    const profile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: {
        phone,
        location,
        country,
        city,
        state,
        zipCode,
        headline,
        summary,
        yearsOfExperience,
        currentTitle,
        currentCompany,
        linkedInUrl,
        githubUrl,
        portfolioUrl,
      },
      include: {
        skills: true,
        experiences: true,
        educations: true,
      },
    });

    logger.info(`Profile updated for user: ${req.user!.userId}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile },
    });
  })
);

/**
 * @route   POST /api/profile/skills
 * @desc    Add skill to profile
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
    const { name, category, proficiency } = req.body;

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!profile) {
      throw new APIError('Profile not found', 404);
    }

    const skill = await prisma.skill.create({
      data: {
        profileId: profile.id,
        name: name.trim(),
        category,
        proficiency,
      },
    });

    logger.info(`Skill added: ${name}`);

    res.status(201).json({
      success: true,
      message: 'Skill added successfully',
      data: { skill },
    });
  })
);

/**
 * @route   DELETE /api/profile/skills/:id
 * @desc    Remove skill from profile
 * @access  Private
 */
router.delete(
  '/skills/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!profile) {
      throw new APIError('Profile not found', 404);
    }

    // Verify skill belongs to user's profile
    const skill = await prisma.skill.findFirst({
      where: { id, profileId: profile.id },
    });

    if (!skill) {
      throw new APIError('Skill not found', 404);
    }

    await prisma.skill.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Skill removed successfully',
    });
  })
);

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
    const { title, company, location, startDate, endDate, isCurrent, description } = req.body;

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
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

    res.status(201).json({
      success: true,
      message: 'Experience added successfully',
      data: { experience },
    });
  })
);

/**
 * @route   PUT /api/profile/experiences/:id
 * @desc    Update work experience
 * @access  Private
 */
router.put(
  '/experiences/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!profile) {
      throw new APIError('Profile not found', 404);
    }

    // Verify experience belongs to user's profile
    const experience = await prisma.experience.findFirst({
      where: { id, profileId: profile.id },
    });

    if (!experience) {
      throw new APIError('Experience not found', 404);
    }

    const updated = await prisma.experience.update({
      where: { id },
      data: {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
      },
    });

    res.json({
      success: true,
      message: 'Experience updated successfully',
      data: { experience: updated },
    });
  })
);

/**
 * @route   DELETE /api/profile/experiences/:id
 * @desc    Delete work experience
 * @access  Private
 */
router.delete(
  '/experiences/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!profile) {
      throw new APIError('Profile not found', 404);
    }

    const experience = await prisma.experience.findFirst({
      where: { id, profileId: profile.id },
    });

    if (!experience) {
      throw new APIError('Experience not found', 404);
    }

    await prisma.experience.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Experience deleted successfully',
    });
  })
);

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
    const { institution, degree, fieldOfStudy, startDate, endDate, isCurrent, gpa } = req.body;

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
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

    res.status(201).json({
      success: true,
      message: 'Education added successfully',
      data: { education },
    });
  })
);

/**
 * @route   PUT /api/profile/educations/:id
 * @desc    Update education
 * @access  Private
 */
router.put(
  '/educations/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!profile) {
      throw new APIError('Profile not found', 404);
    }

    const education = await prisma.education.findFirst({
      where: { id, profileId: profile.id },
    });

    if (!education) {
      throw new APIError('Education not found', 404);
    }

    const updated = await prisma.education.update({
      where: { id },
      data: {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
      },
    });

    res.json({
      success: true,
      message: 'Education updated successfully',
      data: { education: updated },
    });
  })
);

/**
 * @route   DELETE /api/profile/educations/:id
 * @desc    Delete education
 * @access  Private
 */
router.delete(
  '/educations/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!profile) {
      throw new APIError('Profile not found', 404);
    }

    const education = await prisma.education.findFirst({
      where: { id, profileId: profile.id },
    });

    if (!education) {
      throw new APIError('Education not found', 404);
    }

    await prisma.education.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Education deleted successfully',
    });
  })
);

/**
 * @route   POST /api/profile/resume
 * @desc    Upload resume
 * @access  Private
 */
router.post(
  '/resume',
  authenticate,
  asyncHandler(async (req, res) => {
    const { resumeUrl, resumeText } = req.body;

    if (!resumeUrl) {
      throw new APIError('Resume URL is required', 400);
    }

    const profile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: {
        resumeUrl,
        resumeText,
      },
    });

    // TODO: Trigger AI parsing of resume
    // This would extract skills, experience, etc.

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: { profile },
    });
  })
);

export default router;
