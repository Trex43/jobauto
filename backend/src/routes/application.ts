import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authenticate, requireSubscription } from '../middleware/auth';
import { APIError, asyncHandler } from '../middleware/error';
import { logger } from '../utils/logger';
import { sendApplicationConfirmation } from '../utils/email';

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
 * @route   GET /api/applications
 * @desc    Get user's applications
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = { userId: req.user!.userId };

    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              companyLogo: true,
              location: true,
              remoteType: true,
              salaryMin: true,
              salaryMax: true,
              salaryCurrency: true,
              applyUrl: true,
            },
          },
          interviews: {
            orderBy: { scheduledAt: 'asc' },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    // Get status counts
    const statusCounts = await prisma.application.groupBy({
      by: ['status'],
      where: { userId: req.user!.userId },
      _count: { status: true },
    });

    res.json({
      success: true,
      data: {
        applications,
        statusCounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  })
);

/**
 * @route   GET /api/applications/:id
 * @desc    Get application by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const application = await prisma.application.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
      include: {
        job: true,
        interviews: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    if (!application) {
      throw new APIError('Application not found', 404);
    }

    res.json({
      success: true,
      data: { application },
    });
  })
);

/**
 * @route   POST /api/applications
 * @desc    Apply to a job
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  [
    body('jobId').notEmpty().withMessage('Job ID is required'),
    body('coverLetter').optional().trim(),
    body('notes').optional().trim(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { jobId, coverLetter, notes, isAutoApply } = req.body;
    const userId = req.user!.userId;

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new APIError('Job not found', 404);
    }

    // Check if already applied
    const existingApplication = await prisma.application.findFirst({
      where: { userId, jobId },
    });

    if (existingApplication) {
      throw new APIError('You have already applied to this job', 409);
    }

    // Check subscription limits for auto-apply
    if (isAutoApply) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw new APIError('Subscription not found', 404);
      }

      if (subscription.tier === 'FREE' && subscription.autoAppliesUsed >= subscription.autoAppliesLimit) {
        throw new APIError(
          'Auto-apply limit reached. Upgrade to Professional for unlimited auto-applies.',
          403
        );
      }

      // Increment auto-apply counter
      await prisma.subscription.update({
        where: { userId },
        data: { autoAppliesUsed: { increment: 1 } },
      });
    }

    // Calculate match score
    const userProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { skills: true },
    });

    let matchScore = 0;
    let matchReasons = [];

    if (userProfile) {
      const userSkills = userProfile.skills.map((s) => s.name.toLowerCase());
      const jobSkills = job.skillsRequired.map((s) => s.toLowerCase());
      const matchingSkills = jobSkills.filter((skill) =>
        userSkills.some((userSkill) => userSkill.includes(skill) || skill.includes(userSkill))
      );

      matchScore = jobSkills.length > 0 
        ? Math.round((matchingSkills.length / jobSkills.length) * 100) 
        : 0;

      if (matchingSkills.length > 0) {
        matchReasons.push(`${matchingSkills.length} matching skills`);
      }
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId,
        jobId,
        coverLetter,
        notes,
        matchScore,
        matchReasons,
        isAutoApplied: isAutoApply || false,
        status: 'PENDING',
      },
      include: {
        job: {
          select: {
            title: true,
            company: true,
          },
        },
      },
    });

    // Update analytics
    await prisma.userAnalytics.update({
      where: { userId },
      data: {
        totalApplications: { increment: 1 },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: isAutoApply ? 'auto_apply' : 'manual_apply',
        description: `Applied to ${job.title} at ${job.company}`,
        metadata: { jobId, applicationId: application.id },
      },
    });

    // Send confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (user) {
        await sendApplicationConfirmation(
          user.email,
          user.firstName,
          job.title,
          job.company
        );
      }
    } catch (emailError) {
      logger.error('Failed to send application confirmation:', emailError);
    }

    logger.info(`Application created: ${application.id}`);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application },
    });
  })
);

/**
 * @route   PUT /api/applications/:id
 * @desc    Update application
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes, coverLetter } = req.body;

    const application = await prisma.application.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!application) {
      throw new APIError('Application not found', 404);
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (coverLetter !== undefined) updateData.coverLetter = coverLetter;

    // If status is being updated to APPLIED, set appliedAt
    if (status === 'APPLIED' && application.status === 'PENDING') {
      updateData.appliedAt = new Date();
    }

    const updated = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        job: {
          select: {
            title: true,
            company: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: { application: updated },
    });
  })
);

/**
 * @route   DELETE /api/applications/:id
 * @desc    Withdraw application
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const application = await prisma.application.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!application) {
      throw new APIError('Application not found', 404);
    }

    // Soft delete by updating status
    await prisma.application.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    });

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
    });
  })
);

/**
 * @route   GET /api/applications/stats/overview
 * @desc    Get application statistics
 * @access  Private
 */
router.get(
  '/stats/overview',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const [
      totalApplications,
      statusBreakdown,
      recentApplications,
      responseRate,
      interviewsScheduled,
    ] = await Promise.all([
      prisma.application.count({
        where: { userId },
      }),
      prisma.application.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),
      prisma.application.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          job: {
            select: {
              title: true,
              company: true,
            },
          },
        },
      }),
      prisma.application.count({
        where: {
          userId,
          status: { in: ['INTERVIEW', 'OFFER', 'REJECTED'] },
        },
      }),
      prisma.interview.count({
        where: { userId },
      }),
    ]);

    // Calculate rates
    const responseRatePercent = totalApplications > 0 
      ? Math.round((responseRate / totalApplications) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        totalApplications,
        statusBreakdown,
        recentApplications,
        responseRate: responseRatePercent,
        interviewsScheduled,
      },
    });
  })
);

/**
 * @route   POST /api/applications/:id/interviews
 * @desc    Schedule an interview
 * @access  Private
 */
router.post(
  '/:id/interviews',
  authenticate,
  [
    body('scheduledAt').isISO8601().withMessage('Valid date is required'),
    body('duration').optional().isInt({ min: 15, max: 480 }),
    body('type').isIn(['phone', 'video', 'onsite']).withMessage('Valid interview type is required'),
    body('round').optional().trim(),
    body('interviewerName').optional().trim(),
    body('interviewerEmail').optional().isEmail(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { scheduledAt, duration, type, round, interviewerName, interviewerEmail, notes } = req.body;

    const application = await prisma.application.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!application) {
      throw new APIError('Application not found', 404);
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId: id,
        userId: req.user!.userId,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        type,
        round: round || 'screening',
        interviewerName,
        interviewerEmail,
        notes,
      },
    });

    // Update application status
    await prisma.application.update({
      where: { id },
      data: { status: 'INTERVIEW' },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: 'interview_scheduled',
        description: `Interview scheduled for ${type}`,
        metadata: { applicationId: id, interviewId: interview.id },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: { interview },
    });
  })
);

export default router;
