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

/**
 * Session response schema for capturing user input and media.
 *
 * The `data` field contains step-specific structured data:
 * - input.scale: string (e.g., "5")
 * - input.yesNo: string ("yes" | "no")
 * - input.shortText: string
 * - input.longText: string
 * - input.multiSelect: MultiSelectOption[] (full options with promptFragment/promptMedia)
 * - capture.photo: MediaReference[] (media references)
 *
 * For analytics:
 * - Simple inputs: data is the primitive value
 * - MultiSelect: data.map(opt => opt.value) to get string[]
 * - Capture: no primitive needed
 */
export const sessionResponseSchema = z.object({
  /** Links to step definition */
  stepId: z.string(),
  /** For @{step:...} prompt resolution */
  stepName: z.string(),
  /** e.g., 'input.scale', 'capture.photo' */
  stepType: z.string(),
  /** Step-specific structured data */
  data: z.unknown().nullable().default(null),
  /** Unix timestamp (ms) */
  createdAt: z.number(),
  /** Unix timestamp (ms) */
  updatedAt: z.number(),
})

/** A single response from a session step */
export type SessionResponse = z.infer<typeof sessionResponseSchema>
