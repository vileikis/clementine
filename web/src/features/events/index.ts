// ============================================================================
// Events Feature Public API
// ============================================================================
// This is the ONLY file that should be imported from outside this feature.
// Use: import { EventCard, type Event } from "@/features/events"
//
// IMPORTANT: The following are NOT exported here to avoid Next.js bundling errors:
// - Server Actions: import from "@/features/events/actions"
// - Repositories: import from "@/features/events/repositories"
// - Schemas: import from "@/features/events/schemas"
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
export { NAME_LENGTH, COLOR_REGEX, THEME_DEFAULTS } from "./constants";
