/**
 * Theme types - re-exported from schema for single source of truth
 *
 * All theme types are inferred from Zod schemas in theme.schemas.ts.
 * This file re-exports them for backwards compatibility.
 */
export type {
  ButtonRadius,
  Theme,
  ThemeText,
  ThemeButton,
  ThemeBackground,
} from '../schemas/theme.schemas'
