/**
 * ThemedButton Component
 *
 * Button primitive that applies theme button styles.
 * Supports context-based theming or direct theme prop override.
 *
 * @example
 * ```tsx
 * // Within ThemeProvider - uses context
 * <ThemedButton onClick={handleClick}>Get Started</ThemedButton>
 *
 * // Without provider - pass theme directly
 * <ThemedButton theme={previewTheme}>Preview Button</ThemedButton>
 *
 * // Size variants
 * <ThemedButton size="lg">Large Button</ThemedButton>
 * <ThemedButton size="sm">Small Button</ThemedButton>
 * ```
 */

import { BUTTON_RADIUS_MAP } from '../../constants'
import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

/** Button size variants */
export type ButtonSize = 'sm' | 'md' | 'lg'

/** Size-based Tailwind classes for padding and font size */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export interface ThemedButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style'
> {
  /** Button content */
  children: ReactNode
  /** Button size variant (defaults to 'md') */
  size?: ButtonSize
  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

export function ThemedButton({
  children,
  size = 'md',
  theme: themeOverride,
  className,
  disabled,
  type = 'button',
  ...props
}: ThemedButtonProps) {
  const theme = useThemeWithOverride(themeOverride)

  // Compute button colors with fallback
  const backgroundColor = theme.button.backgroundColor ?? theme.primaryColor
  const textColor = theme.button.textColor
  const borderRadius = BUTTON_RADIUS_MAP[theme.button.radius]

  const style: CSSProperties = {
    backgroundColor,
    color: textColor,
    borderRadius,
    fontFamily: theme.fontFamily ?? undefined,
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        SIZE_CLASSES[size],
        'font-bold shadow-sm transition-opacity',
        'hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </button>
  )
}
