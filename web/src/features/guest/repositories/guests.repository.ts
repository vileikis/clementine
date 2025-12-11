// Guest repository - CRUD operations for guests and sessions subcollections
// Path: /projects/{projectId}/guests/{guestId}
// Path: /projects/{projectId}/sessions/{sessionId}

import { db } from "@/lib/firebase/admin"
import type { Guest, Session } from "../types"
import type { CreateGuestInput, CreateSessionInput } from "../schemas"
import { guestSchema, sessionSchema } from "../schemas"

// ============================================================================
// Collection References
// ============================================================================

function getGuestsCollection(projectId: string) {
  return db.collection("projects").doc(projectId).collection("guests")
}

function getSessionsCollection(projectId: string) {
  return db.collection("projects").doc(projectId).collection("sessions")
}

// ============================================================================
// Guest Operations
// ============================================================================

/**
 * Get a guest by ID
 */
export async function getGuest(
  projectId: string,
  guestId: string
): Promise<Guest | null> {
  const doc = await getGuestsCollection(projectId).doc(guestId).get()
  if (!doc.exists) return null

  const data = doc.data()
  if (!data) return null

  return guestSchema.parse({ id: doc.id, ...data })
}

/**
 * Create a new guest record
 * Uses authUid as the document ID for easy lookup
 */
export async function createGuest(
  projectId: string,
  input: CreateGuestInput
): Promise<Guest> {
  const guestRef = getGuestsCollection(projectId).doc(input.authUid)
  const now = Date.now()

  const guest: Guest = {
    id: input.authUid,
    projectId,
    authUid: input.authUid,
    createdAt: now,
    lastSeenAt: now,
  }

  await guestRef.set(guest)
  return guest
}

/**
 * Update guest's lastSeenAt timestamp
 */
export async function updateGuestLastSeen(
  projectId: string,
  guestId: string
): Promise<void> {
  const guestRef = getGuestsCollection(projectId).doc(guestId)
  await guestRef.update({
    lastSeenAt: Date.now(),
  })
}

// ============================================================================
// Session Operations
// ============================================================================

/**
 * Get a session by ID
 */
export async function getSession(
  projectId: string,
  sessionId: string
): Promise<Session | null> {
  const doc = await getSessionsCollection(projectId).doc(sessionId).get()
  if (!doc.exists) return null

  const data = doc.data()
  if (!data) return null

  return sessionSchema.parse({ id: doc.id, ...data })
}

/**
 * Create a new session
 */
export async function createSession(
  projectId: string,
  input: CreateSessionInput
): Promise<Session> {
  const sessionRef = getSessionsCollection(projectId).doc()
  const now = Date.now()

  const session: Session = {
    id: sessionRef.id,
    projectId,
    guestId: input.guestId,
    experienceId: input.experienceId,
    eventId: input.eventId,
    state: "created",
    currentStepIndex: 0,
    data: {},
    createdAt: now,
    updatedAt: now,
  }

  await sessionRef.set(session)
  return session
}

/**
 * Get all sessions for a guest, ordered by creation time (newest first)
 */
export async function getSessionsByGuest(
  projectId: string,
  guestId: string
): Promise<Session[]> {
  const snapshot = await getSessionsCollection(projectId)
    .where("guestId", "==", guestId)
    .orderBy("createdAt", "desc")
    .get()

  return snapshot.docs.map((doc) =>
    sessionSchema.parse({ id: doc.id, ...doc.data() })
  )
}
