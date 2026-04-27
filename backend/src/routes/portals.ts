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

const PORTALS = [
  { id: 'LINKEDIN', name: 'LinkedIn', icon: 'linkedin', color: '#0A66C2' },
  { id: 'INDEED', name: 'Indeed', icon: 'indeed', color: '#003A9B' },
  { id: 'GLASSDOOR', name: 'Glassdoor', icon: 'glassdoor', color: '#0CAA41' },
  { id: 'ZIPRECRUITER', name: 'ZipRecruiter', icon: 'ziprecruiter', color: '#506E91' },
  { id: 'MONSTER', name: 'Monster', icon: 'monster', color: '#642891' },
  { id: 'CAREERBUILDER', name: 'CareerBuilder', icon: 'careerbuilder', color: '#0071C5' },
  { id: 'SIMPLYHIRED', name: 'SimplyHired', icon: 'simplyhired', color: '#00A1E0' },
  { id: 'ANGELLIST', name: 'AngelList', icon: 'angellist', color: '#000000' },
  { id: 'STACKOVERFLOW', name: 'Stack Overflow', icon: 'stackoverflow', color: '#F48024' },
  { id: 'GITHUB', name: 'GitHub Jobs', icon: 'github', color: '#333333' },
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
  [
    body('profileUrl').optional().trim(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { portal } = req.params;
    const { profileUrl } = req.body;

    if (!PORTALS.find((p) => p.id === portal)) {
      throw new APIError('Invalid portal', 400);
    }

    // In a real app, this would initiate OAuth flow
    // For MVP, we just store a mock connection
    const connection = await prisma.portalConnection.upsert({
      where: {
        userId_portal: { userId, portal: portal as any },
      },
      update: {
        isConnected: true,
        connectedAt: new Date(),
        lastSyncAt: new Date(),
        profileUrl,
      },
      create: {
        userId,
        portal: portal as any,
        isConnected: true,
        connectedAt: new Date(),
        lastSyncAt: new Date(),
        profileUrl,
      },
    });

    logger.info(`Portal connected: ${portal} for user ${userId}`);

    res.json({
      success: true,
      message: `${portal} connected successfully`,
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

  // In a real app, this would fetch jobs from the portal API
  // For MVP, we return success and note that jobs are synced
  logger.info(`Portal sync triggered: ${portal} for user ${userId}`);

  res.json({
    success: true,
    message: `${portal} sync completed`,
    data: { syncedAt: new Date() },
  });
}));

export default router;

