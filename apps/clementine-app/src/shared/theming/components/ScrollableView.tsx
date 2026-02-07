import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'

interface ScrollableViewProps {
  children: ReactNode
  /**
   * Classes for the inner content wrapper.
   * Use for positioning (items-center), spacing (gap-6), padding (p-8),
   * and max-width (max-w-md).
   *
   * Base classes (w-full my-auto flex flex-col) are always applied.
   * Use my-auto for vertical centering when content is short.
   *
   * @example className="items-center gap-6 p-8 max-w-md" // centered content
   */
  className?: string
}

/**
 * Scrollable container with flexible content positioning.
 *
 * Fills available space and enables vertical scrolling when content overflows.
 * Inner wrapper uses my-auto for vertical centering when content is short.
 *
 * @example
 * ```tsx
 * // Centered content (welcome, share screens)
 * <ScrollableView className="items-center gap-6 p-8 max-w-md">
 *   <Content />
 * </ScrollableView>
 * ```
 */
export function ScrollableView({ children, className }: ScrollableViewProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center">
      <div className={cn('w-full my-auto flex flex-col', className)}>
        {children}
      </div>
    </div>
  )
}
