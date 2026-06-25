import { ApiError } from '#utils/ApiError.js'
import { asyncHandler } from '#utils/asyncHandler.js'
import { roleHasPermission } from '#config/permissions.js'

// Role tells you WHAT a user is allowed to do in general; it can't tell you
// whether THIS specific booking/review/etc. belongs to them. This is that
// second check — "is this user the owner, or do they hold the admin-level
// permission that bypasses ownership entirely" (e.g. MANAGE_BOOKINGS lets
// an admin act on anyone's booking, not just their own).
//
// Loads the resource once and attaches it to req.resource so the
// controller that runs next doesn't have to fetch it again.
export function requireOwnership(
  model,
  { idParam = 'id', ownerField = 'user', bypassPermission } = {},
) {
  return asyncHandler(async (req, res, next) => {
    const resource = await model.findById(req.params[idParam])
    if (!resource) {
      throw ApiError.notFound('Resource not found')
    }

    const isOwner = resource[ownerField]?.toString() === req.user?.id
    const hasBypass =
      Boolean(bypassPermission) && roleHasPermission(req.user?.role, bypassPermission)

    if (!isOwner && !hasBypass) {
      throw ApiError.forbidden('You do not have permission to access this resource')
    }

    req.resource = resource
    next()
  })
}
