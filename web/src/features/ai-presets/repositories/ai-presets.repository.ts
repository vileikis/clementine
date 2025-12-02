// AI Preset repository - CRUD operations for root /aiPresets collection
// Refactored for normalized Firestore design (data-model-v4)

import { db } from "@/lib/firebase/admin";
import {
  aiPresetSchema,
  type PhotoAiPreset,
  type GifAiPreset,
  type AiPreset,
} from "../schemas";

/**
 * Creates a new photo AI preset in the root /aiPresets collection
 */
export async function createPhotoAiPreset(data: {
  companyId: string;
  eventIds: string[];
  name: string;
}): Promise<PhotoAiPreset> {
  const aiPresetRef = db.collection("aiPresets").doc();
  const now = Date.now();

  const aiPreset: PhotoAiPreset = {
    id: aiPresetRef.id,
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

  await aiPresetRef.set(aiPreset);
  return aiPreset;
}

/**
 * Creates a new GIF AI preset in the root /aiPresets collection
 */
export async function createGifAiPreset(data: {
  companyId: string;
  eventIds: string[];
  name: string;
}): Promise<GifAiPreset> {
  const aiPresetRef = db.collection("aiPresets").doc();
  const now = Date.now();

  const aiPreset: GifAiPreset = {
    id: aiPresetRef.id,
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

  await aiPresetRef.set(aiPreset);
  return aiPreset;
}

/**
 * Updates an existing AI preset in the root /aiPresets collection
 */
export async function updateAiPreset(
  aiPresetId: string,
  data: Partial<AiPreset>
): Promise<void> {
  const now = Date.now();

  await db
    .collection("aiPresets")
    .doc(aiPresetId)
    .update({
      ...data,
      updatedAt: now,
    });
}

/**
 * Deletes an AI preset from the root /aiPresets collection
 */
export async function deleteAiPreset(aiPresetId: string): Promise<void> {
  await db.collection("aiPresets").doc(aiPresetId).delete();
}

/**
 * Gets a single AI preset by ID from the root /aiPresets collection
 */
export async function getAiPreset(
  aiPresetId: string
): Promise<AiPreset | null> {
  const doc = await db.collection("aiPresets").doc(aiPresetId).get();

  if (!doc.exists) {
    return null;
  }

  return aiPresetSchema.parse({
    id: doc.id,
    ...doc.data(),
  });
}

/**
 * Gets all AI presets for an event using array-contains query
 * Query: where('eventIds', 'array-contains', eventId)
 */
export async function getAiPresetsByEventId(
  eventId: string
): Promise<AiPreset[]> {
  const snapshot = await db
    .collection("aiPresets")
    .where("eventIds", "array-contains", eventId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) =>
    aiPresetSchema.parse({
      id: doc.id,
      ...doc.data(),
    })
  );
}

/**
 * Gets all AI presets for a company
 */
export async function getAiPresetsByCompanyId(
  companyId: string
): Promise<AiPreset[]> {
  const snapshot = await db
    .collection("aiPresets")
    .where("companyId", "==", companyId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) =>
    aiPresetSchema.parse({
      id: doc.id,
      ...doc.data(),
    })
  );
}

/**
 * Duplicates an existing AI preset with a new ID and name
 * All settings are copied except for the ID and timestamps
 */
export async function duplicateAiPreset(
  sourceAiPreset: AiPreset,
  newName: string
): Promise<AiPreset> {
  const aiPresetRef = db.collection("aiPresets").doc();
  const now = Date.now();

  // Create a copy with new ID, name, and timestamps
  const duplicated: AiPreset = {
    ...sourceAiPreset,
    id: aiPresetRef.id,
    name: newName,
    createdAt: now,
    updatedAt: now,
  };

  await aiPresetRef.set(duplicated);
  return duplicated;
}

// ============================================================================
// Legacy aliases for backward compatibility during migration
// These will be removed in a future version
// ============================================================================
/** @deprecated Use createPhotoAiPreset instead */
export const createPhotoExperience = createPhotoAiPreset;
/** @deprecated Use createGifAiPreset instead */
export const createGifExperience = createGifAiPreset;
/** @deprecated Use updateAiPreset instead */
export const updateExperience = updateAiPreset;
/** @deprecated Use deleteAiPreset instead */
export const deleteExperience = deleteAiPreset;
/** @deprecated Use getAiPreset instead */
export const getExperience = getAiPreset;
/** @deprecated Use getAiPresetsByEventId instead */
export const getExperiencesByEventId = getAiPresetsByEventId;
/** @deprecated Use getAiPresetsByCompanyId instead */
export const getExperiencesByCompanyId = getAiPresetsByCompanyId;
/** @deprecated Use duplicateAiPreset instead */
export const duplicateExperience = duplicateAiPreset;
