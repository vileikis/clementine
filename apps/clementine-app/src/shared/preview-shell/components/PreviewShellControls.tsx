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
}

/**
 * Preview Shell Controls Component
 *
 * Container for viewport switcher and fullscreen trigger
 * Uses justify-between layout with bottom border separator
 */
export function PreviewShellControls({
  mode,
  onModeChange,
  enableViewportSwitcher,
  enableFullscreen,
  onFullscreenClick,
}: PreviewShellControlsProps) {
  return (
    <div className="flex items-center justify-between border-b p-2">
      {enableViewportSwitcher ? (
        <ViewportSwitcher mode={mode} onModeChange={onModeChange} />
      ) : (
        <div />
      )}
      {enableFullscreen && <FullscreenTrigger onClick={onFullscreenClick} />}
    </div>
  )
}
