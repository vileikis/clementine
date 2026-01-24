/**
 * Guest Schema
 *
 * Defines the structure for Guest documents stored in Firestore.
 * A guest represents an anonymous visitor to a project.
 *
 * Firestore Path: /projects/{projectId}/guests/{guestId}
 *
 * Note: guestId equals authUid for simplicity (one guest record per auth session)
 */
import { z } from 'zod'

/**
 * Completed Experience Entry
 *
 * Tracks when a guest completed an experience.
 * Used for pregate/preshare skip logic and analytics.
 */
export const completedExperienceSchema = z.object({
  /** Experience ID that was completed */
  experienceId: z.string().min(1, 'Experience ID is required'),

  /** Completion timestamp (Unix ms) */
  completedAt: z.number(),

  /** Session ID for analytics linking */
  sessionId: z.string().min(1, 'Session ID is required'),
})

export type CompletedExperience = z.infer<typeof completedExperienceSchema>

/**
 * Guest entity schema
 *
 * Represents an anonymous visitor to a project.
 * Created on first visit, used to associate sessions.
 * Extended with completedExperiences for pregate/preshare skip logic.
 */
export const guestSchema = z.object({
  /** Document ID (same as authUid) */
  id: z.string().min(1, 'Guest ID is required'),

  /** Project this guest visited */
  projectId: z.string().min(1, 'Project ID is required'),

  /** Firebase anonymous auth UID */
  authUid: z.string().min(1, 'Auth UID is required'),

  /** Creation timestamp (Unix ms) */
  createdAt: z.number(),

  /**
   * Track completed experiences for skip logic
   * Used to determine if guest should skip pregate/preshare
   */
  completedExperiences: z.array(completedExperienceSchema).default([]),
})

export type Guest = z.infer<typeof guestSchema>

/**
 * Input schema for creating a guest record
 */
export const createGuestInputSchema = z.object({
  projectId: z.string().min(1),
  authUid: z.string().min(1),
})

export type CreateGuestInput = z.infer<typeof createGuestInputSchema>
