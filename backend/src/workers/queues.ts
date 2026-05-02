// backend/src/workers/queues.ts
import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const QUEUE_NAMES = {
  JOB_FETCH:    'job-fetch',
  AUTO_APPLY:   'auto-apply',
  COVER_LETTER: 'cover-letter',
  NOTIFY:       'notify',
} as const;

export const jobFetchQueue = new Queue(QUEUE_NAMES.JOB_FETCH, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 500 },
  },
});

export const autoApplyQueue = new Queue(QUEUE_NAMES.AUTO_APPLY, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: { count: 500 },
    removeOnFail:     { count: 1000 },
  },
});

export const coverLetterQueue = new Queue(QUEUE_NAMES.COVER_LETTER, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 3000 },
    removeOnComplete: { count: 200 },
    removeOnFail:     { count: 200 },
  },
});

export const notifyQueue = new Queue(QUEUE_NAMES.NOTIFY, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 200 },
  },
});

export const autoApplyQueueEvents = new QueueEvents(QUEUE_NAMES.AUTO_APPLY, {
  connection: redisConnection,
});

export interface JobFetchData {
  portal: string;
  keywords?: string[];
  location?: string;
  forced?: boolean;
}

export interface AutoApplyData {
  autoApplyJobId: string;
  userId: string;
  jobId: string;
  priority: number;
}

export interface CoverLetterData {
  userId: string;
  jobId: string;
  autoApplyJobId: string;
}

export interface NotifyData {
  userId: string;
  type: 'apply_success' | 'apply_failed' | 'daily_summary' | 'match_found';
  payload: Record<string, unknown>;
}

export async function scheduleRecurringJobs() {
  const portals = ['remotive', 'remoteok', 'arbeitnow', 'adzuna', 'usajobs', 'greenhouse', 'lever', 'jooble'];
  for (const portal of portals) {
    await jobFetchQueue.add(
      `fetch-${portal}`,
      { portal } satisfies JobFetchData,
      {
        repeat: { pattern: '0 * * * *' },
        jobId:  `recurring-fetch-${portal}`,
      }
    );
  }
  console.log('[Queues] Recurring job fetch scheduled for', portals.length, 'portals');
}

export { redisConnection };
