import { z } from 'zod'

// bcrypt silently truncates/ignores input past 72 bytes — capping length
// here means a user's actual password is never longer than what bcrypt
// will faithfully hash, avoiding a confusing "two different long passwords
// hash the same" edge case.
const passwordField = z.string().min(8).max(72)

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(50),
    email: z.string().trim().toLowerCase().email(),
    password: passwordField,
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
  }),
})

export const verifyEmailSchema = z.object({
  body: z.object({ token: z.string().min(10) }),
})

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().trim().toLowerCase().email() }),
})

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    newPassword: passwordField,
  }),
})
