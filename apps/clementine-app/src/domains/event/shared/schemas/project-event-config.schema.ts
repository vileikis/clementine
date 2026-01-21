/**
 * Project Event Configuration Schema (App)
 *
 * App-specific event configuration schema with WRITE validation.
 *
 * **Pattern**: Re-export READ schemas from @clementine/shared,
 * define WRITE schemas (with validation limits) here for app-specific needs.
 *
 * Cross-reference: See project-event-full.schema.ts for complete ProjectEvent schema
 */
import { z } from 'zod'

// Re-export READ schemas from shared kernel (single source of truth)
export {
  // Event full document schemas
  projectEventFullSchema,
  projectEventStatusSchema,
  // Event config schemas
  CURRENT_CONFIG_VERSION,
  overlayReferenceSchema,
  overlaysConfigSchema,
  shareOptionsConfigSchema,
  ctaConfigSchema,
  shareConfigSchema,
  welcomeConfigSchema,
  experiencePickerLayoutSchema,
  projectEventConfigSchema,
  // Theme schemas
  themeSchema,
  themeTextSchema,
  themeButtonSchema,
  themeBackgroundSchema,
  mediaReferenceSchema,
  // Experience schemas
  experiencesConfigSchema,
  experienceReferenceSchema,
  mainExperienceReferenceSchema,
  // Types
  type ProjectEventFull,
  type ProjectEventStatus,
  type ProjectEventConfig,
  type OverlayReference,
  type OverlaysConfig,
  type ShareOptionsConfig,
  type WelcomeConfig,
  type CtaConfig,
  type ShareConfig,
  type ExperiencePickerLayout,
  type MediaReference,
  type Theme,
  type ThemeText,
  type ThemeButton,
  type ThemeBackground,
  type ExperiencesConfig,
  type ExperienceReference,
  type MainExperienceReference,
} from '@clementine/shared'

// =============================================================================
// App-specific WRITE schemas (with validation limits)
// =============================================================================

/**
 * CTA Write Schema
 *
 * Stricter validation for writing CTA config.
 * Enforces: if label is provided, url must also be provided.
 */
export const ctaWriteSchema = z
  .object({
    label: z.string().nullable().default(null),
    url: z.string().nullable().default(null),
  })
  .refine(
    (data) => {
      // If label is provided, url must also be provided
      if (data.label !== null && data.url === null) {
        return false
      }
      return true
    },
    {
      message: 'CTA url is required when label is provided',
      path: ['url'],
    },
  )

/**
 * Share Write Schema
 *
 * Stricter validation for writing share config.
 * Uses ctaWriteSchema to enforce CTA cross-field validation.
 */
export const shareWriteSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  cta: ctaWriteSchema.nullable().default(null),
})
