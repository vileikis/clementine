/**
 * Project Domain Barrel Export
 *
 * Main entry point for the project domain.
 * Re-exports from subdomains (share, shared).
 *
 * Note: Events subdomain has been merged into the project document.
 * Config is now accessed via project.draftConfig and project.publishedConfig.
 * Use the project-config domain for config editing features.
 */

// Shared hooks and queries
export * from './shared'

// Share subdomain
export * from './share'

// Layout subdomain
export * from './layout'

// Distribute subdomain
export * from './distribute'

// Analytics subdomain
export * from './analytics'

// Connect subdomain
export * from './connect'
