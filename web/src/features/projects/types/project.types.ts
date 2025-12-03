// Project-related TypeScript types

export type ProjectStatus = "draft" | "live" | "archived" | "deleted";

/**
 * Theme text configuration
 */
export interface ProjectThemeText {
  color: string; // Hex color (e.g., "#000000")
  alignment: "left" | "center" | "right";
}

/**
 * Theme button configuration
 */
export interface ProjectThemeButton {
  backgroundColor?: string | null; // Hex color (inherits primaryColor if undefined)
  textColor: string; // Hex color (e.g., "#FFFFFF")
  radius: "none" | "sm" | "md" | "full";
}

/**
 * Theme background configuration
 */
export interface ProjectThemeBackground {
  color: string; // Hex color (e.g., "#F9FAFB")
  image?: string | null; // Full public URL
  overlayOpacity: number; // 0-1
}

/**
 * Project-wide theme settings for visual customization
 */
export interface ProjectTheme {
  logoUrl?: string | null;
  fontFamily?: string | null;
  primaryColor: string; // Hex color - anchor color for the project
  text: ProjectThemeText;
  button: ProjectThemeButton;
  background: ProjectThemeBackground;
}

export interface Project {
  id: string;
  name: string;

  status: ProjectStatus;

  companyId: string | null; // FK to companies collection (renamed from ownerId)

  sharePath: string; // e.g., "/p/abc123" (renamed from joinPath)
  qrPngPath: string; // Storage path

  publishStartAt?: number | null; // Optional Unix timestamp ms (TEMPORARY - will move to Event in Phase 5)
  publishEndAt?: number | null; // Optional Unix timestamp ms (TEMPORARY - will move to Event in Phase 5)

  // Switchboard pattern - controls which event/experience is active (TEMPORARY SEMANTICS - points to Experience IDs in Phase 4, will point to nested Event IDs in Phase 5)
  activeEventId?: string | null; // renamed from activeJourneyId

  // Nested object configurations (TEMPORARY - will move to Event in Phase 5)
  theme: ProjectTheme;

  // Soft delete timestamp
  deletedAt?: number | null;

  createdAt: number; // Unix timestamp ms
  updatedAt: number;
}
