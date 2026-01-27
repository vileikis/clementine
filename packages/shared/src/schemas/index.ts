/**
 * Schema Barrel Exports
 *
 * Central export point for all shared schemas.
 * Organized by domain for clear separation of concerns.
 */

// Session domain
export * from './session'

// Job domain (transform pipeline execution)
export * from './job'

// Experience domain
export * from './experience'

// Project domain (includes config schemas previously in event/)
export * from './project'

// Workspace domain
export * from './workspace'

// Theme domain
export * from './theme'

// Media domain
export * from './media'

// AI Preset domain
export * from './ai-preset'

// Legacy: Media processing schemas (used by existing media pipeline)
// These are separate from the new transform pipeline schemas
// TODO: Remove when old media pipeline functions are deleted
export * from './session.schemas.legacy'
