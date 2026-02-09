/**
 * ThemedScaleButton Component
 *
 * Scale/rating button primitive for opinion scales.
 * Supports context-based theming or direct theme prop override.
 *
 * @example
 * ```tsx
 * // Within ThemeProvider - uses context
 * <ThemedScaleButton value={1} selected={rating === 1} onClick={() => setRating(1)} />
 *
 * // Disabled in edit mode
 * <ThemedScaleButton value={5} disabled />
 * ```
 */

import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import { BUTTON_RADIUS_MAP } from '../../constants'
import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

export interface ThemedScaleButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style'
> {
  /** The numeric value to display */
  value: number
  /** Whether this value is currently selected */
  selected?: boolean
  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

export function ThemedScaleButton({
  value,
  selected = false,
  theme: themeOverride,
  className,
  disabled,
  ...props
}: ThemedScaleButtonProps) {
  const theme = useThemeWithOverride(themeOverride)

  const borderRadius = BUTTON_RADIUS_MAP[theme.button.radius]

  const style: CSSProperties = selected
    ? {
        backgroundColor: theme.primaryColor,
        color: theme.button.textColor,
        borderColor: theme.primaryColor,
        borderRadius,
        fontFamily: 'inherit',
      }
    : {
        backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
        color: theme.text.color,
        borderColor: `color-mix(in srgb, ${theme.text.color} 30%, transparent)`,
        borderRadius,
        fontFamily: 'inherit',
      }

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex items-center justify-center',
        'h-12 w-12 text-lg font-semibold',
        'border-2 transition-all',
        'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={style}
      {...props}
    >
      {value}
    </button>
  )
}
