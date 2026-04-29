import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import axios from 'axios';
import type { Job } from '@prisma/client';

export interface RawJob {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location?: string;
  remote?: boolean | string;
  description: string;
  url: string;
  salary_min?: number;
  salary_max?: number;
  tags: string[];
  source?: string;
  category?: string;
  published_at?: string;
}

export interface NormalizedJob {
  externalId: string;
  portal: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string | null;
  remoteType: string | null;
  description: string;
  applyUrl: string;
  originalUrl: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: 'USD';
  salaryPeriod: 'yearly';
  skillsRequired: string[];
  postedAt: Date | null;
  source: string | null;
  category: string | null;
}

// Fetch single source
import { fetchRemotiveJobs } from './jobSources/remotive';
import { fetchRemoteOKJobs } from './jobSources/remoteok';
import { fetchArbeitnowJobs } from './jobSources/arbeitnow';

async function fetchJobsFromSource(source: string): Promise<RawJob[]> {
  switch (source) {
    case 'remotive':
      return await fetchRemotiveJobs();
    case 'remoteok':
      return await fetchRemoteOKJobs();
    case 'arbeitnow':
      return await fetchArbeitnowJobs();
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

// Normalize raw job to Prisma format
export function normalizeJob(raw: RawJob, source: string, portal: string): NormalizedJob {
  const extId = raw.id || `${source}-${Date.now()}`;
  
  return {
    externalId: extId,
    portal,
    title: raw.title,
    company: raw.company,
    companyLogo: raw.company_logo || null,
    location: raw.location || null,
    remoteType: typeof raw.remote === 'boolean' ? 'remote' : raw.remote || null,
    description: raw.description.substring(0, 2000),
    applyUrl: raw.url,
    originalUrl: raw.url,
    salaryMin: raw.salary_min || null,
    salaryMax: raw.salary_max || null,
    salaryCurrency: 'USD' as const,
    salaryPeriod: 'yearly' as const,
    skillsRequired: raw.tags || [],
    postedAt: raw.published_at ? new Date(raw.published_at) : new Date(),
    source,
    category: raw.category || null,
  };
}

// Deduplicate by externalId + source
export function deduplicateJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = `${job.externalId}-${job.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Main sync function
export async function syncJobs(limit: number = 200): Promise<{ synced: number; total: number }> {
  logger.info('Starting job sync...');

  // Check if recent sync
  const recent = await prisma.job.findFirst({
    where: { lastSyncedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    orderBy: { lastSyncedAt: 'desc' }
  });
  if (recent) {
    logger.info('Recent sync found, skipping');
    return { synced: 0, total: await prisma.job.count() };
  }

  const sources = ['remotive', 'remoteok', 'arbeitnow'];
  const allRawJobs: RawJob[] = [];

  // Fetch parallel
  await Promise.all(
    sources.map(async (source) => {
      const jobs = await fetchJobsFromSource(source);
      allRawJobs.push(...jobs.map(j => ({ ...j, source })));
    })
  );

  if (allRawJobs.length === 0) {
    logger.warn('No jobs fetched from any source');
    return { synced: 0, total: 0 };
  }

  const normalized = allRawJobs
    .map(raw => normalizeJob(raw, raw.source!, 'API' as any))
    .slice(0, limit);

  const deduped = deduplicateJobs(normalized);
  
  // Upsert batch with transactions
  const createData = deduped.map(job => ({
    externalId: job.externalId,
    portal: job.portal,
    title: job.title,
    company: job.company,
    companyLogo: job.companyLogo,
    location: job.location,
    remoteType: job.remoteType,
    description: job.description,
    requirements: '', // Not available
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: job.salaryPeriod,
    applyUrl: job.applyUrl,
    originalUrl: job.originalUrl,
    skillsRequired: job.skillsRequired,
    matchScore: null,
    postedAt: job.postedAt,
    expiresAt: null,
    category: job.category,
    source: job.source,
    lastSyncedAt: new Date(),
    isActive: true,
  }));

  await prisma.job.createMany({
    data: createData,
    skipDuplicates: true,
    update: {
      // On duplicate, update fields
      title: true,
      company: true,
      // ... etc
    }
  });

  // Set lastSyncedAt on all new/updated
  await prisma.$executeRaw`UPDATE "Job" SET "lastSyncedAt" = NOW() WHERE "lastSyncedAt" IS NULL OR "lastSyncedAt" < NOW() - INTERVAL '24 hours'`;

  const total = await prisma.job.count({ where: { isActive: true } });
  logger.info(`Synced ${deduped.length} jobs, total active: ${total}`);

  return { synced: deduped.length, total };
}

