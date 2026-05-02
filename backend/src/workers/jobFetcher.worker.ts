// backend/src/workers/jobFetcher.worker.ts
import { Worker, Job } from 'bullmq';
import { redisConnection, JobFetchData, QUEUE_NAMES } from './queues';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { JobPortal } from '@prisma/client';

// Import REAL job fetchers from jobSources
import { fetchRemotiveJobs } from '../services/jobSources/remotive';
import { fetchRemoteOKJobs } from '../services/jobSources/remoteok';
import { fetchArbeitnowJobs } from '../services/jobSources/arbeitnow';
import { fetchAdzunaJobs } from '../services/jobSources/adzuna';
import { fetchUSAJobsJobs } from '../services/jobSources/usajobs';
import { fetchKnownGreenhouseBoards } from '../services/jobSources/greenhouse';
import { fetchKnownLeverBoards } from '../services/jobSources/lever';
import { fetchJoobleJobs } from '../services/jobSources/jooble';

export interface RawJob {
  externalId:   string;
  portal:       JobPortal;
  title:        string;
  company:      string;
  location:     string;
  description:  string;
  applyUrl:     string;
  salaryMin?:   number;
  salaryMax?:   number;
  jobType?:     string;
  skills?:      string[];
  postedAt?:    Date;
}

// Map portal names to real fetcher functions
const PORTAL_MAP: Record<string, () => Promise<RawJob[]>> = {
  remotive:   async () => {
    const jobs = await fetchRemotiveJobs();
    return jobs.map(j => ({
      externalId: j.id,
      portal: JobPortal.REMOTIVE,
      title: j.title,
      company: j.company,
      location: j.location || 'Remote',
      description: j.description,
      applyUrl: j.url,
      salaryMin: j.salary_min,
      salaryMax: j.salary_max,
      jobType: j.tags?.join(', '),
      skills: j.tags,
      postedAt: j.published_at ? new Date(j.published_at) : new Date(),
    }));
  },
  
  remoteok:   async () => {
    const jobs = await fetchRemoteOKJobs();
    return jobs.map(j => ({
      externalId: j.id,
      portal: JobPortal.REMOTEOK,
      title: j.title,
      company: j.company,
      location: j.location || 'Remote',
      description: j.description,
      applyUrl: j.url,
      salaryMin: j.salary_min,
      salaryMax: j.salary_max,
      jobType: j.tags?.join(', '),
      skills: j.tags,
      postedAt: j.published_at ? new Date(j.published_at) : new Date(),
    }));
  },
  
  arbeitnow:  async () => {
    const jobs = await fetchArbeitnowJobs();
    return jobs.map(j => ({
      externalId: j.id,
      portal: JobPortal.ARBEITNOW,
      title: j.title,
      company: j.company,
      location: j.location || 'Remote',
      description: j.description,
      applyUrl: j.url,
      jobType: j.tags?.join(', '),
      skills: j.tags,
      postedAt: j.published_at ? new Date(j.published_at) : new Date(),
    }));
  },
  
  adzuna:     async () => {
    const jobs = await fetchAdzunaJobs({ limit: 50 });
    return jobs.map(j => ({
      externalId: j.id,
      portal: JobPortal.ADZUNA,
      title: j.title,
      company: j.company,
      location: j.location || '',
      description: j.description,
      applyUrl: j.url,
      salaryMin: j.salary_min,
      salaryMax: j.salary_max,
      jobType: j.tags?.join(', '),
      skills: j.tags,
      postedAt: j.published_at ? new Date(j.published_at) : new Date(),
    }));
  },
  
  usajobs:    async () => {
    const jobs = await fetchUSAJobsJobs({ limit: 50 });
    return jobs.map(j => ({
      externalId: j.id,
      portal: JobPortal.USAJOBS,
      title: j.title,
      company: j.company,
      location: j.location || '',
      description: j.description,
      applyUrl: j.url,
      jobType: j.category,
      skills: j.tags,
      postedAt: j.published_at ? new Date(j.published_at) : new Date(),
    }));
  },
  
  greenhouse: async () => {
    const jobs = await fetchKnownGreenhouseBoards();
    return jobs.map(j => ({
      externalId: j.id,
      portal: JobPortal.GREENHOUSE,
      title: j.title,
      company: j.company,
      location: j.location || '',
      description: j.description,
      applyUrl: j.url,
      skills: j.tags,
      postedAt: j.published_at ? new Date(j.published_at) : new Date(),
    }));
  },
  
  lever:      async () => {
    const jobs = await fetchKnownLeverBoards();
    return jobs.map(j => ({
      externalId: j.id,
      portal: JobPortal.LEVER,
      title: j.title,
      company: j.company,
      location: j.location || '',
      description: j.description,
      applyUrl: j.url,
      skills: j.tags,
      postedAt: j.published_at ? new Date(j.published_at) : new Date(),
    }));
  },
  
  jooble:     async () => {
    const jobs = await fetchJoobleJobs({ limit: 50 });
    return jobs.map(j => ({
      externalId: j.id,
      portal: JobPortal.JOOBLE,
      title: j.title,
      company: j.company,
      location: j.location || '',
      description: j.description,
      applyUrl: j.url,
      salaryMin: j.salary_min,
      salaryMax: j.salary_max,
      skills: j.tags,
      postedAt: j.published_at ? new Date(j.published_at) : new Date(),
    }));
  },
};

const worker = new Worker<JobFetchData>(
  QUEUE_NAMES.JOB_FETCH,
  async (job: Job<JobFetchData>) => {
    const { portal } = job.data;
    const startMs = Date.now();
    logger.info(`[JobFetcher] Starting fetch for portal: ${portal}`);

    const fetcher = PORTAL_MAP[portal];
    if (!fetcher) {
      logger.warn(`[JobFetcher] No fetcher for portal: ${portal}, skipping`);
      return { portal, total: 0, skipped: true };
    }

    let rawJobs: RawJob[] = [];
    try {
      rawJobs = await fetcher();
      logger.info(`[JobFetcher] ${portal}: fetched ${rawJobs.length} raw jobs`);
    } catch (err: any) {
      logger.error(`[JobFetcher] Error fetching from ${portal}:`, err.message);
      throw err;
    }

    let created = 0, updated = 0;
    for (const raw of rawJobs) {
      try {
        // Cast portal to JobPortal enum as required
        const portalEnum = raw.portal as JobPortal;

        await prisma.job.upsert({
          where:  { externalId: raw.externalId },
          create: {
            externalId: raw.externalId, 
            portal: portalEnum, 
            title: raw.title,
            company: raw.company, 
            location: raw.location ?? '', 
            description: raw.description,
            applyUrl: raw.applyUrl, 
            // originalUrl is REQUIRED per schema - use applyUrl
            originalUrl: raw.applyUrl, 
            // Use salaryMin/salaryMax
            salaryMin: raw.salaryMin,
            salaryMax: raw.salaryMax,
            skillsRequired: raw.skills ?? [], 
            postedAt: raw.postedAt ?? new Date(), 
            isActive: true,
          },
          update: {
            title: raw.title, 
            company: raw.company, 
            location: raw.location ?? '',
            description: raw.description, 
            applyUrl: raw.applyUrl, 
            // Use salaryMin/salaryMax
            salaryMin: raw.salaryMin,
            salaryMax: raw.salaryMax,
            skillsRequired: raw.skills ?? [], 
            isActive: true, 
            updatedAt: new Date(),
          },
        });
        created++;
      } catch (err) {
        logger.warn(`[JobFetcher] Could not upsert job ${raw.externalId}: ${err}`);
        updated++;
      }
    }

    const durationMs = Date.now() - startMs;
    logger.info(`[JobFetcher] ${portal}: ${rawJobs.length} jobs in ${durationMs}ms (created: ${created}, updated: ${updated})`);
    return { portal, total: rawJobs.length, created, updated, durationMs };
  },
  { connection: redisConnection, concurrency: 4 }
);

worker.on('completed', (job, result) => logger.info(`[JobFetcher] ${job.id} done`, result));
worker.on('failed',    (job, err)    => logger.error(`[JobFetcher] ${job?.id} failed: ${err.message}`));

export default worker;
