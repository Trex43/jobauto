import axios from 'axios';
import type { RawJob } from '../jobAggregator';

export async function fetchRemoteOKJobs(): Promise<RawJob[]> {
  try {
    const { data } = await axios.get('https://remoteok.com/api', {
      timeout: 10000,
      headers: { 'User-Agent': 'JobAuto/1.0' }
    });
    
    return data.slice(1).map((job: any, index: number) => ({
      id: `rok-${index}`,
      title: job.position,
      company: job.company,
      company_logo: null,
      location: job.location,
      remote: job.remote100 ? true : job.remote ? 'hybrid' : false,
      description: job.description || '',
      url: job.url,
      tags: [],
      source: 'remoteok',
    }));
  } catch (error) {
    console.error('RemoteOK fetch failed:', error);
    return [];
  }
}

