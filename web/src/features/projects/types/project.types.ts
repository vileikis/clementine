// Project-related TypeScript types

import type { Theme } from "@/features/theming";

export type ProjectStatus = "draft" | "live" | "archived" | "deleted";

/**
 * Re-export sub-types from theming module for backward compatibility.
 * New code should import directly from @/features/theming.
 */
export type { ThemeText as ProjectThemeText } from "@/features/theming";
export type { ThemeButton as ProjectThemeButton } from "@/features/theming";
export type { ThemeBackground as ProjectThemeBackground } from "@/features/theming";

/**
 * Project-wide theme settings for visual customization.
 *
 * Extends Theme with logoUrl for backward compatibility.
 * logoUrl is an identity concern (not styling), but kept here during migration.
 *
 * @deprecated Prefer importing Theme from @/features/theming and using Project.logoUrl directly.
 */
export interface ProjectTheme extends Theme {
  /** Logo URL - identity concern, kept for backward compatibility */
  logoUrl?: string | null;
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

  // Logo URL - identity concern, separated from theme styling
  logoUrl?: string | null;

  // Nested object configurations (TEMPORARY - will move to Event in Phase 5)
  theme: ProjectTheme;

  // Soft delete timestamp
  deletedAt?: number | null;

  createdAt: number; // Unix timestamp ms
  updatedAt: number;
}
