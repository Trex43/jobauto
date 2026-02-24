import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
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
 * @route   GET /api/jobs
 * @desc    Get jobs with filtering and pagination
 * @access  Public
 */
router.get(
  '/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('location').optional().trim(),
    query('remote').optional().isIn(['remote', 'onsite', 'hybrid']),
    query('minSalary').optional().isInt(),
    query('maxSalary').optional().isInt(),
    query('portal').optional(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const {
      search,
      location,
      remote,
      minSalary,
      maxSalary,
      portal,
      skills,
    } = req.query;

    // Build where clause
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    if (remote) {
      where.remoteType = remote;
    }

    if (minSalary || maxSalary) {
      where.AND = [];
      if (minSalary) {
        where.AND.push({ salaryMax: { gte: parseInt(minSalary as string) } });
      }
      if (maxSalary) {
        where.AND.push({ salaryMin: { lte: parseInt(maxSalary as string) } });
      }
    }

    if (portal) {
      where.portal = portal;
    }

    if (skills) {
      const skillArray = (skills as string).split(',');
      where.skillsRequired = { hasSome: skillArray };
    }

    // Get jobs
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { postedAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    // If user is authenticated, calculate match scores
    let jobsWithMatchScore = jobs;
    if (req.user) {
      const userProfile = await prisma.profile.findUnique({
        where: { userId: req.user.userId },
        include: { skills: true },
      });

      if (userProfile) {
        const userSkills = userProfile.skills.map((s) => s.name.toLowerCase());

        jobsWithMatchScore = jobs.map((job) => {
          const jobSkills = job.skillsRequired.map((s) => s.toLowerCase());
          const matchingSkills = jobSkills.filter((skill) =>
            userSkills.some((userSkill) => userSkill.includes(skill) || skill.includes(userSkill))
          );
          const matchScore = jobSkills.length > 0 
            ? Math.round((matchingSkills.length / jobSkills.length) * 100) 
            : 0;

          return {
            ...job,
            matchScore,
            matchingSkills,
          };
        });

        // Sort by match score if requested
        if (req.query.sortByMatch === 'true') {
          jobsWithMatchScore.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        }
      }
    }

    res.json({
      success: true,
      data: {
        jobs: jobsWithMatchScore,
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
 * @route   GET /api/jobs/:id
 * @desc    Get job by ID
 * @access  Public
 */
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new APIError('Job not found', 404);
    }

    // Check if user has already applied
    let hasApplied = false;
    let application = null;

    if (req.user) {
      application = await prisma.application.findFirst({
        where: {
          userId: req.user.userId,
          jobId: id,
        },
      });
      hasApplied = !!application;
    }

    // Calculate match score if user is authenticated
    let matchScore = null;
    let matchReasons = [];

    if (req.user) {
      const userProfile = await prisma.profile.findUnique({
        where: { userId: req.user.userId },
        include: {
          skills: true,
          jobPreferences: true,
        },
      });

      if (userProfile) {
        const userSkills = userProfile.skills.map((s) => s.name.toLowerCase());
        const jobSkills = job.skillsRequired.map((s) => s.toLowerCase());
        const matchingSkills = jobSkills.filter((skill) =>
          userSkills.some((userSkill) => userSkill.includes(skill) || skill.includes(userSkill))
        );

        matchScore = jobSkills.length > 0 
          ? Math.round((matchingSkills.length / jobSkills.length) * 100) 
          : 0;

        // Generate match reasons
        if (matchingSkills.length > 0) {
          matchReasons.push(`You have ${matchingSkills.length} matching skills`);
        }

        const prefs = userProfile.jobPreferences;
        if (prefs) {
          if (prefs.desiredRoles?.some((role) => 
            job.title.toLowerCase().includes(role.toLowerCase())
          )) {
            matchReasons.push('Matches your desired role');
          }

          if (prefs.desiredLocations?.some((loc) => 
            job.location?.toLowerCase().includes(loc.toLowerCase())
          )) {
            matchReasons.push('Matches your preferred location');
          }

          if (prefs.remotePreference && job.remoteType === prefs.remotePreference) {
            matchReasons.push('Matches your work preference');
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        job: {
          ...job,
          matchScore,
          matchReasons,
        },
        hasApplied,
        application,
      },
    });
  })
);

/**
 * @route   POST /api/jobs
 * @desc    Create a new job (admin only)
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty(),
    body('company').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('applyUrl').trim().isURL(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    // Check if admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new APIError('Access denied', 403);
    }

    const jobData = req.body;

    const job = await prisma.job.create({
      data: {
        ...jobData,
        externalId: jobData.externalId || `manual-${Date.now()}`,
        postedAt: new Date(),
      },
    });

    logger.info(`Job created: ${job.title} at ${job.company}`);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: { job },
    });
  })
);

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job (admin only)
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new APIError('Access denied', 403);
    }

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
  })
);

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete job (admin only)
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new APIError('Access denied', 403);
    }

    const { id } = req.params;

    await prisma.job.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  })
);

/**
 * @route   GET /api/jobs/recommendations/personalized
 * @desc    Get personalized job recommendations
 * @access  Private
 */
router.get(
  '/recommendations/personalized',
  authenticate,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;

    // Get user profile and preferences
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        profile: {
          include: { skills: true },
        },
        jobPreferences: true,
      },
    });

    if (!user?.profile || !user?.jobPreferences) {
      return res.json({
        success: true,
        data: {
          jobs: [],
          message: 'Complete your profile to get personalized recommendations',
        },
      });
    }

    const userSkills = user.profile.skills.map((s) => s.name.toLowerCase());
    const prefs = user.jobPreferences;

    // Build recommendation query
    const where: any = {
      isActive: true,
      OR: [],
    };

    // Match by skills
    if (userSkills.length > 0) {
      where.OR.push({
        skillsRequired: { hasSome: userSkills },
      });
    }

    // Match by desired roles
    if (prefs.desiredRoles?.length > 0) {
      where.OR.push(
        ...prefs.desiredRoles.map((role) => ({
          title: { contains: role, mode: 'insensitive' },
        }))
      );
    }

    // Match by location
    if (prefs.desiredLocations?.length > 0) {
      where.OR.push(
        ...prefs.desiredLocations.map((loc) => ({
          location: { contains: loc, mode: 'insensitive' },
        }))
      );
    }

    // Exclude already applied jobs
    const appliedJobIds = await prisma.application.findMany({
      where: { userId: req.user!.userId },
      select: { jobId: true },
    });

    where.id = {
      notIn: appliedJobIds.map((a) => a.jobId),
    };

    // Get recommendations
    const jobs = await prisma.job.findMany({
      where,
      take: limit * 2, // Get more to filter by match score
      orderBy: { postedAt: 'desc' },
    });

    // Calculate match scores and filter
    const jobsWithScores = jobs.map((job) => {
      const jobSkills = job.skillsRequired.map((s) => s.toLowerCase());
      const matchingSkills = jobSkills.filter((skill) =>
        userSkills.some((userSkill) => userSkill.includes(skill) || skill.includes(userSkill))
      );

      let score = 0;
      const reasons = [];

      // Skill match (up to 50 points)
      if (jobSkills.length > 0) {
        score += (matchingSkills.length / jobSkills.length) * 50;
        if (matchingSkills.length > 0) {
          reasons.push(`${matchingSkills.length} skill matches`);
        }
      }

      // Role match (up to 20 points)
      if (prefs.desiredRoles?.some((role) =>
        job.title.toLowerCase().includes(role.toLowerCase())
      )) {
        score += 20;
        reasons.push('Matches desired role');
      }

      // Location match (up to 15 points)
      if (prefs.desiredLocations?.some((loc) =>
        job.location?.toLowerCase().includes(loc.toLowerCase())
      )) {
        score += 15;
        reasons.push('Preferred location');
      }

      // Remote preference (up to 15 points)
      if (prefs.remotePreference && job.remoteType === prefs.remotePreference) {
        score += 15;
        reasons.push('Matches work preference');
      }

      return {
        ...job,
        matchScore: Math.round(score),
        matchReasons: reasons,
      };
    });

    // Filter by minimum match score and sort
    const minMatchScore = prefs.minMatchScore || 50;
    const filteredJobs = jobsWithScores
      .filter((job) => job.matchScore >= minMatchScore)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        jobs: filteredJobs,
        total: filteredJobs.length,
      },
    });
  })
);

/**
 * @route   GET /api/jobs/stats/trending
 * @desc    Get trending jobs and statistics
 * @access  Public
 */
router.get(
  '/stats/trending',
  asyncHandler(async (req, res) => {
    const [recentJobs, topCompanies, topLocations] = await Promise.all([
      prisma.job.findMany({
        where: { isActive: true },
        take: 10,
        orderBy: { postedAt: 'desc' },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          salaryMin: true,
          salaryMax: true,
          postedAt: true,
        },
      }),
      prisma.job.groupBy({
        by: ['company'],
        where: { isActive: true },
        _count: { company: true },
        orderBy: { _count: { company: 'desc' } },
        take: 10,
      }),
      prisma.job.groupBy({
        by: ['location'],
        where: { isActive: true },
        _count: { location: true },
        orderBy: { _count: { location: 'desc' } },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        recentJobs,
        topCompanies,
        topLocations,
      },
    });
  })
);

export default router;
