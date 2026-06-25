import morgan from 'morgan'
import { logger } from '#config/logger.js'
import { env } from '#config/env.js'

// Pipe morgan's access-log lines through Winston instead of straight to
// stdout, so request logs share the same level/format pipeline as everything
// else the app logs (and can be filtered/silenced the same way in tests).
const stream = {
  write: (message) => logger.http(message.trim()),
}

export const httpLogger = morgan(env.isProduction ? 'combined' : 'dev', { stream })
