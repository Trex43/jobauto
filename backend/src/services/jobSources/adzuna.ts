/**
 * Adzuna Job API Integration
 * Free tier: 1000 requests/month
 * API Docs: https://developer.adzuna.com/docs
 */

import axios from 'axios';
import { logger } from '../../utils/logger';  // 🎯 Added for verbose logging
import type { RawJob } from '../jobAggregator';


// Adzuna API configuration 🎯 FIXED: Added verbose logging
// Get free API keys: https://developer.adzuna.com/
const ADZUNA_CONFIG = {
  appId: process.env.ADZUNA_APP_ID || 'demo',
  appKey: process.env.ADZUNA_APP_KEY || 'demo',
  baseUrl: 'https://api.adzuna.com/v1',
  country: 'us',
};

const hasValidKeys = !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
const appIdMask = hasValidKeys ? '***VALID***' : 'MISSING/DEMO';
logger.info(`[ADZUNA] Config loaded - AppID: ${appIdMask}, Valid keys: ${hasValidKeys}`);

if (!hasValidKeys) {
  logger.warn('[ADZUNA] ⚠️  Demo/Missing keys detected - will skip fetches (set ADZUNA_APP_ID & ADZUNA_APP_KEY)');
}


// Map Adzuna categories to common job titles
const CATEGORY_MAP: Record<string, string> = {
  'it gigs': 'IT',
  'admin office work': 'Admin',
  'customer service': 'Customer Service',
  'delivery driving': 'Driving',
  'food service': 'Food Service',
  'general labor': 'General Labor',
  'sales': 'Sales',
  'retail': 'Retail',
  'skilled trade': 'Skilled Trade',
  'medical health': 'Healthcare',
  'education': 'Education',
};

export interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string; area?: string[] };
  salary_min?: number;
  salary_max?: number;
  salary_is_estimate?: boolean;
  description: string;
  redirect_url: string;
  category?: { tag: string; label: string };
  date_posted: string;
  data?: any[];
}

function mapRemoteType(description: string, title: string): boolean | null {
  const text = (description + title).toLowerCase();
  if (text.includes('remote') || text.includes('work from home') || text.includes('wfh')) {
    return true;
  }
  if (text.includes('hybrid')) {
    return null; // hybrid - treat as null for now
  }
  return null;
}

function extractSkills(tags: any[] | undefined): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  return tags
    .filter((tag: unknown): tag is string => typeof tag === 'string')
    .slice(0, 10);
}

async function searchJobs(params: {
  keyword: string;
  location?: string;
  category?: string;
  page?: number;
}): Promise<RawJob[]> {
  // Skip if no valid keys
  if (!hasValidKeys) {
    logger.info('[ADZUNA] Skipping search - no valid keys');
    return [];
  }

  try {
    const { keyword, location, category, page = 1 } = params;
    
    const queryParams = new URLSearchParams({
      app_id: ADZUNA_CONFIG.appId,
      app_key: ADZUNA_CONFIG.appKey,
      what: keyword,
      page: page.toString(),
      max_days_old: '30',
      sort_by: 'date',
    });


    if (location) {
      queryParams.append('where', location);
    }

    if (category && CATEGORY_MAP[category]) {
      queryParams.append('category', category);
    }

    // 🎯 FIXED: Correct Adzuna endpoint format /v1/jobs/{country}/search/{page}
    const encodedParams = queryParams.toString();
    const url = `${ADZUNA_CONFIG.baseUrl}/jobs/${ADZUNA_CONFIG.country}/search/1?${encodedParams}`;
    logger.info(`[ADZUNA] Searching: ${url.split('?')[0]}?${encodedParams.substring(0,100)}...`);
    
    const { data, status } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'JobAuto/1.0',
        'Accept': 'application/json',
      },
    });


    logger.info(`[ADZUNA] Response: status=${status}, count=${data.results?.length || 0}, total=${data.count || 0}`);

    if (!data.results || !Array.isArray(data.results)) {
      logger.warn('[ADZUNA] Invalid response structure');
      return [];
    }

return data.results.map((job: AdzunaJob) => ({

      id: `adzuna-${job.id}`,
      title: job.title,
      company: job.company?.display_name || 'Unknown',
      location: job.location?.display_name || location || 'Remote',
      remote: mapRemoteType(job.description, job.title),
      description: job.description?.substring(0, 2000) || '',
      url: job.redirect_url,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      tags: extractSkills(job.data || []),
      source: 'adzuna',
      category: job.category?.label || (job.category?.tag ? CATEGORY_MAP[job.category.tag] : null) || null,
      published_at: job.date_posted,
    }));
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const msg = error.response?.data?.error?.message || error.message;
      logger.error(`[ADZUNA] API ERROR ${status}: ${msg}`);
      if (status === 401) logger.error('[ADZUNA] ❌ 401 Invalid API keys');
      if (status === 429) logger.error('[ADZUNA] ❌ 429 Rate limit hit');
    } else {
      logger.error('[ADZUNA] Network/unknown error:', error);
    }
    return [];
  }
}


async function getJobsByCategory(category: string = 'it gigs'): Promise<RawJob[]> {
  return searchJobs({
    keyword: '',
    category,
  });
}

async function searchRemoteJobs(keyword: string = 'developer'): Promise<RawJob[]> {
  try {
    // Search remote in title or description
    const results: RawJob[] = [];
    
    // Try multiple search patterns
    const searches = [
      { keyword: `${keyword} remote` },
      { keyword: `remote ${keyword}` },
      { keyword: `${keyword} work from home` },
    ];

    for (const search of searches) {
      const jobs = await searchJobs(search);
      results.push(...jobs);
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    return results.filter(job => {
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });
} catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Adzuna remote search error:', error.message);
    } else {
      console.error('Adzuna remote search error:', error);
    }
    return [];
  }
}

// Main export function 🎯 ENHANCED LOGGING
export async function fetchAdzunaJobs(options?: {
  keyword?: string;
  location?: string;
  category?: string;
  limit?: number;
}): Promise<RawJob[]> {
  const startTime = Date.now();
  const { keyword = 'developer', location, category, limit = 100 } = options || {};

  logger.info(`[ADZUNA] fetchAdzunaJobs called: keyword="${keyword}", limit=${limit}, keys=${hasValidKeys ? 'OK' : 'MISSING'}`);

  if (!hasValidKeys) {
    logger.warn('[ADZUNA] Early return - missing valid keys');
    return [];
  }

  let jobs: RawJob[] = [];


  if (category) {
    jobs = await getJobsByCategory(category);
  } else {
    // Search for common tech roles
    const keywords = [
      keyword,
      'software engineer',
      'frontend developer',
      'backend developer',
      'full stack developer',
      'devops',
      'data scientist',
    ];

    for (const kw of keywords.slice(0, 3)) {
      const result = await searchJobs({ keyword: kw, location });
      jobs.push(...result);
    }
  }

  // Deduplicate and limit
  const seen = new Set<string>();
  const deduped = jobs.filter(job => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });

  const finalCount = Math.min(deduped.length, limit);
  const duration = Date.now() - startTime;
  logger.info(`[ADZUNA] ✅ Complete: ${finalCount}/${deduped.length} jobs in ${duration}ms`);

  return deduped.slice(0, limit);
}


export default fetchAdzunaJobs;
