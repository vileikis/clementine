// Zod schemas for Theme validation
// Following standards/global/zod-validation.md patterns
import { z } from 'zod'

import { mediaReferenceSchema } from './media-reference.schema'

/** Hex color regex pattern */
export const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

/** Button radius options */
export const BUTTON_RADIUS_OPTIONS = ['square', 'rounded', 'pill'] as const
export type ButtonRadius = (typeof BUTTON_RADIUS_OPTIONS)[number]

/**
 * Theme text configuration schema
 */
export const themeTextSchema = z.object({
  color: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .default('#1E1E1E'), // Dark text for light theme
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
    .default(null), // Falls back to primaryColor
  textColor: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .default('#FFFFFF'),
  radius: z.enum(BUTTON_RADIUS_OPTIONS).default('rounded'),
})

/**
 * Theme background configuration schema
 */
export const themeBackgroundSchema = z.object({
  color: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .default('#FFFFFF'), // White background for light theme
  image: mediaReferenceSchema.nullable().default(null),
  overlayOpacity: z.number().min(0).max(1).default(0.3),
})

/**
 * Complete theme schema for visual customization
 * Used by Project.theme and Event.theme
 *
 * All fields have defaults - parsing partial data fills missing fields.
 * Default theme is light (dark text on white background).
 */
export const themeSchema = z.object({
  fontFamily: z.string().nullable().default(null),
  primaryColor: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .default('#3B82F6'), // Blue primary
  text: themeTextSchema.default({
    color: '#1E1E1E',
    alignment: 'center',
  }),
  button: themeButtonSchema.default({
    backgroundColor: null,
    textColor: '#FFFFFF',
    radius: 'rounded',
  }),
  background: themeBackgroundSchema.default({
    color: '#FFFFFF',
    image: null,
    overlayOpacity: 0.3,
  }),
})

/**
 * TypeScript types inferred from schemas
 */
export type Theme = z.infer<typeof themeSchema>
export type ThemeText = z.infer<typeof themeTextSchema>
export type ThemeButton = z.infer<typeof themeButtonSchema>
export type ThemeBackground = z.infer<typeof themeBackgroundSchema>
