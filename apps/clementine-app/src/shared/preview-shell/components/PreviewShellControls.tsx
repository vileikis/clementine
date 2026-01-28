'use client'

import { ViewportSwitcher } from './ViewportSwitcher'
import { FullscreenTrigger } from './FullscreenTrigger'
import type { ViewportMode } from '../types/preview-shell.types'

interface PreviewShellControlsProps {
  mode: ViewportMode
  onModeChange: (mode: ViewportMode) => void
  enableViewportSwitcher: boolean
  enableFullscreen: boolean
  onFullscreenClick: () => void
  headerSlot?: React.ReactNode
}

/**
 * Preview Shell Controls Component
 *
 * Container for viewport switcher and fullscreen trigger
 * Three-column layout: left (spacer), center (headerSlot), right (controls)
 */
export function PreviewShellControls({
  mode,
  onModeChange,
  enableViewportSwitcher,
  enableFullscreen,
  onFullscreenClick,
  headerSlot,
}: PreviewShellControlsProps) {
  return (
    <div className="flex items-center border-b p-2 gap-4">
      {/* Left spacer - keeps center content centered */}
      <div className="flex-1" />

      {/* Center - Custom header content */}
      <div className="flex-shrink-0">{headerSlot}</div>

      {/* Right - Controls */}
      <div className="flex-1 flex items-center justify-end gap-2">
        {enableViewportSwitcher && (
          <ViewportSwitcher mode={mode} onModeChange={onModeChange} />
        )}
        {enableFullscreen && <FullscreenTrigger onClick={onFullscreenClick} />}
      </div>
    </div>
  )
}
