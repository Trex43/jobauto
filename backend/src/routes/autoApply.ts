import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { APIError, asyncHandler } from '../middleware/error';
import { logger } from '../utils/logger';
import { runAutoApplyForUser, runAutoApplyForAllUsers } from '../services/autoApply';

interface MatchPreview {
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    remoteType: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
  };
  matchScore: number;
  matchReasons: string[];
}

const router = Router();

/**
 * @route   GET /api/auto-apply/status
 * @desc    Get auto-apply status for current user
 * @access  Private
 */
router.get('/status', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const [subscription, analytics, recentApplications] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.userAnalytics.findUnique({ where: { userId } }),
    prisma.application.findMany({
      where: { userId, isAutoApplied: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        job: {
          select: { title: true, company: true, location: true },
        },
      },
    }),
  ]);

  const autoAppliesUsed = subscription?.autoAppliesUsed || 0;
  const autoAppliesLimit = subscription?.autoAppliesLimit || 5;

  res.json({
    success: true,
    data: {
      isEnabled: true, // Auto-apply is always "enabled" conceptually; limited by subscription
      used: autoAppliesUsed,
      limit: autoAppliesLimit,
      remaining: Math.max(0, autoAppliesLimit - autoAppliesUsed),
      totalAutoApplied: analytics?.totalApplications || 0,
      timeSaved: analytics?.estimatedTimeSaved || 0,
      recentApplications,
    },
  });
}));

/**
 * @route   POST /api/auto-apply/run
 * @desc    Manually trigger auto-apply for current user
 * @access  Private
 */
router.post('/run', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { limit = 5 } = req.body;

  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  const autoAppliesUsed = subscription?.autoAppliesUsed || 0;
  const autoAppliesLimit = subscription?.autoAppliesLimit || 5;

  if (autoAppliesUsed >= autoAppliesLimit) {
    throw new APIError('Auto-apply limit reached. Upgrade your plan for more applications.', 403);
  }

  const result = await runAutoApplyForUser(userId, limit);

  logger.info(`Manual auto-apply triggered by user ${userId}: ${result.applied} jobs`);

  res.json({
    success: true,
    message: `Auto-applied to ${result.applied} jobs`,
    data: {
      applied: result.applied,
      matches: result.matches,
      remaining: autoAppliesLimit - (autoAppliesUsed + result.applied),
    },
  });
}));

/**
 * @route   POST /api/auto-apply/run-all
 * @desc    Trigger auto-apply for ALL users (admin only)
 * @access  Admin
 */
router.post('/run-all', authenticate, asyncHandler(async (req, res) => {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
    throw new APIError('Access denied', 403);
  }

  const result = await runAutoApplyForAllUsers();

  res.json({
    success: true,
    message: `Auto-apply completed for ${result.totalUsers} users`,
    data: result,
  });
}));

/**
 * @route   GET /api/auto-apply/matches
 * @desc    Preview matching jobs without applying
 * @access  Private
 */
router.get('/matches', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: { include: { skills: true } },
      jobPreferences: true,
    },
  });

  if (!user?.profile || !user?.jobPreferences) {
    return res.json({
      success: true,
      data: { matches: [], message: 'Complete your profile and preferences to see matches' },
    });
  }

  // Get existing applications
  const existingApps = await prisma.application.findMany({
    where: { userId },
    select: { jobId: true },
  });
  const appliedJobIds = new Set(existingApps.map((a) => a.jobId));

  // Get active jobs
  const jobs = await prisma.job.findMany({
    where: {
      isActive: true,
      id: { notIn: Array.from(appliedJobIds) },
    },
    take: 50,
    orderBy: { postedAt: 'desc' },
  });

  const userSkills = user.profile.skills.map((s) => s.name.toLowerCase());
  const minMatchScore = user.jobPreferences.minMatchScore || 50;

  const matches: MatchPreview[] = [];
  for (const job of jobs) {
    const jobSkills = (job.skillsRequired || []).map((s: string) => s.toLowerCase());
    const matchingSkills = jobSkills.filter((skill: string) =>
      userSkills.some((us) => us.includes(skill) || skill.includes(us))
    );

    let score = 0;
    const reasons: string[] = [];

    if (jobSkills.length > 0) {
      score += (matchingSkills.length / jobSkills.length) * 50;
      if (matchingSkills.length > 0) reasons.push(`${matchingSkills.length} skill matches`);
    } else {
      score += 25;
    }

    if (user.jobPreferences?.desiredRoles?.some((role: string) =>
      job.title.toLowerCase().includes(role.toLowerCase())
    )) {
      score += 20;
      reasons.push('Matches desired role');
    }

    if (user.jobPreferences?.desiredLocations?.some((loc: string) =>
      job.location?.toLowerCase().includes(loc.toLowerCase())
    )) {
      score += 15;
      reasons.push('Preferred location');
    }

    if (user.jobPreferences?.remotePreference && job.remoteType === user.jobPreferences.remotePreference) {
      score += 15;
      reasons.push('Matches work preference');
    }

    if (score >= minMatchScore) {
      matches.push({
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          remoteType: job.remoteType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
        },
        matchScore: Math.round(score),
        matchReasons: reasons,
      });
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);

  res.json({
    success: true,
    data: { matches: matches.slice(0, 20) },
  });
}));

export default router;

