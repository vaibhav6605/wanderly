// Runs before any test file's imports — sets fake-but-deterministic JWT
// secrets so config/env.js never reads undefined. Mirrors NODE_ENV=test's
// other free pass (no MONGO_URI needed to import app.js): tests shouldn't
// depend on real secrets existing in the environment/CI at all.
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret'
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret'

// The auth rate limiters default to a strict production ceiling (10 req/
// 15min) that a thorough auth test file legitimately exceeds in normal
// assertions — raise it here rather than weakening the real default.
process.env.AUTH_RATE_LIMIT_MAX ||= '1000'
process.env.REFRESH_RATE_LIMIT_MAX ||= '1000'

// Payments tests mock Stripe but still need a non-empty key so getStripe()
// passes the "is Stripe configured?" guard before handing off to the mock.
process.env.STRIPE_SECRET_KEY ||= 'sk_test_fake_key_for_tests'
