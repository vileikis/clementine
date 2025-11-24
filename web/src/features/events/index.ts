// ============================================================================
// Events Feature Public API
// ============================================================================
// This is the ONLY file that should be imported from outside this feature.
// Use: import { EventCard, createEventAction } from "@/features/events"
//
// IMPORTANT: Repository functions are NOT exported here because they contain
// server-only code (Firebase Admin SDK). Import them directly when needed:
// import { getEvent } from "@/features/events/lib/repository"
// ============================================================================

// ============================================================================
// Studio Components (Event list & management)
// ============================================================================
export { EventCard } from "./components/studio/EventCard";
export { EventForm } from "./components/studio/EventForm";
export { EventStatusSwitcher } from "./components/studio/EventStatusSwitcher";
export { EventBreadcrumb } from "./components/studio/EventBreadcrumb";

// ============================================================================
// Designer Components (Event builder UI)
// ============================================================================
export { PreviewPanel } from "./components/designer/PreviewPanel";

// ============================================================================
// Shared Components (Used across studio & designer)
// ============================================================================
export { EventTabs } from "./components/shared/EventTabs";
export { DesignSubTabs } from "./components/shared/DesignSubTabs";
export { TabLink } from "./components/shared/TabLink";
export { EditableEventName } from "./components/shared/EditableEventName";

// ============================================================================
// Server Actions (Safe for client components - marked "use server")
// ============================================================================
export {
  createEventAction,
  getEventAction,
  listEventsAction,
  updateEventBrandingAction,
  updateEventStatusAction,
  updateEventNameAction,
  updateEventTheme,
  updateEventSwitchboardAction,
} from "./actions/events";

// ============================================================================
// Types (Compile-time only, safe to export)
// ============================================================================
export type {
  Event,
  EventStatus,
  EventTheme,
  EventThemeText,
  EventThemeButton,
  EventThemeBackground,
} from "./types/event.types";

// ============================================================================
// Validation Schemas (Safe to export)
// ============================================================================
export {
  eventStatusSchema,
  eventSchema,
} from "./schemas";

// ============================================================================
// Constants (Safe to export)
// ============================================================================
export {
  NAME_LENGTH,
  COLOR_REGEX,
  THEME_DEFAULTS,
} from "./constants";

// ============================================================================
// Repository & Cache - NOT EXPORTED
// ============================================================================
// These contain server-only code (Firebase Admin SDK) and should be imported
// directly when needed in server-only files:
//
// import { createEvent, getEvent, listEvents } from "@/features/events/repositories/events"
//
// DO NOT add repository exports here - they will cause build errors when
// client components try to import them!
// ============================================================================
