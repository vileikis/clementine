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
 *
 * // Style variants
 * <ThemedButton variant="primary">Primary Action</ThemedButton>
 * <ThemedButton variant="outline">Secondary Action</ThemedButton>
 * ```
 */

import { BUTTON_RADIUS_MAP } from '../../constants'
import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

/** Button size variants */
export type ButtonSize = 'sm' | 'md' | 'lg'

/** Button style variants */
export type ButtonVariant = 'primary' | 'outline'

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
  /** Button style variant (defaults to 'primary') */
  variant?: ButtonVariant
  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

export function ThemedButton({
  children,
  size = 'md',
  variant = 'primary',
  theme: themeOverride,
  className,
  disabled,
  type = 'button',
  ...props
}: ThemedButtonProps) {
  const theme = useThemeWithOverride(themeOverride)

  // Compute button colors with fallback
  const primaryBgColor = theme.button.backgroundColor ?? theme.primaryColor
  const primaryTextColor = theme.button.textColor
  const borderRadius = BUTTON_RADIUS_MAP[theme.button.radius]

  // Style based on variant
  const style: CSSProperties =
    variant === 'primary'
      ? {
          backgroundColor: primaryBgColor,
          color: primaryTextColor,
          borderRadius,
          fontFamily: theme.fontFamily ?? undefined,
        }
      : {
          backgroundColor: 'transparent',
          color: theme.text.color,
          borderRadius,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: `color-mix(in srgb, ${theme.text.color} 30%, transparent)`,
          fontFamily: theme.fontFamily ?? undefined,
        }

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        SIZE_CLASSES[size],
        'inline-flex items-center justify-center',
        'font-bold transition-opacity',
        variant === 'primary' && 'shadow-sm',
        'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2',
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
