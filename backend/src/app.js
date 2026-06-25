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

export const app = express()

// Railway/Vercel sit behind a reverse proxy; trust exactly one hop so
// req.ip (and therefore the rate limiter) reads the real client IP from
// X-Forwarded-For instead of the proxy's own address.
app.set('trust proxy', 1)

// 1. Security headers — set before anything else touches the response.
app.use(helmet())

// 2. Cross-origin access control — only configured origin(s) may call this
//    API with credentials (cookies).
app.use(cors(corsOptions))

// 3. Compress every response body.
app.use(compression())

// 4. Structured request logging — log the attempt even if it's about to be
//    rate-limited or rejected by a later middleware.
app.use(httpLogger)

// 5. Throttle abusive clients before spending CPU on body parsing.
app.use(apiLimiter)

// 6. Body parsing. JSON only — this API never accepts traditional HTML
//    form posts, and file uploads go straight to Cloudinary, not through us.
app.use(express.json({ limit: '10kb' }))

// 7. Reads the httpOnly refresh-token cookie set during login (auth phase).
app.use(cookieParser())

app.get('/health', (req, res) => {
  ApiResponse.send(res, 200, { status: 'ok', uptime: process.uptime() })
})

// Future: app.use('/api/v1/auth', authRouter), etc.

// 8. No route matched.
app.use(notFound)

// 9. Always last — catches everything thrown or passed to next() above.
app.use(errorHandler)
