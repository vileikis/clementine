// Event repository - CRUD operations for events collection

import { db } from "@/lib/firebase/admin";
import type { Event } from "../types/event.types";
import { eventSchema } from "../schemas";

export async function createEvent(data: {
  title: string;
  companyId: string;
  buttonColor?: string;
}): Promise<string> {
  const eventRef = db.collection("events").doc();

  const now = Date.now();
  const eventId = eventRef.id;
  const joinPath = `/join/${eventId}`;

  const event: Event = {
    id: eventId,
    title: data.title,
    companyId: data.companyId,
    status: "draft",
    joinPath,
    qrPngPath: `events/${eventId}/qr/join.png`,
    createdAt: now,
    updatedAt: now,
    // Initialize theme with button color if provided
    ...(data.buttonColor && {
      theme: {
        buttonColor: data.buttonColor,
      },
    }),
    // Initialize share config with defaults
    share: {
      allowDownload: true,
      allowSystemShare: true,
      allowEmail: false,
      socials: [],
    },
    // Denormalized counters
    experiencesCount: 0,
    sessionsCount: 0,
    readyCount: 0,
    sharesCount: 0,
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

