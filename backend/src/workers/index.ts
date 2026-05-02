// backend/src/workers/index.ts
import { scheduleRecurringJobs } from './queues';
import { logger } from '../utils/logger';

export async function startWorkers() {
  logger.info('[Workers] Starting all background workers...');

  const [
    { default: jobFetcherWorker },
    { default: autoApplierWorker },
    { default: coverLetterWorker },
    { default: notifyWorker },
  ] = await Promise.all([
    import('./jobFetcher.worker'),
    import('./autoApplier.worker'),
    import('./coverLetter.worker'),
    import('./notify.worker'),
  ]);

  await scheduleRecurringJobs();
  logger.info('[Workers] All workers started');

  const shutdown = async () => {
    logger.info('[Workers] Shutting down...');
    await Promise.all([
      jobFetcherWorker.close(),
      autoApplierWorker.close(),
      coverLetterWorker.close(),
      notifyWorker.close(),
    ]);
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT',  shutdown);
}
