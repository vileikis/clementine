// Zod schemas for Theme validation
import { z } from 'zod'

/** Hex color regex pattern */
export const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

/**
 * Theme text configuration schema
 */
export const themeTextSchema = z.object({
  color: z.string().regex(COLOR_REGEX, 'Invalid hex color format'),
  alignment: z.enum(['left', 'center', 'right']),
})

/**
 * Theme button configuration schema
 */
export const themeButtonSchema = z.object({
  backgroundColor: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .nullable()
    .optional()
    .default(null),
  textColor: z.string().regex(COLOR_REGEX, 'Invalid hex color format'),
  radius: z.enum(['none', 'sm', 'md', 'full']),
})

/**
 * Theme background configuration schema
 */
export const themeBackgroundSchema = z.object({
  color: z.string().regex(COLOR_REGEX, 'Invalid hex color format'),
  image: z.string().url().nullable().optional().default(null),
  overlayOpacity: z.number().min(0).max(1),
})

/**
 * Complete theme schema for visual customization
 * Used by Project.theme and Event.theme
 */
export const themeSchema = z.object({
  fontFamily: z.string().nullable().optional().default(null),
  primaryColor: z.string().regex(COLOR_REGEX, 'Invalid hex color format'),
  text: themeTextSchema,
  button: themeButtonSchema,
  background: themeBackgroundSchema,
})

/**
 * Partial theme schema for updates (all fields optional)
 */
export const updateThemeSchema = z.object({
  fontFamily: z.string().nullable().optional(),
  primaryColor: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .optional(),
  text: z
    .object({
      color: z
        .string()
        .regex(COLOR_REGEX, 'Invalid hex color format')
        .optional(),
      alignment: z.enum(['left', 'center', 'right']).optional(),
    })
    .optional(),
  button: z
    .object({
      backgroundColor: z
        .string()
        .regex(COLOR_REGEX, 'Invalid hex color format')
        .nullable()
        .optional(),
      textColor: z
        .string()
        .regex(COLOR_REGEX, 'Invalid hex color format')
        .optional(),
      radius: z.enum(['none', 'sm', 'md', 'full']).optional(),
    })
    .optional(),
  background: z
    .object({
      color: z
        .string()
        .regex(COLOR_REGEX, 'Invalid hex color format')
        .optional(),
      image: z.string().url().nullable().optional(),
      overlayOpacity: z.number().min(0).max(1).optional(),
    })
    .optional(),
})

/**
 * TypeScript types inferred from schemas
 */
export type Theme = z.infer<typeof themeSchema>
export type ThemeText = z.infer<typeof themeTextSchema>
export type ThemeButton = z.infer<typeof themeButtonSchema>
export type ThemeBackground = z.infer<typeof themeBackgroundSchema>
export type UpdateTheme = z.infer<typeof updateThemeSchema>
