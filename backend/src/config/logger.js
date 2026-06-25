import winston from 'winston'
import { env } from './env.js'

const { combine, timestamp, printf, colorize, json } = winston.format

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp: ts }) => `${ts} ${level}: ${message}`),
)

// Plain JSON in production so log aggregators (Railway's log viewer, or
// anything it forwards to) can parse fields instead of regexing text.
const prodFormat = combine(timestamp(), json())

export const logger = winston.createLogger({
  level: env.logLevel,
  levels: winston.config.npm.levels,
  format: env.isProduction ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
})
