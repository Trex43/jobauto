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
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!user) return;

    if (type === 'apply_success') {
      await resend.emails.send({
        from: 'JobAuto <notifications@jobauto.com>', to: user.email,
        subject: `Applied to ${payload.jobTitle} at ${payload.company}`,
        html: `<h2>Application submitted!</h2><p>Hi ${user.name}, we applied to <strong>${payload.jobTitle}</strong> at <strong>${payload.company}</strong> on your behalf.</p>`,
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
      const stats = await prisma.autoApplyJob.groupBy({
        by: ['status'], where: { userId, updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, _count: { status: true },
      });
      const s: any = {};
      stats.forEach(r => s[r.status] = r._count.status);
      await resend.emails.send({
        from: 'JobAuto <notifications@jobauto.com>', to: user.email,
        subject: 'Your JobAuto daily summary',
        html: `<h2>Daily Summary</h2><ul><li>Applied: ${s.SUCCESS ?? 0}</li><li>Queued: ${s.QUEUED ?? 0}</li><li>Failed: ${s.FAILED ?? 0}</li></ul>`,
      });
    }

    logger.info(`[Notify] Sent ${type} to ${user.email}`);
  },
  { connection: redisConnection, concurrency: 10 }
);

worker.on('failed', (job, err) => logger.error(`[Notify] ${job?.id} failed: ${err.message}`));
export default worker;
