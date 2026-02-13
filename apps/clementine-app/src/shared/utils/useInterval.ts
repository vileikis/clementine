import { useEffect, useRef } from 'react'

/**
 * Declarative setInterval hook.
 *
 * Pass `null` as delay to pause the interval.
 * The callback ref is kept up to date so the latest closure is always called.
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  // Always keep the ref fresh so callers don't need to memoize
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}
