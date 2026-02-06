/**
 * Session Domain - Schemas Barrel Export
 *
 * Exports all Zod schemas and inferred types for the session domain.
 * Core session schemas are imported from @clementine/shared.
 */

// Re-export core session schemas from shared kernel
export {
  sessionSchema,
  sessionModeSchema,
  configSourceSchema,
  sessionStatusSchema,
  jobStatusSchema,
  sessionResultMediaSchema,
  type Session,
  type SessionMode,
  type ConfigSource,
  type SessionStatus,
  type JobStatus,
  type SessionResultMedia,
} from '@clementine/shared'
