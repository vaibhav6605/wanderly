import nodemailer from 'nodemailer'
import { env } from './env.js'
import { logger } from './logger.js'

// No SMTP host configured (dev/test, or before prod secrets are set) —
// log the email instead of sending it, so the full auth flow is runnable
// and demoable without real SMTP credentials.
const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    })
  : null

export async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    logger.info(`[email:dev] to=${to} subject="${subject}"\n${html}`)
    return
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, html })
}
