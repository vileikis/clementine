/**
 * Preview Shell Type Definitions
 *
 * Core types for viewport simulation and device preview infrastructure.
 */

export type ViewportMode = 'mobile' | 'desktop'

export interface ViewportDimensions {
  width: number
  height: number
}

export interface ViewportStore {
  mode: ViewportMode
  setMode: (mode: ViewportMode) => void
  toggle: () => void
}

export interface ViewportContextValue {
  mode: ViewportMode
  dimensions: ViewportDimensions
}

export interface PreviewShellProps {
  children: React.ReactNode
  enableViewportSwitcher?: boolean
  enableFullscreen?: boolean
  viewportMode?: ViewportMode
  onViewportChange?: (mode: ViewportMode) => void
  className?: string
}

export interface DeviceFrameProps {
  children: React.ReactNode
  className?: string
}

export interface ViewportSwitcherProps {
  mode: ViewportMode
  onModeChange: (mode: ViewportMode) => void
  size?: 'sm' | 'md'
  className?: string
}

export interface FullscreenOverlayProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  showViewportSwitcher?: boolean
  onModeChange?: (mode: ViewportMode) => void
  className?: string
}

export interface FullscreenTriggerProps {
  onClick: () => void
  className?: string
}

export interface UseViewportOptions {
  defaultMode?: ViewportMode
  controlled?: boolean
}

export interface UseViewportReturn {
  mode: ViewportMode
  setMode: (mode: ViewportMode) => void
  toggle: () => void
  dimensions: ViewportDimensions
}

export interface UseFullscreenOptions {
  onEnter?: () => void
  onExit?: () => void
}

export interface UseFullscreenReturn {
  isFullscreen: boolean
  enter: () => void
  exit: () => void
  toggle: () => void
}
