// Guest flow Zod schemas for validation

import { z } from "zod"

// ============================================================================
// Session State
// ============================================================================

export const sessionStateSchema = z.enum([
  "created",
  "in_progress",
  "completed",
  "abandoned",
  "error",
])

export type SessionState = z.infer<typeof sessionStateSchema>

// ============================================================================
// Guest
// ============================================================================

export const guestSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  authUid: z.string().min(1),
  createdAt: z.number().int().positive(),
  lastSeenAt: z.number().int().positive(),
})

export type Guest = z.infer<typeof guestSchema>

/**
 * Schema for creating a new guest (id is auto-assigned from authUid)
 */
export const createGuestSchema = z.object({
  projectId: z.string().min(1),
  authUid: z.string().min(1),
})

export type CreateGuestInput = z.infer<typeof createGuestSchema>

// ============================================================================
// Session
// ============================================================================

export const sessionSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  guestId: z.string().min(1),
  experienceId: z.string().min(1),
  eventId: z.string().min(1),
  state: sessionStateSchema,
  currentStepIndex: z.number().int().min(0),
  data: z.record(z.string(), z.unknown()),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export type Session = z.infer<typeof sessionSchema>

/**
 * Schema for creating a new session
 */
export const createSessionSchema = z.object({
  projectId: z.string().min(1),
  guestId: z.string().min(1),
  experienceId: z.string().min(1),
  eventId: z.string().min(1),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
