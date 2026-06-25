// The permission catalog — every action the API can gate. Routes check
// permissions, never role strings directly; that's what makes adding a
// third role later (e.g. "support") a one-line change here instead of a
// grep-and-replace across every route file.
export const PERMISSIONS = Object.freeze({
  MANAGE_TOURS: 'manage:tours',
  MANAGE_BOOKINGS: 'manage:bookings',
  MANAGE_USERS: 'manage:users',
  MANAGE_PAYMENTS: 'manage:payments',
  MANAGE_REVIEWS: 'manage:reviews',
  MANAGE_COUPONS: 'manage:coupons',
  MANAGE_CATEGORIES: 'manage:categories',

  BOOK_TOURS: 'book:tours',
  REVIEW_TOURS: 'review:tours',
  MANAGE_WISHLIST: 'manage:wishlist',
  MANAGE_OWN_PROFILE: 'manage:own-profile',
})

// Admins are a superset — they can do everything a regular user can, plus
// the manage:* actions over every resource. A second role with a narrower
// admin-ish slice (e.g. a future "support" role limited to MANAGE_BOOKINGS
// and MANAGE_USERS) would just be a third array here, not a code change.
export const ROLE_PERMISSIONS = Object.freeze({
  admin: Object.freeze(Object.values(PERMISSIONS)),
  user: Object.freeze([
    PERMISSIONS.BOOK_TOURS,
    PERMISSIONS.REVIEW_TOURS,
    PERMISSIONS.MANAGE_WISHLIST,
    PERMISSIONS.MANAGE_OWN_PROFILE,
  ]),
})

export function roleHasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
