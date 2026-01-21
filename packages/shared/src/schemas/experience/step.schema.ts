/**
 * Base Step Schema (Shared)
 *
 * Simplified step schema for shared kernel.
 * Contains only fields needed across app and functions.
 * Step-specific configs (discriminated union) stay in app domain.
 *
 * Note: This is the Firestore document structure, not the full
 * validated step with config type checking.
 */
import { z } from 'zod'

/**
 * Base step schema for Firestore documents
 */
export const baseStepSchema = z.looseObject({
  /** Unique step identifier within the experience (UUID) */
  id: z.string(),
  /** Step type from registry (e.g., 'info', 'input.scale') */
  type: z.string(),
  /** Human-readable step name for identification and variable mapping */
  name: z.string().min(1).max(50).optional(),
  /** Step-specific configuration object */
  config: z.record(z.string(), z.unknown()).default({}),
})

export type BaseStep = z.infer<typeof baseStepSchema>
