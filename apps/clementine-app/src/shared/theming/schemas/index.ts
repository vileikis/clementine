// Theming schemas barrel export

// MediaReference schema (reusable for media asset references)
export { mediaReferenceSchema } from './media-reference.schema'
export type { MediaReference } from './media-reference.schema'

// Theme schemas
export {
  COLOR_REGEX,
  BUTTON_RADIUS_OPTIONS,
  themeTextSchema,
  themeButtonSchema,
  themeBackgroundSchema,
  themeSchema,
} from './theme.schemas'

export type {
  ButtonRadius,
  Theme,
  ThemeText,
  ThemeButton,
  ThemeBackground,
} from './theme.schemas'
