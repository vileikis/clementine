// Session repository - Session lifecycle operations

import { db } from "@/lib/firebase/admin";
import type { Session, SessionState } from "../types";
import { sessionSchema } from "../schemas";

// ============================================================================
// Existing functions (preserved)
// ============================================================================

export async function startSession(eventId: string): Promise<string> {
  const eventDoc = await db.collection("events").doc(eventId).get();
  if (!eventDoc.exists) {
    throw new Error("Event not found");
  }

  const sessionRef = db
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .doc();

  const now = Date.now();
  const session: Session = {
    id: sessionRef.id,
    eventId,
    state: "created",
    createdAt: now,
    updatedAt: now,
  };

  await sessionRef.set(session);
  return sessionRef.id;
}

export async function saveCapture(
  eventId: string,
  sessionId: string,
  inputImagePath: string
): Promise<void> {
  await db
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .doc(sessionId)
    .update({
      inputImagePath,
      state: "captured",
      updatedAt: Date.now(),
    });
}

export async function updateSessionState(
  eventId: string,
  sessionId: string,
  state: SessionState,
  additionalData?: { resultImagePath?: string; error?: string }
): Promise<void> {
  await db
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .doc(sessionId)
    .update({
      state,
      ...additionalData,
      updatedAt: Date.now(),
    });
}

export async function getSession(
  eventId: string,
  sessionId: string
): Promise<Session | null> {
  const doc = await db
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .doc(sessionId)
    .get();

  if (!doc.exists) return null;

  return sessionSchema.parse({ id: doc.id, ...doc.data() });
}

// ============================================================================
// New functions for journey support
// ============================================================================

export async function startJourneySession(
  eventId: string,
  journeyId: string
): Promise<string> {
  const eventDoc = await db.collection("events").doc(eventId).get();
  if (!eventDoc.exists) {
    throw new Error("Event not found");
  }

  const sessionRef = db
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .doc();

  const now = Date.now();
  const session: Session = {
    id: sessionRef.id,
    eventId,
    journeyId,
    currentStepIndex: 0,
    data: {},
    state: "created",
    createdAt: now,
    updatedAt: now,
  };

  await sessionRef.set(session);
  return sessionRef.id;
}

export async function updateStepIndex(
  eventId: string,
  sessionId: string,
  stepIndex: number
): Promise<void> {
  await db
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .doc(sessionId)
    .update({
      currentStepIndex: stepIndex,
      updatedAt: Date.now(),
    });
}

export async function saveStepData(
  eventId: string,
  sessionId: string,
  key: string,
  value: unknown
): Promise<void> {
  await db
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .doc(sessionId)
    .update({
      [`data.${key}`]: value,
      updatedAt: Date.now(),
    });
}
