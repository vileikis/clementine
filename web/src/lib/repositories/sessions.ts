// Session repository - Session lifecycle operations

import { db } from "@/lib/firebase/admin";
import type { Session, SessionState } from "@/lib/types/firestore";
import { sessionSchema } from "@/lib/schemas/firestore";

export async function startSession(eventId: string): Promise<string> {
  const eventDoc = await db.collection("events").doc(eventId).get();
  if (!eventDoc.exists) {
    throw new Error("Event not found");
  }

  const eventData = eventDoc.data();
  const sceneId = eventData?.currentSceneId;

  if (!sceneId) {
    throw new Error("Event has no current scene");
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
    sceneId,
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
