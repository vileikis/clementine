/**
 * Project Domain Barrel Export
 *
 * Main entry point for the project domain.
 * Re-exports from subdomains (events, share, shared).
 */

// Shared hooks and queries
export * from './shared'

// Events subdomain
export * from './events'

// Share subdomain
export * from './share'
