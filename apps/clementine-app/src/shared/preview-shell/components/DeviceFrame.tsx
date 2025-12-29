'use client'

import { useViewportContext } from '../context/ViewportContext'
import type { DeviceFrameProps } from '../types/preview-shell.types'
import { cn } from '@/shared/utils'

/**
 * Device Frame Component
 *
 * Renders a responsive container with viewport-specific behavior:
 * - Mobile: Fixed dimensions (375x667px iPhone SE)
 * - Desktop: Fills available space with minimum height
 */
export function DeviceFrame({
  children,
  className,
}: Omit<DeviceFrameProps, 'mode'>) {
  const { mode, dimensions } = useViewportContext()
  const isMobile = mode === 'mobile'

  return (
    <div
      className={cn(
        // Frame styling
        'overflow-hidden rounded-lg border bg-background shadow-lg transition-all duration-200',
        // Desktop fills available space using flex-grow (not h-full which needs explicit parent height)
        !isMobile && 'w-full flex-1 flex flex-col',
        className,
      )}
      style={
        isMobile
          ? {
              // Mobile: fixed dimensions
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
            }
          : {
              // Desktop: minimum height for visual presence
              minHeight: `${dimensions.height}px`,
            }
      }
    >
      {/* Content container - fills frame, overflow handled by children */}
      <div
        className={cn(
          'relative w-full',
          isMobile ? 'h-full' : 'flex-1 flex flex-col',
        )}
      >
        {children}
      </div>
    </div>
  )
}
