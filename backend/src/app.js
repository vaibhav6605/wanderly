import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { corsOptions } from '#config/corsOptions.js'
import { httpLogger } from '#middlewares/httpLogger.js'
import { apiLimiter } from '#middlewares/rateLimiter.js'
import { notFound } from '#middlewares/notFound.js'
import { errorHandler } from '#middlewares/errorHandler.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { stripeWebhookHandler } from '#webhooks/stripe.webhook.js'
import authRouter from '#modules/auth/auth.routes.js'
import usersRouter from '#modules/users/users.routes.js'
import toursRouter from '#modules/listings/listings.routes.js'
import bookingsRouter from '#modules/bookings/bookings.routes.js'
import paymentsRouter from '#modules/payments/payments.routes.js'
import adminRouter from '#modules/admin/admin.routes.js'
import reviewsRouter from '#modules/reviews/reviews.routes.js'
import categoriesRouter from '#modules/categories/categories.routes.js'
import couponsRouter from '#modules/coupons/coupons.routes.js'
import notificationsRouter from '#modules/notifications/notifications.routes.js'
import wishlistRouter from '#modules/wishlist/wishlist.routes.js'

export const app = express()

app.set('trust proxy', 1)

app.use(helmet())
app.use(cors(corsOptions))
app.use(compression())
app.use(httpLogger)
app.use(apiLimiter)

// ── Stripe webhook — MUST be registered before express.json() ─────────────
// Stripe's signature verification requires the raw, unparsed request body.
// express.raw() reads it as a Buffer and leaves it on req.body so the
// handler can pass it verbatim to stripe.webhooks.constructEvent().
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler)

// ── Body parsing for all other routes ─────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

app.get('/health', (req, res) => {
  ApiResponse.send(res, 200, { status: 'ok', uptime: process.uptime() })
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/tours', toursRouter)
app.use('/api/v1/bookings', bookingsRouter)
app.use('/api/v1/payments', paymentsRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/reviews', reviewsRouter)
app.use('/api/v1/categories', categoriesRouter)
app.use('/api/v1/coupons', couponsRouter)
app.use('/api/v1/notifications', notificationsRouter)
app.use('/api/v1/wishlist', wishlistRouter)

app.use(notFound)
app.use(errorHandler)
