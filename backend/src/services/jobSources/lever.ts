/**
 * Lever API Integration
 * For public company boards
 * Docs: https://developers.lever.co/
 */

import axios from 'axios';
import type { RawJob } from '../jobAggregator';

interface LeverJob {
  id: string;
  text: string;
  descriptionPlain: string;
  hostedUrl: string;
  categories: {
    team?: string;
    location?: string;
    commitment?: string;
    department?: string;
  };
  createdAt: number;
}

interface LeverBoardResponse {
  jobs: LeverJob[];
}

function parseDescription(description?: string): string {
  if (!description) return '';
  return description.replace(/<[^>]*>/g, '').substring(0, 2000);
}

function mapRemoteType(location?: string, commitment?: string): boolean | undefined {
  const text = `${location} ${commitment}`.toLowerCase();
  if (text.includes('remote') || text.includes('virtual')) return true;
  return undefined;
}

export async function fetchLeverJobs(companyBoardUrl: string): Promise<RawJob[]> {
  try {
    const url = companyBoardUrl.replace(/\/$/, '') + '/api/v0/postings';
    
    const { data } = await axios.get<LeverBoardResponse>(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'JobAuto/1.0' },
    });

    if (!data?.jobs) return [];

    return data.jobs.map((job: LeverJob) => {
      const team = job.categories?.team || '';
      const dept = job.categories?.department || '';
      const comm = job.categories?.commitment || '';
      return {
        id: `lever-${job.id}`,
        title: job.text,
        company: companyBoardUrl.split('//')[1]?.split('.')[0] || 'Company',
        location: job.categories?.location || 'Remote',
        remote: mapRemoteType(job.categories?.location, comm),
        description: parseDescription(job.descriptionPlain),
        url: job.hostedUrl,
        tags: [team, dept, comm].filter((t): t is string => Boolean(t)),
        source: 'lever',
        category: team,
        published_at: new Date(job.createdAt).toISOString(),
      };
    });
  } catch (error) {
    console.error(`Lever fetch error for ${companyBoardUrl}:`, error);
    return [];
  }
}

export async function fetchKnownLeverBoards(): Promise<RawJob[]> {
  const DEMO_BOARDS = [
    'https://jobs.lever.co/coinbase',
    'https://jobs.lever.co/notion',
    'https://jobs.lever.co/figma',
  ];

  let allJobs: RawJob[] = [];
  for (const board of DEMO_BOARDS.slice(0, 2)) {
    const jobs = await fetchLeverJobs(board);
    allJobs.push(...jobs);
  }

  const seen = new Set<string>();
  return allJobs.filter(job => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });
}

export default fetchKnownLeverBoards;
