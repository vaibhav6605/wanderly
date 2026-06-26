import { Coupon } from '#models/Coupon.js'
import { ApiError } from '#utils/ApiError.js'

export async function listCoupons({ page = 1, limit = 20, isActive } = {}) {
  const filter = isActive !== undefined ? { isActive } : {}
  const [coupons, totalCount] = await Promise.all([
    Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Coupon.countDocuments(filter),
  ])
  return { coupons, meta: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) } }
}

export async function createCoupon(data) {
  const existing = await Coupon.findOne({ code: data.code })
  if (existing) throw ApiError.conflict('A coupon with that code already exists')
  return Coupon.create(data)
}

export async function updateCoupon(id, updates) {
  if (updates.code) {
    const conflict = await Coupon.findOne({ code: updates.code, _id: { $ne: id } })
    if (conflict) throw ApiError.conflict('A coupon with that code already exists')
  }
  const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
  if (!coupon) throw ApiError.notFound('Coupon not found')
  return coupon
}

export async function deleteCoupon(id) {
  const coupon = await Coupon.findByIdAndDelete(id)
  if (!coupon) throw ApiError.notFound('Coupon not found')
}
