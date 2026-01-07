/**
 * ThemedText Component
 *
 * Typography primitive that applies theme text styles.
 * Supports context-based theming or direct theme prop override.
 *
 * @example
 * ```tsx
 * // Within ThemeProvider - uses context
 * <ThemedText variant="heading">Welcome!</ThemedText>
 *
 * // Without provider - pass theme directly
 * <ThemedText variant="body" theme={previewTheme}>Preview text</ThemedText>
 *
 * // Custom element and alignment
 * <ThemedText variant="heading" as="h2" align="left">Subheading</ThemedText>
 * ```
 */

import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import type { CSSProperties, ElementType, ReactNode } from 'react'

import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

/** Text size variants with corresponding font sizes and weights */
export type TextVariant = 'heading' | 'body' | 'small'

/** Default element type for each variant */
const VARIANT_ELEMENTS: Record<TextVariant, ElementType> = {
  heading: 'h1',
  body: 'p',
  small: 'span',
}

/** Tailwind classes for each text variant */
const VARIANT_CLASSES: Record<TextVariant, string> = {
  heading: 'text-3xl font-bold',
  body: 'text-lg',
  small: 'text-sm opacity-75',
}

export interface ThemedTextProps {
  /** Content to render */
  children: ReactNode
  /** Text size variant (defaults to 'body') */
  variant?: TextVariant
  /** HTML element to render as (defaults based on variant) */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'
  /** Text alignment override (defaults to theme.text.alignment) */
  align?: 'left' | 'center' | 'right' | 'inherit'
  /** Additional CSS classes */
  className?: string
  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

export function ThemedText({
  children,
  variant = 'body',
  as,
  align,
  className,
  theme: themeOverride,
}: ThemedTextProps) {
  const theme = useThemeWithOverride(themeOverride)

  // Determine element type: explicit 'as' prop > variant default
  const Element = as ?? VARIANT_ELEMENTS[variant]

  // Get text alignment: explicit 'align' prop > theme.text.alignment
  const textAlign =
    align === 'inherit' ? undefined : (align ?? theme.text.alignment)

  const style: CSSProperties = {
    color: theme.text.color,
    textAlign,
    fontFamily: theme.fontFamily ?? undefined,
  }

  return (
    <Element className={cn(VARIANT_CLASSES[variant], className)} style={style}>
      {children}
    </Element>
  )
}
