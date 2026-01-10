/**
 * Experience Domain - Main Barrel Export
 *
 * Entry point for importing from @/domains/experience
 *
 * IMPORT BOUNDARY: This domain is a core capability.
 * - MAY import from: @/shared, @/integrations, @/ui-kit
 * - MUST NOT import from: @/domains/event, @/domains/guest
 *
 * Usage:
 * ```typescript
 * import { Experience, experienceSchema, ExperienceSlot } from '@/domains/experience'
 * ```
 */

// Re-export everything from shared
export * from './shared'

// Re-export subdomain placeholders
export * from './steps'
export * from './validation'
export * from './runtime'
export * from './editor'
