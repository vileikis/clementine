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
export { BuilderSidebar } from "./components/designer/BuilderSidebar";
export { DesignSidebar } from "./components/designer/DesignSidebar";
export { WelcomeEditor } from "./components/designer/WelcomeEditor";
export { EndingEditor } from "./components/designer/EndingEditor";
export { PreviewPanel } from "./components/designer/PreviewPanel";
export { BuilderContent } from "./components/designer/BuilderContent";

// ============================================================================
// Shared Components (Used across studio & designer)
// ============================================================================
export { EventTabs } from "./components/shared/EventTabs";
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
  getCurrentSceneAction,
  updateEventStatusAction,
  updateEventTitleAction,
  updateEventWelcome,
  updateEventEnding,
  updateEventSurveyConfig,
} from "./actions/events";

// Scene-related actions (legacy - still in use)
export {
  updateSceneAction,
  uploadReferenceImageAction,
  getImageUrlAction,
  removeReferenceImageAction,
} from "./actions/scenes";

// ============================================================================
// Types (Compile-time only, safe to export)
// ============================================================================
export type { Event, EventStatus, ShareSocial } from "./types/event.types";

// ============================================================================
// Validation Schemas (Safe to export)
// ============================================================================
export {
  eventStatusSchema,
  shareSocialSchema,
  eventSchema,
  updateEventWelcomeSchema,
  updateEventEndingSchema,
  updateEventSurveyConfigSchema,
} from "./lib/validation";

// ============================================================================
// Repository & Cache - NOT EXPORTED
// ============================================================================
// These contain server-only code (Firebase Admin SDK) and should be imported
// directly when needed in server-only files:
//
// import { createEvent, getEvent, listEvents } from "@/features/events/repositories/events"
// import { updateScene, getScene } from "@/features/events/repositories/scenes"
//
// DO NOT add repository exports here - they will cause build errors when
// client components try to import them!
// ============================================================================
