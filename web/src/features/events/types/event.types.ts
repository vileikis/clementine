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

/**
 * Event-wide theme settings for visual customization
 */
export interface EventTheme {
  buttonColor?: string; // Hex color (e.g., "#3B82F6")
  buttonTextColor?: string; // Hex color (e.g., "#FFFFFF")
  backgroundColor?: string; // Hex color (e.g., "#F9FAFB")
  backgroundImage?: string; // Full public URL
}

/**
 * Welcome screen configuration shown to guests when they first join an event
 */
export interface EventWelcome {
  title?: string; // Max 500 characters
  body?: string; // Max 500 characters
  ctaLabel?: string; // Max 50 characters
  backgroundImage?: string; // Full public URL
  backgroundColor?: string; // Hex color (e.g., "#FFFFFF")
}

/**
 * Ending screen configuration shown to guests after completing an experience
 */
export interface EventEnding {
  title?: string; // Max 500 characters
  body?: string; // Max 500 characters
  ctaLabel?: string; // Max 50 characters
  ctaUrl?: string; // Valid URL
}

/**
 * Share settings controlling how guests can share their generated media
 */
export interface EventShareConfig {
  allowDownload: boolean; // Default: true
  allowSystemShare: boolean; // Default: true
  allowEmail: boolean; // Default: false
  socials: ShareSocial[]; // Default: []
}

export interface Event {
  id: string;
  title: string;

  status: EventStatus;

  companyId: string | null; // FK to companies collection

  joinPath: string; // e.g., "/join/abc123"
  qrPngPath: string; // Storage path

  publishStartAt?: number; // Optional Unix timestamp ms
  publishEndAt?: number; // Optional Unix timestamp ms

  // Nested object configurations
  theme?: EventTheme;
  welcome?: EventWelcome;
  ending?: EventEnding;
  share: EventShareConfig;

  // Denormalized counters (for performance)
  experiencesCount: number;
  sessionsCount: number;
  readyCount: number; // Sessions in "ready" state
  sharesCount: number;

  createdAt: number; // Unix timestamp ms
  updatedAt: number;
}
