import { useEventTheme } from '../hooks/useEventTheme'
import type { CSSProperties, ReactNode } from 'react'
import type { ThemeBackground } from '../types'
import { cn } from '@/shared/utils'

interface ThemedBackgroundProps {
  /** Content to render above the background */
  children: ReactNode
  /** Background override (uses theme.background from context if not provided) */
  background?: ThemeBackground
  /** Additional CSS classes for the outer container */
  className?: string
  /** Additional inline styles for the outer container */
  style?: CSSProperties
}

/**
 * Renders a themed background container with color, optional image, and overlay.
 *
 * Must be used within a ThemeProvider. Gets theme from context, with optional
 * background prop override.
 *
 * Provides only the background - consumers handle their own layout and scrolling.
 * Children render directly above the background layers.
 *
 * @example
 * ```tsx
 * // Standard usage - uses theme.background from context
 * <ThemedBackground className="h-dvh">
 *   <MyRenderer />
 * </ThemedBackground>
 *
 * // Override background
 * <ThemedBackground background={customBackground}>
 *   <Content />
 * </ThemedBackground>
 * ```
 */
export function ThemedBackground({
  children,
  background: backgroundOverride,
  className,
  style,
}: ThemedBackgroundProps) {
  const { theme } = useEventTheme()

  // Use prop override if provided, otherwise use theme.background
  const background = backgroundOverride ?? theme.background

  const bgColor = background?.color ?? '#FFFFFF'
  const bgImage = background?.image?.url ?? null
  const overlayOpacity = background?.overlayOpacity ?? 0

  return (
    <div
      className={cn('relative flex flex-1 flex-col', className)}
      style={{
        backgroundColor: bgColor,
        fontFamily: theme.fontFamily ?? undefined,
        ...style,
      }}
    >
      {/* Background Image */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Overlay for readability when image is present */}
      {bgImage && overlayOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content wrapper - ensures stacking above background layers */}
      <div className="relative z-10 flex flex-1 flex-col">
        {children}
      </div>
    </div>
  )
}
