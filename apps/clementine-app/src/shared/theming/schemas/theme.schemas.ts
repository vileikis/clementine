/**
 * Theme Schemas (App Re-export)
 *
 * Re-exports theme schemas from @clementine/shared for app usage.
 * Single source of truth is in packages/shared/src/schemas/theme/
 */

// Re-export everything from shared
export {
  // Schemas
  themeSchema,
  themeTextSchema,
  themeButtonSchema,
  themeBackgroundSchema,
  // Pattern constants
  COLOR_REGEX,
  BUTTON_RADIUS_OPTIONS,
  // Default value constants
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_ALIGNMENT,
  DEFAULT_TEXT,
  DEFAULT_BUTTON_TEXT_COLOR,
  DEFAULT_BUTTON_RADIUS,
  DEFAULT_BUTTON,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_OVERLAY_OPACITY,
  DEFAULT_BACKGROUND,
  DEFAULT_THEME,
  // Font constants
  DEFAULT_FONT_SOURCE,
  DEFAULT_FONT_VARIANTS,
  DEFAULT_FALLBACK_STACK,
  FONT_SOURCE_OPTIONS,
  // Types
  type Theme,
  type ThemeText,
  type ThemeButton,
  type ThemeBackground,
  type ButtonRadius,
  type FontSource,
} from '@clementine/shared'
