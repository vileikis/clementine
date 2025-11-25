// Journey repository - CRUD operations for journeys collection

import { db } from "@/lib/firebase/admin";
import type { Journey } from "../types/journeys.types";
import { journeySchema } from "../schemas";

/**
 * Creates a new journey for an event
 */
export async function createJourney(data: {
  eventId: string;
  name: string;
}): Promise<string> {
  const journeyRef = db.collection("journeys").doc();

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
  const snapshot = await db
    .collection("journeys")
    .where("eventId", "==", eventId)
    .where("status", "==", "active")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) =>
    journeySchema.parse({ id: doc.id, ...doc.data() })
  );
}

/**
 * Gets a single journey by ID
 * Returns null if journey doesn't exist or is deleted
 */
export async function getJourney(journeyId: string): Promise<Journey | null> {
  const doc = await db.collection("journeys").doc(journeyId).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (data?.status === "deleted") return null;

  return journeySchema.parse({ id: doc.id, ...data });
}

/**
 * Soft deletes a journey by setting status to "deleted" and deletedAt timestamp
 */
export async function deleteJourney(journeyId: string): Promise<void> {
  await db.collection("journeys").doc(journeyId).update({
    status: "deleted",
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  });
}
