import { z } from 'zod'

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(50),
    description: z.string().trim().max(300).optional(),
    icon: z.string().trim().optional(),
  }),
})

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().max(300).nullish(),
    icon: z.string().trim().nullish(),
    isActive: z.boolean().optional(),
  }),
})

export const categoryIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})
