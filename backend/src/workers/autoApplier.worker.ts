// backend/src/workers/autoApplier.worker.ts
import { Worker, Job } from 'bullmq';
import { redisConnection, AutoApplyData, QUEUE_NAMES, notifyQueue } from './queues';
import { prisma }  from '../utils/prisma';
import { logger }  from '../utils/logger';
import { AutoApplyStatus } from '@prisma/client';

const worker = new Worker<AutoApplyData>(
  QUEUE_NAMES.AUTO_APPLY,
  async (job: Job<AutoApplyData>) => {
    const { autoApplyJobId, userId, jobId } = job.data;
    const startMs = Date.now();

    const [autoApplyJob, jobRecord, settings] = await Promise.all([
      prisma.autoApplyJob.findUnique({ where: { id: autoApplyJobId } }),
      prisma.job.findUnique({ where: { id: jobId } }),
      prisma.userAutoApplySettings.findUnique({ where: { userId } }),
    ]);

    if (!autoApplyJob || !jobRecord) throw new Error(`Not found: ${autoApplyJobId}`);

    if (['SUCCESS', 'SKIPPED'].includes(autoApplyJob.status)) {
      return { skipped: true };
    }

    // Daily limit check
    if (settings) {
      const resetNeeded = isNewDay(settings.lastResetAt);
      if (resetNeeded) {
        await prisma.userAutoApplySettings.update({
          where: { userId },
          data:  { appliedTodayCount: 0, lastResetAt: new Date() },
        });
      } else if (settings.appliedTodayCount >= settings.dailyLimit) {
        await prisma.autoApplyJob.update({ where: { id: autoApplyJobId }, data: { status: 'SKIPPED', errorMessage: 'Daily limit reached' } });
        return { skipped: true, reason: 'daily_limit_reached' };
      }

      // Blacklist check
      if (settings.blacklistedCompanies.some((c: string) => jobRecord.company.toLowerCase().includes(c.toLowerCase()))) {
        await prisma.autoApplyJob.update({ where: { id: autoApplyJobId }, data: { status: 'SKIPPED', errorMessage: `Blacklisted: ${jobRecord.company}` } });
        return { skipped: true, reason: 'blacklisted' };
      }
    }

    // Mark in progress
    await prisma.autoApplyJob.update({ where: { id: autoApplyJobId }, data: { status: 'IN_PROGRESS', startedAt: new Date() } });
    await prisma.autoApplyLog.create({ data: { autoApplyJobId, attempt: autoApplyJob.attemptCount + 1, status: 'IN_PROGRESS', message: 'Starting application' } });

    let externalAppId: string | undefined;
    try {
      externalAppId = await applyToJob({ method: autoApplyJob.applyMethod, jobRecord, userId, coverLetter: autoApplyJob.coverLetter ?? undefined });
    } catch (err: any) {
      const isRetryable = autoApplyJob.attemptCount + 1 < autoApplyJob.maxAttempts;
      await prisma.autoApplyJob.update({
        where: { id: autoApplyJobId },
        data: { status: isRetryable ? 'QUEUED' : 'FAILED', attemptCount: { increment: 1 }, errorMessage: err.message },
      });
      await prisma.autoApplyLog.create({ data: { autoApplyJobId, attempt: autoApplyJob.attemptCount + 1, status: isRetryable ? 'QUEUED' : 'FAILED', message: err.message } });
      if (!isRetryable) {
        await notifyQueue.add('notify', { userId, type: 'apply_failed', payload: { jobTitle: jobRecord.title, company: jobRecord.company, errorMessage: err.message } });
      }
      throw err;
    }

    // SUCCESS
    await prisma.$transaction([
      prisma.autoApplyJob.update({
        where: { id: autoApplyJobId },
        data: { status: 'SUCCESS', completedAt: new Date(), externalAppId, attemptCount: { increment: 1 } },
      }),
      prisma.application.upsert({
        where:  { userId_jobId: { userId, jobId } },
        create: { userId, jobId, status: 'APPLIED', appliedAt: new Date(), coverLetter: autoApplyJob.coverLetter, source: 'AUTO' },
        update: { status: 'APPLIED', appliedAt: new Date() },
      }),
      ...(settings ? [prisma.userAutoApplySettings.update({ where: { userId }, data: { appliedTodayCount: { increment: 1 } } })] : []),
    ]);

    await prisma.autoApplyLog.create({ data: { autoApplyJobId, attempt: autoApplyJob.attemptCount + 1, status: 'SUCCESS', message: `Applied successfully`, details: { durationMs: Date.now() - startMs } } });
    await notifyQueue.add('notify', { userId, type: 'apply_success', payload: { jobTitle: jobRecord.title, company: jobRecord.company, applyUrl: jobRecord.applyUrl, externalAppId } });

    logger.info(`[AutoApply] SUCCESS: ${jobRecord.title} @ ${jobRecord.company}`);
    return { success: true, externalAppId };
  },
  { connection: redisConnection, concurrency: 3, limiter: { max: 10, duration: 60_000 } }
);

async function applyToJob(opts: { method: any; jobRecord: any; userId: string; coverLetter?: string }): Promise<string | undefined> {
  const { method, jobRecord, userId, coverLetter } = opts;
  // For now, log the application — wire up real strategies per portal
  logger.info(`[AutoApply] Applying via ${method} to ${jobRecord.applyUrl}`);
  // TODO: import and call greenhouseApply, leverApply, webFormApply, emailApply
  return `applied-${Date.now()}`;
}

function isNewDay(lastReset: Date): boolean {
  const now = new Date(), reset = new Date(lastReset);
  return now.getDate() !== reset.getDate() || now.getMonth() !== reset.getMonth() || now.getFullYear() !== reset.getFullYear();
}

worker.on('completed', (job, result) => logger.info(`[AutoApply] ${job.id} done`, result));
worker.on('failed',    (job, err)    => logger.error(`[AutoApply] ${job?.id} failed: ${err.message}`));
worker.on('stalled',   (jobId)      => logger.warn(`[AutoApply] ${jobId} stalled`));

export default worker;
