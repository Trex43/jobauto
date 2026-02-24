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

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
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
  })
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin or own user
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check permissions
    if (req.user!.userId !== id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new APIError('Access denied', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id },
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
        portalConnections: true,
        _count: {
          select: {
            applications: true,
            resumes: true,
          },
        },
      },
    });

    if (!user) {
      throw new APIError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  })
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Admin or own user
 */
router.put(
  '/:id',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('role').optional().isIn(['USER', 'ADMIN', 'SUPER_ADMIN']),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, role, isActive } = req.body;

    // Check permissions
    if (req.user!.userId !== id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new APIError('Access denied', 403);
    }

    // Only admins can change role or isActive
    if ((role || isActive !== undefined) && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new APIError('Only admins can change role or status', 403);
    }

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    logger.info(`User updated: ${user.email}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  })
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Admin or own user
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check permissions
    if (req.user!.userId !== id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new APIError('Access denied', 403);
    }

    // Prevent self-deletion for admins
    if (req.user!.userId === id && req.user!.role === 'SUPER_ADMIN') {
      throw new APIError('Cannot delete your own super admin account', 400);
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`User deactivated: ${id}`);

    res.json({
      success: true,
      message: 'User account deactivated successfully',
    });
  })
);

/**
 * @route   GET /api/users/:id/stats
 * @desc    Get user statistics
 * @access  Admin or own user
 */
router.get(
  '/:id/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check permissions
    if (req.user!.userId !== id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new APIError('Access denied', 403);
    }

    const [
      applicationsByStatus,
      totalApplications,
      recentApplications,
      interviews,
    ] = await Promise.all([
      prisma.application.groupBy({
        by: ['status'],
        where: { userId: id },
        _count: { status: true },
      }),
      prisma.application.count({
        where: { userId: id },
      }),
      prisma.application.findMany({
        where: { userId: id },
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
      prisma.interview.findMany({
        where: { userId: id },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
        include: {
          application: {
            select: {
              job: {
                select: {
                  title: true,
                  company: true,
                },
              },
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        applicationsByStatus,
        totalApplications,
        recentApplications,
        upcomingInterviews: interviews,
      },
    });
  })
);

/**
 * @route   GET /api/users/:id/activity
 * @desc    Get user activity log
 * @access  Admin or own user
 */
router.get(
  '/:id/activity',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Check permissions
    if (req.user!.userId !== id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new APIError('Access denied', 403);
    }

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where: { userId: id } }),
    ]);

    res.json({
      success: true,
      data: {
        activities,
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

export default router;
