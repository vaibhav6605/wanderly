import mongoose from 'mongoose'
import { Tour } from '#models/Tour.js'
import { Category } from '#models/Category.js'
import { Destination } from '#models/Destination.js'
import { ApiError } from '#utils/ApiError.js'

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { avgRating: -1 },
  popular: { bookingsCount: -1 },
  title: { title: 1 },
}

const TOUR_POPULATE = [
  { path: 'category', select: 'name slug icon' },
  { path: 'destinations', select: 'name country city' },
]

// ── Listing ────────────────────────────────────────────────────────────────

export async function listTours({
  search,
  category,
  difficulty,
  destinations,
  minPrice,
  maxPrice,
  currency,
  sort = 'newest',
  page = 1,
  limit = 12,
  showAll = false,
}) {
  const filter = {}

  if (!showAll) filter.isActive = true
  if (search) filter.$text = { $search: search }
  if (category) filter.category = category
  if (difficulty) {
    const values = difficulty.split(',').map((s) => s.trim()).filter(Boolean)
    filter.difficulty = values.length === 1 ? values[0] : { $in: values }
  }
  if (destinations) {
    const ids = destinations.split(',').map((s) => s.trim()).filter(Boolean)
    if (ids.length) filter.destinations = { $in: ids }
  }
  if (minPrice != null) filter.price = { ...filter.price, $gte: Number(minPrice) }
  if (maxPrice != null) filter.price = { ...filter.price, $lte: Number(maxPrice) }
  if (currency) filter.currency = currency

  const sortObj = SORT_MAP[sort] ?? SORT_MAP.newest
  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.min(100, Math.max(1, Number(limit)))
  const skip = (pageNum - 1) * limitNum

  const [tours, total] = await Promise.all([
    Tour.find(filter).populate(TOUR_POPULATE).sort(sortObj).skip(skip).limit(limitNum).lean(),
    Tour.countDocuments(filter),
  ])

  return {
    tours,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  }
}

// ── Single tour ────────────────────────────────────────────────────────────

export async function getTour(id) {
  const isId = mongoose.isValidObjectId(id)
  const query = isId ? { _id: id } : { slug: id, isActive: true }

  const tour = await Tour.findOne(query)
    .populate(TOUR_POPULATE)
    .populate('createdBy', 'name')
    .lean()

  if (!tour) throw ApiError.notFound('Tour not found')
  return tour
}

// ── Related & recommended ──────────────────────────────────────────────────

export async function getRelatedTours(tourId) {
  const source = await Tour.findById(tourId).select('category').lean()
  if (!source) throw ApiError.notFound('Tour not found')

  return Tour.find({ _id: { $ne: tourId }, category: source.category, isActive: true })
    .populate(TOUR_POPULATE)
    .sort({ avgRating: -1 })
    .limit(4)
    .lean()
}

export async function getRecommended() {
  const tours = await Tour.find({ isActive: true, avgRating: { $gte: 4 } })
    .populate(TOUR_POPULATE)
    .sort({ avgRating: -1, bookingsCount: -1 })
    .limit(8)
    .lean()

  if (tours.length < 4) {
    return Tour.find({ isActive: true })
      .populate(TOUR_POPULATE)
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()
  }

  return tours
}

// ── Reference data ─────────────────────────────────────────────────────────

export async function getCategories() {
  return Category.find({ isActive: true }).sort({ name: 1 }).lean()
}

export async function getDestinations(search) {
  const filter = { isActive: true }
  if (search) filter.$text = { $search: search }
  return Destination.find(filter).sort({ name: 1 }).limit(100).lean()
}

// ── Admin CRUD ─────────────────────────────────────────────────────────────

export async function createTour(data, createdBy) {
  const tour = new Tour({ ...data, createdBy })
  await tour.save()
  await tour.populate(TOUR_POPULATE)
  return tour.toObject()
}

export async function updateTour(id, data) {
  const tour = await Tour.findByIdAndUpdate(id, { $set: data }, {
    new: true,
    runValidators: true,
  })
    .populate(TOUR_POPULATE)
    .lean()

  if (!tour) throw ApiError.notFound('Tour not found')
  return tour
}

export async function deleteTour(id) {
  const tour = await Tour.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean()
  if (!tour) throw ApiError.notFound('Tour not found')
}
