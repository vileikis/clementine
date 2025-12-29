'use client'

import { ViewportProvider } from '../context/ViewportContext'
import { useViewportStore } from '../store/viewportStore'
import { useFullscreen } from '../hooks/useFullscreen'
import { DeviceFrame } from './DeviceFrame'
import { PreviewShellControls } from './PreviewShellControls'
import { FullscreenOverlay } from './FullscreenOverlay'
import type { PreviewShellProps } from '../types/preview-shell.types'
import { cn } from '@/shared/utils'

/**
 * Preview Shell Component
 *
 * Main orchestrator for viewport switching and fullscreen state management
 * Supports both controlled and uncontrolled viewport modes
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

  return (
    <ViewportProvider mode={currentMode}>
      <div className={cn('space-y-4', className)}>
        {/* Controls */}
        <PreviewShellControls
          mode={currentMode}
          onModeChange={handleModeChange}
          enableViewportSwitcher={enableViewportSwitcher}
          enableFullscreen={enableFullscreen}
          onFullscreenClick={enter}
        />

        {/* Device Frame */}
        <DeviceFrame>
          <div className="h-full overflow-auto">{children}</div>
        </DeviceFrame>

        {/* Fullscreen Overlay */}
        {enableFullscreen && (
          <FullscreenOverlay
            isOpen={isFullscreen}
            onClose={exit}
            title="Preview"
            showViewportSwitcher={enableViewportSwitcher}
            onModeChange={handleModeChange}
          >
            <DeviceFrame>
              <div className="h-full overflow-auto">{children}</div>
            </DeviceFrame>
          </FullscreenOverlay>
        )}
      </div>
    </ViewportProvider>
  )
}
