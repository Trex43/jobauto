import axios from 'axios';
import type { RawJob } from '../jobAggregator';

export async function fetchTheMuseJobs(): Promise<RawJob[]> {
  try {
    // The Muse free RSS API
    const { data } = await axios.get('https://www.themuse.com/api/public/jobs?page=1', {
      timeout: 10000,
    });
    return data.results.map((job: any) => ({
      id: job.id,
      title: job.name,
      company: job.company.name,
      company_logo: job.company.image_url,
      location: job.locations[0]?.name || 'Remote',
      remote: true,
      description: job.contents,
      url: job.refs.landing_page,
      tags: job.categories.map((c: any) => c.name),
      source: 'themuse',
    }));
} catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('TheMuse fetch failed:', error.message);
    } else {
      console.error('TheMuse fetch failed:', error);
    }
    return [];
  }
}

