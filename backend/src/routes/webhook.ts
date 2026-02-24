import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhooks
 * @access  Public (secured by Stripe signature)
 */
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      throw new Error('Missing stripe signature or endpoint secret');
    }

    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    logger.error('Stripe webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`Stripe webhook received: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentSucceeded(invoice);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentFailed(invoice);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    default:
      logger.info(`Unhandled Stripe event: ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    logger.error('Missing metadata in checkout session');
    return;
  }

  try {
    // Update subscription
    await prisma.subscription.update({
      where: { userId },
      data: {
        tier: plan as any,
        stripeSubscriptionId: session.subscription as string,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        autoAppliesLimit: plan === 'PROFESSIONAL' || plan === 'ENTERPRISE' ? -1 : 5, // -1 for unlimited
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'subscription_started',
        description: `Started ${plan} subscription`,
        metadata: { sessionId: session.id },
      },
    });

    logger.info(`Subscription started for user ${userId}: ${plan}`);
  } catch (error) {
    logger.error('Error handling checkout completion:', error);
  }
}

/**
 * Handle invoice.payment_succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId as string },
    });

    if (!subscription) {
      logger.error('Subscription not found for invoice');
      return;
    }

    // Update subscription period
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000),
      },
    });

    logger.info(`Payment succeeded for subscription ${subscriptionId}`);
  } catch (error) {
    logger.error('Error handling payment success:', error);
  }
}

/**
 * Handle invoice.payment_failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId as string },
    });

    if (!subscription) return;

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'past_due',
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: subscription.userId,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: 'Your subscription payment failed. Please update your payment method.',
        actionUrl: '/settings/billing',
        actionText: 'Update Payment',
      },
    });

    logger.info(`Payment failed for subscription ${subscriptionId}`);
  } catch (error) {
    logger.error('Error handling payment failure:', error);
  }
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!dbSubscription) return;

    // Update subscription details
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    logger.info(`Subscription updated: ${subscription.id}`);
  } catch (error) {
    logger.error('Error handling subscription update:', error);
  }
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!dbSubscription) return;

    // Downgrade to free tier
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        tier: 'FREE',
        status: 'cancelled',
        stripeSubscriptionId: null,
        autoAppliesLimit: 5,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: dbSubscription.userId,
        type: 'subscription_cancelled',
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled. You have been downgraded to the Free plan.',
        actionUrl: '/pricing',
        actionText: 'View Plans',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: dbSubscription.userId,
        action: 'subscription_cancelled',
        description: 'Subscription cancelled and downgraded to Free',
      },
    });

    logger.info(`Subscription cancelled: ${subscription.id}`);
  } catch (error) {
    logger.error('Error handling subscription deletion:', error);
  }
}

export default router;
