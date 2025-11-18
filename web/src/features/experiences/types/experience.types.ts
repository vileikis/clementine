// Experience types for the experiences feature module

/**
 * Experience types supported by the platform.
 * Only "photo" is fully implemented in the initial phase.
 */
export type ExperienceType = "photo" | "video" | "gif" | "wheel";

/**
 * Preview media types for experiences.
 */
export type PreviewType = "image" | "gif" | "video";

/**
 * AI aspect ratio options for transformation output.
 */
export type AspectRatio = "1:1" | "3:4" | "4:5" | "9:16" | "16:9";

/**
 * Experience represents a single interactive experience within an event.
 * Lives in /events/{eventId}/experiences/{experienceId} subcollection.
 */
export interface Experience {
  id: string;
  eventId: string;

  // Basic configuration
  label: string;
  type: ExperienceType;
  enabled: boolean;

  // Preview configuration
  previewPath?: string; // Storage path
  previewType?: PreviewType;

  // Countdown configuration
  countdownEnabled: boolean;
  countdownSeconds: number;

  // Overlay configuration
  overlayEnabled: boolean;
  overlayFramePath?: string; // Storage path

  // AI transformation configuration
  aiEnabled: boolean;
  aiModel?: string;
  aiPrompt?: string;
  aiReferenceImagePaths?: string[]; // Storage paths
  aiAspectRatio: AspectRatio;

  createdAt: number;
  updatedAt: number;

  // ====================================================================
  // Deprecated fields (kept for backward compatibility with legacy data)
  // ====================================================================
  allowCamera?: boolean; // DEPRECATED - removed in 001-photo-experience-tweaks
  allowLibrary?: boolean; // DEPRECATED - removed in 001-photo-experience-tweaks
  overlayLogoPath?: string; // DEPRECATED - removed in 001-photo-experience-tweaks
  maxDurationMs?: number; // DEPRECATED - for video/gif types (out of scope)
  frameCount?: number; // DEPRECATED - for gif/boomerang types (out of scope)
  captureIntervalMs?: number; // DEPRECATED - for gif types (out of scope)
}

/**
 * ExperienceItem represents items used by certain experience types (e.g., wheel sectors).
 * Lives in /events/{eventId}/experienceItems/{itemId} subcollection.
 * NOTE: Out of scope for initial implementation (photo experiences only).
 */
export interface ExperienceItem {
  id: string;
  eventId: string;
  experienceId: string; // FK to experiences subcollection

  label: string;
  order: number;
  enabled: boolean;

  // Item-specific configuration (type-dependent)
  value?: string;
  color?: string;
  weight?: number; // For wheel probability

  createdAt: number;
  updatedAt: number;
}

/**
 * Survey step types supported by the platform.
 */
export type SurveyStepType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "opinion_scale"
  | "email"
  | "statement";

/**
 * SurveyStep represents a single survey question/step.
 * Lives in /events/{eventId}/surveySteps/{stepId} subcollection.
 */
export interface SurveyStep {
  id: string;
  eventId: string;
  type: SurveyStepType;

  // Content
  title?: string;
  description?: string;
  placeholder?: string;

  // Type-specific configuration
  options?: string[]; // For multiple_choice
  allowMultiple?: boolean; // For multiple_choice
  scaleMin?: number; // For opinion_scale
  scaleMax?: number; // For opinion_scale

  // Validation
  required: boolean;

  createdAt: number;
  updatedAt: number;
}
