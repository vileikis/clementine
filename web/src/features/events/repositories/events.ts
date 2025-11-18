// Event repository - CRUD operations for events collection

import { db } from "@/lib/firebase/admin";
import type { Event, Scene } from "../types/event.types";
import { eventSchema } from "../lib/schemas";

export async function createEvent(data: {
  title: string;
  brandColor: string;
  showTitleOverlay: boolean;
  companyId: string;
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
    // Events Builder Redesign defaults
    shareAllowDownload: true,
    shareAllowSystemShare: true,
    shareAllowEmail: true,
    shareSocials: [],
    surveyEnabled: false,
    surveyRequired: false,
    surveyStepsCount: 0,
    surveyStepsOrder: [],
    surveyVersion: 1,
    experiencesCount: 0,
    sessionsCount: 0,
    readyCount: 0,
    sharesCount: 0,
  };

  const scene: Scene = {
    id: sceneRef.id,
    label: "Default Scene v1",
    mode: "photo",
    prompt: "Apply clean studio background with brand color accents.",
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

export async function listEvents(filters?: {
  companyId?: string | null;
}): Promise<Event[]> {
  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection("events");

  // Special handling for "no company" filter
  // Need to fetch all events and filter server-side because Firestore
  // doesn't match undefined fields with null queries
  if (filters?.companyId === null) {
    const snapshot = await query.orderBy("createdAt", "desc").get();
    const allEvents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];

    // Filter for events without companyId (null or undefined)
    const eventsWithoutCompany = allEvents.filter(
      (event) =>
        event.companyId === null ||
        event.companyId === undefined ||
        event.companyId === ""
    );

    return eventsWithoutCompany.map((event) => eventSchema.parse(event));
  }

  // Apply companyId filter for specific company
  if (filters?.companyId !== undefined) {
    query = query.where("companyId", "==", filters.companyId);
  }

  const snapshot = await query.orderBy("createdAt", "desc").get();
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

export async function updateEventTitle(
  eventId: string,
  title: string
): Promise<void> {
  await db.collection("events").doc(eventId).update({
    title,
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
