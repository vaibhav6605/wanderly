// Matches the response envelope documented in the architecture: every 2xx
// payload is { success, data, meta }, mirrored by errorHandler's
// { success: false, error } shape for failures.
export class ApiResponse {
  constructor(data = null, meta = {}) {
    this.success = true
    this.data = data
    this.meta = meta
  }

  static send(res, statusCode, data, meta = {}) {
    return res.status(statusCode).json(new ApiResponse(data, meta))
  }
}
