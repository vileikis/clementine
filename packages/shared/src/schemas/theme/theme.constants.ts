/**
 * Theme Default Constants
 *
 * Default values for theme configuration.
 * Used by theme schemas and can be imported for programmatic theme creation.
 */

// =============================================================================
// Color Defaults
// =============================================================================

/** Default primary color (blue) */
export const DEFAULT_PRIMARY_COLOR = '#3B82F6'

/** Default text color (dark gray for light theme) */
export const DEFAULT_TEXT_COLOR = '#1E1E1E'

/** Default button text color (white) */
export const DEFAULT_BUTTON_TEXT_COLOR = '#FFFFFF'

/** Default background color (white for light theme) */
export const DEFAULT_BACKGROUND_COLOR = '#FFFFFF'

// =============================================================================
// Text Defaults
// =============================================================================

/** Default text alignment */
export const DEFAULT_TEXT_ALIGNMENT = 'center' as const

/** Default text configuration */
export const DEFAULT_TEXT = {
  color: DEFAULT_TEXT_COLOR,
  alignment: DEFAULT_TEXT_ALIGNMENT,
} as const

// =============================================================================
// Button Defaults
// =============================================================================

/** Default button radius */
export const DEFAULT_BUTTON_RADIUS = 'rounded' as const

/** Default button configuration */
export const DEFAULT_BUTTON = {
  backgroundColor: null,
  textColor: DEFAULT_BUTTON_TEXT_COLOR,
  radius: DEFAULT_BUTTON_RADIUS,
} as const

// =============================================================================
// Background Defaults
// =============================================================================

/** Default background overlay opacity */
export const DEFAULT_OVERLAY_OPACITY = 0.3

/** Default background configuration */
export const DEFAULT_BACKGROUND = {
  color: DEFAULT_BACKGROUND_COLOR,
  image: null,
  overlayOpacity: DEFAULT_OVERLAY_OPACITY,
} as const

// =============================================================================
// Complete Theme Default
// =============================================================================

/** Default theme (light theme with blue primary) */
export const DEFAULT_THEME = {
  fontFamily: null,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  text: DEFAULT_TEXT,
  button: DEFAULT_BUTTON,
  background: DEFAULT_BACKGROUND,
} as const
