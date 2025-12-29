import type {
  ViewportDimensions,
  ViewportMode,
} from '../types/preview-shell.types'

/**
 * Viewport dimension constants for device simulation
 *
 * Mobile: iPhone SE dimensions (375x667px)
 * Desktop: Compact desktop viewport (900x600px)
 */
export const VIEWPORT_DIMENSIONS: Record<ViewportMode, ViewportDimensions> = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 900, height: 600 },
}
