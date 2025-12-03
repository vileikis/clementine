// Event-related TypeScript types

/**
 * Theme text configuration for events
 */
export interface EventThemeText {
  color: string; // Hex color (#RRGGBB)
  alignment: "left" | "center" | "right";
}

/**
 * Theme button configuration for events
 */
export interface EventThemeButton {
  backgroundColor?: string | null; // Hex color, inherits primaryColor if null
  textColor: string; // Hex color (#RRGGBB)
  radius: "none" | "sm" | "md" | "full";
}

/**
 * Theme background configuration for events
 */
export interface EventThemeBackground {
  color: string; // Hex color (#RRGGBB)
  image?: string | null; // Full public URL
  overlayOpacity: number; // 0-1
}

/**
 * Event-wide theme settings for visual customization
 * (identical structure to ProjectTheme for consistency)
 */
export interface EventTheme {
  logoUrl?: string | null; // Full public URL
  fontFamily?: string | null; // CSS font family string
  primaryColor: string; // Hex color (#RRGGBB)
  text: EventThemeText;
  button: EventThemeButton;
  background: EventThemeBackground;
}

/**
 * Link between an Event and an Experience
 * (embedded object in Event.experiences array)
 */
export interface EventExperienceLink {
  experienceId: string; // FK to /experiences/{experienceId}
  label?: string | null; // Optional display name override
}

/**
 * Event entity - a time-bound themed instance under a Project
 *
 * Firestore Path: /projects/{projectId}/events/{eventId}
 */
export interface Event {
  id: string; // Document ID (auto-generated)
  projectId: string; // Parent project ID (from path)
  companyId: string; // FK to companies (denormalized for query efficiency)
  name: string; // 1-200 characters

  // Optional scheduling (stored, not enforced in Phase 5)
  publishStartAt?: number | null; // Unix timestamp ms
  publishEndAt?: number | null; // Unix timestamp ms

  // Linked experiences (embedded array, linking UI deferred)
  experiences: EventExperienceLink[];

  // Visual customization
  theme: EventTheme;

  // Soft delete timestamp
  deletedAt?: number | null; // Unix timestamp ms when deleted

  // Timestamps
  createdAt: number; // Unix timestamp ms
  updatedAt: number; // Unix timestamp ms
}
