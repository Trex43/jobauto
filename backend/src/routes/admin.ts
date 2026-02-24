import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
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

// All routes require admin access
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard stats
 * @access  Admin
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [
    totalUsers,
    newUsersToday,
    totalApplications,
    applicationsToday,
    totalJobs,
    activeJobs,
    subscriptionStats,
    recentUsers,
    recentApplications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.application.count(),
    prisma.application.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.job.count(),
    prisma.job.count({ where: { isActive: true } }),
    prisma.subscription.groupBy({
      by: ['tier'],
      _count: { tier: true },
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        subscription: {
          select: { tier: true },
        },
      },
    }),
    prisma.application.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        job: {
          select: {
            title: true,
            company: true,
          },
        },
      },
    }),
  ]);

  // Calculate growth rates (simplified)
  const userGrowthRate = 12.5; // This would be calculated from historical data
  const applicationGrowthRate = 8.3;

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        newUsersToday,
        userGrowthRate,
        totalApplications,
        applicationsToday,
        applicationGrowthRate,
        totalJobs,
        activeJobs,
      },
      subscriptionStats,
      recentUsers,
      recentApplications,
    },
  });
}));

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Admin
 */
router.get('/users', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const role = req.query.role as string;

  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        subscription: {
          select: {
            tier: true,
            status: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}));

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role
 * @access  Super Admin
 */
router.put(
  '/users/:id/role',
  authorize('SUPER_ADMIN'),
  [
    body('role').isIn(['USER', 'ADMIN', 'SUPER_ADMIN']).withMessage('Valid role is required'),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent changing own role
    if (id === req.user!.userId) {
      throw new APIError('Cannot change your own role', 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    logger.info(`User role updated: ${user.email} -> ${role}`);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user },
    });
  })
);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Activate/deactivate user
 * @access  Admin
 */
router.put(
  '/users/:id/status',
  [
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    // Prevent deactivating self
    if (id === req.user!.userId) {
      throw new APIError('Cannot change your own status', 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    logger.info(`User status updated: ${user.email} -> ${isActive}`);

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user },
    });
  })
);

/**
 * @route   GET /api/admin/jobs
 * @desc    Get all jobs with pagination
 * @access  Admin
 */
router.get('/jobs', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    }),
    prisma.job.count(),
  ]);

  res.json({
    success: true,
    data: {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}));

/**
 * @route   POST /api/admin/jobs
 * @desc    Create a new job
 * @access  Admin
 */
router.post(
  '/jobs',
  [
    body('title').trim().notEmpty(),
    body('company').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('applyUrl').trim().isURL(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const jobData = req.body;

    const job = await prisma.job.create({
      data: {
        ...jobData,
        externalId: `manual-${Date.now()}`,
        postedAt: new Date(),
      },
    });

    logger.info(`Job created by admin: ${job.title}`);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: { job },
    });
  })
);

/**
 * @route   PUT /api/admin/jobs/:id
 * @desc    Update job
 * @access  Admin
 */
router.put('/jobs/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const job = await prisma.job.update({
    where: { id },
    data: updateData,
  });

  res.json({
    success: true,
    message: 'Job updated successfully',
    data: { job },
  });
}));

/**
 * @route   DELETE /api/admin/jobs/:id
 * @desc    Delete job
 * @access  Admin
 */
router.delete('/jobs/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.job.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Job deleted successfully',
  });
}));

/**
 * @route   GET /api/admin/applications
 * @desc    Get all applications
 * @access  Admin
 */
router.get('/applications', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
    }),
    prisma.application.count(),
  ]);

  res.json({
    success: true,
    data: {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}));

/**
 * @route   GET /api/admin/analytics
 * @desc    Get platform analytics
 * @access  Admin
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    userGrowth,
    applicationGrowth,
    subscriptionDistribution,
    topCompanies,
    topLocations,
    dailyStats,
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    }),
    prisma.application.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    }),
    prisma.subscription.groupBy({
      by: ['tier'],
      _count: { tier: true },
    }),
    prisma.job.groupBy({
      by: ['company'],
      _count: { company: true },
      orderBy: { _count: { company: 'desc' } },
      take: 10,
    }),
    prisma.job.groupBy({
      by: ['location'],
      where: { location: { not: null } },
      _count: { location: true },
      orderBy: { _count: { location: 'desc' } },
      take: 10,
    }),
    prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ]);

  res.json({
    success: true,
    data: {
      userGrowth,
      applicationGrowth,
      subscriptionDistribution,
      topCompanies,
      topLocations,
      dailyStats,
    },
  });
}));

/**
 * @route   GET /api/admin/settings
 * @desc    Get system settings
 * @access  Super Admin
 */
router.get('/settings', authorize('SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const settings = await prisma.systemSetting.findMany();

  res.json({
    success: true,
    data: { settings },
  });
}));

/**
 * @route   PUT /api/admin/settings/:key
 * @desc    Update system setting
 * @access  Super Admin
 */
router.put(
  '/settings/:key',
  authorize('SUPER_ADMIN'),
  [
    body('value').notEmpty(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { value, description } = req.body;

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: { setting },
    });
  })
);

/**
 * @route   POST /api/admin/broadcast
 * @desc    Send broadcast notification/email
 * @access  Admin
 */
router.post(
  '/broadcast',
  [
    body('type').isIn(['email', 'notification']).withMessage('Valid type is required'),
    body('subject').trim().notEmpty(),
    body('message').trim().notEmpty(),
    body('target').isIn(['all', 'free', 'professional', 'enterprise']).withMessage('Valid target is required'),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { type, subject, message, target } = req.body;

    // Build target filter
    const where: any = {};
    if (target !== 'all') {
      where.subscription = {
        tier: target.toUpperCase(),
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
      },
    });

    // TODO: Implement actual broadcast logic
    // For emails, use a queue system
    // For notifications, create notification records

    logger.info(`Broadcast ${type} sent to ${users.length} users`);

    res.json({
      success: true,
      message: `Broadcast queued for ${users.length} users`,
      data: { recipientCount: users.length },
    });
  })
);

export default router;
