// Events repository - CRUD operations for events subcollection

import { db } from "@/lib/firebase/admin";
import type { Event } from "../types/event.types";
import { eventSchema } from "../schemas";
import { DEFAULT_EVENT_THEME } from "../constants";

/**
 * Get the events collection reference for a project
 */
function getEventsCollection(projectId: string) {
  return db.collection("projects").doc(projectId).collection("events");
}

/**
 * Create a new event under a project
 */
export async function createEvent(data: {
  projectId: string;
  companyId: string;
  name: string;
}): Promise<string> {
  const eventsRef = getEventsCollection(data.projectId);
  const eventRef = eventsRef.doc();

  const now = Date.now();
  const eventId = eventRef.id;

  const event: Event = {
    id: eventId,
    projectId: data.projectId,
    companyId: data.companyId,
    name: data.name,
    publishStartAt: null,
    publishEndAt: null,
    experiences: [],
    theme: DEFAULT_EVENT_THEME,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await eventRef.set(event);

  return eventId;
}

/**
 * Get a single event by ID
 */
export async function getEvent(
  projectId: string,
  eventId: string
): Promise<Event | null> {
  const doc = await getEventsCollection(projectId).doc(eventId).get();

  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  // Check for soft delete
  if (data.deletedAt) return null;

  return eventSchema.parse({ id: doc.id, ...data });
}

/**
 * List all non-deleted events for a project
 */
export async function listEvents(
  projectId: string,
  options?: { includeDeleted?: boolean }
): Promise<Event[]> {
  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
    getEventsCollection(projectId);

  // Sort by createdAt DESC (newest first)
  query = query.orderBy("createdAt", "desc");

  const snapshot = await query.get();

  const events: Event[] = [];

  for (const doc of snapshot.docs) {
    try {
      const parsed = eventSchema.parse({ id: doc.id, ...doc.data() });
      events.push(parsed as Event);
    } catch {
      // Skip invalid documents
    }
  }

  // Filter out deleted events unless includeDeleted is true
  if (!options?.includeDeleted) {
    return events.filter((event) => event.deletedAt === null);
  }

  return events;
}

/**
 * Update event fields (partial update)
 */
export async function updateEvent(
  projectId: string,
  eventId: string,
  data: Partial<Pick<Event, "name" | "publishStartAt" | "publishEndAt">>
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.publishStartAt !== undefined) {
    updateData.publishStartAt = data.publishStartAt;
  }
  if (data.publishEndAt !== undefined) {
    updateData.publishEndAt = data.publishEndAt;
  }

  await eventRef.update(updateData);
}

/**
 * Update event theme (partial update with dot notation)
 */
export async function updateEventTheme(
  projectId: string,
  eventId: string,
  themeData: {
    logoUrl?: string | null;
    fontFamily?: string | null;
    primaryColor?: string;
    text?: {
      color?: string;
      alignment?: "left" | "center" | "right";
    };
    button?: {
      backgroundColor?: string | null;
      textColor?: string;
      radius?: "none" | "sm" | "md" | "full";
    };
    background?: {
      color?: string;
      image?: string | null;
      overlayOpacity?: number;
    };
  }
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  // Top-level theme fields
  if (themeData.logoUrl !== undefined) {
    updateData["theme.logoUrl"] = themeData.logoUrl;
  }
  if (themeData.fontFamily !== undefined) {
    updateData["theme.fontFamily"] = themeData.fontFamily;
  }
  if (themeData.primaryColor !== undefined) {
    updateData["theme.primaryColor"] = themeData.primaryColor;
  }

  // Nested text fields
  if (themeData.text) {
    Object.entries(themeData.text).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[`theme.text.${key}`] = value;
      }
    });
  }

  // Nested button fields
  if (themeData.button) {
    Object.entries(themeData.button).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[`theme.button.${key}`] = value;
      }
    });
  }

  // Nested background fields
  if (themeData.background) {
    Object.entries(themeData.background).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[`theme.background.${key}`] = value;
      }
    });
  }

  await eventRef.update(updateData);
}

/**
 * Soft delete an event (set deletedAt timestamp)
 */
export async function softDeleteEvent(
  projectId: string,
  eventId: string
): Promise<void> {
  const eventRef = getEventsCollection(projectId).doc(eventId);

  await eventRef.update({
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  });
}
