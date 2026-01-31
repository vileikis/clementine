/**
 * Schema Contracts
 *
 * Zod schema definitions for answer value after refactor.
 * Documents the schema change from 4-type union to 2-type union.
 * Shows extraction of answerValueSchema for reusability.
 */

import { z } from 'zod'

/**
 * Answer Value Schema (NEW - Extracted)
 *
 * Single source of truth for answer value types.
 * Simplified from 4 types to 2 types.
 *
 * BEFORE (inline in answerSchema):
 * value: z.union([
 *   z.string(),       // Text inputs
 *   z.number(),       // Scale inputs (REMOVED)
 *   z.boolean(),      // Yes/No inputs (REMOVED)
 *   z.array(z.string()), // Multi-select inputs
 * ])
 *
 * AFTER (extracted schema):
 */
export const answerValueSchema = z.union([
  z.string(),          // Text, Yes/No ("yes"/"no"), Scale ("1"-"5")
  z.array(z.string()), // Multi-select
])

/**
 * Answer Value Type
 *
 * Inferred from schema for guaranteed consistency.
 * Used by both session schema and app renderers.
 */
export type AnswerValue = z.infer<typeof answerValueSchema>

/**
 * Answer Schema (Updated)
 *
 * Now uses answerValueSchema instead of inline union.
 *
 * Format by step type:
 * - input.scale: string ("1", "2", "3", ...)
 * - input.yesNo: string ("yes" or "no")
 * - input.shortText: string
 * - input.longText: string
 * - input.multiSelect: string[] (array of selected option values)
 */
export const answerSchema = z.object({
  /** Step that collected this answer */
  stepId: z.string(),

  /** Step type (e.g., 'input.scale', 'input.yesNo') */
  stepType: z.string(),

  /** The answer value - uses answerValueSchema */
  value: answerValueSchema,  // ✅ Uses extracted schema

  /**
   * Optional step-specific context for AI generation
   * - Multi-select: MultiSelectOption[] (full option objects with promptFragment/promptMedia)
   * - Other steps: any step-specific structured data
   */
  context: z.unknown().nullable().default(null),

  /** Timestamp when answered (Unix ms) */
  answeredAt: z.number(),
})

/**
 * TypeScript type inferred from schema
 */
export type Answer = z.infer<typeof answerSchema>

/**
 * Answer Value Type (Simplified)
 *
 * BEFORE: string | number | boolean | string[]
 * AFTER: string | string[]
 */
export type AnswerValue = string | string[]

/**
 * Validation Examples
 */
export const AnswerValidationExamples = {
  /**
   * Valid scale answer
   */
  validScale: {
    stepId: 'step-123',
    stepType: 'input.scale',
    value: '3', // String, not number
    context: null,
    answeredAt: 1706745600000,
  } satisfies Answer,

  /**
   * Valid yes/no answer
   */
  validYesNo: {
    stepId: 'step-456',
    stepType: 'input.yesNo',
    value: 'yes', // String, not boolean
    context: null,
    answeredAt: 1706745600000,
  } satisfies Answer,

  /**
   * Valid text answer
   */
  validText: {
    stepId: 'step-789',
    stepType: 'input.shortText',
    value: 'Hello world',
    context: null,
    answeredAt: 1706745600000,
  } satisfies Answer,

  /**
   * Valid multi-select answer
   */
  validMultiSelect: {
    stepId: 'step-abc',
    stepType: 'input.multiSelect',
    value: ['option1', 'option2'], // String array
    context: [
      { value: 'option1', promptFragment: '...', promptMedia: null },
      { value: 'option2', promptFragment: '...', promptMedia: null },
    ],
    answeredAt: 1706745600000,
  } satisfies Answer,

  /**
   * INVALID: Number value (no longer accepted)
   */
  // invalidNumber: {
  //   stepId: 'step-123',
  //   stepType: 'input.scale',
  //   value: 3, // ❌ TypeScript error: Type 'number' is not assignable to type 'string | string[]'
  //   context: null,
  //   answeredAt: 1706745600000,
  // },

  /**
   * INVALID: Boolean value (no longer accepted)
   */
  // invalidBoolean: {
  //   stepId: 'step-456',
  //   stepType: 'input.yesNo',
  //   value: true, // ❌ TypeScript error: Type 'boolean' is not assignable to type 'string | string[]'
  //   context: null,
  //   answeredAt: 1706745600000,
  // },
}

/**
 * Migration Utilities (for hypothetical data migration)
 *
 * Not needed for current implementation (pre-launch, no data),
 * but documented for future reference.
 */
export const AnswerMigration = {
  /**
   * Normalize old answer value to new format
   */
  normalizeValue: (value: unknown, stepType: string): AnswerValue => {
    // Handle boolean (yes/no)
    if (typeof value === 'boolean') {
      return value ? 'yes' : 'no'
    }

    // Handle number (scale)
    if (typeof value === 'number') {
      return String(value)
    }

    // Handle string (text, already normalized)
    if (typeof value === 'string') {
      return value
    }

    // Handle string array (multi-select, already normalized)
    if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      return value
    }

    throw new Error(
      `Cannot normalize answer value: ${JSON.stringify(value)} for step type ${stepType}`,
    )
  },

  /**
   * Validate answer matches expected format for step type
   */
  validateForStepType: (value: AnswerValue, stepType: string): boolean => {
    switch (stepType) {
      case 'input.scale':
      case 'input.yesNo':
      case 'input.shortText':
      case 'input.longText':
        return typeof value === 'string'

      case 'input.multiSelect':
        return Array.isArray(value)

      default:
        return false
    }
  },
}

/**
 * Type Guards
 */
export const AnswerTypeGuards = {
  /**
   * Check if answer value is a string
   */
  isStringValue: (value: AnswerValue): value is string => {
    return typeof value === 'string'
  },

  /**
   * Check if answer value is a string array
   */
  isArrayValue: (value: AnswerValue): value is string[] => {
    return Array.isArray(value)
  },

  /**
   * Check if answer is for a scale step (value should be numeric string)
   */
  isScaleAnswer: (answer: Answer): boolean => {
    return (
      answer.stepType === 'input.scale' &&
      typeof answer.value === 'string' &&
      !isNaN(Number(answer.value))
    )
  },

  /**
   * Check if answer is for a yes/no step (value should be "yes" or "no")
   */
  isYesNoAnswer: (answer: Answer): boolean => {
    return (
      answer.stepType === 'input.yesNo' &&
      (answer.value === 'yes' || answer.value === 'no')
    )
  },
}
