// Event repository - CRUD operations for events collection

import { db } from "@/lib/firebase/admin";
import type { Event, Scene } from "@/lib/types/firestore";
import { eventSchema } from "@/lib/schemas/firestore";

export async function createEvent(data: {
  title: string;
  brandColor: string;
  showTitleOverlay: boolean;
}): Promise<string> {
  const eventRef = db.collection("events").doc();
  const sceneRef = eventRef.collection("scenes").doc();

  const now = Date.now();
  const eventId = eventRef.id;
  const joinPath = `/join/${eventId}`;

  const event: Event = {
    id: eventId,
    ...data,
    status: "draft",
    currentSceneId: sceneRef.id,
    joinPath,
    qrPngPath: `events/${eventId}/qr/join.png`,
    createdAt: now,
    updatedAt: now,
  };

  const scene: Scene = {
    id: sceneRef.id,
    label: "Default Scene v1",
    mode: "photo",
    effect: "background_swap",
    prompt: "Apply clean studio background with brand color accents.",
    defaultPrompt: "Apply clean studio background with brand color accents.",
    flags: {
      customTextTool: false,
      stickersTool: false,
    },
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await db.runTransaction(async (txn) => {
    txn.set(eventRef, event);
    txn.set(sceneRef, scene);
  });

  return eventId;
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const doc = await db.collection("events").doc(eventId).get();
  if (!doc.exists) return null;
  return eventSchema.parse({ id: doc.id, ...doc.data() });
}

export async function listEvents(): Promise<Event[]> {
  const snapshot = await db
    .collection("events")
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) =>
    eventSchema.parse({ id: doc.id, ...doc.data() })
  );
}

export async function updateEventBranding(
  eventId: string,
  branding: { brandColor?: string; showTitleOverlay?: boolean }
): Promise<void> {
  await db.collection("events").doc(eventId).update({
    ...branding,
    updatedAt: Date.now(),
  });
}

export async function updateEventStatus(
  eventId: string,
  status: "draft" | "live" | "archived"
): Promise<void> {
  await db.collection("events").doc(eventId).update({
    status,
    updatedAt: Date.now(),
  });
}

export async function getCurrentScene(eventId: string): Promise<Scene | null> {
  const eventDoc = await db.collection("events").doc(eventId).get();
  if (!eventDoc.exists) return null;

  const eventData = eventDoc.data() as Event;
  const sceneDoc = await db
    .collection("events")
    .doc(eventId)
    .collection("scenes")
    .doc(eventData.currentSceneId)
    .get();

  if (!sceneDoc.exists) return null;

  return { id: sceneDoc.id, ...sceneDoc.data() } as Scene;
}
