import { PERMISSIONS, ROLE_PERMISSIONS, roleHasPermission } from '../../src/config/permissions.js'
import { requirePermission } from '../../src/middlewares/requirePermission.js'

describe('roleHasPermission', () => {
  it('grants admin every permission in the catalog', () => {
    for (const permission of Object.values(PERMISSIONS)) {
      expect(roleHasPermission('admin', permission)).toBe(true)
    }
  })

  it('grants user only the consumer-facing permissions', () => {
    expect(roleHasPermission('user', PERMISSIONS.BOOK_TOURS)).toBe(true)
    expect(roleHasPermission('user', PERMISSIONS.REVIEW_TOURS)).toBe(true)
    expect(roleHasPermission('user', PERMISSIONS.MANAGE_WISHLIST)).toBe(true)
    expect(roleHasPermission('user', PERMISSIONS.MANAGE_OWN_PROFILE)).toBe(true)
  })

  it('denies user every manage:* admin permission', () => {
    const manageOnlyPermissions = Object.values(PERMISSIONS).filter(
      (permission) => !ROLE_PERMISSIONS.user.includes(permission),
    )
    for (const permission of manageOnlyPermissions) {
      expect(roleHasPermission('user', permission)).toBe(false)
    }
  })

  it('returns false for an unknown role rather than throwing', () => {
    expect(roleHasPermission('superadmin', PERMISSIONS.MANAGE_USERS)).toBe(false)
    expect(roleHasPermission(undefined, PERMISSIONS.MANAGE_USERS)).toBe(false)
  })
})

describe('requirePermission middleware', () => {
  it('allows a role that holds the permission', () => {
    const next = jest.fn()
    requirePermission(PERMISSIONS.MANAGE_TOURS)({ user: { role: 'admin' } }, {}, next)
    expect(next).toHaveBeenCalledWith()
  })

  it('rejects a role missing the permission with 403', () => {
    const next = jest.fn()
    requirePermission(PERMISSIONS.MANAGE_TOURS)({ user: { role: 'user' } }, {}, next)
    expect(next.mock.calls[0][0].statusCode).toBe(403)
  })

  it('rejects when req.user is missing (ran before authenticate)', () => {
    const next = jest.fn()
    requirePermission(PERMISSIONS.MANAGE_OWN_PROFILE)({}, {}, next)
    expect(next.mock.calls[0][0].statusCode).toBe(403)
  })

  it('requires ALL listed permissions, not just one', () => {
    const next = jest.fn()
    // user holds MANAGE_WISHLIST but not MANAGE_TOURS
    requirePermission(PERMISSIONS.MANAGE_WISHLIST, PERMISSIONS.MANAGE_TOURS)(
      { user: { role: 'user' } },
      {},
      next,
    )
    expect(next.mock.calls[0][0].statusCode).toBe(403)
  })
})
