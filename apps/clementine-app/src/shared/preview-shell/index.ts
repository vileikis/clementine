// Containers (composed shells)
export {
  PreviewShell,
  FullscreenPreviewShell,
  type PreviewShellProps,
  type FullscreenPreviewShellProps,
} from './containers'

// Components (primitives)
export {
  DeviceFrame,
  ViewportSwitcher,
  FullscreenOverlay,
  FullscreenTrigger,
  type DeviceFrameProps,
  type ViewportSwitcherProps,
  type FullscreenOverlayProps,
  type FullscreenTriggerProps,
} from './components'

// Hooks
export { useViewport, useFullscreen } from './hooks'

// Context
export { ViewportProvider, useViewportContext } from './context'

// Store
export { useViewportStore } from './store'

// Types (shared types only - component props are colocated)
export type * from './types'

// Constants
export { VIEWPORT_DIMENSIONS } from './constants'
