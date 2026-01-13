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
 * ```
 */

import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

/** Icon button size variants */
export type IconButtonSize = 'sm' | 'md' | 'lg'

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
  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

export function ThemedIconButton({
  children,
  size = 'md',
  theme: themeOverride,
  className,
  disabled,
  type = 'button',
  ...props
}: ThemedIconButtonProps) {
  const theme = useThemeWithOverride(themeOverride)

  const style: CSSProperties = {
    color: theme.text.color,
    borderColor: `color-mix(in srgb, ${theme.text.color} 25%, transparent)`,
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        SIZE_CLASSES[size],
        'flex items-center justify-center',
        'rounded-full border',
        'transition-colors',
        'hover:bg-current/10',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
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
