// Event repository - CRUD operations for events collection

import { db } from "@/lib/firebase/admin";
import type { Event } from "../types/event.types";
import { eventSchema } from "../schemas";
import { THEME_DEFAULTS } from "../constants";

export async function createEvent(data: {
  name: string;
  ownerId: string;
  primaryColor: string;
}): Promise<string> {
  const eventRef = db.collection("events").doc();

  const now = Date.now();
  const eventId = eventRef.id;
  const joinPath = `/join/${eventId}`;

  const event: Event = {
    id: eventId,
    name: data.name,
    ownerId: data.ownerId,
    status: "draft",
    joinPath,
    qrPngPath: `events/${eventId}/qr/join.png`,
    activeJourneyId: null,
    createdAt: now,
    updatedAt: now,
    // Initialize full theme structure with defaults
    theme: {
      ...THEME_DEFAULTS,
      primaryColor: data.primaryColor,
    },
  };

  await eventRef.set(event);

  return eventId;
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const doc = await db.collection("events").doc(eventId).get();
  if (!doc.exists) return null;
  return eventSchema.parse({ id: doc.id, ...doc.data() });
}

export async function listEvents(filters?: {
  ownerId?: string | null;
}): Promise<Event[]> {
  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection("events");

  // Filter out deleted events - use "in" clause for Firestore compatibility
  query = query.where("status", "in", ["draft", "live", "archived"]);

  // Special handling for "no owner" filter
  // Need to fetch all events and filter server-side because Firestore
  // doesn't match undefined fields with null queries
  if (filters?.ownerId === null) {
    const snapshot = await query.orderBy("createdAt", "desc").get();
    const allEvents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];

    // Filter for events without ownerId (null or undefined)
    const eventsWithoutOwner = allEvents.filter(
      (event) =>
        event.ownerId === null ||
        event.ownerId === undefined ||
        event.ownerId === ""
    );

    return eventsWithoutOwner.map((event) => eventSchema.parse(event));
  }

  // Apply ownerId filter for specific owner
  if (filters?.ownerId !== undefined) {
    query = query.where("ownerId", "==", filters.ownerId);
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

export async function updateEventName(
  eventId: string,
  name: string
): Promise<void> {
  await db.collection("events").doc(eventId).update({
    name,
    updatedAt: Date.now(),
  });
}

/**
 * Soft delete an event (mark as deleted)
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const eventRef = db.collection("events").doc(eventId);
  const eventSnap = await eventRef.get();

  if (!eventSnap.exists) {
    throw new Error("Event not found");
  }

  const now = Date.now();
  await eventRef.update({
    status: "deleted",
    deletedAt: now,
    updatedAt: now,
  });
}

