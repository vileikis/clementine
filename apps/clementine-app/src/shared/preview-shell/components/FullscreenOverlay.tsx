'use client'

import { X } from 'lucide-react'
import { useViewportContext } from '../context/ViewportContext'
import { ViewportSwitcher } from './ViewportSwitcher'
import type { FullscreenOverlayProps } from '../types/preview-shell.types'
import { Button } from '@/ui-kit/components/button'
import { cn } from '@/shared/utils'

/**
 * Fullscreen Overlay Component
 *
 * CSS-based fullscreen modal with header, close button, and optional viewport switcher
 * Handles Escape key closing via useFullscreen hook
 */
export function FullscreenOverlay({
  isOpen,
  onClose,
  children,
  title = 'Preview',
  showViewportSwitcher = false,
  onModeChange,
  className,
}: FullscreenOverlayProps) {
  const { mode } = useViewportContext()

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col bg-background',
        className,
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="text-lg font-semibold">{title}</h2>

        <div className="flex items-center gap-2">
          {showViewportSwitcher && onModeChange && (
            <ViewportSwitcher
              mode={mode}
              onModeChange={onModeChange}
              size="sm"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10"
            aria-label="Close fullscreen"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {children}
      </div>
    </div>
  )
}
