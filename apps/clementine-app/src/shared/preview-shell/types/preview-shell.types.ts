/**
 * Preview Shell Type Definitions
 *
 * Core shared types for viewport simulation and device preview infrastructure.
 * Component props are colocated with their respective components.
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
