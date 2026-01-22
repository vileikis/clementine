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
 * Guest entity schema
 *
 * Represents an anonymous visitor to a project.
 * Created on first visit, used to associate sessions.
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
