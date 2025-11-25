// Journeys Feature - Public API
// All imports from this feature should use this file

// ============================================================================
// Components
// ============================================================================
export * from "./components";

// ============================================================================
// Types
// ============================================================================
export type { Journey, JourneyStatus } from "./types";

// ============================================================================
// Server-only exports
// Note: Actions, schemas, repositories are NOT exported from the public API.
// They should only be accessed via direct imports:
// - Actions: @/features/journeys/actions
// - Schemas: @/features/journeys/schemas (internal use only)
// - Repositories: @/features/journeys/repositories (server-only)
// ============================================================================
