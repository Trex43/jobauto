import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Stripe from 'stripe';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { APIError, asyncHandler } from '../middleware/error';
import { logger } from '../utils/logger';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
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
 * @route   GET /api/subscriptions/plans
 * @desc    Get available subscription plans
 * @access  Public
 */
router.get('/plans', asyncHandler(async (req, res) => {
  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      description: 'Get started with job automation',
      price: 0,
      interval: 'month',
      features: [
        '5 auto-applies per month',
        'Basic AI matching',
        '3 job portals',
        'Email support',
        'Basic analytics',
      ],
      limitations: [
        'Limited to 5 applications/month',
        'Basic matching algorithm',
      ],
    },
    {
      id: 'PROFESSIONAL',
      name: 'Professional',
      description: 'Perfect for active job seekers',
      price: 29,
      interval: 'month',
      features: [
        'Unlimited auto-applies',
        'Advanced AI matching (50%+ accuracy)',
        'All 50+ job portals',
        'Priority email support',
        'Advanced analytics',
        'Resume optimization',
        'Interview scheduling',
        'Salary insights',
      ],
      popular: true,
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      description: 'For teams and agencies',
      price: 99,
      interval: 'month',
      features: [
        'Everything in Professional',
        'Custom integrations',
        'API access',
        'Dedicated account manager',
        'Team collaboration',
        'White-label options',
        'SSO authentication',
        'Custom contracts',
      ],
    },
  ];

  res.json({
    success: true,
    data: { plans },
  });
}));

/**
 * @route   GET /api/subscriptions/current
 * @desc    Get current user's subscription
 * @access  Private
 */
router.get(
  '/current',
  authenticate,
  asyncHandler(async (req, res) => {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!subscription) {
      throw new APIError('Subscription not found', 404);
    }

    // Get usage stats
    const applicationsThisMonth = await prisma.application.count({
      where: {
        userId: req.user!.userId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        isAutoApplied: true,
      },
    });

    res.json({
      success: true,
      data: {
        subscription: {
          ...subscription,
          applicationsThisMonth,
          remainingAutoApplies: subscription.tier === 'FREE' 
            ? Math.max(0, subscription.autoAppliesLimit - applicationsThisMonth)
            : 'unlimited',
        },
      },
    });
  })
);

/**
 * @route   POST /api/subscriptions/checkout
 * @desc    Create Stripe checkout session
 * @access  Private
 */
router.post(
  '/checkout',
  authenticate,
  [
    body('plan').isIn(['PROFESSIONAL', 'ENTERPRISE']).withMessage('Valid plan is required'),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { plan } = req.body;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new APIError('User not found', 404);
    }

    // Get Stripe price ID
    const priceId = plan === 'PROFESSIONAL' 
      ? process.env.STRIPE_PRICE_PROFESSIONAL 
      : process.env.STRIPE_PRICE_ENTERPRISE;

    if (!priceId) {
      throw new APIError('Payment configuration error', 500);
    }

    let customerId = user.subscription?.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Update subscription with customer ID
      await prisma.subscription.update({
        where: { userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
        },
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  })
);

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancel subscription at period end
 * @access  Private
 */
router.post(
  '/cancel',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new APIError('No active subscription found', 404);
    }

    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local record
    await prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });

    logger.info(`Subscription cancelled for user: ${userId}`);

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
    });
  })
);

/**
 * @route   POST /api/subscriptions/reactivate
 * @desc    Reactivate cancelled subscription
 * @access  Private
 */
router.post(
  '/reactivate',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new APIError('No subscription found', 404);
    }

    // Reactivate subscription
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update local record
    await prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: false },
    });

    logger.info(`Subscription reactivated for user: ${userId}`);

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
    });
  })
);

/**
 * @route   POST /api/subscriptions/update-payment
 * @desc    Create session to update payment method
 * @access  Private
 */
router.post(
  '/update-payment',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new APIError('No subscription found', 404);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/settings/billing`,
    });

    res.json({
      success: true,
      data: { url: session.url },
    });
  })
);

/**
 * @route   GET /api/subscriptions/invoices
 * @desc    Get billing history
 * @access  Private
 */
router.get(
  '/invoices',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      return res.json({
        success: true,
        data: { invoices: [] },
      });
    }

    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 24,
    });

    res.json({
      success: true,
      data: {
        invoices: invoices.data.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: invoice.status,
          date: new Date(invoice.created * 1000),
          pdfUrl: invoice.invoice_pdf,
        })),
      },
    });
  })
);

/**
 * @route   POST /api/subscriptions/upgrade
 * @desc    Upgrade/downgrade subscription
 * @access  Private
 */
router.post(
  '/upgrade',
  authenticate,
  [
    body('plan').isIn(['PROFESSIONAL', 'ENTERPRISE']).withMessage('Valid plan is required'),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { plan } = req.body;
    const userId = req.user!.userId;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new APIError('No active subscription found', 404);
    }

    const newPriceId = plan === 'PROFESSIONAL'
      ? process.env.STRIPE_PRICE_PROFESSIONAL
      : process.env.STRIPE_PRICE_ENTERPRISE;

    if (!newPriceId) {
      throw new APIError('Payment configuration error', 500);
    }

    // Update subscription
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: (await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)).items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    // Update local record
    await prisma.subscription.update({
      where: { userId },
      data: { tier: plan },
    });

    logger.info(`Subscription upgraded to ${plan} for user: ${userId}`);

    res.json({
      success: true,
      message: `Subscription upgraded to ${plan} successfully`,
    });
  })
);

export default router;
