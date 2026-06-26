import { Category } from '#models/Category.js'
import { Tour } from '#models/Tour.js'
import { ApiError } from '#utils/ApiError.js'

export async function listCategories({ includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true }
  return Category.find(filter).sort({ name: 1 })
}

export async function createCategory({ name, description, icon }) {
  const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
  if (existing) throw ApiError.conflict('A category with that name already exists')
  return Category.create({ name, description, icon })
}

export async function updateCategory(id, updates) {
  const category = await Category.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
  if (!category) throw ApiError.notFound('Category not found')
  return category
}

export async function deleteCategory(id) {
  const inUse = await Tour.exists({ category: id })
  if (inUse) throw ApiError.conflict('Category is in use by one or more tours')
  const category = await Category.findByIdAndDelete(id)
  if (!category) throw ApiError.notFound('Category not found')
}
