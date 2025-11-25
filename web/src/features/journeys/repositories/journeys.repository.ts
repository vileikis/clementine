// Journey repository - CRUD operations for journeys subcollection
// Collection path: /events/{eventId}/journeys/{journeyId}

import { db } from "@/lib/firebase/admin";
import type { Journey } from "../types/journeys.types";
import { journeySchema } from "../schemas";

/**
 * Helper to get the journeys subcollection reference for an event
 */
function getJourneysCollection(eventId: string) {
  return db.collection("events").doc(eventId).collection("journeys");
}

/**
 * Creates a new journey for an event
 */
export async function createJourney(data: {
  eventId: string;
  name: string;
}): Promise<string> {
  const journeyRef = getJourneysCollection(data.eventId).doc();

  const now = Date.now();
  const journey: Journey = {
    id: journeyRef.id,
    eventId: data.eventId,
    name: data.name,
    stepOrder: [],
    tags: [],
    status: "active",
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await journeyRef.set(journey);

  return journeyRef.id;
}

/**
 * Lists all non-deleted journeys for an event, sorted by createdAt descending
 */
export async function listJourneys(eventId: string): Promise<Journey[]> {
  const snapshot = await getJourneysCollection(eventId)
    .where("status", "==", "active")
    .get();

  return snapshot.docs.map((doc) =>
    journeySchema.parse({ id: doc.id, ...doc.data() })
  );
}

/**
 * Gets a single journey by ID
 * Returns null if journey doesn't exist or is deleted
 */
export async function getJourney(
  eventId: string,
  journeyId: string
): Promise<Journey | null> {
  const doc = await getJourneysCollection(eventId).doc(journeyId).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (data?.status === "deleted") return null;

  return journeySchema.parse({ id: doc.id, ...data });
}

/**
 * Soft deletes a journey by setting status to "deleted" and deletedAt timestamp
 */
export async function deleteJourney(
  eventId: string,
  journeyId: string
): Promise<void> {
  await getJourneysCollection(eventId).doc(journeyId).update({
    status: "deleted",
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  });
}
