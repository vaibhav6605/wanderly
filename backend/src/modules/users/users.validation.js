import { z } from 'zod'

export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    role: z.enum(['user', 'admin']).optional(),
  }),
})

export const banUserSchema = z.object({
  body: z.object({ isBanned: z.boolean() }),
})

export const updateUserRoleSchema = z.object({
  body: z.object({ role: z.enum(['user', 'admin']) }),
})

export const updateOwnProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(50).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/)
      .optional(),
  }),
})
