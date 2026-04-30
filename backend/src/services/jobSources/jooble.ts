/**
 * Jooble API Integration
 * Free API: 100 requests/month
 * Docs: https://jooble.org/api/about
 */

import axios from 'axios';
import type { RawJob } from '../jobAggregator';

const JOOBLE_CONFIG = {
  baseUrl: 'https://jooble.org/api',
  apiKey: process.env.JOOBLE_API_KEY || '',
};

interface JoobleJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type?: string;
  link: string;
  snippet?: string;
  posted?: string;
}

interface JoobleResponse {
  jobs: JoobleJob[];
  totalCount?: number;
}

function parseSalary(salaryStr?: string): { min?: number; max?: number } {
  if (!salaryStr) return {};
  // Extract numbers fromsalary string like "$50k - $80k"
  const numbers = salaryStr.match(/\d+/g);
  if (!numbers || numbers.length === 0) return {};
  if (numbers.length === 1) {
    return { min: parseInt(numbers[0]) * 1000 };
  }
  return {
    min: parseInt(numbers[0]) * 1000,
    max: parseInt(numbers[1]) * 1000,
  };
}

function mapRemoteType(title: string, snippet?: string): boolean | undefined {
  const text = `${title} ${snippet}`.toLowerCase();
  if (text.includes('remote') || text.includes('work from home')) return true;
  return undefined;
}

export async function fetchJoobleJobs(options?: {
  keyword?: string;
  location?: string;
  limit?: number;
}): Promise<RawJob[]> {
  const { keyword = 'developer', location, limit = 50 } = options || {};

  if (!JOOBLE_CONFIG.apiKey) {
    console.warn('Jooble API key not configured');
    return [];
  }

  try {
    const { data } = await axios.post<JoobleResponse>(
      `${JOOBLE_CONFIG.baseUrl}/v2/${JOOBLE_CONFIG.apiKey}`,
      {
        keywords: keyword,
        location: location || 'United States',
        pageNumber: 1,
        pageSize: Math.min(limit, 25),
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'JobAuto/1.0',
        },
      }
    );

    if (!data?.jobs) return [];

    return data.jobs.map((job: JoobleJob) => {
      const salary = parseSalary(job.salary);
      return {
        id: `jooble-${job.id}`,
        title: job.title,
        company: job.company || 'Company',
        location: job.location || location || 'United States',
        remote: mapRemoteType(job.title, job.snippet),
        description: job.snippet || '',
        url: job.link,
        salary_min: salary.min,
        salary_max: salary.max,
        tags: [],
        source: 'jooble',
        category: job.type,
        published_at: job.posted,
      };
    });
} catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Jooble API error:', error.response?.data || error.message);
    } else {
      console.error('Jooble API error:', error);
    }
    return [];
  }
}

export default fetchJoobleJobs;
