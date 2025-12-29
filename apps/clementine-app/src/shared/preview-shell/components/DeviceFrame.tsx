'use client'

import { useViewportContext } from '../context/ViewportContext'
import type { DeviceFrameProps } from '../types/preview-shell.types'
import { cn } from '@/shared/utils'

/**
 * Device Frame Component
 *
 * Renders a fixed-size container with viewport-specific dimensions
 * Mobile: 375x667px (iPhone SE), Desktop: 900x600px
 */
export function DeviceFrame({
  children,
  className,
}: Omit<DeviceFrameProps, 'mode'>) {
  const { dimensions } = useViewportContext()

  return (
    <div
      className={cn(
        'mx-auto overflow-hidden rounded-lg border bg-background shadow-lg transition-all duration-200',
        className,
      )}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
    >
      {children}
    </div>
  )
}
