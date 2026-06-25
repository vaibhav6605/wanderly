export function ApiResponse(data, meta = {}) {
  return { success: true, data, meta }
}
