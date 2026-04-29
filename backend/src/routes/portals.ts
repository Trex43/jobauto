import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { APIError, asyncHandler } from '../middleware/error';
import { logger } from '../utils/logger';

const router = Router();

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

// 50+ Job Portals with categories
const PORTALS = [
  // General
  { id: 'LINKEDIN', name: 'LinkedIn', icon: 'linkedin', color: '#0A66C2', category: 'GENERAL' },
  { id: 'INDEED', name: 'Indeed', icon: 'indeed', color: '#003A9B', category: 'GENERAL' },
  { id: 'GLASSDOOR', name: 'Glassdoor', icon: 'glassdoor', color: '#0CAA41', category: 'GENERAL' },
  { id: 'ZIPRECRUITER', name: 'ZipRecruiter', icon: 'ziprecruiter', color: '#506E91', category: 'GENERAL' },
  { id: 'MONSTER', name: 'Monster', icon: 'monster', color: '#642891', category: 'GENERAL' },
  { id: 'CAREERBUILDER', name: 'CareerBuilder', icon: 'careerbuilder', color: '#0071C5', category: 'GENERAL' },
  { id: 'SIMPLYHIRED', name: 'SimplyHired', icon: 'simplyhired', color: '#00A1E0', category: 'GENERAL' },
  { id: 'GOOGLE_JOBS', name: 'Google Jobs', icon: 'google', color: '#4285F4', category: 'GENERAL' },
  { id: 'SNAGAJOB', name: 'Snagajob', icon: 'snagajob', color: '#F36F21', category: 'GENERAL' },
  { id: 'LINKUP', name: 'LinkUp', icon: 'linkup', color: '#1E3A5F', category: 'GENERAL' },

  // Tech
  { id: 'STACKOVERFLOW', name: 'Stack Overflow', icon: 'stackoverflow', color: '#F48024', category: 'TECH' },
  { id: 'GITHUB', name: 'GitHub Jobs', icon: 'github', color: '#333333', category: 'TECH' },
  { id: 'DICE', name: 'Dice', icon: 'dice', color: '#000000', category: 'TECH' },
  { id: 'HIRED', name: 'Hired', icon: 'hired', color: '#0066FF', category: 'TECH' },
  { id: 'ANGELLIST', name: 'AngelList', icon: 'angellist', color: '#000000', category: 'TECH' },
  { id: 'WELLFOUND', name: 'Wellfound', icon: 'wellfound', color: '#2A2A2A', category: 'TECH' },
  { id: 'CRUNCHBOARD', name: 'Crunchboard', icon: 'crunchboard', color: '#00D301', category: 'TECH' },
  { id: 'MASHABLE', name: 'Mashable Jobs', icon: 'mashable', color: '#00AEEF', category: 'TECH' },
  { id: 'PRODUCTHUNT', name: 'Product Hunt', icon: 'producthunt', color: '#DA552F', category: 'TECH' },
  { id: 'KEYVALUES', name: 'Key Values', icon: 'keyvalues', color: '#FF6B6B', category: 'TECH' },
  { id: 'UNDERDOG', name: 'Underdog.io', icon: 'underdog', color: '#1A1A1A', category: 'TECH' },
  { id: 'YCOMBINATOR', name: 'Y Combinator', icon: 'yc', color: '#FF6600', category: 'TECH' },
  { id: 'WHITETRUFFLE', name: 'WhiteTruffle', icon: 'wt', color: '#7B68EE', category: 'TECH' },
  { id: 'GUN', name: 'Gun.io', icon: 'gun', color: '#E63946', category: 'TECH' },
  { id: 'TOPTAL', name: 'Toptal', icon: 'toptal', color: '#3863A0', category: 'TECH' },

  // Remote
  { id: 'REMOTE_CO', name: 'Remote.co', icon: 'remote', color: '#2E8B57', category: 'REMOTE' },
  { id: 'WEWORKREMOTELY', name: 'We Work Remotely', icon: 'wwr', color: '#3C5A99', category: 'REMOTE' },
  { id: 'FLEXJOBS', name: 'FlexJobs', icon: 'flexjobs', color: '#6B5B95', category: 'REMOTE' },
  { id: 'REMOTIVE', name: 'Remotive', icon: 'remotive', color: '#FF6B35', category: 'REMOTE' },
  { id: 'WORKINGNOMADS', name: 'Working Nomads', icon: 'wn', color: '#2C3E50', category: 'REMOTE' },
  { id: 'SKIPTHEDRIVE', name: 'SkipTheDrive', icon: 'std', color: '#1ABC9C', category: 'REMOTE' },
  { id: 'VIRTUALVOCATIONS', name: 'Virtual Vocations', icon: 'vv', color: '#3498DB', category: 'REMOTE' },
  { id: 'JOBSPRESSO', name: 'Jobspresso', icon: 'jobspresso', color: '#E74C3C', category: 'REMOTE' },
  { id: 'OUTSITE', name: 'Outsite', icon: 'outsite', color: '#F39C12', category: 'REMOTE' },
  { id: 'DYNAMITEJOBS', name: 'Dynamite Jobs', icon: 'dj', color: '#9B59B6', category: 'REMOTE' },

  // MENA Region
  { id: 'BAYT', name: 'Bayt.com', icon: 'bayt', color: '#E31937', category: 'MENA' },
  { id: 'NAUKRI', name: 'Naukri.com', icon: 'naukri', color: '#1E4D8C', category: 'MENA' },
  { id: 'GULFTALENT', name: 'GulfTalent', icon: 'gulftalent', color: '#0056A6', category: 'MENA' },
  { id: 'WUZZUF', name: 'Wuzzuf', icon: 'wuzzuf', color: '#00A8E8', category: 'MENA' },
  { id: 'AKHTABOOT', name: 'Akhtaboot', icon: 'akhtaboot', color: '#2E7D32', category: 'MENA' },
  { id: 'NAUkrigulf', name: 'Naukrigulf', icon: 'naukrigulf', color: '#1E4D8C', category: 'MENA' },
  { id: 'DUBAIZZLE', name: 'Dubizzle', icon: 'dubizzle', color: '#FF0000', category: 'MENA' },
  { id: 'TANQEEB', name: 'Tanqeeb', icon: 'tanqeeb', color: '#0066CC', category: 'MENA' },
  { id: 'MIHNA', name: 'Mihnati', icon: 'mihnati', color: '#4CAF50', category: 'MENA' },
  { id: 'HIREDDOTNET', name: 'Hired.com', icon: 'hired', color: '#0066FF', category: 'MENA' },
  { id: 'LOOTAH', name: 'Lootah Premium', icon: 'lootah', color: '#C0392B', category: 'MENA' },
  { id: 'DRJOBS', name: 'DrJobs', icon: 'drjobs', color: '#2980B9', category: 'MENA' },

  // Startup
  { id: 'STARTUPHIRE', name: 'Startup Hire', icon: 'sh', color: '#E74C3C', category: 'STARTUP' },
  { id: 'STARTUPJOBS', name: 'Startup Jobs', icon: 'sj', color: '#9B59B6', category: 'STARTUP' },
  { id: 'F6S', name: 'F6S', icon: 'f6s', color: '#F1C40F', category: 'STARTUP' },
  { id: 'SEEDDB', name: 'SeedDB', icon: 'seeddb', color: '#2ECC71', category: 'STARTUP' },
  { id: 'VENTURELOOP', name: 'VentureLoop', icon: 'vl', color: '#34495E', category: 'STARTUP' },

  // Freelance
  { id: 'UPWORK', name: 'Upwork', icon: 'upwork', color: '#6FDA44', category: 'FREELANCE' },
  { id: 'FREELANCER', name: 'Freelancer', icon: 'freelancer', color: '#29B2FE', category: 'FREELANCE' },
  { id: 'FIVERR', name: 'Fiverr', icon: 'fiverr', color: '#1DBF73', category: 'FREELANCE' },
  { id: 'PEOPLEPERHOUR', name: 'PeoplePerHour', icon: 'pph', color: '#3C5A99', category: 'FREELANCE' },
  { id: 'TOPTAL_FREELANCE', name: 'Toptal', icon: 'toptal', color: '#3863A0', category: 'FREELANCE' },
];

/**
 * @route   GET /api/portals
 * @desc    Get all available portals with user's connection status
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const connections = await prisma.portalConnection.findMany({
    where: { userId },
  });

  const connectionMap = new Map<string, any>(connections.map((c) => [c.portal, c]));

  const portalsWithStatus = PORTALS.map((portal) => {
    const conn = connectionMap.get(portal.id as any);
    return {
      ...portal,
      isConnected: conn?.isConnected || false,
      connectedAt: conn?.connectedAt,
      lastSyncAt: conn?.lastSyncAt,
      profileUrl: conn?.profileUrl,
    };
  });

  res.json({
    success: true,
    data: { portals: portalsWithStatus },
  });
}));

/**
 * @route   POST /api/portals/:portal/connect
 * @desc    Connect a job portal (mock OAuth for MVP)
 * @access  Private
 */
router.post(
  '/:portal/connect',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { portal } = req.params;

    if (!PORTALS.find((p) => p.id === portal)) {
      throw new APIError('Invalid portal', 400);
    }

    // STEP 5: No credentials needed for MVP - connect immediately for ALL portals
    // Real apps would OAuth here, but per requirements: "Clicking Connect immediately connects"
    const connection = await prisma.portalConnection.upsert({
      where: {
        userId_portal: { userId, portal: portal as any },
      },
      update: {
        isConnected: true,
        connectedAt: new Date(),
        lastSyncAt: new Date(),
      },
      create: {
        userId,
        portal: portal as any,
        isConnected: true,
        connectedAt: new Date(),
        lastSyncAt: new Date(),
      },
    });

    logger.info(`Portal ${portal} connected for user ${userId} (no auth required)`);

    res.json({
      success: true,
      message: `${portal} connected successfully! No login required - jobs will sync automatically.`,
      data: { connection },
    });
  })
);

/**
 * @route   POST /api/portals/:portal/disconnect
 * @desc    Disconnect a job portal
 * @access  Private
 */
router.post('/:portal/disconnect', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { portal } = req.params;

  await prisma.portalConnection.updateMany({
    where: { userId, portal: portal as any },
    data: {
      isConnected: false,
      accessToken: null,
      refreshToken: null,
    },
  });

  logger.info(`Portal disconnected: ${portal} for user ${userId}`);

  res.json({
    success: true,
    message: `${portal} disconnected successfully`,
  });
}));

/**
 * @route   POST /api/portals/:portal/sync
 * @desc    Sync jobs from a portal (mock for MVP)
 * @access  Private
 */
router.post('/:portal/sync', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { portal } = req.params;

  const connection = await prisma.portalConnection.findUnique({
    where: {
      userId_portal: { userId, portal: portal as any },
    },
  });

  if (!connection?.isConnected) {
    throw new APIError('Portal not connected', 400);
  }

  // Update last sync time
  await prisma.portalConnection.update({
    where: { id: connection.id },
    data: { lastSyncAt: new Date() },
  });

  // User-specific sync from this portal's source
  logger.info(`Portal ${portal} sync for user ${userId}`);
  const { syncUserJobs } = await import('../services/jobAggregator');
  const result = await syncUserJobs(userId, 100);
  
  res.json({
    success: true,
    message: `${portal} synced ${result.synced} jobs`,
    data: { syncedAt: new Date(), synced: result.synced },
  });
}));

export default router;

