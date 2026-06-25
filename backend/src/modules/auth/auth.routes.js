import { Router } from 'express'
import * as authController from './auth.controller.js'
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation.js'
import { validate } from '#middlewares/validate.js'
import { authenticate } from '#middlewares/authenticate.js'
import { createRateLimiter } from '#middlewares/rateLimiter.js'
import { env } from '#config/env.js'

const router = Router()

// Tighter than the global apiLimiter — these are the brute-force/abuse-prone
// endpoints (credential stuffing on login, email-bombing via forgot-password).
const authLimiter = createRateLimiter(env.authRateLimit)
const refreshLimiter = createRateLimiter(env.refreshRateLimit)

router.post('/register', authLimiter, validate(registerSchema), authController.register)
router.post('/login', authLimiter, validate(loginSchema), authController.login)
router.post('/refresh', refreshLimiter, authController.refresh)
router.post('/logout', authController.logout)
router.get('/me', authenticate, authController.me)
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail)
router.post('/resend-verification', authenticate, authLimiter, authController.resendVerification)
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
)
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword)

export default router
