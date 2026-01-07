import type { CSSProperties, ReactNode } from 'react'
import type { ThemeBackground } from '../types'
import { cn } from '@/shared/utils'

interface ThemedBackgroundProps {
  /** Content to render above the background */
  children: ReactNode
  /** Background configuration (color, image, overlay) */
  background?: Partial<ThemeBackground>
  /** CSS font-family to apply to the container */
  fontFamily?: string | null
  /** Additional CSS classes for the outer container */
  className?: string
  /** Additional inline styles for the outer container */
  style?: CSSProperties
  /**
   * Additional classes for the content container.
   * Default provides max-width constraint (max-w-3xl).
   * Use to override width, add padding, flex layout, etc.
   * @example contentClassName="max-w-xl p-8" // narrower with padding
   * @example contentClassName="max-w-none" // full width
   */
  contentClassName?: string
}

/**
 * Renders a full-height container with themed background and centered content.
 *
 * Structure:
 * - Outer container: fills available space, handles background color/image/overlay
 * - Position wrapper: centers content vertically and horizontally, handles overflow
 * - Content container: max-width constraint, receives contentClassName
 *
 * @example
 * ```tsx
 * // Standard usage - centered content with default max-width
 * <ThemedBackground background={theme.background} fontFamily={theme.fontFamily}>
 *   <PageContent />
 * </ThemedBackground>
 *
 * // Custom content layout with padding and flex
 * <ThemedBackground contentClassName="flex flex-col gap-8 p-8">
 *   <Content />
 * </ThemedBackground>
 *
 * // Full width content (override max-width)
 * <ThemedBackground contentClassName="max-w-none">
 *   <FullWidthContent />
 * </ThemedBackground>
 * ```
 */
export function ThemedBackground({
  children,
  background,
  fontFamily,
  className,
  style,
  contentClassName,
}: ThemedBackgroundProps) {
  const bgColor = background?.color ?? '#FFFFFF'
  const bgImage = background?.image?.url ?? null
  const overlayOpacity = background?.overlayOpacity ?? 0

  return (
    <div
      className={cn('relative flex flex-1 flex-col overflow-hidden', className)}
      style={{
        backgroundColor: bgColor,
        fontFamily: fontFamily ?? undefined,
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

      {/* Position wrapper: centers content, handles overflow */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-auto px-4 py-8">
        {/* Content container: max-width + contentClassName */}
        <div className={cn('w-full max-w-3xl', contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  )
}
