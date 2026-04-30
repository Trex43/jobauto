import axios from 'axios';
import type { RawJob } from '../jobAggregator';

export async function fetchRemotiveJobs(): Promise<RawJob[]> {
  try {
    const { data } = await axios.get('https://remotive.com/api/remote-jobs', {
      timeout: 10000,
      headers: { 'User-Agent': 'JobAuto/1.0' }
    });
    
    return data.jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company_name,
      company_logo: job.company_logo,
      location: 'Remote',
      remote: true,
      description: job.description,
      url: job.url,
      tags: job.tags,
      source: 'remotive',
      published_at: job.publication_date,
    }));
} catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Remotive fetch failed:', error.message);
    } else {
      console.error('Remotive fetch failed:', error);
    }
    return [];
  }
}

