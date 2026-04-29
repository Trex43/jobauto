import axios from 'axios';
import cheerio from 'cheerio';
import type { RawJob } from '../jobAggregator';

export async function fetchIndeedJobs(): Promise<RawJob[]> {
  try {
    // Simple Indeed scraper (basic, for MVP)
    const { data } = await axios.get('https://www.indeed.com/jobs?q=software&l=Remote', {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(data);
    const jobs: RawJob[] = [];
    $('div.job_seen_beacon').slice(0, 10).each((i, el) => {
      const title = $(el).find('h2 a span').text().trim();
      const company = $(el).find('.companyName').text().trim();
      const location = $(el).find('.companyLocation').text().trim();
      const url = 'https://www.indeed.com' + $(el).find('h2 a').attr('href');
      if (title && company) {
        jobs.push({
          id: `indeed-${i}`,
          title,
          company,
          location,
          remote: location.includes('Remote'),
          description: '',
          url,
          tags: [],
          source: 'indeed',
        });
      }
    });
    return jobs;
  } catch (error) {
    console.error('Indeed scraper failed:', error);
    return [];
  }
}

