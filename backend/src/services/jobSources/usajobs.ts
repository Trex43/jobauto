/**
 * USAJobs API Integration
 * Free API for US Federal Government jobs
 * API Docs: https://developer.usajobs.gov/api/
 */

import axios from 'axios';
import type { RawJob } from '../jobAggregator';

const USAJOBS_CONFIG = {
  baseUrl: 'https://data.usajobs.gov/api/search',
  apiKey: process.env.USAJOBS_API_KEY || '',
};

interface USAJobsResponse {
  SearchResult?: {
    SearchResultItems?: Array<{
      Position?: {
        PositionTitle: string;
        OrganizationName: string;
        PositionLocation?: Array<{ CityName: string; StateCode: string; CountryCode: string }>;
        PositionSchedule?: Array<{ Schedule: string }>;
        PositionType?: Array<{ Name: string }>;
        MinimumRange?: number;
        MaximumRange?: number;
        QualificationSummary?: string;
      };
      MatchedObjectDescriptor?: {
        PositionURI: string;
        JobSummary?: string;
        FullDuties?: string;
        tags?: Array<{ name: string }>;
        PublicationStartDate: string;
      };
    }>;
  };
}

function mapRemoteType(schedule?: string): boolean | undefined {
  if (!schedule) return undefined;
  return schedule.toLowerCase().includes('remote');
}

function extractSkills(tags?: Array<{ name: string }>): string[] {
  return (tags || []).map(t => t.name).filter(Boolean).slice(0, 10);
}

export async function fetchUSAJobsJobs(options?: {
  keyword?: string;
  location?: string;
  limit?: number;
}): Promise<RawJob[]> {
  const { keyword = 'developer', location, limit = 50 } = options || {};

  if (!USAJOBS_CONFIG.apiKey) {
    console.warn('USAJobs API key not configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      SearchResultStartIndex: '0',
      SearchResultMaxHits: '25',
      Keyword: keyword,
      KeywordType: 'or',
      PositionStartDate: '03',
    });

    if (location) params.append('Location', location);

    const { data } = await axios.get<USAJobsResponse>(
      `${USAJOBS_CONFIG.baseUrl}?${params}`,
      {
        timeout: 10000,
        headers: {
          'User-Agent': 'JobAuto/1.0',
          'Host': 'data.usajobs.gov',
          'Authorization': USAJOBS_CONFIG.apiKey,
        },
      }
    );

    const items = data?.SearchResult?.SearchResultItems;
    if (!items) return [];

    return items
      .filter(item => item.Position && item.MatchedObjectDescriptor)
      .slice(0, limit)
      .map(item => {
        const pos = item.Position!;
        const desc = item.MatchedObjectDescriptor!;
        const loc = pos.PositionLocation?.[0];

        return {
          id: `usajobs-${desc.PositionURI?.split('/').pop()}`,
          title: pos.PositionTitle || 'Unknown',
          company: pos.OrganizationName || 'US Federal Government',
          location: loc ? `${loc.CityName}, ${loc.StateCode || loc.CountryCode}` : location || 'United States',
          remote: mapRemoteType(pos.PositionSchedule?.[0]?.Schedule),
          description: [pos.QualificationSummary, desc.JobSummary, desc.FullDuties]
            .filter(Boolean)
            .join('\n\n')
            .substring(0, 2000),
          url: desc.PositionURI,
          salary_min: pos.MinimumRange && pos.MinimumRange > 1000 ? Math.round(pos.MinimumRange) : undefined,
          salary_max: pos.MaximumRange && pos.MaximumRange > 1000 ? Math.round(pos.MaximumRange) : undefined,
          tags: extractSkills(desc.tags),
          source: 'usajobs',
          category: pos.PositionType?.[0]?.Name,
          published_at: desc.PublicationStartDate,
        };
      });
} catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('USAJobs API error:', error.response?.data || error.message);
    } else {
      console.error('USAJobs API error:', error);
    }
    return [];
  }
}

export default fetchUSAJobsJobs;
