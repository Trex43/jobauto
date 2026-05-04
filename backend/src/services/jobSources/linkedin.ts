import axios from 'axios';

export async function fetchLinkedInJobs(keywords: string = '', limit = 20): Promise<any[]> {
  // Skip if no token
  if (!process.env.LINKEDIN_ACCESS_TOKEN) {
    console.log('LinkedIn: Skipping - no LINKEDIN_ACCESS_TOKEN set');
    return [];
  }

  try {
    // LinkedIn Jobs API v2
    const response = await axios.get('https://api.linkedin.com/v2/jobSearch', {
      params: {
        keywords,
        limit: limit.toString(),
        start: 0,
        f_AL: true // Remote only
      },
      headers: {
        'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'User-Agent': 'JobAuto/1.0'
      }
    });

    return response.data.jobs.map((job: any) => ({
      id: String(job.id),
      title: job.title,
      company: job.companyName || job.company,
      companyLogo: job.companyLogoUrl || '',
      location: job.location || 'Remote',
      remoteType: 'remote',
      description: job.description || '',
      applyUrl: job.applyUrl || `https://linkedin.com/jobs/${job.id}`,
      originalUrl: `https://linkedin.com/jobs/${job.id}`,
      source: 'linkedin',
      postedAt: job.postedTime || new Date().toISOString()
    }));
  } catch (error: any) {
    console.error('LinkedIn API error:', error.response?.status, error.message);
    return [];
  }
}

