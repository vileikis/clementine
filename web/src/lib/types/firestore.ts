// Canonical TypeScript types for Firestore data models

export type EventStatus = "draft" | "live" | "archived";
export type SceneStatus = "active" | "deprecated";
export type SessionState = "created" | "captured" | "transforming" | "ready" | "error";
export type CaptureMode = "photo" | "video" | "gif" | "boomerang";
export type CompanyStatus = "active" | "deleted";

export type ShareSocial =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "x"
  | "snapchat"
  | "whatsapp"
  | "custom";

export interface Event {
  id: string;
  title: string;
  brandColor: string; // hex color
  showTitleOverlay: boolean;

  status: EventStatus;
  currentSceneId: string; // FK to scenes subcollection

  companyId: string | null; // FK to companies collection

  joinPath: string; // e.g., "/join/abc123"
  qrPngPath: string; // Storage path

  createdAt: number; // Unix timestamp ms
  updatedAt: number;

  // ========================================================================
  // Events Builder Redesign Fields (001-events-builder-redesign)
  // ========================================================================

  // Welcome screen configuration
  welcomeTitle?: string;
  welcomeDescription?: string;
  welcomeCtaLabel?: string;
  welcomeBackgroundImagePath?: string; // Storage path
  welcomeBackgroundColorHex?: string;

  // Ending screen configuration
  endHeadline?: string;
  endBody?: string;
  endCtaLabel?: string;
  endCtaUrl?: string;

  // Share configuration
  shareAllowDownload: boolean;
  shareAllowSystemShare: boolean;
  shareAllowEmail: boolean;
  shareSocials: ShareSocial[];

  // Survey configuration
  surveyEnabled: boolean;
  surveyRequired: boolean;
  surveyStepsCount: number;
  surveyStepsOrder: string[]; // Array of stepIds in order
  surveyVersion: number; // Increments when survey config changes

  // Denormalized counters (for performance)
  experiencesCount: number;
  sessionsCount: number;
  readyCount: number; // Sessions in "ready" state
  sharesCount: number;
}

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  deletedAt: number | null;

  // Optional branding metadata
  brandColor?: string;
  contactEmail?: string;
  termsUrl?: string;
  privacyUrl?: string;

  createdAt: number;
  updatedAt: number;
}

export interface Scene {
  id: string;
  label: string;
  mode: CaptureMode;

  prompt: string | null;

  referenceImagePath?: string; // Storage path

  flags: {
    customTextTool: boolean;
    stickersTool: boolean;
  };

  status: SceneStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  eventId: string; // denormalized for convenience
  sceneId: string; // snapshot pointer

  state: SessionState;

  inputImagePath?: string; // Storage path
  resultImagePath?: string; // Storage path

  error?: string;

  createdAt: number;
  updatedAt: number;
}

export interface Media {
  id: string;
  sessionId: string;
  sceneId: string;
  resultImagePath: string;

  createdAt: number;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface StatsOverview {
  sessions: number;
  captures: number;
  transforms: number;
  shares: number;
  downloads: number;
  uniqueGuests: number;

  captureRate: number;
  transformSuccessRate: number;
  shareRate: number;

  topMedia: Array<{
    mediaId: string;
    sessionId: string;
    resultImagePath: string;
    score: number;
    shares: number;
    downloads: number;
    views: number;
  }>;

  updatedAt: number;
}

// ============================================================================
// Events Builder Redesign Types (001-events-builder-redesign)
// ============================================================================

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

  // Capture configuration
  allowCamera: boolean;
  allowLibrary: boolean;
  maxDurationMs?: number; // For video/gif types
  frameCount?: number; // For gif/boomerang types
  captureIntervalMs?: number; // For gif types

  // Overlay configuration
  overlayFramePath?: string; // Storage path
  overlayLogoPath?: string; // Storage path

  // AI transformation configuration
  aiEnabled: boolean;
  aiModel?: string;
  aiPrompt?: string;
  aiReferenceImagePaths?: string[]; // Storage paths

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
