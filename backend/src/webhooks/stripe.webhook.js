import Stripe from 'stripe'
import { env } from '#config/env.js'
import { logger } from '#config/logger.js'
import {
  handlePaymentSucceeded,
  handlePaymentFailed,
  handleChargeRefunded,
} from '#modules/payments/payments.service.js'

// Stripe instance used only for webhook signature verification here.
// The payments service has its own instance for API calls.
let _stripe = null
function getStripe() {
  if (!_stripe) _stripe = new Stripe(env.stripe.secretKey)
  return _stripe
}

export async function stripeWebhookHandler(req, res) {
  const sig = req.headers['stripe-signature']

  if (!env.stripe.webhookSecret) {
    logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification')
    res.status(400).json({ error: 'Webhook secret not configured' })
    return
  }

  let event
  try {
    // req.body is a raw Buffer here because the webhook route uses express.raw()
    event = getStripe().webhooks.constructEvent(req.body, sig, env.stripe.webhookSecret)
  } catch (err) {
    logger.warn(`Stripe webhook signature verification failed: ${err.message}`)
    res.status(400).send(`Webhook Error: ${err.message}`)
    return
  }

  logger.debug(`Stripe webhook received: ${event.type}`)

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object)
        break

      default:
        // Acknowledge but don't process unrecognised events
        break
    }

    res.status(200).json({ received: true })
  } catch (err) {
    // Log and return 500 so Stripe will retry the event
    logger.error(`Stripe webhook handler error for ${event.type}: ${err.message}`)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}
