/**
 * Project Configuration Schema (Shared)
 *
 * Complete project configuration schema for shared kernel.
 * Contains all fields needed by both app and functions, including theme and experiences.
 *
 * This is the single source of truth for project configuration structure.
 * App-specific WRITE schemas (with validation limits) are defined in the app domain.
 */
import { z } from 'zod'

import {
  mediaReferenceSchema,
  overlayReferenceSchema,
} from '../media/media-reference.schema'
import { themeSchema } from '../theme'
import { experiencesConfigSchema } from './experiences.schema'

/**
 * Current schema version for project configuration
 */
export const CURRENT_CONFIG_VERSION = 1

/**
 * Overlay images for different aspect ratios
 */
export const overlaysConfigSchema = z
  .object({
    '1:1': overlayReferenceSchema.default(null),
    '9:16': overlayReferenceSchema.default(null),
  })
  .nullable()
  .default(null)

/**
 * Experience Picker Layout
 */
export const experiencePickerLayoutSchema = z.enum(['list', 'grid'])

/**
 * Guest sharing preferences and options
 */
export const shareOptionsConfigSchema = z.object({
  download: z.boolean().default(true),
  copyLink: z.boolean().default(true),
  email: z.boolean().default(false),
  instagram: z.boolean().default(false),
  facebook: z.boolean().default(false),
  linkedin: z.boolean().default(false),
  twitter: z.boolean().default(false),
  tiktok: z.boolean().default(false),
  telegram: z.boolean().default(false),
})

/**
 * CTA Configuration
 */
export const ctaConfigSchema = z.object({
  label: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
})

/**
 * Share Loading State Configuration
 * Shown while AI generation is in progress
 */
export const shareLoadingConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
})

/**
 * Share Ready State Configuration
 */
export const shareReadyConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  cta: ctaConfigSchema.nullable().default(null),
})

/**
 * Welcome Screen Configuration
 */
export const welcomeConfigSchema = z.object({
  title: z.string().default('Choose your experience'),
  description: z.string().nullable().default(null),
  media: mediaReferenceSchema.nullable().default(null),
  layout: experiencePickerLayoutSchema.default('list'),
})

/**
 * Complete Project Configuration Schema
 *
 * Includes all fields: overlays, share, welcome, theme, and experiences.
 * This is a loose object for forward compatibility.
 */
export const projectConfigSchema = z.looseObject({
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),
  overlays: overlaysConfigSchema,
  shareOptions: shareOptionsConfigSchema.nullable().default(null),
  shareReady: shareReadyConfigSchema.nullable().default(null),
  shareLoading: shareLoadingConfigSchema.nullable().default(null),
  welcome: welcomeConfigSchema.nullable().default(null),
  theme: themeSchema.nullable().default(null),
  experiences: experiencesConfigSchema.nullable().default(null),
})

/**
 * TypeScript types exported from schemas
 */
export type ProjectConfig = z.infer<typeof projectConfigSchema>
export type OverlaysConfig = z.infer<typeof overlaysConfigSchema>
export type ShareOptionsConfig = z.infer<typeof shareOptionsConfigSchema>
export type WelcomeConfig = z.infer<typeof welcomeConfigSchema>
export type CtaConfig = z.infer<typeof ctaConfigSchema>
export type ShareLoadingConfig = z.infer<typeof shareLoadingConfigSchema>
export type ShareReadyConfig = z.infer<typeof shareReadyConfigSchema>
export type ExperiencePickerLayout = z.infer<typeof experiencePickerLayoutSchema>

// Re-export media schemas
export {
  mediaReferenceSchema,
  overlayReferenceSchema,
  type MediaReference,
  type OverlayReference,
} from '../media/media-reference.schema'
