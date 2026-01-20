'use client'

import { useEffect } from 'react'
import { ViewportProvider } from '../context/ViewportContext'
import { useViewportStore } from '../store/viewportStore'
import { useFullscreen } from '../hooks/useFullscreen'
import { DeviceFrame } from '../components/DeviceFrame'
import { FullscreenOverlay } from '../components/FullscreenOverlay'
import type { FullscreenPreviewShellProps } from '../types/preview-shell.types'

/**
 * Fullscreen Preview Shell Component
 *
 * A composed container for fullscreen-only preview experiences.
 * Handles viewport state, escape key closing, and scroll lock internally.
 *
 * Use this for modals/overlays that are always fullscreen (e.g., ExperiencePreviewModal).
 * For 2-column editor layouts with inline preview, use PreviewShell instead.
 *
 * @example
 * ```tsx
 * <FullscreenPreviewShell
 *   isOpen={open}
 *   onClose={handleClose}
 *   title="Preview Mode"
 * >
 *   <MyPreviewContent />
 * </FullscreenPreviewShell>
 * ```
 */
export function FullscreenPreviewShell({
  isOpen,
  onClose,
  children,
  title = 'Preview',
  showViewportSwitcher = true,
}: FullscreenPreviewShellProps) {
  // Viewport state from global store (persists across sessions)
  const { mode, setMode } = useViewportStore()

  // Fullscreen state management with escape key handling
  const fullscreen = useFullscreen({
    onExit: onClose,
  })

  // Sync internal fullscreen state with external isOpen prop
  useEffect(() => {
    if (isOpen && !fullscreen.isFullscreen) {
      fullscreen.enter()
    } else if (!isOpen && fullscreen.isFullscreen) {
      fullscreen.exit()
    }
  }, [isOpen, fullscreen])

  return (
    <ViewportProvider mode={mode}>
      <FullscreenOverlay
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        showViewportSwitcher={showViewportSwitcher}
        onModeChange={setMode}
      >
        <DeviceFrame>{children}</DeviceFrame>
      </FullscreenOverlay>
    </ViewportProvider>
  )
}
