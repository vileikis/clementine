// Experience repository - CRUD operations for experiences subcollection

import { db } from "@/lib/firebase/admin";
import {
  
  experienceSchema,
  
  type PhotoExperience,
  type Experience,
  
} from "./schemas";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Creates a new experience for an event
 */
export async function createExperience(
  eventId: string,
  data: {
    label: string;
    type: "photo";
    enabled: boolean;
  }
): Promise<string> {
  const experienceRef = db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc();

  const now = Date.now();

  const experience = {
    id: experienceRef.id,
    eventId,
    label: data.label,
    type: "photo" as const,
    enabled: data.enabled,
    hidden: false,

    // Nested config object
    config: {
      countdown: 3,
      overlayFramePath: null,
    },

    // Nested aiConfig object
    aiConfig: {
      enabled: false,
      model: null,
      prompt: null,
      referenceImagePaths: null,
      aspectRatio: "1:1" as const,
    },

    createdAt: now,
    updatedAt: now,
  };

  await experienceRef.set(experience);

  // Increment experiencesCount on parent event
  await db
    .collection("events")
    .doc(eventId)
    .update({
      experiencesCount: FieldValue.increment(1),
      updatedAt: now,
    });

  return experienceRef.id;
}

/**
 * Updates an existing experience
 */
export async function updateExperience(
  eventId: string,
  experienceId: string,
  data: Partial<PhotoExperience>
): Promise<void> {
  const now = Date.now();

  await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId)
    .update({
      ...data,
      updatedAt: now,
    });

  // Also update parent event's updatedAt
  await db.collection("events").doc(eventId).update({
    updatedAt: now,
  });
}

/**
 * Deletes an experience
 */
export async function deleteExperience(
  eventId: string,
  experienceId: string
): Promise<void> {
  const now = Date.now();

  await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId)
    .delete();

  // Decrement experiencesCount on parent event
  await db
    .collection("events")
    .doc(eventId)
    .update({
      experiencesCount: FieldValue.increment(-1),
      updatedAt: now,
    });
}

/**
 * Gets a single experience by ID
 */
export async function getExperience(
  eventId: string,
  experienceId: string
): Promise<Experience | null> {
  const doc = await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId)
    .get();

  if (!doc.exists) {
    return null;
  }

  return experienceSchema.parse({
    id: doc.id,
    ...doc.data(),
  });
}

/**
 * Lists all experiences for an event
 */
export async function listExperiences(eventId: string): Promise<Experience[]> {
  const snapshot = await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) =>
    experienceSchema.parse({
      id: doc.id,
      ...doc.data(),
    })
  );
}