import type { ViewportMode } from '@/shared/preview-shell'

/**
 * Component configuration interface for preview-shell dev tools
 */
export interface ComponentConfig {
  enableViewportSwitcher: boolean
  enableFullscreen: boolean
  defaultViewport: ViewportMode
}
