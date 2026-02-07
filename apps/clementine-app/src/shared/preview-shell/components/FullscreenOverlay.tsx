'use client'

import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import * as FocusScope from '@radix-ui/react-focus-scope'
import { useViewportContext } from '../context/ViewportContext'
import { ViewportSwitcher } from './ViewportSwitcher'
import type { ViewportMode } from '../types/preview-shell.types'
import { Button } from '@/ui-kit/ui/button'
import { cn } from '@/shared/utils'

export interface FullscreenOverlayProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  showViewportSwitcher?: boolean
  onModeChange?: (mode: ViewportMode) => void
  className?: string
}

/**
 * Fullscreen Overlay Component
 *
 * CSS-based fullscreen modal with header, close button, and optional viewport switcher.
 * Implements proper dialog semantics with role="dialog", aria-modal="true",
 * accessible title, and focus trapping using Radix UI FocusScope.
 * Handles Escape key closing via useFullscreen hook.
 */
export function FullscreenOverlay({
  isOpen,
  onClose,
  children,
  showViewportSwitcher = false,
  onModeChange,
  className,
}: FullscreenOverlayProps) {
  const { mode } = useViewportContext()
  const isMobile = mode === 'mobile'
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Focus close button when overlay opens for keyboard accessibility
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <FocusScope.Root trapped={isOpen} loop>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-background',
          className,
        )}
      >
        {/* Visually hidden title for accessibility */}
        <h2 id={titleId} className="sr-only">
          Preview
        </h2>

        {/* Header */}
        <div className="flex h-14 items-center justify-center px-4">
          <div className="flex items-center gap-2">
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10"
              aria-label="Close fullscreen"
            >
              <X size={20} />
            </Button>
            {showViewportSwitcher && onModeChange && (
              <ViewportSwitcher
                mode={mode}
                onModeChange={onModeChange}
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Content Area - mobile centered, desktop fills space */}
        <div
          className={cn(
            'flex flex-1 min-h-0 overflow-auto p-6',
            // Mobile: center the fixed-size frame
            isMobile && 'items-center justify-center',
            // Desktop: fill available space with flex column
            !isMobile && 'flex-col',
          )}
        >
          {children}
        </div>
      </div>
    </FocusScope.Root>
  )
}
