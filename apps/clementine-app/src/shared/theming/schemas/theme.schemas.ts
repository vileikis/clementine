// Zod schemas for Theme validation
// Following standards/global/zod-validation.md patterns
import { z } from 'zod'

/** Hex color regex pattern */
export const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

/**
 * Theme text configuration schema
 */
export const themeTextSchema = z.object({
  color: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .default('#FFFFFF'),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
})

/**
 * Theme button configuration schema
 */
export const themeButtonSchema = z.object({
  backgroundColor: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .nullable()
    .default(null),
  textColor: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .default('#FFFFFF'),
  radius: z.enum(['none', 'sm', 'md', 'full']).default('md'),
})

/**
 * Theme background configuration schema
 */
export const themeBackgroundSchema = z.object({
  color: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .default('#1E1E1E'),
  image: z.url().nullable().default(null),
  overlayOpacity: z.number().min(0).max(1).default(0.5),
})

/**
 * Default values for nested theme objects
 * Used by schema defaults and form initialization
 */
export const THEME_DEFAULTS = {
  text: { color: '#FFFFFF', alignment: 'center' as const },
  button: {
    backgroundColor: null,
    textColor: '#FFFFFF',
    radius: 'md' as const,
  },
  background: { color: '#1E1E1E', image: null, overlayOpacity: 0.5 },
}

/**
 * Complete theme schema for visual customization
 * Used by Project.theme and Event.theme
 *
 * All fields have defaults - parsing partial data fills missing fields.
 */
export const themeSchema = z.object({
  fontFamily: z.string().nullable().default(null),
  primaryColor: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .default('#3B82F6'),
  text: themeTextSchema.default(THEME_DEFAULTS.text),
  button: themeButtonSchema.default(THEME_DEFAULTS.button),
  background: themeBackgroundSchema.default(THEME_DEFAULTS.background),
})

/**
 * TypeScript types inferred from schemas
 */
export type Theme = z.infer<typeof themeSchema>
export type ThemeText = z.infer<typeof themeTextSchema>
export type ThemeButton = z.infer<typeof themeButtonSchema>
export type ThemeBackground = z.infer<typeof themeBackgroundSchema>
