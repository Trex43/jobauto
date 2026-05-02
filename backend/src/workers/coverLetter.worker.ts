// backend/src/workers/coverLetter.worker.ts
import { Worker, Job } from 'bullmq';
import OpenAI from 'openai';
import { redisConnection, CoverLetterData, QUEUE_NAMES, autoApplyQueue, AutoApplyData } from './queues';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const worker = new Worker<CoverLetterData>(
  QUEUE_NAMES.COVER_LETTER,
  async (job: Job<CoverLetterData>) => {
    const { userId, jobId, autoApplyJobId } = job.data;

    const [profile, jobRecord] = await Promise.all([
      prisma.profile.findUnique({ where: { userId }, include: { user: { select: { name: true, email: true } } } }),
      prisma.job.findUnique({ where: { id: jobId } }),
    ]);

    if (!profile || !jobRecord) throw new Error(`Profile or job not found`);

    const skills = Array.isArray(profile.skills) ? profile.skills.join(', ') : '';
    const prompt = `Write a cover letter for this job application.
APPLICANT: ${profile.user?.name}, Skills: ${skills}, Bio: ${profile.bio ?? ''}
JOB: ${jobRecord.title} at ${jobRecord.company}. ${jobRecord.description?.slice(0, 400)}
RULES: Max 3 paragraphs, under 250 words. Start with a strong hook. Mention 2-3 matching skills. End with a call to action. No clichés.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', max_tokens: 600, temperature: 0.7,
      messages: [
        { role: 'system', content: 'You are an expert career coach writing compelling, ATS-optimized cover letters.' },
        { role: 'user', content: prompt },
      ],
    });

    const coverLetter = completion.choices[0]?.message?.content?.trim();
    if (!coverLetter) throw new Error('OpenAI returned empty cover letter');

    await prisma.autoApplyJob.update({ where: { id: autoApplyJobId }, data: { coverLetter } });

    const applyJob = await prisma.autoApplyJob.findUnique({ where: { id: autoApplyJobId } });
    if (applyJob) {
      await autoApplyQueue.add(`apply-${autoApplyJobId}`, {
        autoApplyJobId, userId: applyJob.userId, jobId: applyJob.jobId, priority: applyJob.priority,
      } satisfies AutoApplyData, { priority: applyJob.priority });
    }

    logger.info(`[CoverLetter] Generated for ${autoApplyJobId}`);
    return { autoApplyJobId };
  },
  { connection: redisConnection, concurrency: 5 }
);

worker.on('failed', (job, err) => logger.error(`[CoverLetter] ${job?.id} failed: ${err.message}`));
export default worker;
