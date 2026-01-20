'use client'

import { ViewportProvider } from '../context/ViewportContext'
import { useViewportStore } from '../store/viewportStore'
import { useFullscreen } from '../hooks/useFullscreen'
import { DeviceFrame } from '../components/DeviceFrame'
import { PreviewShellControls } from '../components/PreviewShellControls'
import { FullscreenOverlay } from '../components/FullscreenOverlay'
import type { PreviewShellProps } from '../types/preview-shell.types'
import { cn } from '@/shared/utils'

/**
 * Preview Shell Component
 *
 * 2-column editor layout with inline preview and optional fullscreen mode.
 * Supports both controlled and uncontrolled viewport modes.
 *
 * Use this for editor pages with live preview (e.g., ShareEditorPage, ThemeEditorPage).
 * For fullscreen-only modals, use FullscreenPreviewShell instead.
 */
export function PreviewShell({
  children,
  enableViewportSwitcher = true,
  enableFullscreen = true,
  viewportMode,
  onViewportChange,
  className,
}: PreviewShellProps) {
  // Global store state
  const { mode: globalMode, setMode: setGlobalMode } = useViewportStore()

  // Controlled vs uncontrolled mode
  const isControlled = viewportMode !== undefined
  const currentMode = isControlled ? viewportMode : globalMode

  // Fullscreen state
  const { isFullscreen, enter, exit } = useFullscreen()

  // Handle mode changes
  const handleModeChange = (newMode: typeof currentMode) => {
    // Always update global store for persistence
    setGlobalMode(newMode)

    // Call controlled callback if provided
    if (onViewportChange) {
      onViewportChange(newMode)
    }
  }

  const isMobile = currentMode === 'mobile'

  return (
    <ViewportProvider mode={currentMode}>
      <div className={cn('flex flex-col h-full', className)}>
        {/* Controls */}
        <PreviewShellControls
          mode={currentMode}
          onModeChange={handleModeChange}
          enableViewportSwitcher={enableViewportSwitcher}
          enableFullscreen={enableFullscreen}
          onFullscreenClick={enter}
        />

        {/* Device Frame with wrapper for proper layout */}
        <div
          className={cn(
            'flex min-h-0 p-4',
            // Mobile: center the fixed-size frame
            isMobile && 'justify-center',
            // Desktop: fill available space with flex column for proper height
            !isMobile && 'flex-1 flex-col',
          )}
        >
          <DeviceFrame>{children}</DeviceFrame>
        </div>

        {/* Fullscreen Overlay */}
        {enableFullscreen && (
          <FullscreenOverlay
            isOpen={isFullscreen}
            onClose={exit}
            title="Preview"
            showViewportSwitcher={enableViewportSwitcher}
            onModeChange={handleModeChange}
          >
            <DeviceFrame>{children}</DeviceFrame>
          </FullscreenOverlay>
        )}
      </div>
    </ViewportProvider>
  )
}
