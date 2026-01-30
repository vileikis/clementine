/**
 * ThemedProgressBar Component
 *
 * Progress indicator primitive that applies theme primary color and text color.
 * Supports context-based theming or direct theme prop override.
 *
 * @example
 * ```tsx
 * // Within ThemeProvider - uses context
 * <ThemedProgressBar value={50} />
 *
 * // Without provider - pass theme directly
 * <ThemedProgressBar value={75} theme={previewTheme} />
 *
 * // With custom accessibility label
 * <ThemedProgressBar
 *   value={33}
 *   getValueLabel={(value) => `Step ${value} of 100`}
 * />
 *
 * // Indeterminate state
 * <ThemedProgressBar value={null} />
 * ```
 */

import * as ProgressPrimitive from '@radix-ui/react-progress'
import { BUTTON_RADIUS_MAP } from '../../constants'
import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

export interface ThemedProgressBarProps {
  /**
   * Current progress value (0-100)
   * - 0 = no progress
   * - 100 = complete
   * - null/undefined = indeterminate state
   */
  value?: number | null

  /**
   * Maximum value for progress calculation
   * @default 100
   */
  max?: number

  /**
   * Custom accessibility label generator
   * @param value - Current progress value
   * @param max - Maximum value
   * @returns Descriptive string for screen readers
   * @example (value, max) => `Upload ${value}% complete`
   */
  getValueLabel?: (value: number, max: number) => string

  /**
   * Theme override for use without ThemeProvider
   * Allows component to work in isolation for testing/preview
   */
  theme?: Theme

  /**
   * Additional CSS classes for root container
   * Applied to Progress.Root element
   */
  className?: string

  /**
   * Additional CSS classes for progress indicator bar
   * Applied to Progress.Indicator element
   */
  indicatorClassName?: string
}

/**
 * ThemedProgressBar - Themed progress indicator using Radix UI Progress
 *
 * Applies theme.primaryColor to the progress indicator and theme.text.color
 * (at 10% opacity) to the track background. Border radius follows
 * theme.button.radius setting for visual consistency.
 *
 * Accessibility features (provided by Radix UI):
 * - role="progressbar"
 * - aria-valuemin, aria-valuemax, aria-valuenow
 * - Custom aria-valuetext via getValueLabel prop
 */
export function ThemedProgressBar({
  value,
  max = 100,
  getValueLabel,
  theme: themeOverride,
  className,
  indicatorClassName,
}: ThemedProgressBarProps) {
  const theme = useThemeWithOverride(themeOverride)
  const borderRadius = BUTTON_RADIUS_MAP[theme.button.radius]

  // Clamp value to 0-100 range for percentage display
  const clampedValue =
    value !== null && value !== undefined
      ? Math.max(0, Math.min(100, value))
      : null

  return (
    <ProgressPrimitive.Root
      value={clampedValue}
      max={max}
      getValueLabel={getValueLabel}
      className={cn('relative h-2 w-full overflow-hidden', className)}
      style={{
        backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
        borderRadius,
      }}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full transition-all duration-300 ease-out',
          indicatorClassName,
        )}
        style={{
          backgroundColor: theme.primaryColor,
          borderRadius,
          transform: `translateX(-${100 - (clampedValue || 0)}%)`,
        }}
      />
    </ProgressPrimitive.Root>
  )
}
