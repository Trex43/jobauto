/**
 * Greenhouse Board API Integration
 * For public company boards
 * Docs: https://developers.greenhouse.io/
 */

import axios from 'axios';
import type { RawJob } from '../jobAggregator';

interface GreenhouseBoardJob {
  id: number;
  internal_job_id: number;
  title: string;
  location: { name: string };
  updated_at: string;
  job_url: string;
  content?: string;
  content_by?: string;
  departments?: Array<{ id: number; name: string }>;
  offices?: Array<{ id: number; name: string }>;
}

function parseContent(content?: string): string {
  if (!content) return '';
  // Remove HTML tags
  return content.replace(/<[^>]*>/g, '').substring(0, 2000);
}

export async function fetchGreenhouseJobs(companyBoardUrl: string): Promise<RawJob[]> {
  try {
    // Example: https://boards.greenhouse.ioairbnb
    const url = companyBoardUrl.replace(/\/$/, '') + '/api/v1/jobs';
    
    const { data } = await axios.get<{ jobs: GreenhouseBoardJob[] }>(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'JobAuto/1.0' },
    });

    if (!data?.jobs) return [];

    return data.jobs.map((job: GreenhouseBoardJob) => ({
      id: `gh-${job.id}`,
      title: job.title,
      company: companyBoardUrl.split('//')[1]?.split('.')[0] || 'Company',
      location: job.location?.name || 'Remote',
      remote: job.location?.name?.toLowerCase().includes('remote') ? true : undefined,
      description: parseContent(job.content),
      url: job.job_url,
      tags: job.departments?.map(d => d.name) || [],
      source: 'greenhouse',
      published_at: job.updated_at,
    }));
  } catch (error) {
    console.error(`Greenhouse fetch error for ${companyBoardUrl}:`, error);
    return [];
  }
}

// Demo function - fetch from known public boards
export async function fetchKnownGreenhouseBoards(): Promise<RawJob[]> {
  const DEMO_BOARDS = [
    'https://boards.greenhouse.io/airbnb',
    'https://boards.greenhouse.io/stripe',
    'https://boards.greenhouse.io/coinbase',
    'https://boards.greenhouse.io/notion',
    'https://boards.greenhouse.io/loom',
  ];

  let allJobs: RawJob[] = [];

  // Try first two boards for demo
  for (const board of DEMO_BOARDS.slice(0, 2)) {
    const jobs = await fetchGreenhouseJobs(board);
    allJobs.push(...jobs);
  }

  // Deduplicate
  const seen = new Set<string>();
  return allJobs.filter(job => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });
}

export default fetchKnownGreenhouseBoards;
