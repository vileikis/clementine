/**
 * ThemedTextarea Component
 *
 * Multi-line text input primitive that applies theme styles.
 * Supports context-based theming or direct theme prop override.
 *
 * @example
 * ```tsx
 * // Within ThemeProvider - uses context
 * <ThemedTextarea placeholder="Enter your message" rows={4} />
 *
 * // Without provider - pass theme directly
 * <ThemedTextarea theme={previewTheme} placeholder="Preview" />
 * ```
 */

import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import { BUTTON_RADIUS_MAP } from '../../constants'
import type { CSSProperties, TextareaHTMLAttributes } from 'react'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

export interface ThemedTextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'style'
> {
  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

export function ThemedTextarea({
  theme: themeOverride,
  className,
  disabled,
  rows = 4,
  ...props
}: ThemedTextareaProps) {
  const theme = useThemeWithOverride(themeOverride)

  const borderRadius = BUTTON_RADIUS_MAP[theme.button.radius]

  const style: CSSProperties = {
    color: theme.text.color,
    backgroundColor: `color-mix(in srgb, ${theme.text.color} 5%, transparent)`,
    borderColor: `color-mix(in srgb, ${theme.text.color} 30%, transparent)`,
    borderRadius,
    fontFamily: 'inherit',
  }

  return (
    <textarea
      disabled={disabled}
      rows={rows}
      className={cn(
        'w-full px-4 py-3 text-base',
        'border transition-colors resize-none',
        'placeholder:opacity-50',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={style}
      {...props}
    />
  )
}
