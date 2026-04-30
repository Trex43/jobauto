import axios from 'axios';
import type { RawJob } from '../jobAggregator';

export async function fetchArbeitnowJobs(): Promise<RawJob[]> {
  try {
    const { data } = await axios.get('https://www.arbeitnow.com/api/job-board-api', {
      params: { page: 1, per_page: 50 },
      timeout: 10000,
      headers: { 'User-Agent': 'JobAuto/1.0' }
    });
    
    return data.data.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company_name,
      company_logo: null,
      location: job.location,
      remote: job.remote ? true : false,
      description: job.description || '',
      url: job.url,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      tags: [job.job_type, job.category],
      source: 'arbeitnow',
      category: job.category,
    }));
} catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Arbeitnow fetch failed:', error.message);
    } else {
      console.error('Arbeitnow fetch failed:', error);
    }
    return [];
  }
}

