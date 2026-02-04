/**
 * Session Response Schema
 *
 * Unified response format for session step responses.
 * Replaces separate answers[] and capturedMedia[] arrays with a single
 * responses[] array that handles all step types.
 *
 * @see PRD 1A - Schema Foundations
 */
import { z } from 'zod'

export const sessionResponseValueSchema = z.union([
  z.string(), // Text, yes/no, scale
  z.array(z.string()), // Multi-select
])

/**
 * Session response schema for capturing user input and media.
 *
 * value: Analytics-friendly primitive (string or string array)
 * context: Rich structured data (MediaReference[] for captures, options for multi-select)
 *
 * The context field is typed as `unknown` to avoid coupling to specific step types.
 * Interpretation is based on stepType:
 * - input.* (except multiSelect): context is null
 * - input.multiSelect: context is MultiSelectOption[]
 * - capture.*: context is MediaReference[]
 */
export const sessionResponseSchema = z.object({
  /** Links to step definition */
  stepId: z.string(),
  /** For @{step:...} prompt resolution */
  stepName: z.string(),
  /** e.g., 'input.scale', 'capture.photo' */
  stepType: z.string(),
  /** Analytics-friendly primitive value */
  value: sessionResponseValueSchema.nullable().default(null),
  /** Rich structured data (MediaReference[] for captures, etc.) */
  context: z.unknown().nullable().default(null),
  /** Unix timestamp (ms) */
  createdAt: z.number(),
  /** Unix timestamp (ms) */
  updatedAt: z.number(),
})

/** A single response from a session step */
export type SessionResponse = z.infer<typeof sessionResponseSchema>
