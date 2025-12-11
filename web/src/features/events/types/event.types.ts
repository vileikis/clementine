// Event-related TypeScript types

import type { Theme } from "@/features/theming";

/**
 * Layout options for experience cards on the welcome screen
 */
export type ExperienceLayout = "list" | "grid";

/**
 * Welcome screen configuration for an event
 */
export interface EventWelcome {
  /** Custom welcome title. Falls back to event.name in UI if null/empty */
  title?: string | null;

  /** Welcome description displayed below title */
  description?: string | null;

  /** Hero media URL (Firebase Storage public URL) */
  mediaUrl?: string | null;

  /** Type of hero media for proper rendering */
  mediaType?: "image" | "video" | null;

  /** Layout for experience cards */
  layout: ExperienceLayout;
}

/**
 * Default welcome configuration for new events
 */
export const DEFAULT_EVENT_WELCOME: EventWelcome = {
  title: "Choose your experience",
  description: null,
  mediaUrl: null,
  mediaType: null,
  layout: "list",
};

/**
 * Frequency options for extra slots
 */
export type ExtraSlotFrequency = "always" | "once_per_session";

/**
 * Link between an Event and an Experience
 * (embedded object in Event.experiences array and extras slots)
 */
export interface EventExperienceLink {
  experienceId: string; // FK to /experiences/{experienceId}
  label?: string | null; // Optional display name override
  enabled: boolean; // Toggle to enable/disable without removing
  frequency?: ExtraSlotFrequency | null; // Only used for extras: "always" or "once_per_session"
}

/**
 * Container for slot-based extra flows that run at specific points in the guest journey
 */
export interface EventExtras {
  preEntryGate?: EventExperienceLink | null; // Flow shown before guest starts any experience
  preReward?: EventExperienceLink | null; // Flow shown after experience but before AI result
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

  // Linked experiences (embedded array)
  experiences: EventExperienceLink[];

  // Slot-based extra flows (pre-entry gate, pre-reward)
  extras: EventExtras;

  // Logo URL - identity concern, separated from theme styling
  logoUrl?: string | null;

  // Visual customization
  theme: Theme;

  // Welcome screen configuration
  welcome: EventWelcome;

  // Soft delete timestamp
  deletedAt?: number | null; // Unix timestamp ms when deleted

  // Timestamps
  createdAt: number; // Unix timestamp ms
  updatedAt: number; // Unix timestamp ms
}
