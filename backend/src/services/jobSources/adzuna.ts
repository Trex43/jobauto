import axios from 'axios';
import type { RawJob } from '../jobAggregator';

export async function fetchAdzunaJobs(): Promise<RawJob[]> {
  // Adzuna free tier (signup for app_id/app_key or use public demo)
  // For MVP use alternative or skip
  console.log('Adzuna fetch skipped - requires API key');
  return [];
}

