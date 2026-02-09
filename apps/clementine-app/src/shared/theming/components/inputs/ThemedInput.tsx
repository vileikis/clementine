/**
 * ThemedInput Component
 *
 * Text input primitive that applies theme styles.
 * Supports context-based theming or direct theme prop override.
 *
 * @example
 * ```tsx
 * // Within ThemeProvider - uses context
 * <ThemedInput placeholder="Enter your name" />
 *
 * // Without provider - pass theme directly
 * <ThemedInput theme={previewTheme} placeholder="Preview" />
 *
 * // Controlled input
 * <ThemedInput value={value} onChange={(e) => setValue(e.target.value)} />
 * ```
 */

import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import { BUTTON_RADIUS_MAP } from '../../constants'
import type { CSSProperties, InputHTMLAttributes } from 'react'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

export interface ThemedInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'style'
> {
  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

export function ThemedInput({
  theme: themeOverride,
  className,
  disabled,
  ...props
}: ThemedInputProps) {
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
    <input
      disabled={disabled}
      className={cn(
        'w-full px-4 py-3 text-base',
        'border transition-colors',
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
