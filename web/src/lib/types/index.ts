// Barrel file for type exports
// Feature-specific types have been moved to their respective features
// Only shared types remain here

export type {
  Media,
  StatsOverview,
} from "./firestore";

// Re-export feature types for backward compatibility (deprecated - import from features directly)
export type {
  Event,
  EventStatus,
  Scene,
  SceneStatus,
  CaptureMode,
  ShareSocial,
} from "@/features/events/types/event.types";

export type {
  Session,
  SessionState,
} from "@/features/sessions/types/session.types";

export type {
  Company,
  CompanyStatus,
} from "@/features/companies/types/company.types";

export type {
  Experience,
  ExperienceType,
  PreviewType,
  AspectRatio,
} from "@/features/experiences/types/experience.types";
