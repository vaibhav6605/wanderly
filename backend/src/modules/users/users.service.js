import { User } from '#models/User.js'
import { ApiError } from '#utils/ApiError.js'
import { sanitizeUser } from '#utils/sanitizeUser.js'

export async function listUsers({ page, limit, role }) {
  const filter = role ? { role } : {}
  const [users, totalCount] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ])

  return { users: users.map(sanitizeUser), meta: { page, limit, totalCount } }
}

export async function getUserById(id) {
  const user = await User.findById(id)
  if (!user) {
    throw ApiError.notFound('User not found')
  }
  return sanitizeUser(user)
}

export async function setUserBanned(id, isBanned) {
  const user = await User.findById(id)
  if (!user) {
    throw ApiError.notFound('User not found')
  }

  user.isBanned = isBanned
  // Banning revokes every active session immediately — same principle as
  // the password-reset session wipe in auth.service.js.
  if (isBanned) {
    user.refreshTokens = []
  }
  await user.save()
  return sanitizeUser(user)
}

export async function setUserRole(id, role) {
  const user = await User.findById(id)
  if (!user) {
    throw ApiError.notFound('User not found')
  }

  user.role = role
  await user.save()
  return sanitizeUser(user)
}

export async function updateOwnProfile(userId, updates) {
  const user = await User.findById(userId)
  if (!user) {
    throw ApiError.notFound('User not found')
  }

  if (updates.name !== undefined) user.name = updates.name
  if (updates.phone !== undefined) user.phone = updates.phone
  await user.save()
  return sanitizeUser(user)
}
