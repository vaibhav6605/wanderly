import { ApiError } from '#utils/ApiError.js'
import { roleHasPermission } from '#config/permissions.js'

// Must run after `authenticate` — relies on req.user.role. Checks the
// permission catalog, not a role string, so routes stay correct even if
// the role->permission mapping changes later.
export function requirePermission(...permissions) {
  return (req, res, next) => {
    const role = req.user?.role
    const allowed =
      Boolean(role) && permissions.every((permission) => roleHasPermission(role, permission))

    if (!allowed) {
      return next(ApiError.forbidden('You do not have permission to perform this action'))
    }
    next()
  }
}
