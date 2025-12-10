// Project-related TypeScript types

import type { Theme } from "@/features/theming";

export type ProjectStatus = "draft" | "live" | "archived" | "deleted";

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
  theme: Theme;

  // Soft delete timestamp
  deletedAt?: number | null;

  createdAt: number; // Unix timestamp ms
  updatedAt: number;
}
