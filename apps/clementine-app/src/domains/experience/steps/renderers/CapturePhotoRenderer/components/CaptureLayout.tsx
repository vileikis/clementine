/**
 * CaptureLayout Component
 *
 * Shared layout shell for all capture photo states (camera, preview, upload).
 * Provides consistent full-screen container with floating bottom controls.
 */

import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'

interface CaptureLayoutProps {
  /** Main content area (CameraView or PhotoFrame) */
  children: ReactNode
  /** Bottom floating controls (buttons, status text, etc.) */
  controls?: ReactNode
  /** Additional CSS classes on the outer container */
  className?: string
}

export function CaptureLayout({
  children,
  controls,
  className,
}: CaptureLayoutProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col w-full h-full items-center',
        className,
      )}
    >
      {/* Content area - fills all available space */}
      <div className="flex-1 min-h-0 w-full">{children}</div>

      {/* Controls - fixed to bottom, floating above content */}
      {controls && (
        <div className="absolute bottom-0 inset-x-0 flex flex-col items-center gap-4 py-6 pb-8">
          {controls}
        </div>
      )}
    </div>
  )
}
