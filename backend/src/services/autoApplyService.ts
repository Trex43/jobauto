// backend/src/services/autoApplyService.ts
import { prisma }        from '../utils/prisma';
import { logger }        from '../utils/logger';
import { autoApplyQueue, coverLetterQueue, CoverLetterData, AutoApplyData } from '../workers/queues';

function detectApplyMethod(portal: string, applyUrl: string) {
  if (portal === 'greenhouse') return 'API';
  if (portal === 'lever')      return 'API';
  if (applyUrl.includes('mailto:')) return 'EMAIL';
  return 'FORM';
}

export async function queueAutoApply(opts: { userId: string; jobId: string; priority?: number; requireCoverLetter?: boolean }) {
  const { userId, jobId, priority = 5, requireCoverLetter = true } = opts;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`Job not found: ${jobId}`);

  const existing = await prisma.application.findUnique({ where: { userId_jobId: { userId, jobId } } });
  if (existing) { logger.info(`Already applied to ${jobId}`); return null; }

  const existingQueue = await prisma.autoApplyJob.findFirst({ where: { userId, jobId, status: { in: ['PENDING', 'PROCESSING'] } } });
  if (existingQueue) return existingQueue;

  const applyMethod = detectApplyMethod(job.portal, job.applyUrl);

  const autoApplyJob = await prisma.autoApplyJob.create({
    data: { userId, jobId, status: 'PENDING', applyMethod },
  });

  if (requireCoverLetter && process.env.OPENAI_API_KEY) {
    await coverLetterQueue.add(`cover-${autoApplyJob.id}`, { userId, jobId, autoApplyJobId: autoApplyJob.id } satisfies CoverLetterData, { priority });
  } else {
    await autoApplyQueue.add(`apply-${autoApplyJob.id}`, { autoApplyJobId: autoApplyJob.id, userId, jobId, priority } satisfies AutoApplyData, { priority });
  }

  logger.info(`[AutoApplyService] Queued: ${autoApplyJob.id}`);
  return autoApplyJob;
}

export async function bulkQueueAutoApply(userId: string) {
  const settings = await prisma.userAutoApplySettings.findUnique({ where: { userId } });
  if (!settings?.isEnabled) throw new Error('Auto-apply is not enabled for this user');

  const applications = await prisma.application.findMany({ where: { userId }, select: { jobId: true } });
  const appliedJobIds = applications.map((a) => a.jobId);

  const candidateJobs = await prisma.job.findMany({
    where: { id: { notIn: appliedJobIds }, isActive: true, postedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    take: settings.dailyLimit * 2,
    orderBy: { postedAt: 'desc' },
  });

  const remaining = settings.dailyLimit - settings.appliedTodayCount;
  const toApply = candidateJobs.slice(0, remaining);

  const queued: typeof toApply = [];
  for (const job of toApply) {
    const autoApplyJob = await queueAutoApply({ userId, jobId: job.id });
    if (autoApplyJob) queued.push(autoApplyJob);
  }
  return queued;
}

export async function cancelAutoApply(autoApplyJobId: string, userId: string) {
  const job = await prisma.autoApplyJob.findUnique({ where: { id: autoApplyJobId } });
  if (!job) throw new Error('Not found');
  if (job.userId !== userId) throw new Error('Unauthorized');
  if (job.status === 'PROCESSING') throw new Error('Cannot cancel a job in progress');
  await prisma.autoApplyJob.update({ where: { id: autoApplyJobId }, data: { status: 'FAILED', errorMessage: 'Cancelled by user' } });
}

export async function getAutoApplyStats(userId: string) {
  const [total, byStatus, settings] = await Promise.all([
    prisma.autoApplyJob.count({ where: { userId } }),
    prisma.autoApplyJob.groupBy({ by: ['status'], where: { userId }, _count: { id: true } }),
    prisma.userAutoApplySettings.findUnique({ where: { userId } }),
  ]);
  const stats: Record<string, number> = {};
  for (const row of byStatus) stats[row.status] = row._count.id;
  return { total, byStatus: stats, todayCount: settings?.appliedTodayCount ?? 0, dailyLimit: settings?.dailyLimit ?? 20, isEnabled: settings?.isEnabled ?? false };
}
