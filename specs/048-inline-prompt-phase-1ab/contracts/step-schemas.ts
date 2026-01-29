/**
 * Step Schema Contracts
 *
 * TypeScript interfaces representing the updated step schemas for Phase 1a & 1b.
 * These contracts serve as documentation and can be used for validation
 * in other tools (e.g., backend functions, API integrations).
 *
 * Generated from: packages/shared/src/schemas/experience/
 */

/**
 * Experience Step Type Enumeration
 */
export type ExperienceStepType =
  | 'info'
  | 'input.scale'
  | 'input.yesNo'
  | 'input.multiSelect'
  | 'input.shortText'
  | 'input.longText'
  | 'capture.photo'
  | 'transform.pipeline'

/**
 * Experience Step Category Enumeration
 */
export type ExperienceStepCategory = 'info' | 'input' | 'capture' | 'transform'

/**
 * Experience Step Base
 *
 * Common fields for all step types.
 */
export interface ExperienceStepBase {
  /** Unique step identifier (UUID) */
  id: string

  /** Step type discriminator */
  type: ExperienceStepType

  /**
   * Step name (REQUIRED in Phase 1a)
   *
   * Human-readable identifier for step references in AI prompts.
   * Must be unique within experience (case-sensitive).
   *
   * Validation:
   * - Required (not optional)
   * - Regex: /^[a-zA-Z0-9 \-_]+$/ (letters, numbers, spaces, hyphens, underscores)
   * - Max length: 50 characters
   * - Automatically trimmed before validation
   */
  name: string

  /** Step-specific configuration (varies by type) */
  config: unknown // Replaced with specific config type in discriminated union
}

/**
 * Media Reference
 *
 * Reference to uploaded media file in Firebase Storage.
 */
export interface MediaReference {
  /** Unique media identifier (UUID) */
  mediaAssetId: string

  /** Full public URL */
  url: string

  /** Storage path */
  filePath: string

  /** Original filename (optional) */
  fileName?: string
}

/**
 * Multi-Select Option (UPDATED in Phase 1b)
 *
 * Selectable option in multiselect step, optionally enhanced with AI context.
 */
export interface MultiSelectOption {
  /** Option display value (1-100 chars) */
  value: string

  /**
   * Prompt fragment (NEW in Phase 1b)
   *
   * Optional text inserted into AI prompt when this option is selected.
   * Max length: 500 characters.
   */
  promptFragment?: string

  /**
   * Prompt media (NEW in Phase 1b)
   *
   * Optional media reference inserted into AI prompt when this option is selected.
   */
  promptMedia?: MediaReference
}

/**
 * Input Multi-Select Step Configuration (UPDATED in Phase 1b)
 */
export interface ExperienceInputMultiSelectStepConfig {
  /** Title text (max 200 chars) */
  title: string

  /** Whether this step is required */
  required: boolean

  /**
   * Available options (2-10 items)
   *
   * CHANGED in Phase 1b: Was string[], now MultiSelectOption[]
   */
  options: MultiSelectOption[]

  /** Allow multiple selections (false = single select) */
  multiSelect: boolean
}

/**
 * Input Multi-Select Step (UPDATED)
 */
export interface ExperienceInputMultiSelectStep extends ExperienceStepBase {
  type: 'input.multiSelect'
  name: string // Required
  config: ExperienceInputMultiSelectStepConfig
}

/**
 * Capture Photo Step Configuration
 */
export interface ExperienceCapturePhotoStepConfig {
  /** Title text (max 200 chars) */
  title: string

  /** Whether this step is required */
  required: boolean

  /** Camera facing mode */
  cameraFacing: 'user' | 'environment'
}

/**
 * Capture Photo Step (UPDATED)
 */
export interface ExperienceCapturePhotoStep extends ExperienceStepBase {
  type: 'capture.photo'
  name: string // Required
  config: ExperienceCapturePhotoStepConfig
}

/**
 * Input Short Text Step Configuration
 */
export interface ExperienceInputShortTextStepConfig {
  /** Title text (max 200 chars) */
  title: string

  /** Whether this step is required */
  required: boolean

  /** Placeholder text */
  placeholder?: string

  /** Max length */
  maxLength?: number
}

/**
 * Input Short Text Step (UPDATED)
 */
export interface ExperienceInputShortTextStep extends ExperienceStepBase {
  type: 'input.shortText'
  name: string // Required
  config: ExperienceInputShortTextStepConfig
}

/**
 * Experience Step (Discriminated Union)
 *
 * All possible step types with required name field.
 */
export type ExperienceStep =
  | ExperienceInputMultiSelectStep
  | ExperienceCapturePhotoStep
  | ExperienceInputShortTextStep
// Add other step types as needed (info, scale, yesNo, longText, transformPipeline)

/**
 * Example Usage:
 *
 * ```typescript
 * const step: ExperienceStep = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   type: 'input.multiSelect',
 *   name: 'Pet Choice',  // Required (was optional before Phase 1a)
 *   config: {
 *     title: 'Choose your favorite pet',
 *     required: true,
 *     multiSelect: false,
 *     options: [
 *       {
 *         value: 'Cat',
 *         promptFragment: 'fluffy orange tabby cat',  // NEW in Phase 1b
 *         promptMedia: {  // NEW in Phase 1b
 *           mediaAssetId: 'abc-123',
 *           url: 'https://storage.googleapis.com/.../abc-123.jpg',
 *           filePath: 'prompt-media/workspace-id/abc-123.jpg',
 *           fileName: 'cat.jpg'
 *         }
 *       },
 *       { value: 'Dog' }  // Plain option (no AI context)
 *     ]
 *   }
 * }
 * ```
 */

/**
 * AI-Aware Helper
 *
 * Utility to check if a multiselect option is AI-enabled.
 */
export function isAIEnabled(option: MultiSelectOption): boolean {
  return option.promptFragment !== undefined || option.promptMedia !== undefined
}

/**
 * Step Name Validation Regex
 *
 * Use this regex to validate step names in other systems.
 */
export const STEP_NAME_REGEX = /^[a-zA-Z0-9 \-_]+$/

/**
 * Step Name Constraints
 */
export const STEP_NAME_MAX_LENGTH = 50
export const PROMPT_FRAGMENT_MAX_LENGTH = 500
