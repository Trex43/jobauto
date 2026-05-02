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

    // Include user and skills relations as per schema
    const [profile, jobRecord] = await Promise.all([
      prisma.profile.findUnique({ 
        where: { userId }, 
        include: { 
          user: { select: { firstName: true, lastName: true, email: true } }, 
          skills: true 
        } 
      }),
      prisma.job.findUnique({ where: { id: jobId } }),
    ]);

    if (!profile || !jobRecord) throw new Error(`Profile or job not found`);

    // Use skills from the included relation with null safety
    const skillNames = profile.skills?.map((s) => s.name).join(', ') ?? '';
    
    // Replace user.name with firstName + lastName - proper null safety
    const userName = `${profile.user?.firstName ?? ''} ${profile.user?.lastName ?? ''}`.trim();
    
    // Use resumeText as fallback per schema (not bio which doesn't exist)
    const bioText = profile.resumeText ?? profile.summary ?? '';

    const prompt = `Write a cover letter for this job application.
APPLICANT: ${userName}, Skills: ${skillNames}, Bio: ${bioText}
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

    await autoApplyQueue.add(`apply-${autoApplyJobId}`, {
      autoApplyJobId, userId, jobId, priority: 5,
    } satisfies AutoApplyData, { priority: 5 });

    logger.info(`[CoverLetter] Generated for ${autoApplyJobId}`);
    return { autoApplyJobId };
  },
  { connection: redisConnection, concurrency: 5 }
);

worker.on('failed', (job, err) => logger.error(`[CoverLetter] ${job?.id} failed: ${err.message}`));
export default worker;
