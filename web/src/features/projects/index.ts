// ============================================================================
// Projects Feature Public API
// ============================================================================
// This is the ONLY file that should be imported from outside this feature.
// Use: import { ProjectCard, type Project } from "@/features/projects"
//
// IMPORTANT: The following are NOT exported here to avoid Next.js bundling errors:
// - Server Actions: import from "@/features/projects/actions"
// - Repositories: import from "@/features/projects/repositories"
// - Schemas: import from "@/features/projects/schemas"
// ============================================================================

// ============================================================================
// Components
// ============================================================================
export * from "./components";

// ============================================================================
// Types (Compile-time only, safe to export)
// ============================================================================
export * from "./types";

// ============================================================================
// Constants (Safe to export)
// ============================================================================
export { NAME_LENGTH, COLOR_REGEX, THEME_DEFAULTS, PROJECT_STATUS, SHARE_PATH_PREFIX, QR_STORAGE_PATH } from "./constants";
