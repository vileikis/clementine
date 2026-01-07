// Theming module public API

// Types
export type {
  Theme,
  ThemeText,
  ThemeButton,
  ThemeBackground,
  ButtonRadius,
} from './types'
export type { ThemeContextValue } from './context'
export type { MediaReference } from './schemas'

// Schemas
export {
  COLOR_REGEX,
  BUTTON_RADIUS_OPTIONS,
  mediaReferenceSchema,
  normalizeBackgroundImage,
  themeTextSchema,
  themeButtonSchema,
  themeBackgroundSchema,
  themeSchema,
} from './schemas'

// Constants
export { BUTTON_RADIUS_MAP } from './constants'

// Providers
export { ThemeProvider } from './providers'

// Components
export { ThemedBackground, ThemedText, ThemedButton } from './components'
export type { ThemedTextProps, TextVariant, ThemedButtonProps, ButtonSize } from './components'

// Hooks
export { useEventTheme, useThemedStyles, useThemeWithOverride } from './hooks'
