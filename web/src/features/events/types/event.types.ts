// Event-related TypeScript types

export type EventStatus = "draft" | "live" | "archived";

/**
 * Theme text configuration
 */
export interface EventThemeText {
  color: string; // Hex color (e.g., "#000000")
  alignment: "left" | "center" | "right";
}

/**
 * Theme button configuration
 */
export interface EventThemeButton {
  backgroundColor?: string | null; // Hex color (inherits primaryColor if undefined)
  textColor: string; // Hex color (e.g., "#FFFFFF")
  radius: "none" | "sm" | "md" | "full";
}

/**
 * Theme background configuration
 */
export interface EventThemeBackground {
  color: string; // Hex color (e.g., "#F9FAFB")
  image?: string | null; // Full public URL
  overlayOpacity: number; // 0-1
}

/**
 * Event-wide theme settings for visual customization
 */
export interface EventTheme {
  logoUrl?: string | null;
  fontFamily?: string | null;
  primaryColor: string; // Hex color - anchor color for the event
  text: EventThemeText;
  button: EventThemeButton;
  background: EventThemeBackground;
}

export interface Event {
  id: string;
  name: string;

  status: EventStatus;

  ownerId: string | null; // FK to companies collection

  joinPath: string; // e.g., "/join/abc123"
  qrPngPath: string; // Storage path

  publishStartAt?: number | null; // Optional Unix timestamp ms
  publishEndAt?: number | null; // Optional Unix timestamp ms

  // Switchboard pattern - controls which journey is active
  activeJourneyId?: string | null;

  // Nested object configurations
  theme: EventTheme;

  createdAt: number; // Unix timestamp ms
  updatedAt: number;
}
