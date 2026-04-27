import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface MatchResult {
  jobId: string;
  score: number;
  reasons: string[];
}

/**
 * Calculate match score between a job and user profile/preferences
 */
function calculateMatchScore(
  job: any,
  userSkills: string[],
  preferences: any
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const jobSkills = (job.skillsRequired || []).map((s: string) => s.toLowerCase());
  const userSkillSet = userSkills.map((s) => s.toLowerCase());

  // Skill match (up to 50 points)
  if (jobSkills.length > 0) {
    const matchingSkills = jobSkills.filter((skill: string) =>
      userSkillSet.some((us) => us.includes(skill) || skill.includes(us))
    );
    const skillScore = (matchingSkills.length / jobSkills.length) * 50;
    score += skillScore;
    if (matchingSkills.length > 0) {
      reasons.push(`${matchingSkills.length} skill matches`);
    }
  } else {
    score += 25; // No skills required = neutral
  }

  // Role match (up to 20 points)
  if (preferences?.desiredRoles?.length > 0) {
    const titleLower = job.title.toLowerCase();
    const roleMatch = preferences.desiredRoles.some((role: string) =>
      titleLower.includes(role.toLowerCase())
    );
    if (roleMatch) {
      score += 20;
      reasons.push('Matches desired role');
    }
  }

  // Location match (up to 15 points)
  if (preferences?.desiredLocations?.length > 0 && job.location) {
    const locLower = job.location.toLowerCase();
    const locMatch = preferences.desiredLocations.some((loc: string) =>
      locLower.includes(loc.toLowerCase()) || loc.toLowerCase().includes(locLower)
    );
    if (locMatch) {
      score += 15;
      reasons.push('Preferred location');
    }
  }

  // Remote preference (up to 15 points)
  if (preferences?.remotePreference && job.remoteType) {
    if (job.remoteType === preferences.remotePreference) {
      score += 15;
      reasons.push('Matches work preference');
    }
  }

  // Salary match (up to 10 bonus points)
  if (preferences?.minSalary && job.salaryMin) {
    if (job.salaryMin >= preferences.minSalary) {
      score += 10;
      reasons.push('Salary in range');
    }
  }

  return { score: Math.round(score), reasons };
}

/**
 * Run auto-apply for a specific user
 */
export async function runAutoApplyForUser(userId: string, limit: number = 10): Promise<{
  applied: number;
  matches: MatchResult[];
}> {
  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: { include: { skills: true } },
      jobPreferences: true,
      subscription: true,
    },
  });

  if (!user || !user.profile || !user.jobPreferences) {
    logger.warn(`Auto-apply skipped: User ${userId} missing profile or preferences`);
    return { applied: 0, matches: [] };
  }

  // Check subscription limits
  const autoAppliesUsed = user.subscription?.autoAppliesUsed || 0;
  const autoAppliesLimit = user.subscription?.autoAppliesLimit || 5;
  const remaining = autoAppliesLimit - autoAppliesUsed;

  if (remaining <= 0) {
    logger.info(`Auto-apply limit reached for user ${userId}`);
    return { applied: 0, matches: [] };
  }

  const applyLimit = Math.min(limit, remaining);

  // Get user's existing applications
  const existingApplications = await prisma.application.findMany({
    where: { userId },
    select: { jobId: true },
  });
  const appliedJobIds = new Set(existingApplications.map((a) => a.jobId));

  // Get active jobs
  const jobs = await prisma.job.findMany({
    where: {
      isActive: true,
      id: { notIn: Array.from(appliedJobIds) },
    },
    take: 100,
    orderBy: { postedAt: 'desc' },
  });

  const userSkills = user.profile.skills.map((s) => s.name);
  const minMatchScore = user.jobPreferences.minMatchScore || 50;

  // Calculate matches
  const matches: MatchResult[] = [];
  for (const job of jobs) {
    const { score, reasons } = calculateMatchScore(job, userSkills, user.jobPreferences);
    if (score >= minMatchScore) {
      matches.push({ jobId: job.id, score, reasons });
    }
  }

  // Sort by score and apply top matches
  matches.sort((a, b) => b.score - a.score);
  const toApply = matches.slice(0, applyLimit);

  let applied = 0;
  for (const match of toApply) {
    try {
      await prisma.application.create({
        data: {
          userId,
          jobId: match.jobId,
          status: 'APPLIED',
          appliedAt: new Date(),
          matchScore: match.score,
          matchReasons: match.reasons,
          isAutoApplied: true,
        },
      });
      applied++;
    } catch (err) {
      logger.error(`Failed to auto-apply job ${match.jobId} for user ${userId}:`, err);
    }
  }

  // Update subscription usage
  if (applied > 0 && user.subscription) {
    await prisma.subscription.update({
      where: { id: user.subscription.id },
      data: { autoAppliesUsed: { increment: applied } },
    });
  }

  // Update analytics
  const analytics = await prisma.userAnalytics.findUnique({ where: { userId } });
  if (analytics) {
    await prisma.userAnalytics.update({
      where: { userId },
      data: {
        totalApplications: { increment: applied },
        estimatedTimeSaved: { increment: applied * 0.5 }, // 30 min per application saved
      },
    });
  } else {
    await prisma.userAnalytics.create({
      data: {
        userId,
        totalApplications: applied,
        estimatedTimeSaved: applied * 0.5,
      },
    });
  }

  // Create activity logs
  if (applied > 0) {
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'auto_apply',
        description: `Auto-applied to ${applied} jobs`,
        metadata: { jobCount: applied, matchScores: toApply.map((m) => m.score) },
      },
    });
  }

  logger.info(`Auto-apply completed for user ${userId}: ${applied}/${toApply.length} applications created`);

  return { applied, matches: toApply };
}

/**
 * Run auto-apply for all active users (called by cron job)
 */
export async function runAutoApplyForAllUsers(): Promise<{
  totalUsers: number;
  totalApplied: number;
}> {
  // Find users with auto-apply enabled (for now, all paid users + free users under limit)
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let totalApplied = 0;
  for (const user of users) {
    try {
      const result = await runAutoApplyForUser(user.id, 5);
      totalApplied += result.applied;
    } catch (err) {
      logger.error(`Auto-apply failed for user ${user.id}:`, err);
    }
  }

  logger.info(`Global auto-apply completed: ${totalApplied} applications across ${users.length} users`);
  return { totalUsers: users.length, totalApplied };
}

