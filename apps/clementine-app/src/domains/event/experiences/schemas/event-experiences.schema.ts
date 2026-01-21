/**
 * Event Experiences Schema (App Re-export)
 *
 * Re-exports experiences schemas from @clementine/shared for app usage.
 * Single source of truth is in packages/shared/src/schemas/event/
 */

// Re-export everything from shared
export {
  experienceReferenceSchema,
  mainExperienceReferenceSchema,
  experiencesConfigSchema,
  type ExperienceReference,
  type MainExperienceReference,
  type ExperiencesConfig,
} from '@clementine/shared'

// Re-export SlotType and SlotMode for convenience (app-specific constants)
export type { SlotType, SlotMode } from '../constants'
