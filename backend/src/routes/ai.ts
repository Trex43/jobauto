import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { APIError, asyncHandler } from '../middleware/error';
import { logger } from '../utils/logger';

const router = Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route   POST /api/ai/match-job
 * @desc    Calculate match score between user and job
 * @access  Private
 */
router.post(
  '/match-job',
  authenticate,
  [
    body('jobId').notEmpty().withMessage('Job ID is required'),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { jobId } = req.body;
    const userId = req.user!.userId;

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true,
            experiences: true,
          },
        },
        jobPreferences: true,
      },
    });

    if (!user?.profile) {
      throw new APIError('Profile not found', 404);
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new APIError('Job not found', 404);
    }

    // Calculate basic match score
    const userSkills = user.profile.skills.map((s) => s.name.toLowerCase());
    const jobSkills = job.skillsRequired.map((s) => s.toLowerCase());
    const matchingSkills = jobSkills.filter((skill) =>
      userSkills.some((userSkill) => userSkill.includes(skill) || skill.includes(userSkill))
    );

    const skillScore = jobSkills.length > 0 
      ? Math.round((matchingSkills.length / jobSkills.length) * 100) 
      : 0;

    // Use AI for advanced matching if OpenAI key is available
    let aiAnalysis = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `
          Analyze the match between a job seeker and a job posting.
          
          Job Seeker Profile:
          - Skills: ${userSkills.join(', ')}
          - Experience: ${user.profile.yearsOfExperience || 'Not specified'} years
          - Current Title: ${user.profile.currentTitle || 'Not specified'}
          - Summary: ${user.profile.summary || 'Not provided'}
          
          Job Posting:
          - Title: ${job.title}
          - Company: ${job.company}
          - Description: ${job.description.substring(0, 1000)}
          - Required Skills: ${jobSkills.join(', ')}
          
          Provide a JSON response with:
          1. overallMatchScore (0-100)
          2. skillMatchScore (0-100)
          3. experienceMatchScore (0-100)
          4. keyStrengths (array of strings)
          5. gaps (array of strings)
          6. recommendations (array of strings)
        `;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert job matching AI. Analyze job seeker profiles and job postings to provide accurate match scores and insights. Respond only with valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          aiAnalysis = JSON.parse(response);
        }
      } catch (error) {
        logger.error('AI matching error:', error);
        // Fall back to basic scoring
      }
    }

    // Combine scores
    const finalMatchScore = aiAnalysis?.overallMatchScore || skillScore;

    res.json({
      success: true,
      data: {
        matchScore: finalMatchScore,
        skillMatch: {
          score: skillScore,
          matchingSkills,
          missingSkills: jobSkills.filter((s) => !matchingSkills.includes(s)),
        },
        aiAnalysis,
        isRecommended: finalMatchScore >= 50,
      },
    });
  })
);

/**
 * @route   POST /api/ai/optimize-resume
 * @desc    Optimize resume for a specific job
 * @access  Private
 */
router.post(
  '/optimize-resume',
  authenticate,
  [
    body('jobId').notEmpty(),
    body('resumeText').notEmpty(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { jobId, resumeText } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      throw new APIError('AI service not available', 503);
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new APIError('Job not found', 404);
    }

    const prompt = `
      Optimize the following resume for the job posting. Provide specific suggestions to improve the match.
      
      Job Title: ${job.title}
      Company: ${job.company}
      Job Description: ${job.description.substring(0, 1500)}
      Required Skills: ${job.skillsRequired.join(', ')}
      
      Current Resume:
      ${resumeText.substring(0, 3000)}
      
      Provide a JSON response with:
      1. atsScore (0-100) - How well the resume will perform with ATS
      2. keywordMatches (array of matched keywords)
      3. missingKeywords (array of important keywords to add)
      4. suggestions (array of specific improvement suggestions)
      5. optimizedSummary (a rewritten professional summary optimized for this job)
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume optimizer and ATS specialist. Help job seekers optimize their resumes for specific job postings. Respond only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new APIError('AI optimization failed', 500);
      }

      const optimization = JSON.parse(response);

      res.json({
        success: true,
        data: {
          optimization,
          job: {
            id: job.id,
            title: job.title,
            company: job.company,
          },
        },
      });
    } catch (error) {
      logger.error('Resume optimization error:', error);
      throw new APIError('Failed to optimize resume', 500);
    }
  })
);

/**
 * @route   POST /api/ai/extract-skills
 * @desc    Extract skills from resume text
 * @access  Private
 */
router.post(
  '/extract-skills',
  authenticate,
  [
    body('resumeText').notEmpty(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { resumeText } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      throw new APIError('AI service not available', 503);
    }

    const prompt = `
      Extract skills from the following resume text. Categorize them as technical, soft, or domain-specific skills.
      
      Resume Text:
      ${resumeText.substring(0, 4000)}
      
      Provide a JSON response with:
      1. technicalSkills (array of { name, proficiency: 1-10 })
      2. softSkills (array of { name, proficiency: 1-10 })
      3. domainSkills (array of { name, proficiency: 1-10 })
      4. suggestedJobTitles (array of job titles that match this profile)
      5. experienceYears (estimated years of experience)
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at parsing resumes and extracting skills. Provide accurate skill extraction and categorization. Respond only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new APIError('Skill extraction failed', 500);
      }

      const extracted = JSON.parse(response);

      // Save extracted skills to profile
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user!.userId },
      });

      if (profile) {
        const allSkills = [
          ...extracted.technicalSkills.map((s: any) => ({ ...s, category: 'technical' })),
          ...extracted.softSkills.map((s: any) => ({ ...s, category: 'soft' })),
          ...extracted.domainSkills.map((s: any) => ({ ...s, category: 'domain' })),
        ];

        // Add skills to profile
        for (const skill of allSkills) {
          await prisma.skill.upsert({
            where: {
              profileId_name: {
                profileId: profile.id,
                name: skill.name,
              },
            },
            update: {
              proficiency: skill.proficiency,
              isAiExtracted: true,
            },
            create: {
              profileId: profile.id,
              name: skill.name,
              category: skill.category,
              proficiency: skill.proficiency,
              isAiExtracted: true,
            },
          });
        }

        // Update profile
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            yearsOfExperience: extracted.experienceYears,
            resumeText,
          },
        });
      }

      res.json({
        success: true,
        data: {
          extracted,
          skillsAdded: true,
        },
      });
    } catch (error) {
      logger.error('Skill extraction error:', error);
      throw new APIError('Failed to extract skills', 500);
    }
  })
);

/**
 * @route   POST /api/ai/generate-cover-letter
 * @desc    Generate cover letter for a job
 * @access  Private
 */
router.post(
  '/generate-cover-letter',
  authenticate,
  [
    body('jobId').notEmpty(),
    body('tone').optional().isIn(['professional', 'casual', 'enthusiastic']),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { jobId, tone = 'professional' } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      throw new APIError('AI service not available', 503);
    }

    // Get user profile and job
    const [user, job] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: {
          profile: {
            include: { skills: true, experiences: true },
          },
        },
      }),
      prisma.job.findUnique({
        where: { id: jobId },
      }),
    ]);

    if (!user?.profile) {
      throw new APIError('Profile not found', 404);
    }

    if (!job) {
      throw new APIError('Job not found', 404);
    }

    const prompt = `
      Write a compelling cover letter for the following job application.
      
      Job Details:
      - Title: ${job.title}
      - Company: ${job.company}
      - Description: ${job.description.substring(0, 1000)}
      - Required Skills: ${job.skillsRequired.join(', ')}
      
      Applicant Profile:
      - Name: ${user.firstName} ${user.lastName}
      - Current Title: ${user.profile.currentTitle || 'Not specified'}
      - Skills: ${user.profile.skills.map((s) => s.name).join(', ')}
      - Experience: ${user.profile.yearsOfExperience || 'Not specified'} years
      - Summary: ${user.profile.summary || 'Not provided'}
      
      Tone: ${tone}
      
      Write a professional cover letter that:
      1. Opens with a strong hook
      2. Highlights relevant skills and experience
      3. Shows enthusiasm for the company and role
      4. Includes a clear call to action
      5. Is 300-400 words
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career coach who writes compelling cover letters. Create personalized, engaging cover letters that help job seekers stand out.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const coverLetter = completion.choices[0]?.message?.content;

      if (!coverLetter) {
        throw new APIError('Cover letter generation failed', 500);
      }

      res.json({
        success: true,
        data: {
          coverLetter,
          job: {
            id: job.id,
            title: job.title,
            company: job.company,
          },
        },
      });
    } catch (error) {
      logger.error('Cover letter generation error:', error);
      throw new APIError('Failed to generate cover letter', 500);
    }
  })
);

/**
 * @route   POST /api/ai/interview-prep
 * @desc    Generate interview preparation materials
 * @access  Private
 */
router.post(
  '/interview-prep',
  authenticate,
  [
    body('jobId').notEmpty(),
    body('interviewType').optional().isIn(['phone', 'video', 'onsite', 'technical']),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { jobId, interviewType = 'general' } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      throw new APIError('AI service not available', 503);
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new APIError('Job not found', 404);
    }

    const prompt = `
      Create interview preparation materials for a ${interviewType} interview.
      
      Job Details:
      - Title: ${job.title}
      - Company: ${job.company}
      - Description: ${job.description.substring(0, 1500)}
      - Required Skills: ${job.skillsRequired.join(', ')}
      
      Provide a JSON response with:
      1. likelyQuestions (array of 10 likely interview questions)
      2. suggestedAnswers (object with question-answer pairs for 5 key questions)
      3. companyResearch (array of research points about the company)
      4. technicalTopics (array of technical topics to review, if applicable)
      5. questionsToAsk (array of good questions to ask the interviewer)
      6. preparationTips (array of general preparation tips)
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Help job seekers prepare for interviews with relevant questions, suggested answers, and preparation tips. Respond only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new APIError('Interview prep generation failed', 500);
      }

      const prepMaterials = JSON.parse(response);

      res.json({
        success: true,
        data: {
          prepMaterials,
          job: {
            id: job.id,
            title: job.title,
            company: job.company,
          },
        },
      });
    } catch (error) {
      logger.error('Interview prep generation error:', error);
      throw new APIError('Failed to generate interview prep', 500);
    }
  })
);

/**
 * @route   POST /api/ai/salary-insights
 * @desc    Get salary insights for a role
 * @access  Private
 */
router.post(
  '/salary-insights',
  authenticate,
  [
    body('jobTitle').notEmpty(),
    body('location').optional(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { jobTitle, location } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      throw new APIError('AI service not available', 503);
    }

    const prompt = `
      Provide salary insights for the following role.
      
      Job Title: ${jobTitle}
      Location: ${location || 'United States (National Average)'}
      
      Provide a JSON response with:
      1. salaryRange (object with min, max, median in USD)
      2. factors (array of factors that affect salary)
      3. negotiationTips (array of negotiation tips)
      4. marketTrends (brief description of market trends)
      5. relatedRoles (array of related roles with salary ranges)
      6. experienceLevels (array of salary by experience level)
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a compensation expert. Provide accurate salary insights and negotiation advice. Use current market data. Respond only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new APIError('Salary insights generation failed', 500);
      }

      const insights = JSON.parse(response);

      res.json({
        success: true,
        data: {
          insights,
          role: jobTitle,
          location: location || 'National Average',
        },
      });
    } catch (error) {
      logger.error('Salary insights generation error:', error);
      throw new APIError('Failed to generate salary insights', 500);
    }
  })
);

export default router;
