// Experience repository - CRUD operations for root /experiences collection
// Refactored for normalized Firestore design (data-model-v4)

import { db } from "@/lib/firebase/admin";
import {
  experienceSchema,
  type PhotoExperience,
  type GifExperience,
  type Experience,
} from "../schemas";

/**
 * Creates a new photo experience in the root /experiences collection
 */
export async function createPhotoExperience(data: {
  companyId: string;
  eventIds: string[];
  name: string;
}): Promise<PhotoExperience> {
  const experienceRef = db.collection("experiences").doc();
  const now = Date.now();

  const experience: PhotoExperience = {
    id: experienceRef.id,
    companyId: data.companyId,
    eventIds: data.eventIds,
    name: data.name,
    type: "photo",
    enabled: true,

    // Default capture config
    captureConfig: {
      countdown: 0,
      cameraFacing: "front",
      overlayUrl: null,
    },

    // Default AI config
    aiPhotoConfig: {
      enabled: false,
      model: null,
      prompt: null,
      referenceImageUrls: null,
      aspectRatio: "1:1",
    },

    createdAt: now,
    updatedAt: now,
  };

  await experienceRef.set(experience);
  return experience;
}

/**
 * Creates a new GIF experience in the root /experiences collection
 */
export async function createGifExperience(data: {
  companyId: string;
  eventIds: string[];
  name: string;
}): Promise<GifExperience> {
  const experienceRef = db.collection("experiences").doc();
  const now = Date.now();

  const experience: GifExperience = {
    id: experienceRef.id,
    companyId: data.companyId,
    eventIds: data.eventIds,
    name: data.name,
    type: "gif",
    enabled: true,

    // Default capture config
    captureConfig: {
      countdown: 3,
      cameraFacing: "front",
      frameCount: 5,
    },

    // Default AI config (GIF uses photo config - image models)
    aiPhotoConfig: {
      enabled: false,
      model: null,
      prompt: null,
      referenceImageUrls: null,
      aspectRatio: "1:1",
    },

    createdAt: now,
    updatedAt: now,
  };

  await experienceRef.set(experience);
  return experience;
}

/**
 * Updates an existing experience in the root /experiences collection
 */
export async function updateExperience(
  experienceId: string,
  data: Partial<Experience>
): Promise<void> {
  const now = Date.now();

  await db
    .collection("experiences")
    .doc(experienceId)
    .update({
      ...data,
      updatedAt: now,
    });
}

/**
 * Deletes an experience from the root /experiences collection
 */
export async function deleteExperience(experienceId: string): Promise<void> {
  await db.collection("experiences").doc(experienceId).delete();
}

/**
 * Gets a single experience by ID from the root /experiences collection
 */
export async function getExperience(
  experienceId: string
): Promise<Experience | null> {
  const doc = await db.collection("experiences").doc(experienceId).get();

  if (!doc.exists) {
    return null;
  }

  return experienceSchema.parse({
    id: doc.id,
    ...doc.data(),
  });
}

/**
 * Gets all experiences for an event using array-contains query
 * Query: where('eventIds', 'array-contains', eventId)
 */
export async function getExperiencesByEventId(
  eventId: string
): Promise<Experience[]> {
  const snapshot = await db
    .collection("experiences")
    .where("eventIds", "array-contains", eventId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) =>
    experienceSchema.parse({
      id: doc.id,
      ...doc.data(),
    })
  );
}

/**
 * Gets all experiences for a company
 */
export async function getExperiencesByCompanyId(
  companyId: string
): Promise<Experience[]> {
  const snapshot = await db
    .collection("experiences")
    .where("companyId", "==", companyId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) =>
    experienceSchema.parse({
      id: doc.id,
      ...doc.data(),
    })
  );
}

/**
 * Duplicates an existing experience with a new ID and name
 * All settings are copied except for the ID and timestamps
 */
export async function duplicateExperience(
  sourceExperience: Experience,
  newName: string
): Promise<Experience> {
  const experienceRef = db.collection("experiences").doc();
  const now = Date.now();

  // Create a copy with new ID, name, and timestamps
  const duplicated: Experience = {
    ...sourceExperience,
    id: experienceRef.id,
    name: newName,
    createdAt: now,
    updatedAt: now,
  };

  await experienceRef.set(duplicated);
  return duplicated;
}