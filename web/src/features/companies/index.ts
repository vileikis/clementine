// Companies Feature - Public API
// All imports from this feature should use this file

// ============================================================================
// Components
// ============================================================================
export * from './components';

// ============================================================================
// Types
// ============================================================================
export type { Company, CompanyStatus } from './types';

// ============================================================================
// Server-only exports
// Note: Actions, schemas, repositories, and lib are NOT exported from the public API.
// They should only be accessed via direct imports:
// - Actions: @/features/companies/actions
// - Schemas: @/features/companies/schemas (internal use only)
// - Repositories: @/features/companies/repositories (server-only)
// - Lib (cache): @/features/companies/lib (internal use only)
// ============================================================================
