import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after
 * `delay` ms of inactivity. Cleans up the timer on unmount.
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
