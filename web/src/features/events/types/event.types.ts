// Event-related TypeScript types

export type EventStatus = "draft" | "live" | "archived";

export type ShareSocial =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "x"
  | "snapchat"
  | "whatsapp"
  | "custom";

export type SceneStatus = "active" | "deprecated";
export type CaptureMode = "photo" | "video" | "gif" | "boomerang";

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
