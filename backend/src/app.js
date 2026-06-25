import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { env } from '#config/env.js'
import { notFound } from '#middlewares/notFound.js'
import { errorHandler } from '#middlewares/errorHandler.js'

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.clientOrigin, credentials: true }))
app.use(express.json())
app.use(cookieParser())

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'))
}

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok', uptime: process.uptime() } })
})

app.use(notFound)
app.use(errorHandler)
