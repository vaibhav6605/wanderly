import { ApiError } from '#utils/ApiError.js'

// Usage: validate(z.object({ body: z.object({...}), params: z.object({...}) }))
// Only the parts of the request a schema actually defines get validated AND
// overwritten with the parsed/coerced result — this also doubles as
// mass-assignment protection, since Zod strips any key the schema didn't
// declare (e.g. a registration payload sneaking in `role: 'admin'`).
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    })

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
      return next(ApiError.unprocessable('Validation failed', details))
    }

    if (result.data.body !== undefined) req.body = result.data.body
    if (result.data.query !== undefined) req.query = result.data.query
    if (result.data.params !== undefined) req.params = result.data.params

    next()
  }
}
