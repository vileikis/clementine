/**
 * ThemedIconButton Component
 *
 * Circular icon button primitive that applies theme styles.
 * Designed for share buttons, social media icons, and other icon-only actions.
 * Maintains 44px touch targets per mobile-first design guidelines.
 *
 * @example
 * ```tsx
 * // Within ThemeProvider - uses context
 * <ThemedIconButton onClick={handleShare} aria-label="Share on Instagram">
 *   <InstagramIcon className="h-5 w-5" />
 * </ThemedIconButton>
 *
 * // Without provider - pass theme directly
 * <ThemedIconButton theme={previewTheme} aria-label="Download">
 *   <DownloadIcon className="h-5 w-5" />
 * </ThemedIconButton>
 *
 * // Size variants
 * <ThemedIconButton size="sm" aria-label="Copy">
 *   <CopyIcon className="h-4 w-4" />
 * </ThemedIconButton>
 *
 * // Style variants
 * <ThemedIconButton variant="primary" aria-label="Share">
 *   <ShareIcon className="h-5 w-5" />
 * </ThemedIconButton>
 * <ThemedIconButton variant="outline" aria-label="Copy">
 *   <CopyIcon className="h-5 w-5" />
 * </ThemedIconButton>
 * ```
 */

import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

/** Icon button size variants */
export type IconButtonSize = 'sm' | 'md' | 'lg'

/** Icon button style variants */
export type IconButtonVariant = 'primary' | 'outline'

/** Size-based dimensions (maintaining touch targets) */
const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'h-9 w-9', // 36px
  md: 'h-11 w-11', // 44px (default touch target)
  lg: 'h-14 w-14', // 56px
}

export interface ThemedIconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style'
> {
  /** Icon content */
  children: ReactNode
  /** Button size variant (defaults to 'md' - 44px touch target) */
  size?: IconButtonSize
  /** Button style variant (defaults to 'outline') */
  variant?: IconButtonVariant
  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

export function ThemedIconButton({
  children,
  size = 'md',
  variant = 'outline',
  theme: themeOverride,
  className,
  disabled,
  type = 'button',
  ...props
}: ThemedIconButtonProps) {
  const theme = useThemeWithOverride(themeOverride)

  // Compute button colors with fallback
  const primaryBgColor = theme.button.backgroundColor ?? theme.primaryColor
  const primaryTextColor = theme.button.textColor

  // Style based on variant
  const style: CSSProperties =
    variant === 'primary'
      ? {
          backgroundColor: primaryBgColor,
          color: primaryTextColor,
        }
      : {
          backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
          color: theme.text.color,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: `color-mix(in srgb, ${theme.text.color} 40%, transparent)`,
        }

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        SIZE_CLASSES[size],
        'flex items-center justify-center',
        'rounded-full',
        'transition-all duration-150 ease-out',
        'hover:scale-[1.06] hover:opacity-90 active:scale-[0.93] active:duration-75',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </button>
  )
}
