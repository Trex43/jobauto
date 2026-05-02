// backend/src/workers/jobFetcher.worker.ts
import { Worker, Job } from 'bullmq';
import { redisConnection, JobFetchData, QUEUE_NAMES } from './queues';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export interface RawJob {
  externalId:   string;
  portal:       string;
  title:        string;
  company:      string;
  location:     string;
  description:  string;
  applyUrl:     string;
  salary?:      string;
  jobType?:     string;
  skills?:      string[];
  postedAt?:    Date;
}

// ---------------------------------------------------------------------------
// Stub fetchers — replace these imports with your real portal service files
// ---------------------------------------------------------------------------
async function stubFetcher(portal: string): Promise<RawJob[]> {
  // Replace this with your real portal fetchers from backend/src/services/portals/
  console.log(`[JobFetcher] Fetching from ${portal} (stub — wire up real fetcher)`);
  return [];
}

const PORTAL_MAP: Record<string, () => Promise<RawJob[]>> = {
  remotive:   () => stubFetcher('remotive'),
  remoteok:   () => stubFetcher('remoteok'),
  arbeitnow:  () => stubFetcher('arbeitnow'),
  adzuna:     () => stubFetcher('adzuna'),
  usajobs:    () => stubFetcher('usajobs'),
  greenhouse: () => stubFetcher('greenhouse'),
  lever:      () => stubFetcher('lever'),
  jooble:     () => stubFetcher('jooble'),
};

const worker = new Worker<JobFetchData>(
  QUEUE_NAMES.JOB_FETCH,
  async (job: Job<JobFetchData>) => {
    const { portal } = job.data;
    const startMs = Date.now();
    logger.info(`[JobFetcher] Starting fetch for portal: ${portal}`);

    const fetcher = PORTAL_MAP[portal];
    if (!fetcher) throw new Error(`Unknown portal: ${portal}`);

    await upsertPortalHealth(portal, { checking: true });

    let rawJobs: RawJob[] = [];
    try {
      rawJobs = await fetcher();
    } catch (err: any) {
      await upsertPortalHealth(portal, { isHealthy: false, errorMessage: err.message });
      throw err;
    }

    let created = 0, updated = 0;
    for (const raw of rawJobs) {
      await prisma.job.upsert({
        where:  { portal_externalId: { portal: raw.portal, externalId: raw.externalId } },
        create: {
          externalId: raw.externalId, portal: raw.portal, title: raw.title,
          company: raw.company, location: raw.location, description: raw.description,
          applyUrl: raw.applyUrl, salary: raw.salary, jobType: raw.jobType,
          skills: raw.skills ?? [], postedAt: raw.postedAt ?? new Date(), isActive: true,
        },
        update: {
          title: raw.title, company: raw.company, location: raw.location,
          description: raw.description, applyUrl: raw.applyUrl, salary: raw.salary,
          skills: raw.skills ?? [], isActive: true, updatedAt: new Date(),
        },
      });
      created++;
    }

    const durationMs = Date.now() - startMs;
    await upsertPortalHealth(portal, { isHealthy: true, avgResponseMs: durationMs });
    logger.info(`[JobFetcher] ${portal}: ${rawJobs.length} jobs in ${durationMs}ms`);
    return { portal, total: rawJobs.length, durationMs };
  },
  { connection: redisConnection, concurrency: 4 }
);

async function upsertPortalHealth(portalName: string, data: any) {
  const now = new Date();
  await prisma.portalHealth.upsert({
    where:  { portalName },
    create: {
      portalName, isHealthy: data.isHealthy ?? true, lastCheckedAt: now,
      failureCount: data.isHealthy === false ? 1 : 0, errorMessage: data.errorMessage,
      avgResponseMs: data.avgResponseMs,
    },
    update: {
      lastCheckedAt: now,
      ...(data.isHealthy === true  && { isHealthy: true,  lastSuccessAt: now, failureCount: 0, errorMessage: null }),
      ...(data.isHealthy === false && { isHealthy: false, lastFailureAt: now, failureCount: { increment: 1 }, errorMessage: data.errorMessage }),
      ...(data.avgResponseMs       && { avgResponseMs: data.avgResponseMs }),
    },
  });
}

worker.on('completed', (job, result) => logger.info(`[JobFetcher] ${job.id} done`, result));
worker.on('failed',    (job, err)    => logger.error(`[JobFetcher] ${job?.id} failed: ${err.message}`));

export default worker;
