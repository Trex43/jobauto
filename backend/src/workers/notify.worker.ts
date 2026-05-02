// backend/src/workers/notify.worker.ts
import { Worker, Job } from 'bullmq';
import { redisConnection, NotifyData, QUEUE_NAMES } from './queues';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const worker = new Worker<NotifyData>(
  QUEUE_NAMES.NOTIFY,
  async (job: Job<NotifyData>) => {
    const { userId, type, payload } = job.data;
    
    // Use select with proper fields
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { email: true, firstName: true, lastName: true } 
    });
    if (!user) return;

    // Replace user.name with firstName + lastName
    const userName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

    if (type === 'apply_success') {
      await resend.emails.send({
        from: 'JobAuto <notifications@jobauto.com>', to: user.email,
        subject: `Applied to ${payload.jobTitle} at ${payload.company}`,
        html: `<h2>Application submitted!</h2><p>Hi ${userName}, we applied to <strong>${payload.jobTitle}</strong> at <strong>${payload.company}</strong> on your behalf.</p>`,
      });
    }
    if (type === 'apply_failed') {
      await resend.emails.send({
        from: 'JobAuto <notifications@jobauto.com>', to: user.email,
        subject: `Could not apply to ${payload.jobTitle}`,
        html: `<h2>Application failed</h2><p>We could not apply to <strong>${payload.jobTitle}</strong>. Reason: ${payload.errorMessage}</p>`,
      });
    }
    if (type === 'daily_summary') {
      // Use aggregate queries instead of groupBy to avoid typing issues
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Get counts for each status using separate queries
      const [completedCount, pendingCount, failedCount] = await Promise.all([
        prisma.autoApplyJob.count({ where: { userId, status: 'COMPLETED', updatedAt: { gte: yesterday } } }),
        prisma.autoApplyJob.count({ where: { userId, status: 'PENDING', updatedAt: { gte: yesterday } } }),
        prisma.autoApplyJob.count({ where: { userId, status: 'FAILED', updatedAt: { gte: yesterday } } }),
      ]);

      await resend.emails.send({
        from: 'JobAuto <notifications@jobauto.com>', to: user.email,
        subject: 'Your JobAuto daily summary',
        html: `<h2>Daily Summary</h2><ul><li>Applied: ${completedCount}</li><li>Pending: ${pendingCount}</li><li>Failed: ${failedCount}</li></ul>`,
      });
    }

    logger.info(`[Notify] Sent ${type} to ${user.email}`);
  },
  { connection: redisConnection, concurrency: 10 }
);

worker.on('failed', (job, err) => logger.error(`[Notify] ${job?.id} failed: ${err.message}`));
export default worker;
