/**
 * useDebounce Hook
 *
 * Debounces a value, returning the debounced value after a specified delay.
 * Useful for auto-save functionality and search inputs.
 */
import { useEffect, useState } from 'react'

/**
 * Debounce a value
 *
 * Returns the debounced value after the specified delay.
 * If the value changes before the delay expires, the timer resets.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [search, setSearch] = useState('')
 *   const debouncedSearch = useDebounce(search, 300)
 *
 *   useEffect(() => {
 *     // Only triggers after 300ms of no typing
 *     fetchResults(debouncedSearch)
 *   }, [debouncedSearch])
 *
 *   return <input value={search} onChange={(e) => setSearch(e.target.value)} />
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up timeout to update debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clear timeout if value changes before delay expires
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
