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
