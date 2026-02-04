import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'

interface ScrollableViewProps {
  children: ReactNode
  /**
   * Classes for the inner content wrapper.
   * Use for positioning (items-center, justify-center),
   * spacing (gap-6), and padding (p-8).
   *
   * Base classes (min-h-full flex flex-col) are always applied.
   *
   * @example className="items-center justify-center gap-6 p-8" // centered
   * @example className="items-center justify-start gap-4 p-4" // top-aligned
   */
  className?: string
}

/**
 * Scrollable container with flexible content positioning.
 *
 * Fills available space and enables vertical scrolling when content overflows.
 * Inner wrapper uses min-h-full to support vertical centering when content is short.
 *
 * @example
 * ```tsx
 * // Centered content (welcome screens)
 * <ScrollableView className="items-center justify-center gap-6 p-8">
 *   <Content />
 * </ScrollableView>
 *
 * // Top-aligned content (step renderers)
 * <ScrollableView className="items-center justify-start gap-4 p-4">
 *   <StepContent />
 * </ScrollableView>
 * ```
 */
export function ScrollableView({ children, className }: ScrollableViewProps) {
  return (
    // Outer: takes space in flex parent, provides positioning context
    <div className="relative flex-1">
      {/* Scroll container: absolute bounds ensure fixed height for scrolling */}
      <div className="absolute inset-0 overflow-y-auto">
        {/* Content: min-h-full for centering, grows when content is tall */}
        <div className={cn('min-h-full flex flex-col', className)}>
          {children}
        </div>
      </div>
    </div>
  )
}
