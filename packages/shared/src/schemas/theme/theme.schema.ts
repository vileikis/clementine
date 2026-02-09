/**
 * Theme Schemas
 *
 * Complete theme schema for visual customization.
 * Used by Project.theme and Event.theme
 *
 * All fields have defaults - parsing partial data fills missing fields.
 * Default theme is light (dark text on white background).
 */
import { z } from 'zod'

import { mediaReferenceSchema } from '../media/media-reference.schema'
import {
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
  DEFAULT_FONT_SOURCE,
  DEFAULT_FONT_VARIANTS,
  DEFAULT_FALLBACK_STACK,
  FONT_SOURCE_OPTIONS,
} from './theme.constants'

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
    .default(DEFAULT_TEXT_COLOR),
  alignment: z.enum(['left', 'center', 'right']).default(DEFAULT_TEXT_ALIGNMENT),
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
    .default(DEFAULT_BUTTON_TEXT_COLOR),
  radius: z.enum(BUTTON_RADIUS_OPTIONS).default(DEFAULT_BUTTON_RADIUS),
})

/**
 * Theme background configuration schema
 */
export const themeBackgroundSchema = z.object({
  color: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .default(DEFAULT_BACKGROUND_COLOR),
  image: mediaReferenceSchema.nullable().default(null),
  overlayOpacity: z.number().min(0).max(1).default(DEFAULT_OVERLAY_OPACITY),
})

/**
 * Complete theme schema for visual customization
 * Used by Project.theme and Event.theme
 *
 * All fields have defaults - parsing partial data fills missing fields.
 * Default theme is light (dark text on white background).
 */
/** Font source type */
export type FontSource = (typeof FONT_SOURCE_OPTIONS)[number]

export const themeSchema = z.object({
  fontFamily: z.string().nullable().default(null),
  fontSource: z.enum(FONT_SOURCE_OPTIONS).default(DEFAULT_FONT_SOURCE),
  fontVariants: z.array(z.number()).default(DEFAULT_FONT_VARIANTS),
  fallbackStack: z.string().default(DEFAULT_FALLBACK_STACK),
  primaryColor: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .default(DEFAULT_PRIMARY_COLOR),
  text: themeTextSchema.default(DEFAULT_TEXT),
  button: themeButtonSchema.default(DEFAULT_BUTTON),
  background: themeBackgroundSchema.default(DEFAULT_BACKGROUND),
})

/**
 * TypeScript types inferred from schemas
 */
export type Theme = z.infer<typeof themeSchema>
export type ThemeText = z.infer<typeof themeTextSchema>
export type ThemeButton = z.infer<typeof themeButtonSchema>
export type ThemeBackground = z.infer<typeof themeBackgroundSchema>
