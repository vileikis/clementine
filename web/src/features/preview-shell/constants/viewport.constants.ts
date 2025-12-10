/**
 * Viewport dimension constants for preview-shell feature module
 */

import type { ViewportMode, ViewportDimensions } from "../types";

/**
 * Predefined dimensions for each viewport mode
 *
 * - Mobile: 375x667px (iPhone SE viewport)
 * - Desktop: 900x600px (compact desktop preview)
 */
export const VIEWPORT_DIMENSIONS: Record<ViewportMode, ViewportDimensions> = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 900, height: 600 },
};
