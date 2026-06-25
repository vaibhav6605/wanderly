import { Router } from 'express'
import * as usersController from './users.controller.js'
import {
  listUsersQuerySchema,
  banUserSchema,
  updateUserRoleSchema,
  updateOwnProfileSchema,
} from './users.validation.js'
import { validate } from '#middlewares/validate.js'
import { authenticate } from '#middlewares/authenticate.js'
import { requirePermission } from '#middlewares/requirePermission.js'
import { PERMISSIONS } from '#config/permissions.js'

const router = Router()

// /me first — registered before /:id so it can never be shadowed by it.
router.patch(
  '/me',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_OWN_PROFILE),
  validate(updateOwnProfileSchema),
  usersController.updateMe,
)

// Everything below is admin-only (MANAGE_USERS) — there is deliberately no
// "view another user's profile" path for regular users; /me is the only
// self-service route, by design, to avoid even an ownership-checked /:id
// turning into an enumeration/IDOR surface.
router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  validate(listUsersQuerySchema),
  usersController.listUsers,
)
router.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  usersController.getUser,
)
router.patch(
  '/:id/ban',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  validate(banUserSchema),
  usersController.setBanned,
)
router.patch(
  '/:id/role',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  validate(updateUserRoleSchema),
  usersController.setRole,
)

export default router
