import { z } from 'zod'

// ── Reusable subdoc schemas ────────────────────────────────────────────────

const imageSchema = z.object({
  url: z.string().min(1),
  publicId: z.string().min(1),
  order: z.coerce.number().int().min(0).default(0),
})

const itineraryItemSchema = z.object({
  day: z.coerce.number().int().min(1),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().nullable().optional(),
})

const startDateSchema = z.object({
  date: z.string().min(1),
  availableSeats: z.coerce.number().int().min(0),
  isCancelled: z.boolean().optional(),
})

// ── Tour body (shared between create and update) ───────────────────────────

const tourBodySchema = z.object({
  title: z.string().min(1).max(120).trim(),
  summary: z.string().min(1).max(300).trim(),
  description: z.string().min(1).trim(),
  category: z.string().min(1),
  destinations: z.array(z.string().min(1)).min(1),
  duration: z.object({
    days: z.coerce.number().int().min(1),
    nights: z.coerce.number().int().min(0),
  }),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().min(0).nullable().optional(),
  currency: z.enum(['USD', 'INR', 'EUR']).default('USD'),
  maxGroupSize: z.coerce.number().int().min(1),
  difficulty: z.enum(['easy', 'moderate', 'challenging', 'difficult']).default('easy'),
  images: z.array(imageSchema).default([]),
  itinerary: z.array(itineraryItemSchema).default([]),
  inclusions: z.array(z.string().trim()).default([]),
  exclusions: z.array(z.string().trim()).default([]),
  startDates: z.array(startDateSchema).default([]),
  isActive: z.boolean().default(true),
})

// ── Exported schemas ───────────────────────────────────────────────────────

export const createTourSchema = z.object({
  body: tourBodySchema,
})

export const updateTourSchema = z.object({
  body: tourBodySchema.partial(),
  params: z.object({ id: z.string().min(1) }),
})

export const listToursSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    category: z.string().optional(),
    difficulty: z.string().optional(),    // comma-separated: "easy,moderate"
    destinations: z.string().optional(),  // comma-separated ObjectIds
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    currency: z.enum(['USD', 'INR', 'EUR']).optional(),
    sort: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    showAll: z.string().optional(), // admin: 'true' to include inactive tours
  }),
})
