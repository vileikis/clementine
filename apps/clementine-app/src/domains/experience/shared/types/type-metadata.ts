/**
 * Experience Type Metadata
 *
 * Maps each experience type to its metadata: label, allowed step categories,
 * slot compatibility, and coming-soon status.
 *
 * Replaces the old profileMetadata which mapped ExperienceProfile values.
 */
import type {
  ExperienceConfig,
  ExperienceStepCategory,
  ExperienceType,
} from '@clementine/shared'

/**
 * Slot types where experiences can be used
 */
export type SlotType = 'main' | 'pregate' | 'preshare'

/**
 * Type metadata describing capabilities
 */
export interface TypeMetadata {
  /** Human-readable label */
  label: string
  /** Description for users */
  description: string
  /** Allowed step categories */
  allowedStepCategories: ExperienceStepCategory[]
  /** Compatible slot types */
  slotCompatibility: SlotType[]
  /** Whether the type is not yet available for selection */
  comingSoon?: boolean
}

/**
 * Type metadata record
 * Static information about each experience type
 */
export const typeMetadata: Record<ExperienceType, TypeMetadata> = {
  survey: {
    label: 'Survey',
    description: 'Data collection with info, input, and capture steps',
    allowedStepCategories: ['info', 'input', 'capture'],
    slotCompatibility: ['main', 'pregate', 'preshare'],
  },
  photo: {
    label: 'Photo',
    description: 'Passthrough photo capture with optional overlay',
    allowedStepCategories: ['info', 'input', 'capture', 'transform'],
    slotCompatibility: ['main'],
  },
  gif: {
    label: 'GIF',
    description: 'Animated GIF capture',
    allowedStepCategories: ['info', 'input', 'capture', 'transform'],
    slotCompatibility: ['main'],
    comingSoon: true,
  },
  video: {
    label: 'Video',
    description: 'Video capture',
    allowedStepCategories: ['info', 'input', 'capture', 'transform'],
    slotCompatibility: ['main'],
    comingSoon: true,
  },
  'ai.image': {
    label: 'AI Image',
    description: 'AI-generated image from prompt and/or source',
    allowedStepCategories: ['info', 'input', 'capture', 'transform'],
    slotCompatibility: ['main'],
  },
  'ai.video': {
    label: 'AI Video',
    description: 'AI-generated video',
    allowedStepCategories: ['info', 'input', 'capture', 'transform'],
    slotCompatibility: ['main'],
  },
}

/**
 * Type validation result
 */
export interface TypeValidationResult {
  /** Whether the configuration is valid for this type */
  valid: boolean
  /** List of validation errors (blocking issues) */
  errors: string[]
  /** List of validation warnings (non-blocking suggestions) */
  warnings: string[]
}

/**
 * Type validator function type
 */
export type TypeValidator = (
  config: ExperienceConfig,
) => TypeValidationResult

/**
 * Empty validator factory
 * Creates a validator that always passes
 */
const createEmptyValidator = (): TypeValidator => {
  return () => ({
    valid: true,
    errors: [],
    warnings: [],
  })
}

/**
 * Type validators record
 * Maps each type to its validator function
 */
export const typeValidators: Record<ExperienceType, TypeValidator> = {
  survey: createEmptyValidator(),
  photo: createEmptyValidator(),
  gif: createEmptyValidator(),
  video: createEmptyValidator(),
  'ai.image': createEmptyValidator(),
  'ai.video': createEmptyValidator(),
}

/**
 * Validate an experience configuration against its type
 */
export function validateExperienceType(
  type: ExperienceType,
  config: ExperienceConfig,
): TypeValidationResult {
  const validator = typeValidators[type]
  return validator(config)
}
