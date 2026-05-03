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
  portal: 'OTHER';

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

// Job source integrations
import { fetchRemotiveJobs } from './jobSources/remotive';
import { fetchRemoteOKJobs } from './jobSources/remoteok';
import { fetchArbeitnowJobs } from './jobSources/arbeitnow';
import { fetchAdzunaJobs } from './jobSources/adzuna';
import { fetchUSAJobsJobs } from './jobSources/usajobs';
import { fetchKnownGreenhouseBoards } from './jobSources/greenhouse';
import { fetchKnownLeverBoards } from './jobSources/lever';
import { fetchJoobleJobs } from './jobSources/jooble';

async function fetchJobsFromSource(source: string): Promise<RawJob[]> {
  switch (source) {
    case 'remotive':
      return await fetchRemotiveJobs();
    case 'remoteok':
      return await fetchRemoteOKJobs();
    case 'arbeitnow':
      return await fetchArbeitnowJobs();
    case 'adzuna':
      return await fetchAdzunaJobs({ limit: 100 });
    case 'usajobs':
      return await fetchUSAJobsJobs({ limit: 50 });
    case 'greenhouse':
      return await fetchKnownGreenhouseBoards();
    case 'lever':
      return await fetchKnownLeverBoards();
    case 'jooble':
      return await fetchJoobleJobs({ limit: 50 });
    case 'themuse':
      const { fetchTheMuseJobs } = await import('./jobSources/themuse');
      return await fetchTheMuseJobs();
    case 'indeed':
      const { fetchIndeedJobs } = await import('./jobSources/indeed');
      return await fetchIndeedJobs();
    default:
      logger.warn(`Source ${source} not implemented yet, skipping`);
      return [];
  }
}

// Normalize raw job to Prisma format
export function normalizeJob(raw: RawJob, source: string, portal: 'OTHER'): NormalizedJob {
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

// Portal to source mapping
const PORTAL_SOURCE_MAP: Record<string, string> = {
  'REMOTIVE': 'remotive',
  'REMOTEOK': 'remoteok',
  'ARBEITNOW': 'arbeitnow',
  'ADZUNA': 'adzuna',
  'USAJOBS': 'usajobs',
  'GREENHOUSE': 'greenhouse',
  'LEVER': 'lever',
  'JOOBLE': 'jooble',
  'THEMUSE': 'themuse',
  'INDEED': 'indeed',
  'LINKEDIN': 'linkedin',
};

// User-aware sync - only from connected portals
export async function syncUserJobs(userId: string, limit: number = 200): Promise<{ synced: number; total: number }> {
  logger.info(`Starting user-specific job sync for user ${userId}...`);

  const connections = await prisma.portalConnection.findMany({
    where: { 
      userId,
      isConnected: true 
    },
  });

  if (connections.length === 0) {
    logger.warn(`No connected portals for user ${userId}`);
    return { synced: 0, total: await prisma.job.count({ where: { isActive: true } }) };
  }

  const availableSources = connections
    .map(c => PORTAL_SOURCE_MAP[c.portal])
    .filter(Boolean) as string[];

  if (availableSources.length === 0) {
    logger.warn(`No fetchable sources for user ${userId} portals:`, connections.map(c => c.portal));
    return { synced: 0, total: await prisma.job.count({ where: { isActive: true } }) };
  }

  logger.info(`Syncing from sources: ${availableSources.join(', ')}`);

  const allRawJobs: RawJob[] = [];

  await Promise.all(
    availableSources.map(async (source) => {
      const jobs = await fetchJobsFromSource(source);
      allRawJobs.push(...jobs.map(j => ({ ...j, source })));
    })
  );

  if (allRawJobs.length === 0) {
    logger.warn(`No jobs from sources for user ${userId}`);
    return { synced: 0, total: 0 };
  }

  const normalized = allRawJobs
    .map(raw => normalizeJob(raw, raw.source!, 'OTHER' as const))
    .slice(0, limit);

  const deduped = deduplicateJobs(normalized);
  
const createData = deduped.map(job => ({
    externalId: String(job.externalId),
    portal: 'OTHER' as const,
    title: job.title,
    company: job.company,
    companyLogo: job.companyLogo,
    location: job.location,
    remoteType: job.remoteType,
    description: job.description,
    requirements: '', 
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
    skipDuplicates: true
  });

  await prisma.$executeRaw`UPDATE "Job" SET "lastSyncedAt" = NOW() WHERE "lastSyncedAt" IS NULL OR "lastSyncedAt" < NOW() - INTERVAL '24 hours'`;

  const total = await prisma.job.count({ where: { isActive: true } });
  logger.info(`User ${userId} sync complete: ${deduped.length} jobs, total active: ${total}`);

  return { synced: deduped.length, total };
}

export async function syncJobs(limit: number = 200): Promise<{ synced: number; total: number }> {
  logger.warn('Global syncJobs called - use syncUserJobs instead');
  return await syncUserJobs('GLOBAL_FALLBACK', limit);
}
