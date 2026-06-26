/**
 * Lightweight in-memory TTL cache for public GET responses.
 *
 * Keys are arbitrary strings; entries expire silently on next
 * access. Private class fields keep the internals out of DevTools.
 */
class ApiCache {
  #entries = new Map()

  get(key) {
    const entry = this.#entries.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.#entries.delete(key)
      return null
    }
    return entry.data
  }

  set(key, data, ttlMs) {
    this.#entries.set(key, { data, expiresAt: Date.now() + ttlMs })
  }

  /** Remove all entries whose key starts with `prefix`. */
  invalidatePrefix(prefix) {
    for (const key of this.#entries.keys()) {
      if (key.startsWith(prefix)) this.#entries.delete(key)
    }
  }

  delete(key) {
    this.#entries.delete(key)
  }

  clear() {
    this.#entries.clear()
  }
}

export const apiCache = new ApiCache()
