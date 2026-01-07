/**
 * useThemeWithOverride Hook
 *
 * Internal utility hook for themed primitives.
 * Resolves theme from either prop override or context.
 *
 * @internal Not exported from public API - use within themed components only
 */
import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import type { Theme } from '../types'

/**
 * Resolves theme from prop override or context.
 *
 * Priority:
 * 1. Prop override (if provided) - for preview/storybook usage
 * 2. Context value (if ThemeProvider exists) - for guest flows
 * 3. Throws error (if neither available)
 *
 * @param themeOverride - Optional theme to use instead of context
 * @returns Resolved Theme object
 * @throws Error if no theme available from prop or context
 *
 * @example
 * ```tsx
 * // Within a themed component
 * function ThemedButton({ theme: themeOverride, ...props }: ThemedButtonProps) {
 *   const theme = useThemeWithOverride(themeOverride)
 *   // Use theme values...
 * }
 * ```
 */
export function useThemeWithOverride(themeOverride?: Theme): Theme {
  const context = useContext(ThemeContext)

  // Priority 1: Prop override
  if (themeOverride) {
    return themeOverride
  }

  // Priority 2: Context value
  if (context?.theme) {
    return context.theme
  }

  // No theme available - throw helpful error
  throw new Error(
    'Themed components require either a ThemeProvider ancestor or a theme prop',
  )
}
